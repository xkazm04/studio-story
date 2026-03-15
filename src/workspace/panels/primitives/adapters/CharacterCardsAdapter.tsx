'use client';

import React from 'react';
import { Users, User } from 'lucide-react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { characterApi } from '@/app/hooks/integration/useCharacters';
import { CHARACTER_SCHEMA } from '@/workspace/schemas/entitySchemas';
import CardGrid from '../CardGrid';
import { useSelectionContext } from './selectionBus';

interface CharacterCardsAdapterProps {
  projectId?: string;
  compact?: boolean;
  onTriggerSkill?: (skillId: string, params?: Record<string, unknown>) => void;
  onClose?: () => void;
}

export default function CharacterCardsAdapter({
  projectId: propProjectId,
  onTriggerSkill,
  onClose,
}: CharacterCardsAdapterProps) {
  const { selectedProject } = useProjectStore();
  const resolvedProjectId = propProjectId || selectedProject?.id || '';
  const selectedScene = useProjectStore((s) => s.selectedScene);
  const { data: characters = [], isError, error, refetch } = characterApi.useProjectCharacters(
    resolvedProjectId, !!resolvedProjectId,
  );
  const publishSelection = useSelectionContext((s) => s.publish);

  const highlightedCharacters = new Set(
    characters
      .filter((c) => {
        const sceneText = `${selectedScene?.content ?? ''} ${selectedScene?.description ?? ''}`.toLowerCase();
        return sceneText.includes((c.name ?? '').toLowerCase());
      })
      .map((c) => c.id)
  );

  const handleSelect = (item: Record<string, unknown>) => {
    const charId = item.id as string;
    publishSelection({ entity: 'character', id: charId, source: 'character-cards' });
    onTriggerSkill?.('character-backstory', { characterId: charId });
  };

  return (
    <CardGrid
      title={`Characters (${characters.length})`}
      icon={Users}
      headerAccent="cyan"
      onClose={onClose}
      isError={isError}
      errorMessage={error?.message}
      onRetry={() => refetch()}
      items={characters as unknown as Record<string, unknown>[]}
      fields={CHARACTER_SCHEMA.fields}
      onSelect={handleSelect}
      highlightIds={highlightedCharacters}
      searchable
      searchField="name"
      emptyIcon={User}
      emptyTitle="No characters yet"
      emptyDescription="Create or import characters to populate this panel."
    />
  );
}
