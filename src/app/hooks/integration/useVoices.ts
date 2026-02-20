import { Voice, VoiceConfig } from '../../types/Voice';
import { apiFetch, API_BASE_URL } from '../../utils/api';
import { mockVoices, mockVoiceConfigs } from '../../../../db/mockData';
import { createMockableQuery, createFilteredMockQueryFn, createSingleMockQueryFn } from './queryHelpers';

const VOICES_URL = `${API_BASE_URL}/voices`;

export const voiceApi = {
  // Get all voices for a project
  useVoicesByProject: (projectId: string, enabled: boolean = true) => {
    return createMockableQuery<Voice[]>(
      ['voices', 'project', projectId],
      () => createFilteredMockQueryFn(mockVoices as Voice[], v => v.project_id === projectId),
      `${VOICES_URL}?projectId=${projectId}`,
      enabled && !!projectId
    );
  },

  // Get a single voice by ID
  useVoice: (voiceId: string, enabled: boolean = true) => {
    return createMockableQuery<Voice>(
      ['voices', voiceId],
      () => createSingleMockQueryFn(mockVoices as Voice[], v => v.id === voiceId, 'Voice not found'),
      `${VOICES_URL}/${voiceId}`,
      enabled && !!voiceId
    );
  },

  // Get voice config by voice_id
  useVoiceConfig: (voiceId: string, enabled: boolean = true) => {
    return createMockableQuery<VoiceConfig>(
      ['voice-config', voiceId],
      () => createSingleMockQueryFn(
        mockVoiceConfigs as VoiceConfig[],
        vc => vc.voice_id === voiceId,
        'Voice config not found'
      ),
      `${VOICES_URL}/${voiceId}/config`,
      enabled && !!voiceId
    );
  },

  // Create voice
  createVoice: async (data: Partial<Voice>) => {
    return apiFetch<Voice>({
      url: VOICES_URL,
      method: 'POST',
      body: data,
    });
  },

  // Update voice
  updateVoice: async (id: string, data: Partial<Voice>) => {
    return apiFetch<Voice>({
      url: `${VOICES_URL}/${id}`,
      method: 'PUT',
      body: data,
    });
  },

  // Update voice config
  updateVoiceConfig: async (voiceId: string, config: Partial<VoiceConfig>) => {
    return apiFetch<VoiceConfig>({
      url: `${VOICES_URL}/${voiceId}/config`,
      method: 'PUT',
      body: config,
    });
  },

  // Delete voice
  deleteVoice: async (id: string) => {
    return apiFetch<void>({
      url: `${VOICES_URL}/${id}`,
      method: 'DELETE',
    });
  },
};
