/**
 * DependencyGraph
 * Visual graph display for beat dependencies showing prerequisite relationships
 */

'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowRight,
  Lock,
  Zap,
  Clock,
  Target,
  Layers,
} from 'lucide-react';
import {
  type Dependency,
  type DependencyType,
  type CausalityChain,
  DependencyManager,
} from '@/lib/beats/DependencyManager';

// Beat summary for graph display
interface BeatSummary {
  id: string;
  title: string;
  order: number;
  type?: string;
  sceneId?: string;
  sceneName?: string;
}

interface DependencyGraphProps {
  beats: BeatSummary[];
  dependencies: Dependency[];
  selectedBeatId?: string;
  onSelectBeat?: (beatId: string) => void;
  highlightChain?: string[];
  compact?: boolean;
}

// Node position in graph
interface NodePosition {
  x: number;
  y: number;
  layer: number;
}

// Graph node component
function GraphNode({
  beat,
  position,
  isSelected,
  isInChain,
  hasError,
  onClick,
  scale,
}: {
  beat: BeatSummary;
  position: NodePosition;
  isSelected: boolean;
  isInChain: boolean;
  hasError: boolean;
  onClick: () => void;
  scale: number;
}) {
  const nodeSize = 60 * scale;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{ cursor: 'pointer' }}
      onClick={onClick}
    >
      {/* Node circle */}
      <circle
        cx={position.x}
        cy={position.y}
        r={nodeSize / 2}
        className={cn(
          'transition-all duration-200',
          isSelected
            ? 'fill-cyan-500/30 stroke-cyan-400'
            : isInChain
            ? 'fill-amber-500/20 stroke-amber-400'
            : hasError
            ? 'fill-red-500/20 stroke-red-400'
            : 'fill-slate-700/50 stroke-slate-600 hover:fill-slate-700 hover:stroke-slate-500'
        )}
        strokeWidth={isSelected ? 3 : 2}
      />

      {/* Order number badge */}
      <circle
        cx={position.x + nodeSize / 2 - 8}
        cy={position.y - nodeSize / 2 + 8}
        r={12 * scale}
        className="fill-slate-800 stroke-slate-600"
        strokeWidth={1}
      />
      <text
        x={position.x + nodeSize / 2 - 8}
        y={position.y - nodeSize / 2 + 8}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-slate-300 text-[10px] font-medium"
        style={{ fontSize: `${10 * scale}px` }}
      >
        {beat.order}
      </text>

      {/* Beat title (truncated) */}
      <foreignObject
        x={position.x - nodeSize / 2 + 5}
        y={position.y - 8}
        width={nodeSize - 10}
        height={20}
      >
        <div
          className="text-center text-[10px] text-slate-200 truncate px-1"
          title={beat.title}
          style={{ fontSize: `${10 * scale}px` }}
        >
          {beat.title.length > 8 ? beat.title.slice(0, 8) + '...' : beat.title}
        </div>
      </foreignObject>

      {/* Status indicator */}
      {hasError && (
        <g transform={`translate(${position.x + nodeSize / 2 - 12}, ${position.y + nodeSize / 2 - 12})`}>
          <circle r={8 * scale} className="fill-red-500" />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-white text-[8px] font-bold"
            style={{ fontSize: `${8 * scale}px` }}
          >
            !
          </text>
        </g>
      )}
    </motion.g>
  );
}

// Edge (dependency line) component
function GraphEdge({
  from,
  to,
  dependency,
  isHighlighted,
  scale,
}: {
  from: NodePosition;
  to: NodePosition;
  dependency: Dependency;
  isHighlighted: boolean;
  scale: number;
}) {
  const nodeRadius = 30 * scale;

  // Calculate line endpoints (edge of circles)
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const normX = dx / dist;
  const normY = dy / dist;

  const x1 = from.x + normX * nodeRadius;
  const y1 = from.y + normY * nodeRadius;
  const x2 = to.x - normX * (nodeRadius + 8); // Extra space for arrow
  const y2 = to.y - normY * (nodeRadius + 8);

  // Curved path for parallel edges
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const curvature = 0.2;
  const perpX = -normY * dist * curvature;
  const perpY = normX * dist * curvature;

  const path = `M ${x1} ${y1} Q ${midX + perpX} ${midY + perpY} ${x2} ${y2}`;

  // Edge colors by type
  const typeColors: Record<DependencyType, string> = {
    sequential: '#ef4444',
    parallel: '#f59e0b',
    causal: '#22c55e',
  };

  const color = typeColors[dependency.type] || '#64748b';

  return (
    <g className="pointer-events-none">
      {/* Edge line */}
      <path
        d={path}
        fill="none"
        stroke={isHighlighted ? color : `${color}60`}
        strokeWidth={isHighlighted ? 3 : 2}
        strokeDasharray={dependency.strength === 'optional' ? '4 4' : undefined}
        className="transition-all duration-200"
        markerEnd="url(#arrowhead)"
      />

      {/* Type label on edge */}
      {isHighlighted && (
        <text
          x={midX + perpX}
          y={midY + perpY - 8}
          textAnchor="middle"
          className="fill-slate-400 text-[8px]"
          style={{ fontSize: `${8 * scale}px` }}
        >
          {dependency.type}
        </text>
      )}
    </g>
  );
}

