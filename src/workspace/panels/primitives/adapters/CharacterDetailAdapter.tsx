'use client';

import React, { useMemo } from 'react';
import { User } from 'lucide-react';
import { useCharacterStore } from '@/app/store/slices/characterSlice';
import type { BaseAdapterProps } from '../types';
import LazyContainer from '../LazyContainer';
import { useSelectionContext } from './selectionBus';

const CharacterDetails = React.lazy(() => import('@/app/features/characters/components/CharacterDetails'));

interface CharacterDetailAdapterProps extends BaseAdapterProps {
  characterId?: string;
}

export default function CharacterDetailAdapter({
  characterId: propCharId,
  density,
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
      density={density}
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
