'use client';

/**
 * Scene Editor Provider
 * Central state management for scene graph editing
 */

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef, useMemo } from 'react';
import { Scene } from '@/app/types/Scene';
import { SceneChoice } from '@/app/types/SceneChoice';
import { SceneEditorContextType, EditorSnapshot, OptimisticState } from './types';
import { useSceneState, useChoiceState, useCollapsedNodesState } from './hooks';

const SceneEditorContext = createContext<SceneEditorContextType | undefined>(undefined);

interface SceneEditorProviderProps {
  children: ReactNode;
  projectId: string;
  firstSceneId?: string | null;
  initialScenes?: Scene[];
  initialChoices?: SceneChoice[];
}

export function SceneEditorProvider({
  children,
  projectId,
  firstSceneId = null,
  initialScenes = [],
  initialChoices = [],
}: SceneEditorProviderProps) {
  const [isSaving, setIsSaving] = useState(false);
  const isInitializedRef = useRef(false);
  const projectIdRef = useRef<string | null>(projectId);

  // Keep projectIdRef in sync
  useEffect(() => {
    projectIdRef.current = projectId;
  }, [projectId]);

  // State slices
  const sceneState = useSceneState({ isInitializedRef });
  const choiceState = useChoiceState({ isInitializedRef, projectIdRef });
  const collapsedNodesState = useCollapsedNodesState(projectId);

  // Initialize with provided data
  useEffect(() => {
    if (initialScenes.length > 0 && sceneState.scenes.length === 0) {
      sceneState.setScenes(initialScenes);
      // Auto-select first scene if available
      if (firstSceneId) {
        sceneState.setCurrentSceneIdInternal(firstSceneId);
      } else if (initialScenes.length > 0) {
        sceneState.setCurrentSceneIdInternal(initialScenes[0].id);
      }
    }
    if (initialChoices.length > 0 && choiceState.choices.length === 0) {
      choiceState.setChoices(initialChoices);
    }
    isInitializedRef.current = true;
  }, [initialScenes, initialChoices, sceneState, choiceState, firstSceneId]);

  // Optimistic state (simplified version)
  const [pendingEntityIds] = useState<Set<string>>(new Set());
  const [failedEntityIds] = useState<Set<string>>(new Set());

  const optimisticState = useMemo<OptimisticState>(() => ({
    pendingOperations: [],
    pendingEntityIds,
    failedEntityIds,
  }), [pendingEntityIds, failedEntityIds]);

  const hasPendingOperation = useCallback((entityId: string) => {
    return pendingEntityIds.has(entityId);
  }, [pendingEntityIds]);

  const hasFailedOperation = useCallback((entityId: string) => {
    return failedEntityIds.has(entityId);
  }, [failedEntityIds]);

  // Snapshot for undo/redo
  const getSnapshot = useCallback((): EditorSnapshot => ({
    scenes: sceneState.scenes,
    choices: choiceState.choices,
    currentSceneId: sceneState.currentSceneId,
    collapsedNodes: collapsedNodesState.collapsedNodes,
  }), [sceneState, choiceState, collapsedNodesState]);

  const applySnapshot = useCallback((snapshot: EditorSnapshot) => {
    sceneState.setScenes(snapshot.scenes);
    choiceState.setChoices(snapshot.choices);
    sceneState.setCurrentSceneIdInternal(snapshot.currentSceneId);
    collapsedNodesState.setCollapsedNodesInternal(snapshot.collapsedNodes);
  }, [sceneState, choiceState, collapsedNodesState]);

  // Memoize context value
  const value = useMemo<SceneEditorContextType>(() => ({
    // Project data
    projectId,
    firstSceneId,

    // Scene data
    scenes: sceneState.scenes,
    currentScene: sceneState.currentScene,
    currentSceneId: sceneState.currentSceneId,
    choices: choiceState.choices,

    // Graph indices
    graphIndices: choiceState.graphIndices,
    getChoicesForScene: choiceState.getChoicesForScene,
    getPredecessors: choiceState.getPredecessors,
    getSuccessors: choiceState.getSuccessors,

    // Collapsed nodes
    collapsedNodes: collapsedNodesState.collapsedNodes,
    toggleNodeCollapsed: collapsedNodesState.toggleNodeCollapsed,
    isNodeCollapsed: collapsedNodesState.isNodeCollapsed,

    // Scene actions
    setScenes: sceneState.setScenes,
    setCurrentSceneId: sceneState.setCurrentSceneId,
    addScene: sceneState.addScene,
    updateScene: sceneState.updateScene,
    deleteScene: sceneState.deleteScene,

    // Choice actions
    setChoices: choiceState.setChoices,
    addChoice: choiceState.addChoice,
    updateChoice: choiceState.updateChoice,
    deleteChoice: choiceState.deleteChoice,

    // Snapshot
    getSnapshot,
    applySnapshot,

    // UI state
    isSaving,
    setIsSaving,

    // Optimistic state
    optimisticState,
    hasPendingOperation,
    hasFailedOperation,
  }), [
    projectId,
    firstSceneId,
    sceneState,
    choiceState,
    collapsedNodesState,
    getSnapshot,
    applySnapshot,
    isSaving,
    optimisticState,
    hasPendingOperation,
    hasFailedOperation,
  ]);

  return (
    <SceneEditorContext.Provider value={value}>
      {children}
    </SceneEditorContext.Provider>
  );
}

/**
 * Hook to access scene editor context
 */
export function useSceneEditor() {
  const context = useContext(SceneEditorContext);
  if (context === undefined) {
    throw new Error('useSceneEditor must be used within a SceneEditorProvider');
  }
  return context;
}

/**
 * Hook for components that only need current scene
 */
export function useCurrentScene() {
  const { currentScene, currentSceneId, setCurrentSceneId } = useSceneEditor();
  return useMemo(() => ({
    currentScene,
    currentSceneId,
    setCurrentSceneId,
  }), [currentScene, currentSceneId, setCurrentSceneId]);
}

/**
 * Hook for components that only need scene list
 */
export function useScenes() {
  const { scenes, addScene, updateScene, deleteScene } = useSceneEditor();
  return useMemo(() => ({
    scenes,
    addScene,
    updateScene,
    deleteScene,
  }), [scenes, addScene, updateScene, deleteScene]);
}

/**
 * Hook for graph indices and navigation
 */
export function useGraphNavigation() {
  const { graphIndices, getChoicesForScene, getPredecessors, getSuccessors, firstSceneId } = useSceneEditor();
  return useMemo(() => ({
    graphIndices,
    getChoicesForScene,
    getPredecessors,
    getSuccessors,
    firstSceneId,
  }), [graphIndices, getChoicesForScene, getPredecessors, getSuccessors, firstSceneId]);
}
