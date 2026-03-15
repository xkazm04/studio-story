'use client';

import React, { useMemo } from 'react';
import { Map } from 'lucide-react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { actApi } from '@/app/hooks/integration/useActs';
import { sceneApi } from '@/app/hooks/integration/useScenes';
import TreeView from '../TreeView';
import type { TreeNode } from '../types';

interface StoryMapAdapterProps {
  projectId?: string;
  highlightSceneId?: string;
  onClose?: () => void;
}

export default function StoryMapAdapter({
  projectId: propProjectId,
  highlightSceneId,
  onClose,
}: StoryMapAdapterProps) {
  const { selectedProject, selectedScene } = useProjectStore();
  const resolvedProjectId = propProjectId || selectedProject?.id || '';
  const activeSceneId = highlightSceneId || selectedScene?.id;

  const { data: acts = [], isLoading: actsLoading, isError: actsError, error: actsErrorObj, refetch: refetchActs } = actApi.useProjectActs(resolvedProjectId, !!resolvedProjectId);
  const { data: scenes = [], isLoading: scenesLoading, isError: scenesError, error: scenesErrorObj, refetch: refetchScenes } = sceneApi.useProjectScenes(resolvedProjectId, !!resolvedProjectId);

  const nodes: TreeNode[] = useMemo(() => {
    const sortedActs = [...acts].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return sortedActs.map((act) => {
      const actScenes = scenes
        .filter((s) => s.act_id === act.id)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      return {
        id: act.id,
        label: act.name,
        meta: `(${actScenes.length})`,
        children: actScenes.map((scene) => ({
          id: scene.id,
          label: scene.name || 'Untitled Scene',
        })),
      };
    });
  }, [acts, scenes]);

  return (
    <TreeView
      title="Story Map"
      icon={Map}
      headerAccent="violet"
      onClose={onClose}
      isLoading={actsLoading || scenesLoading}
      isError={actsError || scenesError}
      errorMessage={actsErrorObj?.message || scenesErrorObj?.message}
      onRetry={() => { refetchActs(); refetchScenes(); }}
      nodes={nodes}
      activeNodeId={activeSceneId}
      defaultExpanded
      emptyIcon={Map}
      emptyTitle="No acts in this project"
      emptyDescription="Create an act first to visualize your story structure."
    />
  );
}
