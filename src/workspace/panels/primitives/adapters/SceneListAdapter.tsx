'use client';

import React, { useMemo } from 'react';
import { List, Plus, Clapperboard, Loader2 } from 'lucide-react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { sceneApi } from '@/app/hooks/integration/useScenes';
import { SCENE_SCHEMA } from '@/workspace/schemas/entitySchemas';
import DataList from '../DataList';
import { useScriptContextStore } from '../../../store/scriptContextStore';

interface SceneListAdapterProps {
  onClose?: () => void;
  onTriggerSkill?: (skillId: string, params?: Record<string, unknown>) => void;
}

export default function SceneListAdapter({ onClose, onTriggerSkill }: SceneListAdapterProps) {
  const { selectedProject, selectedAct, selectedSceneId, setSelectedSceneId } = useProjectStore();
  const referencedBeats = useScriptContextStore((s) => s.referencedBeats);
  const projectId = selectedProject?.id;
  const actId = selectedAct?.id;
  const { data: scenes = [], isLoading, isFetching, isError, error, refetch } = sceneApi.useScenesByProjectAndAct(
    projectId || '', actId || '', !!projectId && !!actId,
  );

  const highlightSet = useMemo(() => new Set(referencedBeats), [referencedBeats]);

  return (
    <DataList
      title={selectedAct?.name ? `Scenes — ${selectedAct.name}` : 'Scenes'}
      icon={List}
      headerAccent="amber"
      onClose={onClose}
      isLoading={isLoading}
      isError={isError}
      errorMessage={error?.message}
      onRetry={() => refetch()}
      items={scenes as unknown as Record<string, unknown>[]}
      fields={SCENE_SCHEMA.fields}
      selectedId={selectedSceneId ?? undefined}
      highlightIds={highlightSet}
      highlightField="name"
      highlightAccent="amber"
      onSelect={(item) => setSelectedSceneId(item.id as string)}
      numberedItems
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
              className="rounded p-0.5 text-slate-400 transition-colors hover:bg-amber-500/10 hover:text-amber-300"
              title="Generate new scene"
            >
              <Plus className="w-3 h-3" />
            </button>
          ) : null}
        </div>
      }
      emptyIcon={Clapperboard}
      emptyTitle={!projectId || !actId ? 'Pick a project and act' : 'No scenes yet'}
      emptyDescription={!projectId || !actId
        ? 'Select context first to browse and edit scene flow.'
        : 'Create your first scene to start structuring this act.'
      }
    />
  );
}
