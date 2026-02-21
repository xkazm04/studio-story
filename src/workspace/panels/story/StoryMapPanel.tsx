'use client';

import React from 'react';
import { Map, ChevronRight } from 'lucide-react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { actApi } from '@/app/hooks/integration/useActs';
import { sceneApi } from '@/app/hooks/integration/useScenes';
import { cn } from '@/app/lib/utils';
import PanelFrame from '../shared/PanelFrame';
import { PanelEmptyState, PanelSectionTitle } from '../shared/PanelPrimitives';

interface StoryMapPanelProps {
  projectId?: string;
  highlightSceneId?: string;
  onClose?: () => void;
}

export default function StoryMapPanel({
  projectId: propProjectId,
  highlightSceneId,
  onClose,
}: StoryMapPanelProps) {
  const { selectedProject, selectedScene } = useProjectStore();
  const resolvedProjectId = propProjectId || selectedProject?.id || '';
  const activeSceneId = highlightSceneId || selectedScene?.id;

  const { data: acts = [] } = actApi.useProjectActs(resolvedProjectId, !!resolvedProjectId);
  const { data: scenes = [] } = sceneApi.useProjectScenes(resolvedProjectId, !!resolvedProjectId);

  const sortedActs = [...acts].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <PanelFrame title="Story Map" icon={Map} onClose={onClose} headerAccent="violet">
      <div className="h-full overflow-auto p-3 space-y-3">
        {sortedActs.length === 0 ? (
          <PanelEmptyState
            icon={Map}
            title="No acts in this project"
            description="Create an act first to visualize your story structure."
          />
        ) : (
          sortedActs.map((act) => {
            const actScenes = scenes
              .filter((s) => s.act_id === act.id)
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

            return (
              <div key={act.id} className="space-y-1">
                {/* Act header */}
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-cyan-400/80">
                  <ChevronRight className="w-3 h-3" />
                  <PanelSectionTitle title={act.name} className="leading-none" />
                  <span className="text-slate-600 font-normal">({actScenes.length})</span>
                </div>

                {/* Scenes */}
                <div className="ml-4 space-y-0.5">
                  {actScenes.map((scene) => (
                    <div
                      key={scene.id}
                      className={cn(
                        'px-2 py-1 rounded text-[11px] transition-colors',
                        scene.id === activeSceneId
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'text-slate-400 hover:text-slate-300 hover:bg-slate-900/40'
                      )}
                    >
                      {scene.name || 'Untitled Scene'}
                    </div>
                  ))}
                  {actScenes.length === 0 && (
                    <p className="px-2 text-[10px] text-slate-600">No scenes</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </PanelFrame>
  );
}
