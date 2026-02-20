import { BeatSceneMapping, BeatSceneSuggestion } from '@/app/types/Beat';
import { Scene } from '@/app/types/Scene';
import { apiFetch, useApiGet, API_BASE_URL } from '@/app/utils/api';

const BEAT_SCENE_MAPPINGS_URL = `${API_BASE_URL}/beat-scene-mappings`;
const BEAT_SCENE_MAPPING_URL = `${API_BASE_URL}/beat-scene-mapping`;

export const beatSceneMappingApi = {
  /**
   * Get all beat-scene mappings for a beat
   */
  useGetBeatMappings: (beatId: string | undefined, enabled: boolean = true) => {
    const url = beatId
      ? `${BEAT_SCENE_MAPPINGS_URL}?beatId=${beatId}`
      : '';
    return useApiGet<BeatSceneMapping[]>(url, enabled && !!beatId);
  },

  /**
   * Get all beat-scene mappings for a project
   */
  useGetProjectMappings: (
    projectId: string | undefined,
    enabled: boolean = true
  ) => {
    const url = projectId
      ? `${BEAT_SCENE_MAPPINGS_URL}?projectId=${projectId}`
      : '';
    return useApiGet<BeatSceneMapping[]>(url, enabled && !!projectId);
  },

  /**
   * Get beat-scene mappings by status
   */
  useGetMappingsByStatus: (
    projectId: string | undefined,
    status: 'suggested' | 'accepted' | 'rejected' | 'modified',
    enabled: boolean = true
  ) => {
    const url =
      projectId && status
        ? `${BEAT_SCENE_MAPPINGS_URL}?projectId=${projectId}&status=${status}`
        : '';
    return useApiGet<BeatSceneMapping[]>(url, enabled && !!projectId);
  },

  /**
   * Generate AI scene suggestions for a beat
   */
  generateSceneSuggestions: async (params: {
    beatName: string;
    beatDescription?: string;
    beatType?: string;
    existingScenes?: Scene[];
    projectContext?: {
      projectId: string;
      genre?: string;
      theme?: string;
      setting?: string;
    };
    maxSuggestions?: number;
    includeNewScenes?: boolean;
  }): Promise<{ suggestions: BeatSceneSuggestion[]; model: string }> => {
    return apiFetch<{ suggestions: BeatSceneSuggestion[]; model: string }>({
      url: BEAT_SCENE_MAPPING_URL,
      method: 'POST',
      body: params,
    });
  },

  /**
   * Create a beat-scene mapping (save suggestion)
   */
  createMapping: async (params: {
    beat_id: string;
    project_id: string;
    scene_id?: string;
    status?: 'suggested' | 'accepted' | 'rejected' | 'modified';
    suggested_scene_name?: string;
    suggested_scene_description?: string;
    suggested_scene_script?: string;
    suggested_location?: string;
    semantic_similarity_score?: number;
    reasoning?: string;
    ai_model?: string;
    confidence_score?: number;
  }): Promise<BeatSceneMapping> => {
    return apiFetch<BeatSceneMapping>({
      url: BEAT_SCENE_MAPPINGS_URL,
      method: 'POST',
      body: params,
    });
  },

  /**
   * Update a beat-scene mapping (accept/reject/modify)
   */
  updateMapping: async (
    id: string,
    updates: {
      status?: 'suggested' | 'accepted' | 'rejected' | 'modified';
      scene_id?: string;
      suggested_scene_name?: string;
      suggested_scene_description?: string;
      suggested_scene_script?: string;
      suggested_location?: string;
      user_feedback?: string;
    }
  ): Promise<BeatSceneMapping> => {
    return apiFetch<BeatSceneMapping>({
      url: `${BEAT_SCENE_MAPPINGS_URL}/${id}`,
      method: 'PUT',
      body: updates,
    });
  },

  /**
   * Delete a beat-scene mapping
   */
  deleteMapping: async (id: string): Promise<void> => {
    return apiFetch<void>({
      url: `${BEAT_SCENE_MAPPINGS_URL}/${id}`,
      method: 'DELETE',
    });
  },

  /**
   * Accept a suggestion (update status to accepted)
   */
  acceptSuggestion: async (id: string): Promise<BeatSceneMapping> => {
    return apiFetch<BeatSceneMapping>({
      url: `${BEAT_SCENE_MAPPINGS_URL}/${id}`,
      method: 'PUT',
      body: { status: 'accepted' },
    });
  },

  /**
   * Reject a suggestion (update status to rejected)
   */
  rejectSuggestion: async (
    id: string,
    feedback?: string
  ): Promise<BeatSceneMapping> => {
    return apiFetch<BeatSceneMapping>({
      url: `${BEAT_SCENE_MAPPINGS_URL}/${id}`,
      method: 'PUT',
      body: { status: 'rejected', user_feedback: feedback },
    });
  },
};
