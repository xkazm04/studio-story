'use client';

import React, { useMemo } from 'react';
import { User } from 'lucide-react';
import { useCharacterStore } from '@/app/store/slices/characterSlice';
import LazyContainer from '../LazyContainer';
import { useSelectionContext } from './selectionBus';

const CharacterDetails = React.lazy(() => import('@/app/features/characters/components/CharacterDetails'));

interface CharacterDetailAdapterProps {
  characterId?: string;
  onClose?: () => void;
  onTriggerSkill?: (skillId: string, params?: Record<string, unknown>) => void;
}

export default function CharacterDetailAdapter({
  characterId: propCharId,
  onClose,
  onTriggerSkill,
}: CharacterDetailAdapterProps) {
  const storeCharId = useCharacterStore((s) => s.selectedCharacter);
  const selectionEvent = useSelectionContext((s) => s.lastEvent);
  const selectedFromBus = selectionEvent?.entity === 'character' ? selectionEvent.id : null;
  const id = useMemo(() => propCharId ?? selectedFromBus ?? storeCharId, [propCharId, selectedFromBus, storeCharId]);

  return (
    <LazyContainer
      title="Character Detail"
      icon={User}
      headerAccent="cyan"
      onClose={onClose}
      onTriggerSkill={onTriggerSkill}
      component={CharacterDetails}
      componentProps={id ? { characterId: id } : {}}
      isEmpty={!id}
      emptyIcon={User}
      emptyTitle="Select a character to view details"
      emptyDescription="Choose a character from the cast panel."
    />
  );
}
