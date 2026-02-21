'use client';

import React, { useState, useCallback } from 'react';
import { Users } from 'lucide-react';
import PanelFrame from '../shared/PanelFrame';
import { PanelEmptyState } from '../shared/PanelPrimitives';
import AuditionPanel from '@/app/features/voice/components/AuditionPanel';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { characterApi } from '@/app/hooks/integration/useCharacters';
import { useVoicesByProject } from '@/app/hooks/useVoices';

interface VoiceCastingPanelProps {
  onClose?: () => void;
}

export default function VoiceCastingPanel({ onClose }: VoiceCastingPanelProps) {
  const { selectedProject } = useProjectStore();
  const projectId = selectedProject?.id;
  const { data: characters = [] } = characterApi.useProjectCharacters(projectId ?? '', !!projectId);
  const { data: voices = [] } = useVoicesByProject(projectId ?? '');
  const [selectedCharId, setSelectedCharId] = useState<string | undefined>();

  const handleCast = useCallback((characterId: string, voiceId: string) => {
    // TODO: persist casting via API
    console.log('Cast voice', voiceId, 'for character', characterId);
  }, []);

  if (!projectId) {
    return (
      <PanelFrame title="Voice Casting" icon={Users} onClose={onClose} headerAccent="emerald">
        <PanelEmptyState
          icon={Users}
          title="No project selected"
          description="Select a project to match characters with available voices."
        />
      </PanelFrame>
    );
  }

  if (characters.length === 0 || voices.length === 0) {
    return (
      <PanelFrame title="Voice Casting" icon={Users} onClose={onClose} headerAccent="emerald">
        <PanelEmptyState
          icon={Users}
          title={characters.length === 0 ? 'No characters available' : 'No voices available'}
          description={characters.length === 0 ? 'Create characters first to start casting.' : 'Add voice profiles first to begin voice casting.'}
        />
      </PanelFrame>
    );
  }

  return (
    <PanelFrame title="Voice Casting" icon={Users} onClose={onClose} headerAccent="emerald">
      <AuditionPanel
        characters={characters}
        voices={voices}
        selectedCharacterId={selectedCharId}
        onSelectCharacter={setSelectedCharId}
        onCastVoice={handleCast}
      />
    </PanelFrame>
  );
}
