'use client';

import React, { useMemo } from 'react';
import { AudioLines, Clock, Users, Download } from 'lucide-react';
import PanelFrame from '../../shared/PanelFrame';
import { PanelEmptyState } from '../../shared/PanelPrimitives';
import type { BaseAdapterProps } from '../types';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { characterApi } from '@/app/hooks/integration/useCharacters';
import { useVoicesByProject } from '@/app/hooks/useVoices';
import { narrationSessionApi } from '@/app/hooks/integration/useNarrationSessions';
import { useWorkspaceStore } from '@/workspace/store/workspaceStore';

type AudioToolbarAdapterProps = BaseAdapterProps;

interface MetricPill {
  icon: React.ElementType;
  label: string;
  value: string | number;
}

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function StatPill({ icon: Icon, label, value }: MetricPill) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-slate-800/60 px-3 py-1.5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-400/70" />
      <span className="text-[11px] text-slate-400">{label}</span>
      <span className="text-xs font-medium text-slate-200">{value}</span>
    </div>
  );
}

function MicroBadge({ clipCount }: { clipCount: number }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex items-center gap-1 rounded-md bg-slate-800/60 px-2 py-1">
        <AudioLines className="h-3 w-3 text-emerald-400/70" />
        <span className="text-xs font-medium text-slate-200">{clipCount}</span>
      </div>
    </div>
  );
}

export default function AudioToolbarAdapter({ onClose, density }: AudioToolbarAdapterProps) {
  const { selectedProject } = useProjectStore();
  const projectId = selectedProject?.id;

  const { data: characters = [] } = characterApi.useProjectCharacters(projectId ?? '', !!projectId);
  const { data: voices = [] } = useVoicesByProject(projectId ?? '');
  const { data: sessions = [] } = narrationSessionApi.useProjectSessions(projectId, !!projectId);

  const showPanels = useWorkspaceStore((s) => s.showPanels);

  const stats = useMemo(() => {
    let totalClips = 0;
    let totalDuration = 0;
    let exportJobs = { completed: 0, total: 0 };

    for (const session of sessions) {
      const doneLines = session.script_lines?.filter((l) => l.status === 'done') ?? [];
      totalClips += doneLines.length;
      totalDuration += session.total_duration ?? 0;
      if (session.status === 'exported') {
        exportJobs.completed++;
        exportJobs.total++;
      } else if (session.status === 'generating' || session.status === 'partial') {
        exportJobs.total++;
      }
    }

    const assignedVoices = voices.filter((v) => v.character_id).length;
    const totalCharacters = characters.length;

    return { totalClips, totalDuration, assignedVoices, totalCharacters, exportJobs };
  }, [sessions, voices, characters]);

  const pills: MetricPill[] = useMemo(() => [
    { icon: AudioLines, label: 'Clips', value: stats.totalClips },
    { icon: Clock, label: 'Duration', value: formatDuration(stats.totalDuration) },
    { icon: Users, label: 'Voices', value: `${stats.assignedVoices}/${stats.totalCharacters}` },
    { icon: Download, label: 'Exports', value: stats.exportJobs.total > 0 ? `${stats.exportJobs.completed}/${stats.exportJobs.total}` : '—' },
  ], [stats]);

  if (!projectId) {
    return (
      <PanelFrame title="Audio" icon={AudioLines} onClose={onClose} headerAccent="emerald" density={density}>
        <PanelEmptyState
          icon={AudioLines}
          title="No project selected"
          description="Select a project to view audio production stats."
        />
      </PanelFrame>
    );
  }

  // Micro density: just clip count badge
  if (density === 'micro') {
    return (
      <PanelFrame title="Audio" icon={AudioLines} onClose={onClose} headerAccent="emerald" density={density}>
        <MicroBadge clipCount={stats.totalClips} />
      </PanelFrame>
    );
  }

  // Compact density: 2 pills (clips + duration), no actions
  if (density === 'compact') {
    return (
      <PanelFrame title="Audio" icon={AudioLines} onClose={onClose} headerAccent="emerald" density={density}>
        <div className="flex flex-wrap gap-2 p-2">
          {pills.slice(0, 2).map((p) => (
            <StatPill key={p.label} {...p} />
          ))}
        </div>
      </PanelFrame>
    );
  }

  // Full density: all 4 pills + quick actions
  return (
    <PanelFrame title="Audio" icon={AudioLines} onClose={onClose} headerAccent="emerald" density={density}>
      <div className="flex flex-col gap-3 p-2">
        <div className="flex flex-wrap gap-2">
          {pills.map((p) => (
            <StatPill key={p.label} {...p} />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => showPanels([{ type: 'audio-production', density: 'full', dataSlice: { view: 'performance' } }])}
            className="flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20"
          >
            <AudioLines className="h-3.5 w-3.5" />
            Open Narration
          </button>
          <button
            type="button"
            onClick={() => showPanels([{ type: 'audio-production', density: 'full', dataSlice: { view: 'performance' }, props: { autoExport: true } }])}
            className="flex items-center gap-1.5 rounded-md border border-slate-700/50 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700/60"
          >
            <Download className="h-3.5 w-3.5" />
            Export Audio
          </button>
        </div>
      </div>
    </PanelFrame>
  );
}
