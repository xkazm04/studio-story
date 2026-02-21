/**
 * SceneNode Component
 * Custom React Flow node for story scenes
 * Design: Clean Manuscript style with monospace accents
 */

'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { cn } from '@/lib/utils';
import { Play, AlertTriangle, AlertCircle, GitBranch, FileText, Image, Type } from 'lucide-react';
import { SceneNodeData } from '../hooks/useSceneGraphData';

interface NodeStatusResult {
  bgClass: string;
  borderClass: string;
  icon: React.ReactNode;
  label: string;
}

function getNodeStatus(data: SceneNodeData): NodeStatusResult {
  const { isFirst, isOrphaned, isDeadEnd, isComplete, depth } = data;

  if (isFirst) {
    return {
      bgClass: 'bg-slate-800',
      borderClass: 'border-cyan-500',
      icon: <Play className="w-3 h-3 text-cyan-400 fill-cyan-400" />,
      label: 'START',
    };
  }

  if (isOrphaned) {
    return {
      bgClass: 'bg-slate-800',
      borderClass: 'border-amber-500',
      icon: <AlertTriangle className="w-3 h-3 text-amber-500" />,
      label: 'ORPHAN',
    };
  }

  if (isDeadEnd) {
    return {
      bgClass: 'bg-slate-800',
      borderClass: 'border-red-500',
      icon: <AlertCircle className="w-3 h-3 text-red-500" />,
      label: 'DEAD END',
    };
  }

  if (isComplete) {
    return {
      bgClass: 'bg-slate-800',
      borderClass: 'border-emerald-500',
      icon: null,
      label: `LEVEL ${depth}`,
    };
  }

  return {
    bgClass: 'bg-slate-800',
    borderClass: 'border-slate-600',
    icon: null,
    label: `LEVEL ${depth}`,
  };
}

/**
 * Custom comparison for memoization
 */
function arePropsEqual(
  prevProps: NodeProps<SceneNodeData>,
  nextProps: NodeProps<SceneNodeData>
): boolean {
  if (prevProps.id !== nextProps.id) return false;
  if (prevProps.selected !== nextProps.selected) return false;

  const prev = prevProps.data;
  const next = nextProps.data;

  return (
    prev.label === next.label &&
    prev.isFirst === next.isFirst &&
    prev.isOrphaned === next.isOrphaned &&
    prev.isDeadEnd === next.isDeadEnd &&
    prev.isSelected === next.isSelected &&
    prev.isComplete === next.isComplete &&
    prev.choiceCount === next.choiceCount &&
    prev.depth === next.depth
  );
}

const SceneNode = memo(function SceneNode({ data, selected, id }: NodeProps<SceneNodeData>) {
  const { label, isSelected, choiceCount, scene } = data;
  const status = useMemo(() => getNodeStatus(data), [data]);

  const isNodeSelected = isSelected || selected;
  const hasContent = !!scene.content || !!scene.description;
  const hasImage = !!scene.image_url;
  const hasTitle = !!scene.name && scene.name !== 'Untitled Scene';

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      (event.target as HTMLElement).click();
    }
  }, []);

  return (
    <div
      className={cn(
        'relative rounded-lg border-2 transition-all duration-200 cursor-pointer group',
        'shadow-lg shadow-black/20',
        status.bgClass,
        status.borderClass,
        isNodeSelected && 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950 scale-105 z-50',
        !isNodeSelected && 'hover:shadow-xl hover:scale-[1.02] hover:z-10'
      )}
      style={{ width: 140, minHeight: 85, contain: 'layout style paint' }}
      tabIndex={0}
      role="treeitem"
      aria-selected={isNodeSelected}
      aria-level={data.depth >= 0 ? data.depth + 1 : undefined}
      data-node-id={id}
      onKeyDown={handleKeyDown}
    >
      {/* Source handle (left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-slate-600 !border-slate-500 !w-2 !h-2"
      />

      {/* Top accent bar */}
      <div
        className={cn(
          'absolute top-0 left-2 right-2 h-0.5 rounded-b',
          data.isFirst ? 'bg-cyan-500' :
          data.isOrphaned ? 'bg-amber-500' :
          data.isDeadEnd ? 'bg-red-500' :
          data.isComplete ? 'bg-emerald-500' : 'bg-slate-600'
        )}
      />

      {/* Header with status */}
      <div className="flex items-center gap-1 px-2 pt-2 pb-1">
        {status.icon}
        <span
          className={cn(
            'text-[9px] font-mono font-bold uppercase tracking-wider',
            data.isFirst ? 'text-cyan-400' :
            data.isOrphaned ? 'text-amber-500' :
            data.isDeadEnd ? 'text-red-500' : 'text-slate-400'
          )}
        >
          {status.label}
        </span>
      </div>

      {/* Title */}
      <div className="px-2 pb-1.5">
        <p className="text-xs font-semibold leading-tight line-clamp-2 text-slate-100 min-h-8">
          {label}
        </p>
      </div>

      {/* Footer with indicators */}
      <div className="flex items-center justify-between px-2 pb-2 pt-1 border-t border-slate-700/50">
        <div className="flex items-center gap-1">
          <Type className={cn('w-3 h-3', hasTitle ? 'text-emerald-400' : 'text-slate-600')} />
          <FileText className={cn('w-3 h-3', hasContent ? 'text-emerald-400' : 'text-slate-600')} />
          <Image className={cn('w-3 h-3', hasImage ? 'text-emerald-400' : 'text-slate-600')} />
        </div>

        {choiceCount > 0 && (
          <div
            className={cn(
              'flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-medium',
              choiceCount === 1 ? 'bg-slate-700 text-slate-300' :
              choiceCount === 2 ? 'bg-cyan-900/50 text-cyan-400' :
              'bg-purple-900/50 text-purple-400'
            )}
          >
            <GitBranch className="w-2.5 h-2.5" />
            <span>{choiceCount}</span>
          </div>
        )}
      </div>

      {/* Target handle (right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-slate-600 !border-slate-500 !w-2 !h-2"
      />
    </div>
  );
}, arePropsEqual);

SceneNode.displayName = 'SceneNode';
export default SceneNode;
