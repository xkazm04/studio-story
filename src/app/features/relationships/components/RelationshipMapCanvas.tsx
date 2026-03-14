'use client';

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  NodeTypes,
  EdgeTypes,
  useNodesState,
  useEdgesState,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  useViewport,
} from 'reactflow';
import 'reactflow/dist/style.css';

import CharacterNode from './CharacterNode';
import FactionNode from './FactionNode';
import RelationshipEdge from './RelationshipEdge';
import { RelationshipNode, RelationshipEdge as RelEdge, RelationshipType, CharacterNodeData } from '../types';
import { computeFactionClusters, FactionCluster } from '../lib/factionClusters';
import { Faction } from '@/app/types/Faction';

interface RelationshipMapCanvasProps {
  nodes: RelationshipNode[];
  edges: RelEdge[];
  factions: Faction[];
  factionColorMap: Record<string, string>;
  onNodesChange: (nodes: RelationshipNode[]) => void;
  onEdgesChange: (edges: RelEdge[]) => void;
  onNodeDragStop: (nodeId: string, position: { x: number; y: number }) => void;
  activeFilters: Set<RelationshipType>;
}

// ---------------------------------------------------------------------------
// Cluster overlay component — renders SVG hull backgrounds behind nodes
// ---------------------------------------------------------------------------

function ClusterOverlay({ clusters }: { clusters: Map<string, FactionCluster> }) {
  const viewport = useViewport();

  if (clusters.size === 0) return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <g
        transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}
      >
        {Array.from(clusters.values()).map((cluster) => (
          <g key={cluster.factionId}>
            {/* Hull background */}
            <path
              d={cluster.hullPath}
              fill={`${cluster.color}14`}
              stroke={`${cluster.color}33`}
              strokeWidth={1}
            />
            {/* Faction label */}
            <text
              x={cluster.labelPosition.x}
              y={cluster.labelPosition.y}
              textAnchor="middle"
              fill={`${cluster.color}cc`}
              fontSize={13}
              fontWeight={600}
              fontFamily="system-ui, sans-serif"
            >
              {cluster.factionName}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Canvas
// ---------------------------------------------------------------------------

const RelationshipMapCanvas: React.FC<RelationshipMapCanvasProps> = ({
  nodes: initialNodes,
  edges: initialEdges,
  factions,
  factionColorMap,
  onNodesChange,
  onEdgesChange,
  onNodeDragStop,
  activeFilters,
}) => {
  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);
  const [clusters, setClusters] = useState<Map<string, FactionCluster>>(new Map());
  const clusterTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Inject factionColor into character node data
  const enrichedNodes = useMemo(() => {
    return nodes.map((node) => {
      if (node.type !== 'character') return node;
      const charData = node.data as CharacterNodeData;
      const factionId = charData.character?.faction_id;
      const factionColor = factionId ? factionColorMap[factionId] : undefined;
      return {
        ...node,
        data: {
          ...charData,
          factionColor,
        },
      };
    });
  }, [nodes, factionColorMap]);

  // Update nodes when initialNodes change
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // Update edges when initialEdges change
  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Compute clusters whenever character nodes change position
  const recomputeClusters = useCallback(() => {
    const charNodes = nodes.filter(
      (n): n is Node<CharacterNodeData> => n.type === 'character'
    );
    const newClusters = computeFactionClusters(charNodes, factions);
    setClusters(newClusters);
  }, [nodes, factions]);

  // Initial cluster computation
  useEffect(() => {
    recomputeClusters();
  }, [recomputeClusters]);

  // Debounced cluster recomputation on drag
  const debouncedRecompute = useCallback(() => {
    if (clusterTimerRef.current) clearTimeout(clusterTimerRef.current);
    clusterTimerRef.current = setTimeout(() => {
      recomputeClusters();
    }, 200);
  }, [recomputeClusters]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (clusterTimerRef.current) clearTimeout(clusterTimerRef.current);
    };
  }, []);

  // Define custom node types
  const nodeTypes = useMemo<NodeTypes>(
    () => ({
      character: CharacterNode,
      faction: FactionNode,
    }),
    []
  );

  // Define custom edge types
  const edgeTypes = useMemo<EdgeTypes>(
    () => ({
      relationship: RelationshipEdge,
    }),
    []
  );

  // Filter edges based on active filters
  const filteredEdges = useMemo(() => {
    if (activeFilters.size === 0) {
      return edges;
    }
    return edges.filter((edge) => {
      const edgeData = edge.data as RelEdge['data'];
      return activeFilters.has(edgeData?.relationshipType);
    });
  }, [edges, activeFilters]);

  // Handle node changes
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updatedNodes = applyNodeChanges(changes, nodes) as RelationshipNode[];
      setNodes(updatedNodes);
      onNodesChange(updatedNodes);
      // Recompute clusters on position changes
      const hasDrag = changes.some((c) => c.type === 'position');
      if (hasDrag) debouncedRecompute();
    },
    [nodes, setNodes, onNodesChange, debouncedRecompute]
  );

  // Handle edge changes
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updatedEdges = applyEdgeChanges(changes, edges) as RelEdge[];
      setEdges(updatedEdges);
      onEdgesChange(updatedEdges);
    },
    [edges, setEdges, onEdgesChange]
  );

  // Handle node drag stop
  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeDragStop(node.id, node.position);
      recomputeClusters(); // Immediate recompute on drop
    },
    [onNodeDragStop, recomputeClusters]
  );

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={enrichedNodes}
        edges={filteredEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.1}
        maxZoom={2}
        // Read-only: disable new connections
        nodesConnectable={false}
        defaultEdgeOptions={{
          style: { strokeWidth: 2 },
        }}
        className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-900"
      >
        {/* Background Pattern */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(255, 255, 255, 0.1)"
        />

        {/* Controls */}
        <Controls
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg"
          showInteractive={false}
        />

        {/* MiniMap */}
        <MiniMap
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg"
          nodeColor={(node) => {
            if (node.type === 'character') {
              const charData = node.data as CharacterNodeData;
              const fId = charData.character?.faction_id;
              if (fId && factionColorMap[fId]) return factionColorMap[fId];
              return '#3b82f6';
            }
            if (node.type === 'faction') return '#a855f7';
            return '#6b7280';
          }}
          maskColor="rgba(0, 0, 0, 0.6)"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }}
        />
      </ReactFlow>

      {/* Faction cluster overlays */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <ClusterOverlay clusters={clusters} />
      </div>

      {/* Subtle ambient background */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </div>
    </div>
  );
};

export default RelationshipMapCanvas;
