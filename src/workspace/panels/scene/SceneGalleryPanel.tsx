'use client';

import React from 'react';
import { Film, Loader2 } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { sceneApi } from '@/app/hooks/integration/useScenes';
import PanelFrame from '../shared/PanelFrame';
import { PanelEmptyState, PanelSkeletonList } from '../shared/PanelPrimitives';

interface SceneGalleryPanelProps {
  onClose?: () => void;
}

export default function SceneGalleryPanel({ onClose }: SceneGalleryPanelProps) {
  const { selectedProject, selectedAct, selectedScene, setSelectedScene } = useProjectStore();
  const projectId = selectedProject?.id || '';
  const actId = selectedAct?.id || '';
  const { data: scenes = [], isLoading, isFetching } = sceneApi.useScenesByProjectAndAct(
    projectId,
    actId,
    !!projectId && !!actId,
  );

  if (!projectId || !actId) {
    return (
      <PanelFrame title="Scenes" icon={Film} onClose={onClose} headerAccent="amber">
        <PanelEmptyState
          icon={Film}
          title="Pick a project and act"
          description="Select context to preview and switch between scene visuals."
        />
      </PanelFrame>
    );
  }

  return (
    <PanelFrame
      title="Scenes"
      icon={Film}
      onClose={onClose}
      headerAccent="amber"
      actions={
        isFetching && !isLoading ? (
          <span className="inline-flex items-center gap-1 rounded border border-cyan-500/20 bg-cyan-500/8 px-1.5 py-0.5 text-[9px] text-cyan-300">
            <Loader2 className="h-3 w-3 animate-spin" />
            Refreshing
          </span>
        ) : undefined
      }
    >
      <div className="flex h-full items-stretch gap-2 overflow-x-auto p-2">
        {isLoading ? (
          <PanelSkeletonList rows={3} className="min-w-full" />
        ) : scenes.length === 0 ? (
          <PanelEmptyState
            icon={Film}
            title="No scenes in this act"
            description="Add scenes to build a visual gallery for this storyline."
          />
        ) : (
          scenes.map((scene) => {
            const isActive = selectedScene?.id === scene.id;
            return (
              <button
                key={scene.id}
                onClick={() => setSelectedScene(scene)}
                className={cn(
                  'flex w-36 shrink-0 flex-col gap-1 rounded-lg border p-2 text-left transition-colors',
                  isActive
                    ? 'bg-amber-500/10 border-amber-500/40'
                    : 'bg-slate-900/50 border-slate-800/40 hover:border-slate-700/50',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/40'
                )}
              >
                {/* Image thumbnail */}
                {scene.image_url ? (
                  <div className="w-full h-16 rounded overflow-hidden bg-slate-800/50">
                    <img
                      src={scene.image_url}
                      alt={scene.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-16 rounded bg-slate-800/30 flex items-center justify-center">
                    <Film className="w-4 h-4 text-slate-700" />
                  </div>
                )}
                <p className={cn(
                  'text-[10px] font-medium truncate',
                  isActive ? 'text-amber-300' : 'text-slate-300',
                )}>
                  {scene.name}
                </p>
                {scene.description && (
                  <p className="text-[9px] text-slate-500 line-clamp-2">
                    {scene.description.replace(/@\w+(\[[^\]]*\])?\s*/g, '').slice(0, 80)}
                  </p>
                )}
              </button>
            );
          })
        )}
      </div>
    </PanelFrame>
  );
}
