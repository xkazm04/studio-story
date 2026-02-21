/**
 * Graph Stream Event Types
 * Type definitions for reactive graph mutations
 */

import { Scene } from '@/app/types/Scene';
import { SceneChoice } from '@/app/types/SceneChoice';

export type GraphMutationType =
  | 'scene:add'
  | 'scene:update'
  | 'scene:delete'
  | 'scene:batch-add'
  | 'scene:batch-update'
  | 'scene:batch-delete'
  | 'choice:add'
  | 'choice:update'
  | 'choice:delete'
  | 'choice:batch-add'
  | 'choice:batch-delete'
  | 'graph:reset'
  | 'graph:sync'
  | 'selection:change'
  | 'collapse:toggle';

export interface SceneAddEvent {
  type: 'scene:add';
  payload: Scene;
  timestamp: number;
}

export interface SceneUpdateEvent {
  type: 'scene:update';
  payload: { sceneId: string; updates: Partial<Scene> };
  timestamp: number;
}

export interface SceneDeleteEvent {
  type: 'scene:delete';
  payload: { sceneId: string };
  timestamp: number;
}

export interface SceneBatchAddEvent {
  type: 'scene:batch-add';
  payload: Scene[];
  timestamp: number;
}

export interface SceneBatchUpdateEvent {
  type: 'scene:batch-update';
  payload: Array<{ sceneId: string; updates: Partial<Scene> }>;
  timestamp: number;
}

export interface SceneBatchDeleteEvent {
  type: 'scene:batch-delete';
  payload: { sceneIds: string[] };
  timestamp: number;
}

export interface ChoiceAddEvent {
  type: 'choice:add';
  payload: SceneChoice;
  timestamp: number;
}

export interface ChoiceUpdateEvent {
  type: 'choice:update';
  payload: { choiceId: string; updates: Partial<SceneChoice> };
  timestamp: number;
}

export interface ChoiceDeleteEvent {
  type: 'choice:delete';
  payload: { choiceId: string };
  timestamp: number;
}

export interface ChoiceBatchAddEvent {
  type: 'choice:batch-add';
  payload: SceneChoice[];
  timestamp: number;
}

export interface ChoiceBatchDeleteEvent {
  type: 'choice:batch-delete';
  payload: { choiceIds: string[] };
  timestamp: number;
}

export interface GraphResetEvent {
  type: 'graph:reset';
  payload: {
    scenes: Scene[];
    choices: SceneChoice[];
    firstSceneId: string | null;
    currentSceneId: string | null;
  };
  timestamp: number;
}

export interface GraphSyncEvent {
  type: 'graph:sync';
  payload: {
    scenes: Scene[];
    choices: SceneChoice[];
    firstSceneId: string | null;
    currentSceneId: string | null;
    collapsedNodes: Set<string>;
  };
  timestamp: number;
}

export interface SelectionChangeEvent {
  type: 'selection:change';
  payload: { sceneId: string | null };
  timestamp: number;
}

export interface CollapseToggleEvent {
  type: 'collapse:toggle';
  payload: { nodeId: string; collapsed: boolean };
  timestamp: number;
}

export type GraphMutationEvent =
  | SceneAddEvent
  | SceneUpdateEvent
  | SceneDeleteEvent
  | SceneBatchAddEvent
  | SceneBatchUpdateEvent
  | SceneBatchDeleteEvent
  | ChoiceAddEvent
  | ChoiceUpdateEvent
  | ChoiceDeleteEvent
  | ChoiceBatchAddEvent
  | ChoiceBatchDeleteEvent
  | GraphResetEvent
  | GraphSyncEvent
  | SelectionChangeEvent
  | CollapseToggleEvent;

export interface GraphStateSnapshot {
  scenes: Map<string, Scene>;
  choices: Map<string, SceneChoice>;
  firstSceneId: string | null;
  currentSceneId: string | null;
  collapsedNodes: Set<string>;
  lastMutation: GraphMutationEvent | null;
  mutationCount: number;
}

export function createInitialSnapshot(): GraphStateSnapshot {
  return {
    scenes: new Map(),
    choices: new Map(),
    firstSceneId: null,
    currentSceneId: null,
    collapsedNodes: new Set(),
    lastMutation: null,
    mutationCount: 0,
  };
}
