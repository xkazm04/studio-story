'use client';

import React, { useMemo, useCallback } from 'react';
import { ListChecks } from 'lucide-react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { beatApi } from '@/app/hooks/integration/useBeats';
import { useScriptContextStore } from '../../../store/scriptContextStore';
import type { FieldSchema } from '../types';
import DataList from '../DataList';
import { BEAT_TYPE_COLORS, BEAT_TYPE_FALLBACK } from '@/workspace/theme/tokens';

interface BeatsSidebarAdapterProps {
  onClose?: () => void;
}

const BEAT_FIELDS: FieldSchema[] = [
  { key: 'name', label: 'Name', type: 'text', displayIn: ['list-item'] },
  { key: 'description', label: 'Description', type: 'text', displayIn: ['list-item'] },
];

export default function BeatsSidebarAdapter({ onClose }: BeatsSidebarAdapterProps) {
  const { selectedProject, selectedAct } = useProjectStore();
  const projectId = selectedProject?.id || '';
  const actId = selectedAct?.id || '';
  const { data: beats = [], isError, error, refetch } = beatApi.useGetActBeats(actId, !!actId);
  const referencedBeats = useScriptContextStore((s) => s.referencedBeats);
  const requestInsert = useScriptContextStore((s) => s.requestInsert);

  const highlightSet = useMemo(() => new Set(referencedBeats), [referencedBeats]);

  const handleItemClick = (item: Record<string, unknown>) => {
    requestInsert({ type: 'beat', beatRef: item.name as string });
  };

  const itemBadge = useCallback((item: Record<string, unknown>) => {
    const type = item.type as string;
    if (!type) return null;
    return {
      label: type,
      className: BEAT_TYPE_COLORS[type] || BEAT_TYPE_FALLBACK,
    };
  }, []);

  if (!projectId || !actId) {
    return (
      <DataList
        title="Beats"
        icon={ListChecks}
        headerAccent="violet"
        onClose={onClose}
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
      isError={isError}
      errorMessage={error?.message}
      onRetry={() => refetch()}
      items={beats as unknown as Record<string, unknown>[]}
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