// Calculate graph layout using layered approach
function calculateLayout(
  beats: BeatSummary[],
  dependencies: Dependency[],
  width: number,
  height: number
): Map<string, NodePosition> {
  const positions = new Map<string, NodePosition>();
  const manager = new DependencyManager();
  const beatData = beats.map(b => ({ id: b.id, name: b.title, order: b.order }));
  manager.initializeFromBeats(beatData, []);
  dependencies.forEach(d => manager.addDependency(d));

  // Get topological order
  const topoOrder = manager.getTopologicalOrder();
  const orderedBeatIds = topoOrder.hasValidOrder ? topoOrder.order : beats.map(b => b.id);

  // Calculate layers based on dependency depth
  const layers = new Map<string, number>();

  // Initialize all to 0
  beats.forEach(b => {
    layers.set(b.id, 0);
  });

  // Assign layers based on longest path from topological order
  orderedBeatIds.forEach(beatId => {
    const deps = dependencies.filter(d => d.targetBeatId === beatId);
    if (deps.length > 0) {
      const maxParentLayer = Math.max(
        ...deps.map(d => layers.get(d.sourceBeatId) || 0)
      );
      layers.set(beatId, maxParentLayer + 1);
    }
  });

  // Group beats by layer
  const layerGroups = new Map<number, string[]>();
  layers.forEach((layer, beatId) => {
    const group = layerGroups.get(layer) || [];
    group.push(beatId);
    layerGroups.set(layer, group);
  });

  // Calculate positions
  const maxLayer = Math.max(...Array.from(layers.values()), 0);
  const padding = 80;
  const layerWidth = maxLayer > 0 ? (width - padding * 2) / maxLayer : width - padding * 2;

  layerGroups.forEach((beatIds, layer) => {
    const layerHeight = beatIds.length > 1 ? (height - padding * 2) / (beatIds.length - 1) : 0;

    beatIds.forEach((beatId, index) => {
      positions.set(beatId, {
        x: padding + layer * layerWidth,
        y: beatIds.length === 1
          ? height / 2
          : padding + index * layerHeight,
        layer,
      });
    });
  });

  // Handle beats without dependencies (place at left)
  beats.forEach(beat => {
    if (!positions.has(beat.id)) {
      const y = (positions.size % 5) * 80 + 50;
      positions.set(beat.id, { x: padding, y, layer: 0 });
    }
  });

  return positions;
}

