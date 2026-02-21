'use client';

import React from 'react';
import { List, Plus, Clapperboard, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import PanelFrame from '../shared/PanelFrame';
import { PanelEmptyState, PanelSkeletonList } from '../shared/PanelPrimitives';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { sceneApi } from '@/app/hooks/integration/useScenes';

interface SceneListPanelProps {
  onClose?: () => void;
  onTriggerSkill?: (skillId: string, params?: Record<string, unknown>) => void;
}

export default function SceneListPanel({ onClose, onTriggerSkill }: SceneListPanelProps) {
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
      actions={
        <div className="flex items-center gap-1">
          {isFetching && !isLoading ? (
            <span className="inline-flex items-center gap-1 rounded border border-cyan-500/20 bg-cyan-500/8 px-1.5 py-0.5 text-[9px] text-cyan-300">
              <Loader2 className="h-3 w-3 animate-spin" />
              Refreshing
            </span>
          ) : null}
          {onTriggerSkill ? (
            <button
              type="button"
              onClick={() => onTriggerSkill('scene-generation')}
              className="rounded p-0.5 text-slate-500 transition-colors hover:bg-amber-500/10 hover:text-amber-300"
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
        <div className="space-y-1.5 p-2">
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
                  'group flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-all',
                  selectedSceneId === scene.id
                    ? 'bg-amber-500/10 border border-amber-500/30'
                    : 'border border-transparent hover:bg-slate-800/40',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/40'
                )}
              >
                <span className={cn(
                  'shrink-0 w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-bold mt-0.5',
                  selectedSceneId === scene.id
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-slate-800/60 text-slate-500'
                )}>
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    'text-xs font-medium truncate',
                    selectedSceneId === scene.id ? 'text-amber-200' : 'text-slate-300'
                  )}>
                    {scene.name || 'Untitled Scene'}
                  </p>
                  {scene.description && (
                    <p className="text-[10px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
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
