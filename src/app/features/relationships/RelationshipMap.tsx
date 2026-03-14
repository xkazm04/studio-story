'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { Loader2, AlertCircle } from 'lucide-react';
import { EmptyState } from '@/app/components/UI';

import RelationshipMapCanvas from './components/RelationshipMapCanvas';
import RelationshipTypeFilter from './components/RelationshipTypeFilter';
import {
  RelationshipNode,
  RelationshipEdge,
  RelationshipType,
  RelationshipMapData,
  CharacterNodeData,
  FactionNodeData,
} from './types';
import {
  fetchRelationships,
  updateNodePosition,
  getStoredNodePositions,
} from './lib/relationshipApi';
import { FACTION_COLOR_PALETTE } from './lib/factionClusters';
import { Faction } from '@/app/types/Faction';

interface RelationshipMapProps {
  projectId: string;
}

const RelationshipMap: React.FC<RelationshipMapProps> = ({ projectId }) => {
  const [nodes, setNodes] = useState<RelationshipNode[]>([]);
  const [edges, setEdges] = useState<RelationshipEdge[]>([]);
  const [factions, setFactions] = useState<Faction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<RelationshipType>>(
    new Set(Object.values(RelationshipType))
  );

  // Debounce timer for position updates
  const positionUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Build a factionColorMap from loaded factions
  const factionColorMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    factions.forEach((f, i) => {
      map[f.id] =
        f.color ||
        f.branding?.primary_color ||
        FACTION_COLOR_PALETTE[i % FACTION_COLOR_PALETTE.length];
    });
    return map;
  }, [factions]);

  // Load relationship data
  useEffect(() => {
    const loadRelationships = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data: RelationshipMapData = await fetchRelationships(projectId);

        // Apply stored positions
        const storedPositions = getStoredNodePositions(projectId);
        const nodesWithPositions = data.nodes.map((node) => {
          if (storedPositions[node.id]) {
            return { ...node, position: storedPositions[node.id] };
          }
          return node;
        });

        // Extract factions from faction nodes
        const factionList: Faction[] = data.nodes
          .filter((n): n is RelationshipNode & { data: FactionNodeData } => n.type === 'faction')
          .map((n) => n.data.faction);

        setNodes(nodesWithPositions);
        setEdges(data.edges);
        setFactions(factionList);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load relationship map. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      loadRelationships();
    }
  }, [projectId]);

  // Handle node position changes with debouncing
  const handleNodeDragStop = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      if (positionUpdateTimerRef.current) {
        clearTimeout(positionUpdateTimerRef.current);
      }
      positionUpdateTimerRef.current = setTimeout(async () => {
        try {
          await updateNodePosition(projectId, nodeId, position);
        } catch {
          // Position update failure is silently handled — non-critical
        }
      }, 500);
    },
    [projectId]
  );

  // Handle nodes change
  const handleNodesChange = useCallback((updatedNodes: RelationshipNode[]) => {
    setNodes(updatedNodes);
  }, []);

  // Handle edges change
  const handleEdgesChange = useCallback((updatedEdges: RelationshipEdge[]) => {
    setEdges(updatedEdges);
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((filters: Set<RelationshipType>) => {
    setActiveFilters(filters);
  }, []);

  // Retry loading
  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    fetchRelationships(projectId)
      .then((data) => {
        const storedPositions = getStoredNodePositions(projectId);
        const nodesWithPositions = data.nodes.map((node) => {
          if (storedPositions[node.id]) {
            return { ...node, position: storedPositions[node.id] };
          }
          return node;
        });

        const factionList: Faction[] = data.nodes
          .filter((n): n is RelationshipNode & { data: FactionNodeData } => n.type === 'faction')
          .map((n) => n.data.faction);

        setNodes(nodesWithPositions);
        setEdges(data.edges);
        setFactions(factionList);
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load relationship map. Please try again.'
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [projectId]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (positionUpdateTimerRef.current) {
        clearTimeout(positionUpdateTimerRef.current);
      }
    };
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-slate-900 via-slate-900 to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
          <div className="text-white text-lg font-medium">
            Loading Relationship Map...
          </div>
          <div className="text-slate-400 text-sm">
            Fetching characters, factions, and relationships
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-slate-900 via-slate-900 to-slate-900">
        <div className="flex flex-col items-center gap-4 max-w-md">
          <div className="bg-red-500/20 p-4 rounded-full">
            <AlertCircle className="w-12 h-12 text-red-400" />
          </div>
          <div className="text-white text-lg font-medium text-center">
            Failed to Load Relationship Map
          </div>
          <div className="text-slate-400 text-sm text-center">{error}</div>
          <button
            onClick={handleRetry}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (nodes.length === 0 && edges.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-slate-900 via-slate-900 to-slate-900">
        <EmptyState
          icon={<AlertCircle />}
          title="No Relationships Found"
          subtitle="Create some characters and factions, then add relationships between them to see them visualized here."
          iconSize="lg"
          animated
          glowColor="rgb(148, 163, 184)"
        />
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="relative w-full h-full">
        {/* Canvas */}
        <RelationshipMapCanvas
          nodes={nodes}
          edges={edges}
          factions={factions}
          factionColorMap={factionColorMap}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onNodeDragStop={handleNodeDragStop}
          activeFilters={activeFilters}
        />

        {/* Filter Panel */}
        <RelationshipTypeFilter
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
        />

        {/* Stats Panel */}
        <div className="absolute bottom-4 left-4 z-10">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg shadow-lg px-4 py-2">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-400" />
                <span className="text-white">
                  {nodes.filter((n) => n.type === 'character').length} Characters
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-400" />
                <span className="text-white">
                  {nodes.filter((n) => n.type === 'faction').length} Factions
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-white">{edges.length} Relationships</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
};

export default RelationshipMap;
