'use client';

import React, { useState, useCallback } from 'react';
import { BookOpen } from 'lucide-react';
import PanelFrame from '../shared/PanelFrame';
import NarrationPipeline from '@/app/features/voice/components/NarrationPipeline';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { characterApi } from '@/app/hooks/integration/useCharacters';
import { useVoicesByProject } from '@/app/hooks/useVoices';
import type { VoiceSettings, VoiceNarrationResult } from '@/app/features/voice/types';

interface ScriptDialogPanelProps {
  onClose?: () => void;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  stability: 50,
  similarity_boost: 75,
  style: 30,
  speed: 100,
};

export default function ScriptDialogPanel({ onClose }: ScriptDialogPanelProps) {
  const { selectedProject } = useProjectStore();
  const projectId = selectedProject?.id;
  const { data: characters = [] } = characterApi.useProjectCharacters(projectId ?? '', !!projectId);
  const { data: voices = [] } = useVoicesByProject(projectId ?? '');
  const [voiceSettings] = useState<VoiceSettings>(DEFAULT_SETTINGS);

  const handleExport = useCallback((result: VoiceNarrationResult) => {
    console.log('Narration export:', result.clips.length, 'clips,', result.totalDuration, 's');
  }, []);

  if (!projectId) {
    return (
      <PanelFrame title="Script & Dialog" icon={BookOpen} onClose={onClose} headerAccent="amber">
        <div className="flex items-center justify-center h-full text-xs text-slate-500">
          Select a project first
        </div>
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
    <PanelFrame title="Script & Dialog" icon={BookOpen} onClose={onClose} headerAccent="amber">
      <NarrationPipeline
        characters={charInfos}
        voices={voiceInfos}
        voiceSettings={voiceSettings}
        onExportAudio={handleExport}
      />
    </PanelFrame>
  );
}
