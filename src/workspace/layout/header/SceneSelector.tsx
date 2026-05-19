'use client';

import React from 'react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { sceneApi } from '@/app/hooks/integration/useScenes';
import { Scene } from '@/app/types/Scene';
import { useQueryClient } from '@tanstack/react-query';
import HeaderDropdown from './HeaderDropdown';

const SceneSelector: React.FC = () => {
  const { selectedProject, selectedAct, selectedScene, setSelectedScene } = useProjectStore();
  const queryClient = useQueryClient();

  const { data: scenes = [], refetch } = sceneApi.useScenesByProjectAndAct(
    selectedProject?.id || '',
    selectedAct?.id || '',
    !!selectedProject && !!selectedAct
  );

  const sortedScenes = [...scenes].sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleCreateScene = async (name: string) => {
    if (!selectedProject || !selectedAct) return;
    try {
      const newScene = await sceneApi.createScene({
        name,
        project_id: selectedProject.id,
        act_id: selectedAct.id,
        order: scenes.length,
      });
      queryClient.invalidateQueries({
        queryKey: ['scenes', 'project', selectedProject.id, 'act', selectedAct.id],
      });
      await refetch();
      setSelectedScene(newScene);
    } catch (error) {
      console.error('Error creating scene:', error);
    }
  };

  if (!selectedAct) return null;

  const items = sortedScenes.map((scene: Scene) => ({
    id: scene.id,
    label: scene.name,
    sublabel: scene.description || undefined,
    prefix: (
      <span className="text-slate-400 font-mono text-xs">
        #{scene.order !== undefined ? scene.order + 1 : '?'}
      </span>
    ),
  }));

  return (
    <HeaderDropdown
      triggerContent={
        selectedScene ? (
          <>
            <span className="text-slate-500 font-mono text-xs">
              #{selectedScene.order !== undefined ? selectedScene.order + 1 : ''}
            </span>
            <span className="font-medium text-slate-400">{selectedScene.name}</span>
          </>
        ) : (
          <span className="font-medium text-slate-500">Select Scene</span>
        )
      }
      items={items}
      selectedId={selectedScene?.id}
      selectedItemClassName="bg-amber-500/10 text-amber-300"
      onSelect={(id) => {
        const scene = sortedScenes.find((s: Scene) => s.id === id);
        if (scene) setSelectedScene(scene);
      }}
      minWidth={250}
      maxHeight="400px"
      emptyMessage="No scenes in this act"
      createForm={{
        triggerLabel: 'New Scene',
        placeholder: 'Scene name...',
        accentColorClass: 'bg-amber-600/80 hover:bg-amber-600',
        onSubmit: handleCreateScene,
      }}
    />
  );
};

export default SceneSelector;
