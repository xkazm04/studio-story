'use client';

import React from 'react';
import { ListChecks } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { beatApi } from '@/app/hooks/integration/useBeats';
import { useScriptContextStore } from '../../store/scriptContextStore';
import PanelFrame from '../shared/PanelFrame';

interface BeatsSidebarPanelProps {
  onClose?: () => void;
}

const BEAT_TYPE_COLORS: Record<string, string> = {
  setup: 'bg-blue-500/20 text-blue-400',
  conflict: 'bg-red-500/20 text-red-400',
  resolution: 'bg-green-500/20 text-green-400',
  climax: 'bg-amber-500/20 text-amber-400',
  transition: 'bg-slate-500/20 text-slate-400',
  reveal: 'bg-violet-500/20 text-violet-400',
  action: 'bg-orange-500/20 text-orange-400',
};

export default function BeatsSidebarPanel({ onClose }: BeatsSidebarPanelProps) {
  const { selectedProject, selectedAct } = useProjectStore();
  const projectId = selectedProject?.id || '';
  const actId = selectedAct?.id || '';
  const { data: beats = [] } = beatApi.useGetActBeats(actId, !!actId);
  const referencedBeats = useScriptContextStore((s) => s.referencedBeats);
  const requestInsert = useScriptContextStore((s) => s.requestInsert);

  const referencedSet = new Set(referencedBeats);

  const handleBeatClick = (beat: { name: string; description?: string }) => {
    requestInsert({ type: 'beat', beatRef: beat.name });
  };

  if (!projectId || !actId) {
    return (
      <PanelFrame title="Beats" icon={ListChecks} onClose={onClose} headerAccent="violet">
        <div className="flex items-center justify-center h-full text-xs text-slate-500">
          Select a project and act
        </div>
      </PanelFrame>
    );
  }

  return (
    <PanelFrame title="Beats" icon={ListChecks} onClose={onClose} headerAccent="violet">
      <div className="flex-1 overflow-auto p-2 space-y-1">
        {beats.length === 0 ? (
          <div className="text-center text-[10px] text-slate-600 py-4">
            No beats in this act
          </div>
        ) : (
          beats.map((beat) => {
            const isReferenced = referencedSet.has(beat.name);
            const typeColor = BEAT_TYPE_COLORS[beat.type] || 'bg-slate-500/20 text-slate-400';
            return (
              <button
                key={beat.id}
                onClick={() => handleBeatClick(beat)}
                className={cn(
                  'w-full text-left px-2.5 py-2 rounded-md text-xs transition-colors',
                  'border border-transparent',
                  isReferenced
                    ? 'bg-indigo-500/10 border-indigo-500/30'
                    : 'bg-slate-900/30 hover:bg-slate-800/40',
                )}
              >
                <div className="flex items-center gap-2">
                  {isReferenced && (
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  )}
                  <span className={cn(
                    'font-medium truncate',
                    isReferenced ? 'text-indigo-300' : 'text-slate-300',
                  )}>
                    {beat.name}
                  </span>
                  <span className={cn(
                    'ml-auto shrink-0 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-medium',
                    typeColor,
                  )}>
                    {beat.type}
                  </span>
                </div>
                {beat.description && (
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 pl-3.5">
                    {beat.description}
                  </p>
                )}
              </button>
            );
          })
        )}
      </div>
    </PanelFrame>
  );
}