export default function DependencyGraph({
  beats,
  dependencies,
  selectedBeatId,
  onSelectBeat,
  highlightChain,
  compact = false,
}: DependencyGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [showLegend, setShowLegend] = useState(!compact);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Create dependency manager for validation
  const manager = useMemo(() => {
    const m = new DependencyManager();
    const beatData = beats.map(b => ({ id: b.id, name: b.title, order: b.order }));
    m.initializeFromBeats(beatData, []);
    dependencies.forEach(d => m.addDependency(d));
    return m;
  }, [dependencies, beats]);

  // Get validation errors
  const validationErrors = useMemo(() => {
    const beatOrders = new Map(beats.map(b => [b.id, b.order]));
    return manager.validate(beatOrders);
  }, [manager, beats]);

  // Get beats with errors
  const beatsWithErrors = useMemo(() => {
    const errorSet = new Set<string>();
    validationErrors.forEach(error => {
      error.affectedBeats.forEach(id => errorSet.add(id));
    });
    return errorSet;
  }, [validationErrors]);

  // Calculate layout
  const positions = useMemo(() => {
    return calculateLayout(beats, dependencies, dimensions.width / scale, dimensions.height / scale);
  }, [beats, dependencies, dimensions, scale]);

  // Create beat lookup
  const beatMap = useMemo(() => new Map(beats.map(b => [b.id, b])), [beats]);

  // Get causality chains for highlighting
  const causalityChains = useMemo(() => manager.findCausalityChains(), [manager]);

  // Find chain containing selected beat
  const selectedChain = useMemo(() => {
    if (!selectedBeatId) return null;
    return causalityChains.find(chain =>
      chain.beats.includes(selectedBeatId)
    );
  }, [causalityChains, selectedBeatId]);

  const highlightedBeatIds = useMemo(() => {
    if (highlightChain) return new Set(highlightChain);
    if (selectedChain) return new Set(selectedChain.beats);
    return new Set<string>();
  }, [highlightChain, selectedChain]);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || e.altKey) {
      setIsPanning(true);
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }));
    }
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Zoom handlers
  const handleZoomIn = () => setScale(s => Math.min(s * 1.2, 3));
  const handleZoomOut = () => setScale(s => Math.max(s / 1.2, 0.3));
  const handleReset = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  if (beats.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm">
        No beats to display
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-slate-900/50 rounded-lg border border-slate-700/50',
        compact ? 'h-48' : 'h-96'
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Controls */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        <button
          onClick={handleZoomIn}
          className="p-1.5 rounded bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1.5 rounded bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          className="p-1.5 rounded bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Reset view"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowLegend(!showLegend)}
          className={cn(
            'p-1.5 rounded bg-slate-800/80 border border-slate-700 transition-colors',
            showLegend ? 'text-cyan-400' : 'text-slate-300 hover:text-white'
          )}
          title="Toggle legend"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Legend */}
      <AnimatePresence>
        {showLegend && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="absolute top-2 left-2 z-10 bg-slate-800/90 border border-slate-700 rounded-lg p-2 text-xs"
          >
            <div className="font-medium text-slate-200 mb-2">Dependency Types</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-red-500" />
                <span className="text-slate-400">Sequential</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-amber-500" />
                <span className="text-slate-400">Parallel</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-green-500" />
                <span className="text-slate-400">Causal</span>
              </div>
            </div>
            <div className="border-t border-slate-700 mt-2 pt-2">
              <div className="flex items-center gap-2 text-slate-500">
                <Move className="w-3 h-3" />
                Alt+drag to pan
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats overlay */}
      <div className="absolute bottom-2 left-2 z-10 flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1 text-slate-400">
          <Layers className="w-3 h-3" />
          {beats.length} beats
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <ArrowRight className="w-3 h-3" />
          {dependencies.length} dependencies
        </div>
        {validationErrors.length > 0 && (
          <div className="flex items-center gap-1 text-red-400">
            <AlertTriangle className="w-3 h-3" />
            {validationErrors.length} issues
          </div>
        )}
        {validationErrors.length === 0 && dependencies.length > 0 && (
          <div className="flex items-center gap-1 text-green-400">
            <CheckCircle className="w-3 h-3" />
            Valid
          </div>
        )}
      </div>

      {/* SVG Graph */}
      <svg
        width={dimensions.width}
        height={dimensions.height}
        className={cn(isPanning && 'cursor-grabbing')}
      >
        <defs>
          {/* Arrow marker */}
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#64748b"
            />
          </marker>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
          {/* Render edges first (behind nodes) */}
          {dependencies.map((dep) => {
            const from = positions.get(dep.sourceBeatId);
            const to = positions.get(dep.targetBeatId);
            if (!from || !to) return null;

            const isHighlighted =
              dep.sourceBeatId === selectedBeatId ||
              dep.targetBeatId === selectedBeatId ||
              highlightedBeatIds.has(dep.sourceBeatId) ||
              highlightedBeatIds.has(dep.targetBeatId);

            return (
              <GraphEdge
                key={dep.id}
                from={from}
                to={to}
                dependency={dep}
                isHighlighted={isHighlighted}
                scale={scale}
              />
            );
          })}

          {/* Render nodes */}
          {beats.map((beat) => {
            const position = positions.get(beat.id);
            if (!position) return null;

            return (
              <GraphNode
                key={beat.id}
                beat={beat}
                position={position}
                isSelected={beat.id === selectedBeatId}
                isInChain={highlightedBeatIds.has(beat.id)}
                hasError={beatsWithErrors.has(beat.id)}
                onClick={() => onSelectBeat?.(beat.id)}
                scale={scale}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}

// Compact causality chain display
export function CausalityChainDisplay({
  chains,
  beatMap,
  onSelectChain,
}: {
  chains: CausalityChain[];
  beatMap: Map<string, BeatSummary>;
  onSelectChain?: (beatIds: string[]) => void;
}) {
  if (chains.length === 0) {
    return (
      <div className="text-xs text-slate-500 italic">No causality chains detected</div>
    );
  }

  return (
    <div className="space-y-2">
      {chains.slice(0, 5).map((chain, index) => (
        <button
          key={chain.id}
          onClick={() => onSelectChain?.(chain.beats)}
          className="w-full text-left p-2 rounded-lg bg-slate-800/50 border border-slate-700/50
            hover:border-cyan-500/30 transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-3 h-3 text-amber-400" />
            <span className="text-xs font-medium text-slate-200">
              {chain.name} ({chain.beats.length} beats)
            </span>
            <span
              className={cn(
                'text-xs px-1.5 py-0.5 rounded',
                chain.isComplete ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
              )}
            >
              {chain.isComplete ? 'Complete' : 'Incomplete'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400 overflow-hidden">
            {chain.beats.slice(0, 4).map((beatId, i) => (
              <span key={beatId} className="flex items-center gap-1">
                {i > 0 && <ArrowRight className="w-2 h-2" />}
                <span className="truncate max-w-[60px]">
                  {beatMap.get(beatId)?.title || 'Unknown'}
                </span>
              </span>
            ))}
            {chain.beats.length > 4 && (
              <span className="text-slate-500">+{chain.beats.length - 4}</span>
            )}
          </div>
        </button>
      ))}
      {chains.length > 5 && (
        <div className="text-xs text-slate-500">+{chains.length - 5} more chains</div>
      )}
    </div>
  );
}
