/**
 * SceneEditorContext Types
 * Type definitions for scene editor state management
 */

import { Scene } from '@/app/types/Scene';
import { SceneChoice, SceneGraphIndices } from '@/app/types/SceneChoice';

export interface EditorSnapshot {
  scenes: Scene[];
  choices: SceneChoice[];
  currentSceneId: string | null;
  collapsedNodes: Set<string>;
}

export type OperationStatus = 'pending' | 'success' | 'failed';

export interface PendingOperation {
  id: string;
  entityId: string;
  type: 'add_scene' | 'update_scene' | 'delete_scene' |
        'add_choice' | 'update_choice' | 'delete_choice';
  status: OperationStatus;
  timestamp: number;
  error?: string;
}

export interface OptimisticState {
  pendingOperations: PendingOperation[];
  pendingEntityIds: Set<string>;
  failedEntityIds: Set<string>;
}

export interface SceneEditorContextType {
  // Project data
  projectId: string | null;
  firstSceneId: string | null;

  // Scene data
  scenes: Scene[];
  currentScene: Scene | null;
  currentSceneId: string | null;
  choices: SceneChoice[];

  // Graph indices for O(1) lookups
  graphIndices: SceneGraphIndices;
  getChoicesForScene: (sceneId: string) => SceneChoice[];
  getPredecessors: (sceneId: string) => string[];
  getSuccessors: (sceneId: string) => string[];

  // Collapsed nodes (for graph visualization)
  collapsedNodes: Set<string>;
  toggleNodeCollapsed: (nodeId: string) => void;
  isNodeCollapsed: (nodeId: string) => boolean;

  // Scene actions
  setScenes: (scenes: Scene[]) => void;
  setCurrentSceneId: (sceneId: string | null) => void;
  addScene: (scene: Scene) => void;
  updateScene: (sceneId: string, updates: Partial<Scene>) => void;
  deleteScene: (sceneId: string) => void;

  // Choice actions
  setChoices: (choices: SceneChoice[]) => void;
  addChoice: (choice: SceneChoice) => void;
  updateChoice: (choiceId: string, updates: Partial<SceneChoice>) => void;
  deleteChoice: (choiceId: string) => void;

  // Snapshot for undo/redo
  getSnapshot: () => EditorSnapshot;
  applySnapshot: (snapshot: EditorSnapshot) => void;

  // UI state
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;

  // Optimistic state
  optimisticState: OptimisticState;
  hasPendingOperation: (entityId: string) => boolean;
  hasFailedOperation: (entityId: string) => boolean;
}
