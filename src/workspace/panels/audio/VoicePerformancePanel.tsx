'use client';

import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import PanelFrame from '../shared/PanelFrame';
import { PanelEmptyState, PanelSectionTitle } from '../shared/PanelPrimitives';
import PerformanceControls from '@/app/features/voice/components/PerformanceControls';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { useVoicesByProject } from '@/app/hooks/useVoices';
import type { VoiceSettings } from '@/app/features/voice/types';

interface VoicePerformancePanelProps {
  onClose?: () => void;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  stability: 50,
  similarity_boost: 75,
  style: 30,
  speed: 100,
};

export default function VoicePerformancePanel({ onClose }: VoicePerformancePanelProps) {
  const { selectedProject } = useProjectStore();
  const projectId = selectedProject?.id;
  const { data: voices = [] } = useVoicesByProject(projectId ?? '');
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_SETTINGS);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>();

  if (!projectId) {
    return (
      <PanelFrame title="Voice Performance" icon={SlidersHorizontal} onClose={onClose} headerAccent="emerald">
        <PanelEmptyState
          icon={SlidersHorizontal}
          title="No project selected"
          description="Select a project to tune voice performance parameters."
        />
      </PanelFrame>
    );
  }

  if (voices.length === 0) {
    return (
      <PanelFrame title="Voice Performance" icon={SlidersHorizontal} onClose={onClose} headerAccent="emerald">
        <PanelEmptyState
          icon={SlidersHorizontal}
          title="No voices available"
          description="Create voice profiles first to preview and tune delivery settings."
        />
      </PanelFrame>
    );
  }

  return (
    <PanelFrame title="Voice Performance" icon={SlidersHorizontal} onClose={onClose} headerAccent="emerald">
      <div className="flex h-full min-h-0 flex-col overflow-auto">
        {/* Voice selector */}
        <div className="shrink-0 border-b border-slate-800/50 p-2">
          <PanelSectionTitle
            title="Active Voice"
            subtitle="Select a voice profile before adjusting performance sliders."
            className="mb-1.5"
          />
          <select
            value={selectedVoiceId ?? ''}
            onChange={(e) => setSelectedVoiceId(e.target.value || undefined)}
            className="w-full rounded border border-slate-700/50 bg-slate-900/80 px-2 py-1 text-xs text-slate-300 outline-none transition-colors focus:border-emerald-500/40"
          >
            <option value="">None selected</option>
            {voices.map((v) => (
              <option key={v.id} value={v.voice_id ?? v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* Performance controls */}
        <div className="flex-1 p-2">
          <PerformanceControls
            voiceSettings={voiceSettings}
            onSettingsChange={setVoiceSettings}
            selectedVoiceId={selectedVoiceId}
            previewText="The quick brown fox jumps over the lazy dog."
          />
        </div>
      </div>
    </PanelFrame>
  );
}
