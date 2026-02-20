import { BeatPacingSuggestion } from '@/app/types/Beat';
import { apiFetch, useApiGet, API_BASE_URL } from '@/app/utils/api';

const PACING_URL = `${API_BASE_URL}/beat-pacing`;

export const beatPacingApi = {
  // Get all pacing suggestions for a project
  useGetProjectPacingSuggestions: (
    projectId: string | undefined,
    applied?: boolean,
    enabled: boolean = true
  ) => {
    let url = projectId ? `${PACING_URL}?projectId=${projectId}` : '';
    if (applied !== undefined && url) {
      url += `&applied=${applied}`;
    }
    return useApiGet<BeatPacingSuggestion[]>(url, enabled && !!projectId);
  },

  // Get pacing suggestions for a specific beat
  useGetBeatPacingSuggestions: (beatId: string | undefined, enabled: boolean = true) => {
    const url = beatId ? `${PACING_URL}?beatId=${beatId}` : '';
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
      url: PACING_URL,
      method: 'POST',
      body: data,
    });
  },

  // Update pacing suggestion (apply/unapply)
  updatePacingSuggestion: async (id: string, applied: boolean) => {
    return apiFetch<BeatPacingSuggestion>({
      url: `${PACING_URL}?id=${id}`,
      method: 'PUT',
      body: { applied },
    });
  },

  // Delete a pacing suggestion
  deletePacingSuggestion: async (id: string) => {
    return apiFetch<void>({
      url: `${PACING_URL}?id=${id}`,
      method: 'DELETE',
    });
  },
};
