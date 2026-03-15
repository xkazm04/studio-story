'use client';

import React, { useMemo } from 'react';
import { Users } from 'lucide-react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { characterApi } from '@/app/hooks/integration/useCharacters';
import { useScriptContextStore } from '../../../store/scriptContextStore';
import type { FieldSchema } from '../types';
import DataList from '../DataList';

interface CastSidebarAdapterProps {
  onClose?: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  protagonist: 'Lead',
  antagonist: 'Antag',
  supporting: 'Support',
  minor: 'Minor',
};

const CAST_FIELDS: FieldSchema[] = [
  { key: 'avatar_url', label: 'Avatar', type: 'avatar', displayIn: ['list-item'] },
  { key: 'name', label: 'Name', type: 'text', displayIn: ['list-item'] },
  { key: 'typeLabel', label: 'Type', type: 'text', displayIn: ['list-item'] },
];

export default function CastSidebarAdapter({ onClose }: CastSidebarAdapterProps) {
  const { selectedProject } = useProjectStore();
  const projectId = selectedProject?.id || '';
  const { data: characters = [], isError, error, refetch } = characterApi.useProjectCharacters(projectId, !!projectId);
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

  const handleItemClick = (item: Record<string, unknown>) => {
    requestInsert({ type: 'dialogue', speaker: item.name as string });
  };

  if (!projectId) {
    return (
      <DataList
        title="Cast"
        icon={Users}
        headerAccent="cyan"
        onClose={onClose}
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
      isError={isError}
      errorMessage={error?.message}
      onRetry={() => refetch()}
      items={items as unknown as Record<string, unknown>[]}
      fields={CAST_FIELDS}
      highlightIds={highlightSet}
      highlightField="name"
      highlightAccent="cyan"
      onItemClick={handleItemClick}
      emptyTitle="No characters yet"
    />
  );
}
