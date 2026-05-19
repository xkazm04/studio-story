'use client';

import React, { useState, useCallback } from 'react';
import { AudioLines, BookOpen } from 'lucide-react';
import PanelFrame from '../shared/PanelFrame';
import { PanelEmptyState } from '../shared/PanelPrimitives';
import NarrationPipeline from '@/app/features/voice/components/NarrationPipeline';
import PerformanceControls from '@/app/features/voice/components/PerformanceControls';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { characterApi } from '@/app/hooks/integration/useCharacters';
import { useVoicesByProject } from '@/app/hooks/useVoices';
import type { VoiceSettings, VoiceNarrationResult } from '@/app/features/voice/types';
import type { PanelDensity, PanelDataSlice } from '@/workspace/types';
import type { AccentColor } from '@/workspace/theme/tokens';

type AudioMode = 'script' | 'performance';

interface AudioProductionPanelProps {
  onClose?: () => void;
  density?: PanelDensity;
  dataSlice?: PanelDataSlice;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  stability: 50,
  similarity_boost: 75,
  style: 30,
  speed: 100,
};

const MODE_CONFIG: Record<AudioMode, { title: string; icon: typeof AudioLines; accent: AccentColor }> = {
  script: { title: 'Script & Dialog', icon: BookOpen, accent: 'amber' },
  performance: { title: 'Narration', icon: AudioLines, accent: 'emerald' },
};

function resolveMode(dataSlice?: PanelDataSlice): AudioMode {
  const view = dataSlice?.view;
  if (view === 'script' || view === 'performance') return view;
  return 'performance';
}

export default function AudioProductionPanel({ onClose, density, dataSlice }: AudioProductionPanelProps) {
  const mode = resolveMode(dataSlice);
  const { title, icon: Icon, accent } = MODE_CONFIG[mode];

  const { selectedProject } = useProjectStore();
  const projectId = selectedProject?.id;
  const { data: characters = [] } = characterApi.useProjectCharacters(projectId ?? '', !!projectId);
  const { data: voices = [] } = useVoicesByProject(projectId ?? '');
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_SETTINGS);
  const [showControls, setShowControls] = useState(false);

  const handleExport = useCallback((result: VoiceNarrationResult) => {
    console.log('Narration export:', result.clips.length, 'clips,', result.totalDuration, 's');
  }, []);

  if (!projectId) {
    return (
      <PanelFrame title={title} icon={Icon} onClose={onClose} headerAccent={accent} density={density}>
        <PanelEmptyState
          icon={Icon}
          title="No project selected"
          description={mode === 'performance'
            ? 'Select a project to create narrated audio with voice controls.'
            : 'Select a project to view script and dialogue.'}
        />
      </PanelFrame>
    );
  }

  const charInfos = characters.map((c) => ({ id: c.id, name: c.name }));
  const voiceInfos = voices.map((v) => ({
    voice_id: v.voice_id ?? v.id,
    character_id: v.character_id ?? null,
    name: v.name,
  }));

  return (
    <PanelFrame
      title={title}
      icon={Icon}
      onClose={onClose}
      density={density}
      headerAccent={accent}
      actions={
        mode === 'performance' ? (
          <button
            type="button"
            onClick={() => setShowControls((v) => !v)}
            className="rounded px-2 py-0.5 text-xs text-voice-muted/80 transition-colors hover:bg-voice-muted/12 hover:text-voice-muted/90"
          >
            {showControls ? 'Hide Controls' : 'Voice Settings'}
          </button>
        ) : undefined
      }
    >
      <div className="flex flex-col h-full overflow-hidden">
        {mode === 'performance' && showControls && (
          <div className="border-b border-slate-800/50 p-2 shrink-0">
            <PerformanceControls
              voiceSettings={voiceSettings}
              onSettingsChange={setVoiceSettings}
            />
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-auto">
          <NarrationPipeline
            characters={charInfos}
            voices={voiceInfos}
            voiceSettings={voiceSettings}
            onExportAudio={handleExport}
          />
        </div>
      </div>
    </PanelFrame>
  );
}
