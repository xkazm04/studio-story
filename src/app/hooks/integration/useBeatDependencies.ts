import { BeatDependency } from '@/app/types/Beat';
import { apiFetch, useApiGet } from '@/app/utils/api';
import { BEAT_URLS } from '@/lib/beats/api';

export const beatDependenciesApi = {
  // Get all dependencies for a project
  useGetProjectDependencies: (projectId: string | undefined, enabled: boolean = true) => {
    const url = projectId ? `${BEAT_URLS.dependencies}?projectId=${projectId}` : '';
    return useApiGet<BeatDependency[]>(url, enabled && !!projectId);
  },

  // Get dependencies for a specific beat
  useGetBeatDependencies: (beatId: string | undefined, enabled: boolean = true) => {
    const url = beatId ? `${BEAT_URLS.dependencies}?beatId=${beatId}` : '';
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
      url: BEAT_URLS.dependencies,
      method: 'POST',
      body: data,
    });
  },

  // Delete a dependency
  deleteDependency: async (id: string) => {
    return apiFetch<void>({
      url: `${BEAT_URLS.dependencies}?id=${id}`,
      method: 'DELETE',
    });
  },
};
