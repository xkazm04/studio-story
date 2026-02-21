'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Shield } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { FactionNodeData } from '../types';

const FactionNode = memo(({ data, selected }: NodeProps<FactionNodeData>) => {
  const faction = data.faction;

  return (
    <div
      className={cn(
        'relative bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border-2 rounded-xl p-4 min-w-[200px] max-w-[220px] transition-all duration-300 shadow-lg',
        selected
          ? 'border-purple-400 shadow-purple-400/50 shadow-2xl scale-105'
          : 'border-purple-500/50 hover:border-purple-400 hover:shadow-xl hover:scale-102'
      )}
      style={{
        animation: selected ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
        borderColor: faction.color || undefined
      }}
    >
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-purple-600"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-purple-600"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-purple-600"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-purple-600"
      />

      {/* Node Content */}
      <div className="flex flex-col items-center gap-3">
        {/* Logo/Icon */}
        <div className="relative">
          {faction.logo_url ? (
            <img
              src={faction.logo_url}
              alt={faction.name}
              className="w-20 h-20 rounded-lg object-cover border-2 border-purple-400 shadow-lg"
            />
          ) : (
            <div
              className="w-20 h-20 rounded-lg border-2 border-purple-400 flex items-center justify-center shadow-lg"
              style={{
                backgroundColor: faction.color ? `${faction.color}40` : 'rgba(168, 85, 247, 0.3)'
              }}
            >
              <Shield className="w-10 h-10 text-purple-300" />
            </div>
          )}

          {/* Faction Badge */}
          <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full border border-purple-400 shadow-lg">
            Faction
          </div>
        </div>

        {/* Name */}
        <div className="text-center">
          <div className="font-bold text-white text-base truncate max-w-[180px]">
            {faction.name}
          </div>
          {faction.description && (
            <div className="text-xs text-purple-200 line-clamp-2 max-w-[180px] mt-1">
              {faction.description}
            </div>
          )}
        </div>

        {/* Color Indicator */}
        {faction.color && (
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border-2 border-white shadow-md"
              style={{ backgroundColor: faction.color }}
            />
            <span className="text-xs text-purple-200">Theme Color</span>
          </div>
        )}
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-xl bg-purple-400/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
});

FactionNode.displayName = 'FactionNode';

export default FactionNode;
