/**
 * Voice hooks - re-export from integration layer
 *
 * These hooks now use the mockable query pattern to support both
 * mock data (NEXT_PUBLIC_USE_MOCK_DATA=true) and real Supabase data.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { voiceApi } from './integration/useVoices';
import type { Voice, VoiceConfig } from '../types/Voice';

// Re-export the API object
export { voiceApi };

// Re-export query hooks for backwards compatibility with direct hook imports
export const useVoicesByProject = voiceApi.useVoicesByProject;
export const useVoice = voiceApi.useVoice;
export const useVoiceConfig = voiceApi.useVoiceConfig;

// Mutation hooks for backwards compatibility
export const useCreateVoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (voice: Partial<Voice>) => {
      return voiceApi.createVoice(voice);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['voices', 'project', data.project_id] });
    },
  });
};

export const useUpdateVoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Voice> }) => {
      return voiceApi.updateVoice(id, updates);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['voices', 'project', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['voices', data.id] });
    },
  });
};

export const useDeleteVoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      await voiceApi.deleteVoice(id);
      return { id, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['voices', 'project', data.projectId] });
    },
  });
};

export const useUpdateVoiceConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: VoiceConfig) => {
      return voiceApi.updateVoiceConfig(config.voice_id, config);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['voice-config', data.voice_id] });
    },
  });
};
