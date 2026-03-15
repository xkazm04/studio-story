'use client';

import React, { useCallback } from 'react';
import { Info } from 'lucide-react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { sceneApi } from '@/app/hooks/integration/useScenes';
import { useQueryClient } from '@tanstack/react-query';
import DetailView from '../DetailView';
import type { DetailSection } from '../types';

interface SceneMetadataAdapterProps {
  sceneId?: string;
  onClose?: () => void;
}

const SECTIONS: DetailSection[] = [
  {
    title: 'Name',
    subtitle: 'Display name used in the scene list and editor.',
    fields: [
      { key: 'name', label: 'Name', type: 'text', editable: true },
    ],
  },
  {
    title: 'Info',
    subtitle: 'Read-only metadata from the current scene.',
    fields: [
      { key: 'order', label: 'Order', type: 'readonly' },
      { key: 'act_id', label: 'Act', type: 'readonly' },
      { key: 'created_at', label: 'Created', type: 'date' },
      { key: 'updated_at', label: 'Updated', type: 'date' },
    ],
  },
];

export default function SceneMetadataAdapter({
  sceneId: propSceneId,
  onClose,
}: SceneMetadataAdapterProps) {
  const { selectedScene } = useProjectStore();
  const resolvedSceneId = propSceneId || selectedScene?.id || '';
  const { data: scene, isError, error, refetch } = sceneApi.useScene(resolvedSceneId, !!resolvedSceneId);
  const queryClient = useQueryClient();

  const handleSave = useCallback(async (updates: Record<string, unknown>) => {
    await sceneApi.updateScene(resolvedSceneId, updates as any);
    queryClient.invalidateQueries({ queryKey: ['scenes'] });
  }, [resolvedSceneId, queryClient]);

  return (
    <DetailView
      title="Scene Details"
      icon={Info}
      headerAccent="amber"
      onClose={onClose}
      isError={isError}
      errorMessage={error?.message}
      onRetry={() => refetch()}
      data={scene ? (scene as unknown as Record<string, unknown>) : null}
      sections={SECTIONS}
      onSave={resolvedSceneId ? handleSave : undefined}
      emptyIcon={Info}
      emptyTitle="No scene selected"
      emptyDescription="Pick a scene in the workspace to edit metadata."
    />
  );
}
