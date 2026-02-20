import { Scene, SceneCreateInput, SceneUpdateInput } from '../../types/Scene';
import { apiFetch, API_BASE_URL } from '../../utils/api';
import { mockScenes } from '../../../../db/mockData';
import { createMockableQuery, createFilteredMockQueryFn, createSingleMockQueryFn } from './queryHelpers';

const SCENES_URL = `${API_BASE_URL}/scenes`;

export const sceneApi = {
  // Get all scenes for a project
  useProjectScenes: (projectId: string, enabled: boolean = true) => {
    return createMockableQuery<Scene[]>(
      ['scenes', 'project', projectId],
      () => createFilteredMockQueryFn(mockScenes, s => s.project_id === projectId),
      `${SCENES_URL}?projectId=${projectId}`,
      enabled && !!projectId
    );
  },

  // Get scenes by project and act
  useScenesByProjectAndAct: (projectId: string, actId: string, enabled: boolean = true) => {
    return createMockableQuery<Scene[]>(
      ['scenes', 'project', projectId, 'act', actId],
      () => createFilteredMockQueryFn(mockScenes, s => s.project_id === projectId && s.act_id === actId),
      `${SCENES_URL}?projectId=${projectId}&actId=${actId}`,
      enabled && !!projectId && !!actId
    );
  },

  // Get a single scene
  useScene: (id: string, enabled: boolean = true) => {
    return createMockableQuery<Scene>(
      ['scenes', id],
      () => createSingleMockQueryFn(mockScenes, s => s.id === id, 'Scene not found'),
      `${SCENES_URL}/${id}`,
      enabled && !!id
    );
  },

  // Create scene
  createScene: async (data: SceneCreateInput) => {
    return apiFetch<Scene>({
      url: SCENES_URL,
      method: 'POST',
      body: data,
    });
  },

  // Update scene
  updateScene: async (id: string, data: SceneUpdateInput) => {
    return apiFetch<Scene>({
      url: `${SCENES_URL}/${id}`,
      method: 'PUT',
      body: data,
    });
  },

  // Rename scene
  renameScene: async (id: string, name: string) => {
    return apiFetch<Scene>({
      url: `${SCENES_URL}/${id}`,
      method: 'PUT',
      body: { name },
    });
  },

  // Reorder scene
  reorderScene: async (id: string, newOrder: number) => {
    return apiFetch<Scene>({
      url: `${SCENES_URL}/${id}/reorder`,
      method: 'PUT',
      body: { order: newOrder },
    });
  },

  // Delete scene
  deleteScene: async (id: string) => {
    return apiFetch<void>({
      url: `${SCENES_URL}/${id}`,
      method: 'DELETE',
    });
  },
};
