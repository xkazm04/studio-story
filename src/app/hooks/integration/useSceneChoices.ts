/**
 * Scene Choice API hooks
 * Handles CRUD operations for scene navigation/branching
 */

import { SceneChoice, SceneChoiceCreateInput, SceneChoiceUpdateInput } from '../../types/SceneChoice';
import { apiFetch, API_BASE_URL } from '../../utils/api';
import { mockSceneChoices } from '../../../../db/mockData';
import { createMockableQuery, createFilteredMockQueryFn, createSingleMockQueryFn } from './queryHelpers';

const CHOICES_URL = `${API_BASE_URL}/scene-choices`;

export const sceneChoiceApi = {
  // Get all choices for a scene
  useSceneChoices: (sceneId: string, enabled: boolean = true) => {
    return createMockableQuery<SceneChoice[]>(
      ['sceneChoices', 'scene', sceneId],
      () => createFilteredMockQueryFn(
        mockSceneChoices,
        c => c.scene_id === sceneId
      ),
      `${CHOICES_URL}?sceneId=${sceneId}`,
      enabled && !!sceneId
    );
  },

  // Get all choices for a project (for graph visualization)
  useProjectChoices: (projectId: string, enabled: boolean = true) => {
    return createMockableQuery<SceneChoice[]>(
      ['sceneChoices', 'project', projectId],
      // In mock mode, return all choices (they're all for proj-1)
      () => createFilteredMockQueryFn(mockSceneChoices, () => true),
      `${CHOICES_URL}?projectId=${projectId}`,
      enabled && !!projectId
    );
  },

  // Get a single choice
  useChoice: (id: string, enabled: boolean = true) => {
    return createMockableQuery<SceneChoice>(
      ['sceneChoices', id],
      () => createSingleMockQueryFn(
        mockSceneChoices,
        c => c.id === id,
        'Choice not found'
      ),
      `${CHOICES_URL}/${id}`,
      enabled && !!id
    );
  },

  // Get predecessor scenes (scenes that link TO this scene)
  usePredecessors: (sceneId: string, enabled: boolean = true) => {
    return createMockableQuery<SceneChoice[]>(
      ['sceneChoices', 'predecessors', sceneId],
      () => createFilteredMockQueryFn(
        mockSceneChoices,
        c => c.target_scene_id === sceneId
      ),
      `${CHOICES_URL}/predecessors/${sceneId}`,
      enabled && !!sceneId
    );
  },

  // Create choice
  createChoice: async (data: SceneChoiceCreateInput): Promise<SceneChoice> => {
    return apiFetch<SceneChoice>({
      url: CHOICES_URL,
      method: 'POST',
      body: data,
    });
  },

  // Update choice
  updateChoice: async (id: string, data: SceneChoiceUpdateInput): Promise<SceneChoice> => {
    return apiFetch<SceneChoice>({
      url: `${CHOICES_URL}/${id}`,
      method: 'PUT',
      body: data,
    });
  },

  // Delete choice
  deleteChoice: async (id: string): Promise<void> => {
    return apiFetch<void>({
      url: `${CHOICES_URL}/${id}`,
      method: 'DELETE',
    });
  },

  // Reorder choices within a scene
  reorderChoices: async (sceneId: string, choiceIds: string[]): Promise<SceneChoice[]> => {
    return apiFetch<SceneChoice[]>({
      url: `${CHOICES_URL}/reorder`,
      method: 'PUT',
      body: { sceneId, choiceIds },
    });
  },
};
