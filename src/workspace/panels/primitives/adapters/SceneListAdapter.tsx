'use client';

import React, { useMemo, useCallback } from 'react';
import { List, Plus, Clapperboard, Loader2, Pencil, Copy, ArrowUpDown, Trash2, Image } from 'lucide-react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { sceneApi } from '@/app/hooks/integration/useScenes';
import { SCENE_SCHEMA } from '@/workspace/schemas/entitySchemas';
import type { BaseAdapterProps } from '../types';
import type { ContextMenuItem } from '../ContextMenu';
import type { Scene } from '@/app/types/Scene';
import DataList from '../DataList';
import { useScriptContextStore } from '../../../store/scriptContextStore';
import { useResolvedProjectId } from './useResolvedProjectId';

type SceneListAdapterProps = BaseAdapterProps;

export default function SceneListAdapter({ onClose, density, onTriggerSkill }: SceneListAdapterProps) {
  const { projectId, hasProject } = useResolvedProjectId();
  const { selectedAct, selectedSceneId, setSelectedSceneId } = useProjectStore();
  const referencedBeats = useScriptContextStore((s) => s.referencedBeats);
  const actId = selectedAct?.id;
  const { data: scenes = [], isLoading, isFetching, isError, error, refetch } = sceneApi.useScenesByProjectAndAct(
    projectId, actId || '', hasProject && !!actId,
  );

  const highlightSet = useMemo(() => new Set(referencedBeats), [referencedBeats]);
  const hasContext = hasProject && !!actId;

  const getContextMenuItems = useCallback((_item: Scene): ContextMenuItem[] => [
    { id: 'open-editor', label: 'Open in Editor', icon: Pencil },
    { id: 'illustrate', label: 'Illustrate Scene', icon: Image },
    { id: 'move-to-act', label: 'Move to Act...', icon: ArrowUpDown, separator: true },
    { id: 'duplicate', label: 'Duplicate', icon: Copy },
    { id: 'delete', label: 'Delete', icon: Trash2, variant: 'danger', separator: true },
  ], []);

  const handleContextMenuAction = useCallback((actionId: string, item: Scene) => {
    const sceneId = item.id;
    switch (actionId) {
      case 'open-editor':
        setSelectedSceneId(sceneId);
        onTriggerSkill?.('scene-edit', { sceneId });
        break;
      case 'illustrate':
        onTriggerSkill?.('scene-illustrate', { sceneId });
        break;
      case 'move-to-act':
        onTriggerSkill?.('scene-move', { sceneId });
        break;
      case 'duplicate':
        onTriggerSkill?.('scene-duplicate', { sceneId });
        break;
      case 'delete':
        onTriggerSkill?.('scene-delete', { sceneId });
        break;
    }
  }, [setSelectedSceneId, onTriggerSkill]);

  return (
    <DataList
      title={selectedAct?.name ? `Scenes — ${selectedAct.name}` : 'Scenes'}
      icon={List}
      headerAccent="amber"
      onClose={onClose}
      density={density}
      isLoading={isLoading}
      isError={isError}
      errorMessage={error?.message}
      onRetry={() => refetch()}
      items={scenes}
      fields={SCENE_SCHEMA.fields}
      selectedId={selectedSceneId ?? undefined}
      highlightIds={highlightSet}
      highlightField="name"
      highlightAccent="amber"
      onSelect={(item) => setSelectedSceneId(item.id)}
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
      emptyTitle={!hasContext ? 'Pick a project and act' : 'No scenes yet'}
      emptyDescription={!hasContext
        ? 'Select context first to browse and edit scene flow.'
        : 'Create your first scene to start structuring this act.'
      }
      contextMenuItems={getContextMenuItems}
      onContextMenuAction={handleContextMenuAction}
    />
  );
}
