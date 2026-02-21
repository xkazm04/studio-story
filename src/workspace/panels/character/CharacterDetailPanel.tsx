'use client';

import React from 'react';
import { User } from 'lucide-react';
import PanelFrame from '../shared/PanelFrame';
import { useCharacterStore } from '@/app/store/slices/characterSlice';
import CharacterDetails from '@/app/features/characters/components/CharacterDetails';

interface CharacterDetailPanelProps {
  characterId?: string;
  onClose?: () => void;
  onTriggerSkill?: (skillId: string, params?: Record<string, unknown>) => void;
}

export default function CharacterDetailPanel({
  characterId: propCharId,
  onClose,
  onTriggerSkill,
}: CharacterDetailPanelProps) {
  const storeCharId = useCharacterStore((s) => s.selectedCharacter);
  const id = propCharId ?? storeCharId;

  return (
    <PanelFrame title="Character Detail" icon={User} onClose={onClose} headerAccent="cyan">
      {id ? (
        <CharacterDetails characterId={id} />
      ) : (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <User className="w-8 h-8 text-slate-600 mb-3" />
          <p className="text-xs text-slate-500">Select a character to view details</p>
          {onTriggerSkill && (
            <button
              onClick={() => onTriggerSkill('character-backstory')}
              className="mt-3 px-3 py-1 text-[10px] font-medium text-purple-400 border border-purple-500/30 rounded hover:bg-purple-500/10 transition-colors"
            >
              Generate Character
            </button>
          )}
        </div>
      )}
    </PanelFrame>
  );
}
