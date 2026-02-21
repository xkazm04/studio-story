/**
 * Choice State Hook
 * Manages scene choice CRUD with graph indices for O(1) lookups
 */

import { useState, useCallback, useMemo } from 'react';
import { SceneChoice, SceneGraphIndices, buildGraphIndices } from '@/app/types/SceneChoice';

const EMPTY_GRAPH_INDICES: SceneGraphIndices = {
  choicesBySceneId: new Map(),
  predecessorsBySceneId: new Map(),
  successorsBySceneId: new Map(),
};

interface ChoiceStateHookProps {
  isInitializedRef: React.MutableRefObject<boolean>;
  projectIdRef: React.MutableRefObject<string | null>;
  emitChoiceAdd?: (choice: SceneChoice) => void;
  emitChoiceUpdate?: (choiceId: string, updates: Partial<SceneChoice>) => void;
  emitChoiceDelete?: (choiceId: string) => void;
  onLayoutInvalidate?: (projectId: string) => void;
}

export function useChoiceState({
  isInitializedRef,
  projectIdRef,
  emitChoiceAdd,
  emitChoiceUpdate,
  emitChoiceDelete,
  onLayoutInvalidate,
}: ChoiceStateHookProps) {
  const [choices, setChoices] = useState<SceneChoice[]>([]);

  // Pre-computed graph indices - memoized
  const graphIndices = useMemo(() => {
    if (choices.length === 0) return EMPTY_GRAPH_INDICES;
    return buildGraphIndices(choices);
  }, [choices]);

  const getChoicesForScene = useCallback((sceneId: string): SceneChoice[] => {
    return graphIndices.choicesBySceneId.get(sceneId) || [];
  }, [graphIndices]);

  const getPredecessors = useCallback((sceneId: string): string[] => {
    const preds = graphIndices.predecessorsBySceneId.get(sceneId);
    return preds ? Array.from(preds) : [];
  }, [graphIndices]);

  const getSuccessors = useCallback((sceneId: string): string[] => {
    const succs = graphIndices.successorsBySceneId.get(sceneId);
    return succs ? Array.from(succs) : [];
  }, [graphIndices]);

  const invalidateLayout = useCallback(() => {
    const projectId = projectIdRef.current;
    if (projectId && onLayoutInvalidate) {
      onLayoutInvalidate(projectId);
    }
  }, [projectIdRef, onLayoutInvalidate]);

  const addChoice = useCallback((choice: SceneChoice) => {
    setChoices(prev => [...prev, choice]);
    invalidateLayout();
    if (isInitializedRef.current && emitChoiceAdd) {
      emitChoiceAdd(choice);
    }
  }, [isInitializedRef, emitChoiceAdd, invalidateLayout]);

  const updateChoice = useCallback((choiceId: string, updates: Partial<SceneChoice>) => {
    setChoices(prev =>
      prev.map(choice =>
        choice.id === choiceId
          ? { ...choice, ...updates, updated_at: new Date().toISOString() }
          : choice
      )
    );
    if (updates.target_scene_id !== undefined || updates.order_index !== undefined) {
      invalidateLayout();
    }
    if (isInitializedRef.current && emitChoiceUpdate) {
      emitChoiceUpdate(choiceId, updates);
    }
  }, [isInitializedRef, emitChoiceUpdate, invalidateLayout]);

  const deleteChoice = useCallback((choiceId: string) => {
    setChoices(prev => prev.filter(choice => choice.id !== choiceId));
    invalidateLayout();
    if (isInitializedRef.current && emitChoiceDelete) {
      emitChoiceDelete(choiceId);
    }
  }, [isInitializedRef, emitChoiceDelete, invalidateLayout]);

  return {
    choices,
    graphIndices,
    setChoices,
    addChoice,
    updateChoice,
    deleteChoice,
    getChoicesForScene,
    getPredecessors,
    getSuccessors,
  };
}
