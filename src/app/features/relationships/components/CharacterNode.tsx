'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { User } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { CharacterNodeData } from '../types';

export interface CharacterNodeExtraData extends CharacterNodeData {
  /** Faction color looked up from the parent's factionColorMap */
  factionColor?: string;
}

const CharacterNode = memo(({ data, selected }: NodeProps<CharacterNodeExtraData>) => {
  const character = data.character;
  const factionColor = data.factionColor ?? null;
  const role = character.type || character.faction_role || null;

  return (
    <div
      className={cn(
        'relative bg-slate-800/90 border border-slate-700 rounded-lg transition-all duration-200 shadow-md',
        'w-[160px] min-h-[56px] flex flex-row items-center gap-2 px-3 py-2',
        selected
          ? 'ring-2 ring-cyan-400/60 shadow-lg shadow-cyan-500/20 scale-105'
          : 'hover:shadow-lg hover:border-slate-600'
      )}
      style={{
        borderLeftWidth: 3,
        borderLeftColor: factionColor ?? 'rgb(71, 85, 105)', // slate-600 fallback
      }}
    >
      {/* Connection Handles — small and subtle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-slate-500 !border !border-slate-400 !min-w-0 !min-h-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-slate-500 !border !border-slate-400 !min-w-0 !min-h-0"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-slate-500 !border !border-slate-400 !min-w-0 !min-h-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-slate-500 !border !border-slate-400 !min-w-0 !min-h-0"
      />

      {/* Compact avatar */}
      <div className="flex-shrink-0">
        {character.avatar_url ? (
          <img
            src={character.avatar_url}
            alt={character.name}
            className="w-8 h-8 rounded-full object-cover border border-slate-600"
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center border border-slate-600"
            style={{
              backgroundColor: factionColor
                ? `${factionColor}20`
                : 'rgba(100, 116, 139, 0.25)',
            }}
          >
            <User className="w-4 h-4 text-slate-400" />
          </div>
        )}
      </div>

      {/* Name + role */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-semibold text-slate-100 truncate leading-tight">
          {character.name}
        </span>
        {role && (
          <span className="text-[11px] text-slate-400 truncate leading-tight">
            {role}
          </span>
        )}
      </div>
    </div>
  );
});

CharacterNode.displayName = 'CharacterNode';

export default CharacterNode;
