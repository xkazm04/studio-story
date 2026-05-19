'use client';

import React, { useMemo, useCallback } from 'react';
import { ListChecks } from 'lucide-react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { beatApi } from '@/app/hooks/integration/useBeats';
import { useScriptContextStore } from '../../../store/scriptContextStore';
import type { BaseAdapterProps, FieldSchema } from '../types';
import DataList from '../DataList';
import { BEAT_TYPE_COLORS, BEAT_TYPE_FALLBACK } from '@/workspace/theme/tokens';
import type { Beat } from '@/app/types/Beat';
import { useResolvedProjectId } from './useResolvedProjectId';

type BeatsSidebarAdapterProps = BaseAdapterProps;

const BEAT_FIELDS: FieldSchema[] = [
  { key: 'name', label: 'Name', type: 'text', displayIn: ['list-item'], sortable: true },
  { key: 'description', label: 'Description', type: 'text', displayIn: ['list-item'] },
];

export default function BeatsSidebarAdapter({ onClose, density }: BeatsSidebarAdapterProps) {
  const { projectId, hasProject } = useResolvedProjectId();
  const selectedAct = useProjectStore((s) => s.selectedAct);
  const actId = selectedAct?.id || '';
  const { data: beats = [], isError, error, refetch } = beatApi.useGetActBeats(actId, !!actId);
  const referencedBeats = useScriptContextStore((s) => s.referencedBeats);
  const requestInsert = useScriptContextStore((s) => s.requestInsert);

  const highlightSet = useMemo(() => new Set(referencedBeats), [referencedBeats]);

  const handleItemClick = (item: Beat) => {
    requestInsert({ type: 'beat', beatRef: item.name });
  };

  const itemBadge = useCallback((item: Beat) => {
    const type = item.type;
    if (!type) return null;
    return {
      label: type,
      className: BEAT_TYPE_COLORS[type] || BEAT_TYPE_FALLBACK,
    };
  }, []);

  if (!hasProject || !actId) {
    return (
      <DataList
        title="Beats"
        icon={ListChecks}
        headerAccent="violet"
        onClose={onClose}
        density={density}
        items={[]}
        fields={BEAT_FIELDS}
        emptyTitle="Select a project and act"
      />
    );
  }

  return (
    <DataList
      title="Beats"
      icon={ListChecks}
      headerAccent="violet"
      onClose={onClose}
      density={density}
      isError={isError}
      errorMessage={error?.message}
      onRetry={() => refetch()}
      items={beats}
      fields={BEAT_FIELDS}
      highlightIds={highlightSet}
      highlightField="name"
      highlightAccent="indigo"
      onItemClick={handleItemClick}
      itemBadge={itemBadge}
      emptyTitle="No beats in this act"
    />
  );
}
