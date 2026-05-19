import { BeatPacingSuggestion } from '@/app/types/Beat';
import { apiFetch, useApiGet } from '@/app/utils/api';
import { BEAT_URLS } from '@/lib/beats/api';

export const beatPacingApi = {
  // Get all pacing suggestions for a project
  useGetProjectPacingSuggestions: (
    projectId: string | undefined,
    applied?: boolean,
    enabled: boolean = true
  ) => {
    let url = projectId ? `${BEAT_URLS.pacing}?projectId=${projectId}` : '';
    if (applied !== undefined && url) {
      url += `&applied=${applied}`;
    }
    return useApiGet<BeatPacingSuggestion[]>(url, enabled && !!projectId);
  },

  // Get pacing suggestions for a specific beat
  useGetBeatPacingSuggestions: (beatId: string | undefined, enabled: boolean = true) => {
    const url = beatId ? `${BEAT_URLS.pacing}?beatId=${beatId}` : '';
    return useApiGet<BeatPacingSuggestion[]>(url, enabled && !!beatId);
  },

  // Create a pacing suggestion
  createPacingSuggestion: async (data: {
    project_id: string;
    beat_id: string;
    suggestion_type: 'reorder' | 'adjust_duration' | 'merge' | 'split';
    suggested_order?: number;
    suggested_duration?: number;
    reasoning: string;
    confidence?: number;
  }) => {
    return apiFetch<BeatPacingSuggestion>({
      url: BEAT_URLS.pacing,
      method: 'POST',
      body: data,
    });
  },

  // Update pacing suggestion (apply/unapply)
  updatePacingSuggestion: async (id: string, applied: boolean) => {
    return apiFetch<BeatPacingSuggestion>({
      url: `${BEAT_URLS.pacing}?id=${id}`,
      method: 'PUT',
      body: { applied },
    });
  },

  // Delete a pacing suggestion
  deletePacingSuggestion: async (id: string) => {
    return apiFetch<void>({
      url: `${BEAT_URLS.pacing}?id=${id}`,
      method: 'DELETE',
    });
  },
};
