'use client';

import React from 'react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { sceneApi } from '@/app/hooks/integration/useScenes';
import { Tooltip } from '@/app/components/UI/Tooltip';

const SceneProgressIndicator: React.FC = () => {
  const { selectedProject, selectedAct } = useProjectStore();

  const { data: scenes = [] } = sceneApi.useScenesByProjectAndAct(
    selectedProject?.id || '',
    selectedAct?.id || '',
    !!selectedProject && !!selectedAct
  );

  if (!selectedAct || scenes.length === 0) return null;

  const scenesWithContent = scenes.filter(
    (s) => s.content || s.script || s.description
  ).length;
  const progress = (scenesWithContent / scenes.length) * 100;

  return (
    <Tooltip
      content={`${scenesWithContent} of ${scenes.length} scene${scenes.length !== 1 ? 's' : ''} have content`}
      position="bottom"
    >
      <div className="flex items-center w-6">
        <div className="w-full h-[2px] bg-cyan-500/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Tooltip>
  );
};

export default SceneProgressIndicator;
