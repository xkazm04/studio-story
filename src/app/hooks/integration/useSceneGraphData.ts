/**
 * useSceneGraphData Hook
 * Fetches scenes and choices for the Scene Graph visualization
 * Supports both mock mode and real backend
 */

import { useQuery } from '@tanstack/react-query';
import { Scene } from '../../types/Scene';
import { SceneChoice } from '../../types/SceneChoice';
import { apiFetch, API_BASE_URL } from '../../utils/api';
import { USE_MOCK_DATA } from '../../config/api';
import {
  mockGraphScenes,
  mockSceneChoices,
  mockProjectFirstScenes,
} from '../../../../db/mockData';

const SCENES_URL = `${API_BASE_URL}/scenes`;
const CHOICES_URL = `${API_BASE_URL}/scene-choices`;

interface SceneGraphData {
  scenes: Scene[];
  choices: SceneChoice[];
  firstSceneId: string | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch all scene graph data for a project
 */
export function useSceneGraphData(projectId: string): SceneGraphData {
  // Fetch scenes
  const scenesQuery = useQuery({
    queryKey: ['scene-graph', 'scenes', projectId],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        // Filter mock scenes for this project
        return mockGraphScenes.filter((s) => s.project_id === projectId);
      }
      return apiFetch<Scene[]>({
        url: `${SCENES_URL}?projectId=${projectId}&includeContent=true`,
        method: 'GET',
      });
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch choices
  const choicesQuery = useQuery({
    queryKey: ['scene-graph', 'choices', projectId],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        // Get scene IDs for this project
        const projectSceneIds = mockGraphScenes
          .filter((s) => s.project_id === projectId)
          .map((s) => s.id);
        // Filter choices that belong to scenes in this project
        return mockSceneChoices.filter((c) => projectSceneIds.includes(c.scene_id));
      }
      return apiFetch<SceneChoice[]>({
        url: `${CHOICES_URL}?projectId=${projectId}`,
        method: 'GET',
      });
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get first scene ID
  const firstSceneId = USE_MOCK_DATA
    ? mockProjectFirstScenes[projectId] || null
    : null; // TODO: Fetch from backend

  return {
    scenes: scenesQuery.data || [],
    choices: choicesQuery.data || [],
    firstSceneId,
    isLoading: scenesQuery.isLoading || choicesQuery.isLoading,
    error: scenesQuery.error || choicesQuery.error,
  };
}

/**
 * Get mock scene graph data directly (for SSR/initial load)
 */
export function getMockSceneGraphData(projectId: string): {
  scenes: Scene[];
  choices: SceneChoice[];
  firstSceneId: string | null;
} {
  const scenes = mockGraphScenes.filter((s) => s.project_id === projectId);
  const sceneIds = scenes.map((s) => s.id);
  const choices = mockSceneChoices.filter((c) => sceneIds.includes(c.scene_id));
  const firstSceneId = mockProjectFirstScenes[projectId] || null;

  return { scenes, choices, firstSceneId };
}
