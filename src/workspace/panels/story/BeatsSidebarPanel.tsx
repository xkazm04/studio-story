'use client';

import React from 'react';
import { ListChecks } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { beatApi } from '@/app/hooks/integration/useBeats';
import { useScriptContextStore } from '../../store/scriptContextStore';
import PanelFrame from '../shared/PanelFrame';
import { BEAT_TYPE_COLORS, BEAT_TYPE_FALLBACK, INTERACTIVE } from '@/workspace/theme/tokens';
import type { PanelDensity } from '@/workspace/types';

interface BeatsSidebarPanelProps {
  onClose?: () => void;
  density?: PanelDensity;
}

export default function BeatsSidebarPanel({ onClose, density }: BeatsSidebarPanelProps) {
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
      <PanelFrame title="Beats" icon={ListChecks} onClose={onClose} headerAccent="violet" density={density}>
        <div className="flex items-center justify-center h-full text-sm text-slate-400">
          Select a project and act
        </div>
      </PanelFrame>
    );
  }

  return (
    <PanelFrame title="Beats" icon={ListChecks} onClose={onClose} headerAccent="violet" density={density}>
      <div className="flex-1 overflow-auto p-2 space-y-1">
        {beats.length === 0 ? (
          <div className="text-center text-sm text-slate-400 py-4">
            No beats in this act
          </div>
        ) : (
          beats.map((beat) => {
            const isReferenced = referencedSet.has(beat.name);
            const typeColor = BEAT_TYPE_COLORS[beat.type] || BEAT_TYPE_FALLBACK;
            return (
              <button
                key={beat.id}
                onClick={() => handleBeatClick(beat)}
                className={cn(
                  'w-full text-left px-2.5 py-2 rounded-md text-sm border border-transparent',
                  INTERACTIVE.row,
                  INTERACTIVE.focusRing,
                  isReferenced
                    ? 'bg-indigo-500/10 border-indigo-500/30'
                    : 'bg-slate-900/30',
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
                  <p className="hidden @sm:block text-sm text-slate-400 mt-0.5 line-clamp-2 pl-3.5">
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
