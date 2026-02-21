'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { Loader2, AlertCircle, Zap } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { EmptyState } from '@/app/components/UI';

import RelationshipMapCanvas from './components/RelationshipMapCanvas';
import RelationshipTypeFilter from './components/RelationshipTypeFilter';
import {
  RelationshipNode,
  RelationshipEdge,
  RelationshipType,
  RelationshipMapData
} from './types';
import {
  fetchRelationships,
  updateNodePosition,
  getStoredNodePositions
} from './lib/relationshipApi';

interface RelationshipMapProps {
  projectId: string;
}

const RelationshipMap: React.FC<RelationshipMapProps> = ({ projectId }) => {
  const [nodes, setNodes] = useState<RelationshipNode[]>([]);
  const [edges, setEdges] = useState<RelationshipEdge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<RelationshipType>>(
    new Set(Object.values(RelationshipType))
  );
  const [useForceLayout, setUseForceLayout] = useState(false);

  // Debounce timer for position updates
  const positionUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load relationship data
  useEffect(() => {
    const loadRelationships = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data: RelationshipMapData = await fetchRelationships(projectId);

        // Apply stored positions
        const storedPositions = getStoredNodePositions(projectId);
        const nodesWithPositions = data.nodes.map(node => {
          if (storedPositions[node.id]) {
            return {
              ...node,
              position: storedPositions[node.id]
            };
          }
          return node;
        });

        setNodes(nodesWithPositions);
        setEdges(data.edges);
      } catch (err) {
        // Error is handled by setting error state
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
      // Clear existing timer
      if (positionUpdateTimerRef.current) {
        clearTimeout(positionUpdateTimerRef.current);
      }

      // Set new timer for debounced API call
      positionUpdateTimerRef.current = setTimeout(async () => {
        try {
          await updateNodePosition(projectId, nodeId, position);
        } catch (err) {
          // Position update failure is silently handled - non-critical
        }
      }, 500); // 500ms debounce
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

  // Toggle force-directed layout (for future implementation)
  const handleToggleForceLayout = useCallback(() => {
    setUseForceLayout(prev => !prev);
    // TODO: Implement force-directed layout using d3-force or similar
  }, []);

  // Retry loading
  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    // Trigger reload by updating a dependency
    fetchRelationships(projectId)
      .then(data => {
        const storedPositions = getStoredNodePositions(projectId);
        const nodesWithPositions = data.nodes.map(node => {
          if (storedPositions[node.id]) {
            return { ...node, position: storedPositions[node.id] };
          }
          return node;
        });
        setNodes(nodesWithPositions);
        setEdges(data.edges);
      })
      .catch(err => {
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
      <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
          <div className="text-white text-lg font-medium">
            Loading Relationship Map...
          </div>
          <div className="text-gray-400 text-sm">
            Fetching characters, factions, and relationships
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
        <div className="flex flex-col items-center gap-4 max-w-md">
          <div className="bg-red-500/20 p-4 rounded-full">
            <AlertCircle className="w-12 h-12 text-red-400" />
          </div>
          <div className="text-white text-lg font-medium text-center">
            Failed to Load Relationship Map
          </div>
          <div className="text-gray-400 text-sm text-center">
            {error}
          </div>
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
      <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
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

        {/* Force Layout Toggle (UI Innovation) */}
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={handleToggleForceLayout}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-xl border shadow-lg transition-all duration-300',
              useForceLayout
                ? 'bg-yellow-500/30 border-yellow-400 text-yellow-200'
                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
            )}
            title="Toggle force-directed layout"
          >
            <Zap className={cn('w-4 h-4', useForceLayout && 'animate-pulse')} />
            <span className="text-sm font-medium">
              {useForceLayout ? 'Force Layout Active' : 'Enable Force Layout'}
            </span>
          </button>
        </div>

        {/* Stats Panel */}
        <div className="absolute bottom-4 left-4 z-10">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg shadow-lg px-4 py-2">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-400" />
                <span className="text-white">
                  {nodes.filter(n => n.type === 'character').length} Characters
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-400" />
                <span className="text-white">
                  {nodes.filter(n => n.type === 'faction').length} Factions
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-white">
                  {edges.length} Relationships
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
};

export default RelationshipMap;
