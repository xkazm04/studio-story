'use client';

import React, { useState, useCallback } from 'react';
import { AudioLines } from 'lucide-react';
import PanelFrame from '../shared/PanelFrame';
import { PanelEmptyState } from '../shared/PanelPrimitives';
import NarrationPipeline from '@/app/features/voice/components/NarrationPipeline';
import PerformanceControls from '@/app/features/voice/components/PerformanceControls';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { characterApi } from '@/app/hooks/integration/useCharacters';
import { useVoicesByProject } from '@/app/hooks/useVoices';
import type { VoiceSettings, VoiceNarrationResult } from '@/app/features/voice/types';

interface NarrationPanelProps {
  onClose?: () => void;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  stability: 50,
  similarity_boost: 75,
  style: 30,
  speed: 100,
};

export default function NarrationPanel({ onClose }: NarrationPanelProps) {
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
      <PanelFrame title="Narration" icon={AudioLines} onClose={onClose} headerAccent="emerald">
        <PanelEmptyState
          icon={AudioLines}
          title="No project selected"
          description="Select a project to create narrated audio with voice controls."
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
      title="Narration"
      icon={AudioLines}
      onClose={onClose}
      actions={
        <button
          type="button"
          onClick={() => setShowControls((v) => !v)}
          className="rounded px-2 py-0.5 text-[9px] text-violet-300 transition-colors hover:bg-violet-500/12 hover:text-violet-200"
        >
          {showControls ? 'Hide Controls' : 'Voice Settings'}
        </button>
      }
    >
      <div className="flex flex-col h-full overflow-hidden">
        {showControls && (
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
