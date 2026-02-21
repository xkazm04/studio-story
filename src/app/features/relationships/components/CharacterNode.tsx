'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { User } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { CharacterNodeData } from '../types';

const CharacterNode = memo(({ data, selected }: NodeProps<CharacterNodeData>) => {
  const character = data.character;

  return (
    <div
      className={cn(
        'relative bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border-2 rounded-xl p-4 min-w-[180px] max-w-[200px] transition-all duration-300 shadow-lg',
        selected
          ? 'border-blue-400 shadow-blue-400/50 shadow-2xl scale-105'
          : 'border-blue-500/50 hover:border-blue-400 hover:shadow-xl hover:scale-102'
      )}
      style={{
        animation: selected ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
      }}
    >
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-blue-400 !border-2 !border-blue-600"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-400 !border-2 !border-blue-600"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-blue-400 !border-2 !border-blue-600"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-blue-400 !border-2 !border-blue-600"
      />

      {/* Node Content */}
      <div className="flex flex-col items-center gap-2">
        {/* Avatar */}
        <div className="relative">
          {character.avatar_url ? (
            <img
              src={character.avatar_url}
              alt={character.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-blue-400 shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-500/30 border-2 border-blue-400 flex items-center justify-center">
              <User className="w-8 h-8 text-blue-300" />
            </div>
          )}

          {/* Type Badge */}
          <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full border border-blue-400 shadow-lg">
            {character.type || 'Character'}
          </div>
        </div>

        {/* Name */}
        <div className="text-center">
          <div className="font-semibold text-white text-sm truncate max-w-[160px]">
            {character.name}
          </div>
          {character.voice && (
            <div className="text-xs text-blue-200 truncate max-w-[160px]">
              {character.voice}
            </div>
          )}
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-xl bg-blue-400/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
});

CharacterNode.displayName = 'CharacterNode';

export default CharacterNode;
