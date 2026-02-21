'use client';

import React from 'react';
import { Users, User } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { characterApi } from '@/app/hooks/integration/useCharacters';
import { useScriptContextStore } from '../../store/scriptContextStore';
import PanelFrame from '../shared/PanelFrame';

interface CastSidebarPanelProps {
  onClose?: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  protagonist: 'Lead',
  antagonist: 'Antag',
  supporting: 'Support',
  minor: 'Minor',
};

export default function CastSidebarPanel({ onClose }: CastSidebarPanelProps) {
  const { selectedProject } = useProjectStore();
  const projectId = selectedProject?.id || '';
  const { data: characters = [] } = characterApi.useProjectCharacters(projectId, !!projectId);
  const referencedSpeakers = useScriptContextStore((s) => s.referencedSpeakers);
  const requestInsert = useScriptContextStore((s) => s.requestInsert);

  const referencedSet = new Set(referencedSpeakers);

  const handleCharacterClick = (name: string) => {
    requestInsert({ type: 'dialogue', speaker: name });
  };

  if (!projectId) {
    return (
      <PanelFrame title="Cast" icon={Users} onClose={onClose} headerAccent="cyan">
        <div className="flex items-center justify-center h-full text-xs text-slate-500">
          Select a project first
        </div>
      </PanelFrame>
    );
  }

  return (
    <PanelFrame
      title={`Cast (${characters.length})`}
      icon={Users}
      onClose={onClose}
      headerAccent="cyan"
    >
      <div className="flex-1 overflow-auto p-2 space-y-1">
        {characters.length === 0 ? (
          <div className="text-center text-[10px] text-slate-600 py-4">
            No characters yet
          </div>
        ) : (
          characters.map((char) => {
            const isReferenced = referencedSet.has(char.name);
            return (
              <button
                key={char.id}
                onClick={() => handleCharacterClick(char.name)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors',
                  'border border-transparent',
                  isReferenced
                    ? 'bg-cyan-500/10 border-cyan-500/30'
                    : 'bg-slate-900/30 hover:bg-slate-800/40',
                )}
              >
                {/* Avatar */}
                {char.avatar_url ? (
                  <img
                    src={char.avatar_url}
                    alt={char.name}
                    className="w-6 h-6 rounded-full object-cover border border-slate-700/50 shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center shrink-0">
                    <User className="w-3 h-3 text-slate-500" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {isReferenced && (
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                    )}
                    <span className={cn(
                      'text-xs font-medium truncate',
                      isReferenced ? 'text-cyan-300' : 'text-slate-300',
                    )}>
                      {char.name}
                    </span>
                  </div>
                  {char.type && (
                    <p className="text-[10px] text-slate-500 truncate">
                      {TYPE_LABELS[char.type] || char.type}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </PanelFrame>
  );
}
