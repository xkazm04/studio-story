import { BeatDependency } from '@/app/types/Beat';
import { apiFetch, useApiGet, API_BASE_URL } from '@/app/utils/api';

const DEPENDENCIES_URL = `${API_BASE_URL}/beat-dependencies`;

export const beatDependenciesApi = {
  // Get all dependencies for a project
  useGetProjectDependencies: (projectId: string | undefined, enabled: boolean = true) => {
    const url = projectId ? `${DEPENDENCIES_URL}?projectId=${projectId}` : '';
    return useApiGet<BeatDependency[]>(url, enabled && !!projectId);
  },

  // Get dependencies for a specific beat
  useGetBeatDependencies: (beatId: string | undefined, enabled: boolean = true) => {
    const url = beatId ? `${DEPENDENCIES_URL}?beatId=${beatId}` : '';
    return useApiGet<BeatDependency[]>(url, enabled && !!beatId);
  },

  // Create a beat dependency
  createDependency: async (data: {
    source_beat_id: string;
    target_beat_id: string;
    dependency_type?: 'sequential' | 'parallel' | 'causal';
    strength?: 'required' | 'suggested' | 'optional';
  }) => {
    return apiFetch<BeatDependency>({
      url: DEPENDENCIES_URL,
      method: 'POST',
      body: data,
    });
  },

  // Delete a dependency
  deleteDependency: async (id: string) => {
    return apiFetch<void>({
      url: `${DEPENDENCIES_URL}?id=${id}`,
      method: 'DELETE',
    });
  },
};
