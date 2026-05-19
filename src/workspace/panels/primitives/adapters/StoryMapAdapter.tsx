'use client';

import React, { useMemo, useCallback } from 'react';
import { Map, Pencil, ArrowUpDown, Copy, Trash2 } from 'lucide-react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { actApi } from '@/app/hooks/integration/useActs';
import { sceneApi } from '@/app/hooks/integration/useScenes';
import type { BaseAdapterProps, TreeNode } from '../types';
import type { ContextMenuItem } from '../ContextMenu';
import TreeView from '../TreeView';
import { useResolvedProjectId } from './useResolvedProjectId';

interface StoryMapAdapterProps extends BaseAdapterProps {
  projectId?: string;
  highlightSceneId?: string;
}

export default function StoryMapAdapter({
  projectId: propProjectId,
  highlightSceneId,
  density,
  onClose,
  onTriggerSkill,
}: StoryMapAdapterProps) {
  const { projectId: resolvedProjectId } = useResolvedProjectId(propProjectId);
  const selectedScene = useProjectStore((s) => s.selectedScene);
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

  const getContextMenuItems = useCallback((node: TreeNode): ContextMenuItem[] => {
    const isAct = node.children != null && node.children.length >= 0;
    if (isAct) {
      return [
        { id: 'edit', label: 'Edit Act', icon: Pencil },
        { id: 'reorder', label: 'Reorder', icon: ArrowUpDown, separator: true },
        { id: 'delete', label: 'Delete Act', icon: Trash2, variant: 'danger', separator: true },
      ];
    }
    return [
      { id: 'open-editor', label: 'Open in Editor', icon: Pencil },
      { id: 'move-to-act', label: 'Move to Act...', icon: ArrowUpDown, separator: true },
      { id: 'duplicate', label: 'Duplicate', icon: Copy },
      { id: 'delete', label: 'Delete Scene', icon: Trash2, variant: 'danger', separator: true },
    ];
  }, []);

  const handleContextMenuAction = useCallback((actionId: string, node: TreeNode) => {
    const isAct = acts.some((a) => a.id === node.id);
    if (isAct) {
      switch (actionId) {
        case 'edit':
          onTriggerSkill?.('act-edit', { actId: node.id });
          break;
        case 'reorder':
          onTriggerSkill?.('act-reorder', { actId: node.id });
          break;
        case 'delete':
          onTriggerSkill?.('act-delete', { actId: node.id });
          break;
      }
    } else {
      switch (actionId) {
        case 'open-editor':
          onTriggerSkill?.('scene-edit', { sceneId: node.id });
          break;
        case 'move-to-act':
          onTriggerSkill?.('scene-move', { sceneId: node.id });
          break;
        case 'duplicate':
          onTriggerSkill?.('scene-duplicate', { sceneId: node.id });
          break;
        case 'delete':
          onTriggerSkill?.('scene-delete', { sceneId: node.id });
          break;
      }
    }
  }, [acts, onTriggerSkill]);

  return (
    <TreeView
      title="Story Map"
      icon={Map}
      headerAccent="violet"
      onClose={onClose}
      density={density}
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
      contextMenuItems={getContextMenuItems}
      onContextMenuAction={handleContextMenuAction}
    />
  );
}
