/**
 * GraphCanvas Component
 * React Flow canvas for scene graph visualization
 * Design: Clean Manuscript style with notebook grid background
 */

'use client';

import React, { useCallback, useMemo, useRef } from 'react';
import ReactFlow, {
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  ConnectionLineType,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { cn } from '@/lib/utils';
import SceneNode from './SceneNode';
import { SceneNodeData } from '../hooks/useSceneGraphData';

export interface GraphCanvasProps {
  initialNodes: Node<SceneNodeData>[];
  initialEdges: Edge[];
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  currentSceneId: string | null;
  pathNodeIds?: Set<string>;
  pathEdgeIds?: Set<string>;
  children?: React.ReactNode;
}

/**
 * Manuscript-style grid background for the canvas
 * Features notebook ruled lines and subtle dot grid
 */
function ManuscriptGridBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-zinc-950 to-gray-950">
      {/* Notebook ruled lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" preserveAspectRatio="none">
        <defs>
          <pattern id="graph-notebook-lines" width="100%" height="24" patternUnits="userSpaceOnUse">
            <line x1="0" y1="23" x2="100%" y2="23" stroke="#0891b2" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#graph-notebook-lines)" />
      </svg>

      {/* Dot grid overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" preserveAspectRatio="none">
        <defs>
          <pattern id="graph-dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="0.5" fill="#0891b2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#graph-dot-grid)" />
      </svg>

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/10 via-transparent to-slate-950/20" />
    </div>
  );
}

export function GraphCanvas({
  initialNodes,
  initialEdges,
  onNodeClick,
  currentSceneId,
  pathNodeIds = new Set(),
  pathEdgeIds = new Set(),
  children,
}: GraphCanvasProps) {
  const graphContainerRef = useRef<HTMLDivElement>(null);

  // State management for nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when initial data changes
  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Apply path highlighting to edges
  const styledEdges = useMemo(() => {
    return edges.map(edge => ({
      ...edge,
      style: {
        ...edge.style,
        stroke: pathEdgeIds.has(edge.id) ? '#22d3ee' : '#64748b',
        strokeWidth: pathEdgeIds.has(edge.id) ? 3 : 2,
      },
      animated: pathEdgeIds.has(edge.id),
    }));
  }, [edges, pathEdgeIds]);

  // Apply path highlighting to nodes
  const styledNodes = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        isOnPath: pathNodeIds.has(node.id),
      },
    }));
  }, [nodes, pathNodeIds]);

  const nodeTypes = useMemo(() => ({ sceneNode: SceneNode }), []);

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onNodeClick(event, node);
    },
    [onNodeClick]
  );

  // Get node color for minimap
  const getNodeColor = useCallback((node: Node<SceneNodeData>) => {
    if (node.data.isFirst) return '#22d3ee'; // cyan-400
    if (node.data.isOrphaned) return '#f59e0b'; // amber-500
    if (node.data.isDeadEnd) return '#ef4444'; // red-500
    if (node.data.isComplete) return '#10b981'; // emerald-500
    return '#64748b'; // slate-500
  }, []);

  return (
    <div
      ref={graphContainerRef}
      className={cn(
        'relative bg-slate-950 overflow-hidden font-sans'
      )}
      style={{ width: '100%', height: '100%', minHeight: '500px' }}
      data-testid="scene-graph-container"
      role="tree"
      aria-label="Story scene graph navigation"
      aria-activedescendant={currentSceneId ? `scene-node-${currentSceneId}` : undefined}
    >
      <ManuscriptGridBackground />

      <ReactFlow
        nodes={styledNodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        minZoom={0.05}
        maxZoom={2}
        defaultEdgeOptions={{ type: 'smoothstep', animated: false }}
        proOptions={{ hideAttribution: true }}
        style={{ background: 'transparent' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="rgb(100 116 139)"
          gap={24}
          size={1}
          className="opacity-30"
        />

        <Controls
          className={cn(
            '!bg-slate-900 !border-2 !border-slate-700 !rounded-lg !shadow-lg',
            '[&>button]:!bg-slate-800 [&>button]:!border-slate-600 [&>button]:!text-slate-300',
            '[&>button:hover]:!bg-slate-700'
          )}
          showInteractive={false}
          data-testid="scene-graph-controls"
        />

        <MiniMap
          nodeColor={getNodeColor}
          nodeStrokeWidth={3}
          maskColor="rgba(15, 23, 42, 0.8)"
          className="!bg-slate-900/95 !border-2 !border-slate-700 !rounded-lg !shadow-lg"
          style={{ width: 160, height: 100 }}
          pannable
          zoomable
          data-testid="scene-graph-minimap"
        />

        {children}
      </ReactFlow>
    </div>
  );
}
