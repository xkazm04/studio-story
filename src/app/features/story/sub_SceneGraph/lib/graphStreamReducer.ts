/**
 * Graph Stream State Reducer
 * Reduces mutation events into graph state snapshots
 */

import { Scene } from '@/app/types/Scene';
import { SceneChoice } from '@/app/types/SceneChoice';
import { GraphMutationEvent, GraphStateSnapshot } from './graphStreamTypes';

export function reduceGraphState(
  state: GraphStateSnapshot,
  event: GraphMutationEvent
): GraphStateSnapshot {
  const base = { ...state, lastMutation: event, mutationCount: state.mutationCount + 1 };

  switch (event.type) {
    case 'scene:add': {
      const scenes = new Map(state.scenes);
      scenes.set(event.payload.id, event.payload);
      return { ...base, scenes };
    }

    case 'scene:update': {
      const scenes = new Map(state.scenes);
      const existing = scenes.get(event.payload.sceneId);
      if (existing) {
        scenes.set(event.payload.sceneId, { ...existing, ...event.payload.updates });
      }
      return { ...base, scenes };
    }

    case 'scene:delete': {
      const scenes = new Map(state.scenes);
      scenes.delete(event.payload.sceneId);
      return { ...base, scenes };
    }

    case 'scene:batch-add': {
      const scenes = new Map(state.scenes);
      event.payload.forEach(scene => scenes.set(scene.id, scene));
      return { ...base, scenes };
    }

    case 'scene:batch-update': {
      const scenes = new Map(state.scenes);
      event.payload.forEach(({ sceneId, updates }) => {
        const existing = scenes.get(sceneId);
        if (existing) {
          scenes.set(sceneId, { ...existing, ...updates });
        }
      });
      return { ...base, scenes };
    }

    case 'scene:batch-delete': {
      const scenes = new Map(state.scenes);
      event.payload.sceneIds.forEach(id => scenes.delete(id));
      return { ...base, scenes };
    }

    case 'choice:add': {
      const choices = new Map(state.choices);
      choices.set(event.payload.id, event.payload);
      return { ...base, choices };
    }

    case 'choice:update': {
      const choices = new Map(state.choices);
      const existing = choices.get(event.payload.choiceId);
      if (existing) {
        choices.set(event.payload.choiceId, { ...existing, ...event.payload.updates });
      }
      return { ...base, choices };
    }

    case 'choice:delete': {
      const choices = new Map(state.choices);
      choices.delete(event.payload.choiceId);
      return { ...base, choices };
    }

    case 'choice:batch-add': {
      const choices = new Map(state.choices);
      event.payload.forEach(choice => choices.set(choice.id, choice));
      return { ...base, choices };
    }

    case 'choice:batch-delete': {
      const choices = new Map(state.choices);
      event.payload.choiceIds.forEach(id => choices.delete(id));
      return { ...base, choices };
    }

    case 'graph:reset':
    case 'graph:sync': {
      const scenes = new Map<string, Scene>();
      const choices = new Map<string, SceneChoice>();

      event.payload.scenes.forEach(scene => scenes.set(scene.id, scene));
      event.payload.choices.forEach(choice => choices.set(choice.id, choice));

      return {
        ...base,
        scenes,
        choices,
        firstSceneId: event.payload.firstSceneId,
        currentSceneId: event.payload.currentSceneId,
        collapsedNodes: 'collapsedNodes' in event.payload
          ? event.payload.collapsedNodes
          : new Set(),
      };
    }

    case 'selection:change': {
      return { ...base, currentSceneId: event.payload.sceneId };
    }

    case 'collapse:toggle': {
      const collapsedNodes = new Set(state.collapsedNodes);
      if (event.payload.collapsed) {
        collapsedNodes.add(event.payload.nodeId);
      } else {
        collapsedNodes.delete(event.payload.nodeId);
      }
      return { ...base, collapsedNodes };
    }

    default:
      return base;
  }
}
