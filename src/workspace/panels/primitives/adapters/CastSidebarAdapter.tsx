'use client';

import React, { useMemo } from 'react';
import { Users } from 'lucide-react';
import { characterApi } from '@/app/hooks/integration/useCharacters';
import { useScriptContextStore } from '../../../store/scriptContextStore';
import type { BaseAdapterProps, FieldSchema } from '../types';
import DataList from '../DataList';
import { useResolvedProjectId } from './useResolvedProjectId';

type CastSidebarAdapterProps = BaseAdapterProps;

const TYPE_LABELS: Record<string, string> = {
  protagonist: 'Lead',
  antagonist: 'Antag',
  supporting: 'Support',
  minor: 'Minor',
};

const CAST_FIELDS: FieldSchema[] = [
  { key: 'avatar_url', label: 'Avatar', type: 'avatar', displayIn: ['list-item'] },
  { key: 'name', label: 'Name', type: 'text', displayIn: ['list-item'], sortable: true },
  { key: 'typeLabel', label: 'Type', type: 'text', displayIn: ['list-item'], sortable: true },
];

export default function CastSidebarAdapter({ onClose, density }: CastSidebarAdapterProps) {
  const { projectId, hasProject } = useResolvedProjectId();
  const { data: characters = [], isError, error, refetch } = characterApi.useProjectCharacters(projectId, hasProject);
  const referencedSpeakers = useScriptContextStore((s) => s.referencedSpeakers);
  const requestInsert = useScriptContextStore((s) => s.requestInsert);

  const highlightSet = useMemo(() => new Set(referencedSpeakers), [referencedSpeakers]);

  const items = useMemo(
    () => characters.map((char) => ({
      ...char,
      typeLabel: TYPE_LABELS[char.type ?? ''] || char.type || '',
    })),
    [characters],
  );

  const handleItemClick = (item: typeof items[number]) => {
    requestInsert({ type: 'dialogue', speaker: item.name });
  };

  if (!hasProject) {
    return (
      <DataList
        title="Cast"
        icon={Users}
        headerAccent="cyan"
        onClose={onClose}
        density={density}
        items={[]}
        fields={CAST_FIELDS}
        emptyTitle="Select a project first"
      />
    );
  }

  return (
    <DataList
      title={`Cast (${characters.length})`}
      icon={Users}
      headerAccent="cyan"
      onClose={onClose}
      density={density}
      isError={isError}
      errorMessage={error?.message}
      onRetry={() => refetch()}
      items={items}
      fields={CAST_FIELDS}
      highlightIds={highlightSet}
      highlightField="name"
      highlightAccent="cyan"
      onItemClick={handleItemClick}
      emptyTitle="No characters yet"
    />
  );
}
