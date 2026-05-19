'use client';

import React from 'react';
import { List, Plus, Clapperboard, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import PanelFrame from '../shared/PanelFrame';
import { PanelEmptyState, PanelSkeletonList } from '../shared/PanelPrimitives';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { sceneApi } from '@/app/hooks/integration/useScenes';
import type { PanelDensity } from '@/workspace/types';

interface SceneListPanelProps {
  onClose?: () => void;
  onTriggerSkill?: (skillId: string, params?: Record<string, unknown>) => void;
  density?: PanelDensity;
}

export default function SceneListPanel({ onClose, onTriggerSkill, density }: SceneListPanelProps) {
  const { selectedProject, selectedAct, selectedSceneId, setSelectedSceneId } = useProjectStore();
  const projectId = selectedProject?.id;
  const actId = selectedAct?.id;
  const { data: scenes = [], isLoading, isFetching } = sceneApi.useScenesByProjectAndAct(
    projectId || '',
    actId || '',
    !!projectId && !!actId
  );

  return (
    <PanelFrame
      title={selectedAct?.name ? `Scenes — ${selectedAct.name}` : 'Scenes'}
      icon={List}
      onClose={onClose}
      headerAccent="amber"
      density={density}
      actions={
        <div className="flex items-center gap-1">
          {isFetching && !isLoading ? (
            <span className="inline-flex items-center gap-1 rounded border border-cyan-500/20 bg-cyan-500/8 px-1.5 py-0.5 text-xs text-cyan-300">
              <Loader2 className="h-3 w-3 animate-spin" />
              Refreshing
            </span>
          ) : null}
          {onTriggerSkill ? (
            <button
              type="button"
              onClick={() => onTriggerSkill('scene-generation')}
              className="rounded p-0.5 text-slate-400 transition-colors duration-150 hover:bg-slate-800/80 hover:text-cyan-300 active:scale-[0.98] transition-transform"
              title="Generate new scene"
            >
              <Plus className="w-3 h-3" />
            </button>
          ) : null}
        </div>
      }
    >
      {isLoading ? (
        <PanelSkeletonList rows={4} />
      ) : !projectId || !actId ? (
        <PanelEmptyState
          icon={Clapperboard}
          title="Pick a project and act"
          description="Select context first to browse and edit scene flow."
        />
      ) : scenes.length === 0 ? (
        <PanelEmptyState
          icon={Clapperboard}
          title="No scenes yet"
          description="Create your first scene to start structuring this act."
        />
      ) : (
        <div className="space-y-1.5 p-3">
          <AnimatePresence mode="popLayout">
            {scenes.map((scene, idx) => (
              <motion.button
                key={scene.id}
                layout
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                onClick={() => setSelectedSceneId(scene.id)}
                className={cn(
                  'group flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-all duration-150 active:scale-[0.98]',
                  selectedSceneId === scene.id
                    ? 'bg-cyan-500/10 border border-cyan-500/30'
                    : 'border border-transparent hover:bg-slate-800/80',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40'
                )}
              >
                <span className={cn(
                  'shrink-0 w-5 h-5 rounded flex items-center justify-center text-sm font-mono font-bold mt-0.5',
                  selectedSceneId === scene.id
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'bg-slate-800/60 text-slate-400'
                )}>
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    'text-sm font-medium truncate',
                    selectedSceneId === scene.id ? 'text-cyan-300' : 'text-slate-300'
                  )}>
                    {scene.name || 'Untitled Scene'}
                  </p>
                  {scene.description && (
                    <p className="hidden @sm:block text-sm text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                      {scene.description}
                    </p>
                  )}
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}
    </PanelFrame>
  );
}
