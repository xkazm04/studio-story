'use client';

import React from 'react';
import { Mic } from 'lucide-react';
import PanelFrame from '../shared/PanelFrame';
import { PanelEmptyState } from '../shared/PanelPrimitives';
import VoiceList from '@/app/features/voice/components/VoiceList';
import { useProjectStore } from '@/app/store/slices/projectSlice';

interface VoiceManagerPanelProps {
  onClose?: () => void;
}

export default function VoiceManagerPanel({ onClose }: VoiceManagerPanelProps) {
  const { selectedProject } = useProjectStore();

  return (
    <PanelFrame title="Voices" icon={Mic} onClose={onClose} headerAccent="emerald">
      {selectedProject?.id ? (
        <VoiceList projectId={selectedProject.id} />
      ) : (
        <PanelEmptyState
          icon={Mic}
          title="No project selected"
          description="Select a project to manage voice profiles and casting assets."
        />
      )}
    </PanelFrame>
  );
}
