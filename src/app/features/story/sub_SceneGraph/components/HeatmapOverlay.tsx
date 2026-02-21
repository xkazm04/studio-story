'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Node, Edge } from 'reactflow';
import { cn } from '@/lib/utils';
import type { HeatmapData, NodeHeat, EdgeHeat } from '@/lib/analytics';

interface HeatmapOverlayProps {
  nodes: Node[];
  edges: Edge[];
  heatmapData: HeatmapData | null;
  enabled: boolean;
  className?: string;
}

/**
 * HeatmapOverlay - Visual overlay for flow heatmap on scene graph
 *
 * Renders color-coded overlays on nodes and edges based on
 * simulated player traffic. Integrates with React Flow.
 */
export const HeatmapOverlay: React.FC<HeatmapOverlayProps> = ({
  nodes,
  edges,
  heatmapData,
  enabled,
  className,
}) => {
  // Build lookup maps for heat data
  const nodeHeatMap = useMemo(() => {
    if (!heatmapData) return new Map<string, NodeHeat>();
    return new Map(heatmapData.nodes.map(n => [n.sceneId, n]));
  }, [heatmapData]);

  const edgeHeatMap = useMemo(() => {
    if (!heatmapData) return new Map<string, EdgeHeat>();
    return new Map(heatmapData.edges.map(e => [e.choiceId, e]));
  }, [heatmapData]);

  if (!enabled || !heatmapData) {
    return null;
  }

  return (
    <div className={cn('absolute inset-0 pointer-events-none z-10', className)}>
      <AnimatePresence>
        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-4 right-4 bg-slate-900/90 border border-slate-800 rounded-lg p-3 pointer-events-auto"
        >
          <div className="text-[10px] font-medium text-slate-400 mb-2">Traffic Heatmap</div>
          <div className="flex items-center gap-2">
            <div className="flex h-2 rounded-full overflow-hidden">
              <div className="w-4 bg-blue-500/50" />
              <div className="w-4 bg-green-500/70" />
              <div className="w-4 bg-yellow-500/80" />
              <div className="w-4 bg-red-500/90" />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 gap-2">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800">
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>Max visits:</span>
              <span className="text-slate-400">{heatmapData.maxVisits.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>Min visits:</span>
              <span className="text-slate-400">{heatmapData.minVisits.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/**
 * Get node style modifications for heatmap visualization
 */
export function getHeatmapNodeStyle(
  sceneId: string,
  heatmapData: HeatmapData | null,
  enabled: boolean
): React.CSSProperties {
  if (!enabled || !heatmapData) {
    return {};
  }

  const nodeHeat = heatmapData.nodes.find(n => n.sceneId === sceneId);
  if (!nodeHeat) {
    return { opacity: 0.3 };
  }

  return {
    boxShadow: `0 0 ${8 + nodeHeat.normalizedHeat * 12}px ${nodeHeat.heatColor}`,
    borderColor: nodeHeat.heatColor,
  };
}

/**
 * Get edge style modifications for heatmap visualization
 */
export function getHeatmapEdgeStyle(
  choiceId: string,
  heatmapData: HeatmapData | null,
  enabled: boolean
): {
  style?: React.CSSProperties;
  animated?: boolean;
  strokeWidth?: number;
} {
  if (!enabled || !heatmapData) {
    return {};
  }

  const edgeHeat = heatmapData.edges.find(e => e.choiceId === choiceId);
  if (!edgeHeat) {
    return {
      style: { opacity: 0.2 },
      strokeWidth: 1,
    };
  }

  return {
    style: {
      stroke: edgeHeat.heatColor,
    },
    animated: edgeHeat.normalizedHeat > 0.7,
    strokeWidth: 1 + edgeHeat.normalizedHeat * 3,
  };
}

/**
 * HeatmapNodeBadge - Badge showing visit count on a node
 */
export const HeatmapNodeBadge: React.FC<{
  visits: number;
  normalizedHeat: number;
  className?: string;
}> = ({ visits, normalizedHeat, className }) => {
  if (visits === 0) return null;

  const bgColor = normalizedHeat < 0.25
    ? 'bg-blue-500/30'
    : normalizedHeat < 0.5
    ? 'bg-green-500/40'
    : normalizedHeat < 0.75
    ? 'bg-yellow-500/50'
    : 'bg-red-500/60';

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={cn(
        'absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full text-[9px] font-medium text-white',
        bgColor,
        className
      )}
    >
      {visits >= 1000 ? `${(visits / 1000).toFixed(1)}k` : visits}
    </motion.div>
  );
};

/**
 * HeatBar - Mini bar chart for inline heat visualization
 */
export const HeatBar: React.FC<{
  value: number;
  max: number;
  color?: string;
  className?: string;
}> = ({ value, max, color = 'cyan', className }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className={cn('h-1.5 bg-slate-800 rounded-full overflow-hidden', className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={cn(
          'h-full rounded-full',
          color === 'cyan' && 'bg-gradient-to-r from-cyan-500 to-blue-500',
          color === 'green' && 'bg-gradient-to-r from-green-500 to-emerald-500',
          color === 'amber' && 'bg-gradient-to-r from-amber-500 to-yellow-500',
          color === 'red' && 'bg-gradient-to-r from-red-500 to-orange-500'
        )}
      />
    </div>
  );
};

/**
 * HeatmapTooltip - Tooltip showing detailed heat info
 */
export const HeatmapTooltip: React.FC<{
  nodeHeat: NodeHeat | null;
  maxVisits: number;
  position?: { x: number; y: number };
}> = ({ nodeHeat, maxVisits, position }) => {
  if (!nodeHeat || !position) return null;

  const percentage = maxVisits > 0 ? (nodeHeat.visits / maxVisits) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        position: 'absolute',
        left: position.x + 10,
        top: position.y - 40,
      }}
      className="bg-slate-900 border border-slate-700 rounded-lg p-2 shadow-lg pointer-events-none z-50"
    >
      <div className="text-xs text-slate-200 font-medium mb-1">
        {nodeHeat.visits.toLocaleString()} visits
      </div>
      <div className="text-[10px] text-slate-500">
        {percentage.toFixed(1)}% of max traffic
      </div>
      <HeatBar value={nodeHeat.visits} max={maxVisits} className="mt-1.5 w-24" />
    </motion.div>
  );
};

export default HeatmapOverlay;
