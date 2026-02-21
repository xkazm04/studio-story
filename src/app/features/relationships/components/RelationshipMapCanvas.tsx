'use client';

import React, { useCallback, useMemo } from 'react';
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
  addEdge,
  Connection,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges
} from 'reactflow';
import 'reactflow/dist/style.css';

import CharacterNode from './CharacterNode';
import FactionNode from './FactionNode';
import RelationshipEdge from './RelationshipEdge';
import { RelationshipNode, RelationshipEdge as RelEdge, RelationshipType } from '../types';

interface RelationshipMapCanvasProps {
  nodes: RelationshipNode[];
  edges: RelEdge[];
  onNodesChange: (nodes: RelationshipNode[]) => void;
  onEdgesChange: (edges: RelEdge[]) => void;
  onNodeDragStop: (nodeId: string, position: { x: number; y: number }) => void;
  activeFilters: Set<RelationshipType>;
}

const RelationshipMapCanvas: React.FC<RelationshipMapCanvasProps> = ({
  nodes: initialNodes,
  edges: initialEdges,
  onNodesChange,
  onEdgesChange,
  onNodeDragStop,
  activeFilters
}) => {
  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);

  // Update nodes when initialNodes change
  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // Update edges when initialEdges change
  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

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
    },
    [nodes, setNodes, onNodesChange]
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
    },
    [onNodeDragStop]
  );

  // Handle new connections (for future use)
  const handleConnect = useCallback(
    (connection: Connection) => {
      // For now, just add the edge visually
      // In a full implementation, this would create a new relationship via API
      const newEdge = {
        ...connection,
        type: 'relationship',
        data: {
          relationshipId: `temp-${Date.now()}`,
          relationshipType: RelationshipType.UNKNOWN,
          description: 'New relationship'
        }
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={filteredEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          animated: true,
          style: { strokeWidth: 2 }
        }}
        className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900"
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
            if (node.type === 'character') return '#3b82f6';
            if (node.type === 'faction') return '#a855f7';
            return '#6b7280';
          }}
          maskColor="rgba(0, 0, 0, 0.6)"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }}
        />
      </ReactFlow>

      {/* Animated Background Gradient */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
    </div>
  );
};

export default RelationshipMapCanvas;
