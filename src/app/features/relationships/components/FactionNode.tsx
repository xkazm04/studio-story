'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Shield } from 'lucide-react';
import { FactionNodeData } from '../types';

/**
 * Faction node — acts as a labeled anchor point at the cluster centroid.
 * Kept semi-transparent so the convex hull background is the primary visual.
 */
const FactionNode = memo(({ data, selected }: NodeProps<FactionNodeData>) => {
  const faction = data.faction;
  const color = faction.color || faction.branding?.primary_color || '#a855f7';

  return (
    <div
      className="relative flex items-center justify-center rounded-xl px-5 py-3 transition-all duration-200 pointer-events-auto"
      style={{
        backgroundColor: `${color}18`, // ~10% opacity
        border: `1px solid ${color}40`,
        minWidth: 120,
        opacity: selected ? 1 : 0.85,
        boxShadow: selected ? `0 0 12px ${color}30` : 'none',
      }}
    >
      {/* Handles (hidden visually but functional for edge connections) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-transparent !border-0 !min-w-0 !min-h-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-transparent !border-0 !min-w-0 !min-h-0"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-transparent !border-0 !min-w-0 !min-h-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-transparent !border-0 !min-w-0 !min-h-0"
      />

      <Shield className="w-4 h-4 mr-2 flex-shrink-0" style={{ color }} />
      <span
        className="text-sm font-semibold truncate"
        style={{ color }}
      >
        {faction.name}
      </span>
    </div>
  );
});

FactionNode.displayName = 'FactionNode';

export default FactionNode;
