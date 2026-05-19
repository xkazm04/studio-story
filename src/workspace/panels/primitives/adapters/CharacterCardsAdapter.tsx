'use client';

import React, { useCallback } from 'react';
import { Users, User, Pencil, ImagePlus, Mic, Copy, Trash2 } from 'lucide-react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { characterApi } from '@/app/hooks/integration/useCharacters';
import { CHARACTER_SCHEMA } from '@/workspace/schemas/entitySchemas';
import type { Character } from '@/app/types/Character';
import type { BaseAdapterProps } from '../types';
import type { ContextMenuItem } from '../ContextMenu';
import CardGrid from '../CardGrid';
import { useSelectionContext } from './selectionBus';
import { useResolvedProjectId } from './useResolvedProjectId';

interface CharacterCardsAdapterProps extends BaseAdapterProps {
  projectId?: string;
  compact?: boolean;
}

export default function CharacterCardsAdapter({
  projectId: propProjectId,
  density,
  onTriggerSkill,
  onClose,
}: CharacterCardsAdapterProps) {
  const { projectId: resolvedProjectId } = useResolvedProjectId(propProjectId);
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

  const handleSelect = (item: Character) => {
    const charId = item.id;
    publishSelection({ entity: 'character', id: charId, source: 'character-cards' });
    onTriggerSkill?.('character-backstory', { characterId: charId });
  };

  const getContextMenuItems = useCallback((_item: Character): ContextMenuItem[] => [
    { id: 'edit', label: 'Edit Character', icon: Pencil },
    { id: 'generate-avatar', label: 'Generate Avatar', icon: ImagePlus },
    { id: 'assign-voice', label: 'Assign Voice', icon: Mic },
    { id: 'duplicate', label: 'Duplicate', icon: Copy, separator: true },
    { id: 'delete', label: 'Delete', icon: Trash2, variant: 'danger', separator: true },
  ], []);

  const handleContextMenuAction = useCallback((actionId: string, item: Character) => {
    const charId = item.id;
    switch (actionId) {
      case 'edit':
        publishSelection({ entity: 'character', id: charId, source: 'character-cards' });
        onTriggerSkill?.('character-edit', { characterId: charId });
        break;
      case 'generate-avatar':
        onTriggerSkill?.('avatar-generate', { characterId: charId });
        break;
      case 'assign-voice':
        onTriggerSkill?.('voice-assign', { characterId: charId });
        break;
      case 'duplicate':
        onTriggerSkill?.('character-duplicate', { characterId: charId });
        break;
      case 'delete':
        onTriggerSkill?.('character-delete', { characterId: charId });
        break;
    }
  }, [publishSelection, onTriggerSkill]);

  return (
    <CardGrid
      title={`Characters (${characters.length})`}
      icon={Users}
      headerAccent="cyan"
      onClose={onClose}
      density={density}
      isError={isError}
      errorMessage={error?.message}
      onRetry={() => refetch()}
      items={characters}
      fields={CHARACTER_SCHEMA.fields}
      onSelect={handleSelect}
      highlightIds={highlightedCharacters}
      searchable
      searchField="name"
      emptyIcon={User}
      emptyTitle="No characters yet"
      emptyDescription="Create or import characters to populate this panel."
      contextMenuItems={getContextMenuItems}
      onContextMenuAction={handleContextMenuAction}
    />
  );
}
