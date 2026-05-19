/**
 * useGenerationMachine — Scene illustration wrapper
 *
 * Thin wrapper around the generic useGenerativeSelection hook,
 * pre-configured with the scene illustration API endpoints.
 *
 * Usage:
 *   const gen = useGenerationMachine({ sceneId });
 *   gen.start('a prompt');   // idle → generating → polling → gallery
 *   gen.select(imageId);     // gallery: pick an image
 *   gen.confirm();           // gallery → confirming → idle
 *   gen.retry();             // error → idle
 *   gen.reset();             // any → idle
 */

import { useQueryClient } from '@tanstack/react-query';
import {
  useGenerativeSelection,
  type GenerativeSelectionAPI,
  type GenerativeState,
} from '@/app/hooks/useGenerativeSelection';
import { extractData } from '@/app/utils/api';
import type { GeneratedImageEntry } from './generationMachine';

// Re-export for backward compat
export type { GeneratedImageEntry };

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface UseGenerationMachineOptions {
  /** Scene ID for the illustration flow (POST/GET/PUT /api/scenes/:id/illustrate) */
  sceneId?: string;
  /** Called after CONFIRM_SUCCESS so the consumer can invalidate caches */
  onConfirmSuccess?: () => void;
}

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export type GenerationMachineAPI = GenerativeSelectionAPI<GeneratedImageEntry>;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGenerationMachine(
  options: UseGenerationMachineOptions = {},
): GenerationMachineAPI {
  const { sceneId, onConfirmSuccess } = options;
  const queryClient = useQueryClient();

  return useGenerativeSelection<GeneratedImageEntry>({
    queryKey: `scene-illustration-${sceneId}`,

    startGeneration: async (prompt: string) => {
      if (!sceneId) throw new Error('No scene selected');

      const body: Record<string, unknown> = {};
      if (prompt.trim()) body.promptOverride = prompt;

      const response = await fetch(`/api/scenes/${sceneId}/illustrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = extractData<any>(await response.json());

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to start illustration');
      }

      return { generationId: data.generationId };
    },

    pollGeneration: async (generationId: string) => {
      const response = await fetch(
        `/api/scenes/${sceneId}/illustrate?generationId=${generationId}`,
      );
      const data = extractData<any>(await response.json());

      let status: 'pending' | 'complete' | 'failed' = 'pending';
      if (data.status === 'complete') status = 'complete';
      else if (data.status === 'failed') status = 'failed';

      return { status, items: data.images, error: data.error };
    },

    persistSelection: async (selected, { generationId }) => {
      const response = await fetch(`/api/scenes/${sceneId}/illustrate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: selected.url,
          generationId,
        }),
      });

      const data = extractData<any>(await response.json());

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save illustration');
      }
    },

    onPersisted: () => {
      queryClient.invalidateQueries({ queryKey: ['scene', sceneId] });
      queryClient.invalidateQueries({ queryKey: ['scenes'] });
      onConfirmSuccess?.();
    },
  });
}
