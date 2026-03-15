'use client';

import React from 'react';
import { Film, Loader2 } from 'lucide-react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { sceneApi } from '@/app/hooks/integration/useScenes';
import { SCENE_SCHEMA } from '@/workspace/schemas/entitySchemas';
import CardGrid from '../CardGrid';

interface SceneGalleryAdapterProps {
  onClose?: () => void;
}

export default function SceneGalleryAdapter({ onClose }: SceneGalleryAdapterProps) {
  const { selectedProject, selectedAct, selectedScene, setSelectedScene } = useProjectStore();
  const projectId = selectedProject?.id || '';
  const actId = selectedAct?.id || '';
  const { data: scenes = [], isLoading, isFetching, isError, error, refetch } = sceneApi.useScenesByProjectAndAct(
    projectId, actId, !!projectId && !!actId,
  );

  return (
    <CardGrid
      title="Scenes"
      icon={Film}
      headerAccent="amber"
      onClose={onClose}
      isLoading={isLoading}
      isError={isError}
      errorMessage={error?.message}
      onRetry={() => refetch()}
      items={scenes as unknown as Record<string, unknown>[]}
      fields={SCENE_SCHEMA.fields}
      selectedId={selectedScene?.id}
      onSelect={(item) => setSelectedScene(item as any)}
      cardVariant="gallery"
      actions={
        isFetching && !isLoading ? (
          <span className="inline-flex items-center gap-1 rounded border border-cyan-500/20 bg-cyan-500/8 px-1.5 py-0.5 text-xs text-cyan-300">
            <Loader2 className="h-3 w-3 animate-spin" />
            Refreshing
          </span>
        ) : undefined
      }
      emptyIcon={Film}
      emptyTitle={!projectId || !actId ? 'Pick a project and act' : 'No scenes in this act'}
      emptyDescription={!projectId || !actId
        ? 'Select context to preview and switch between scene visuals.'
        : 'Add scenes to build a visual gallery for this storyline.'
      }
    />
  );
}
