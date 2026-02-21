/**
 * Scene State Hook
 * Manages scene CRUD operations with graph event emission
 */

import { useState, useCallback, useMemo } from 'react';
import { Scene } from '@/app/types/Scene';

interface SceneStateHookProps {
  isInitializedRef: React.MutableRefObject<boolean>;
  emitSceneAdd?: (scene: Scene) => void;
  emitSceneUpdate?: (sceneId: string, updates: Partial<Scene>) => void;
  emitSceneDelete?: (sceneId: string) => void;
  emitSelectionChange?: (sceneId: string | null) => void;
}

export function useSceneState({
  isInitializedRef,
  emitSceneAdd,
  emitSceneUpdate,
  emitSceneDelete,
  emitSelectionChange,
}: SceneStateHookProps) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [currentSceneId, setCurrentSceneIdInternal] = useState<string | null>(null);

  // Memoize currentScene
  const currentScene = useMemo(() => {
    return scenes.find(scene => scene.id === currentSceneId) || null;
  }, [scenes, currentSceneId]);

  const setCurrentSceneId = useCallback((sceneId: string | null) => {
    setCurrentSceneIdInternal(sceneId);
    if (isInitializedRef.current && emitSelectionChange) {
      emitSelectionChange(sceneId);
    }
  }, [isInitializedRef, emitSelectionChange]);

  const addScene = useCallback((scene: Scene) => {
    setScenes(prev => [...prev, scene]);
    if (isInitializedRef.current && emitSceneAdd) {
      emitSceneAdd(scene);
    }
  }, [isInitializedRef, emitSceneAdd]);

  const updateScene = useCallback((sceneId: string, updates: Partial<Scene>) => {
    setScenes(prev =>
      prev.map(scene =>
        scene.id === sceneId
          ? { ...scene, ...updates, updated_at: new Date().toISOString() }
          : scene
      )
    );
    if (isInitializedRef.current && emitSceneUpdate) {
      emitSceneUpdate(sceneId, updates);
    }
  }, [isInitializedRef, emitSceneUpdate]);

  const deleteScene = useCallback((sceneId: string) => {
    setScenes(prev => prev.filter(scene => scene.id !== sceneId));
    setCurrentSceneIdInternal(prev => prev === sceneId ? null : prev);
    if (isInitializedRef.current && emitSceneDelete) {
      emitSceneDelete(sceneId);
    }
  }, [isInitializedRef, emitSceneDelete]);

  return {
    scenes,
    currentScene,
    currentSceneId,
    setScenes,
    setCurrentSceneId,
    setCurrentSceneIdInternal,
    addScene,
    updateScene,
    deleteScene,
  };
}
