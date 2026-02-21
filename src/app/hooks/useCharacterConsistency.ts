/**
 * Character Consistency Hook
 * React Query hook for character consistency analysis
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CharacterConsistencyReport,
  ConsistencyCheckRequest,
  ConsistencyResolveRequest,
} from '@/app/types/CharacterConsistency';

/**
 * Analyze character consistency
 */
export function useAnalyzeConsistency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: ConsistencyCheckRequest) => {
      const response = await fetch('/api/character-consistency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze character consistency');
      }

      return response.json() as Promise<CharacterConsistencyReport>;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        ['character-consistency', variables.character_id],
        data
      );
    },
  });
}

/**
 * Get character consistency report (cached)
 */
export function useCharacterConsistency(characterId: string | null) {
  return useQuery({
    queryKey: ['character-consistency', characterId],
    queryFn: () => null as CharacterConsistencyReport | null,
    enabled: false, // Only populated via mutation
  });
}

/**
 * Resolve a consistency issue
 */
export function useResolveConsistencyIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: ConsistencyResolveRequest) => {
      const response = await fetch(`/api/character-consistency/${request.issue_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to resolve consistency issue');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character-consistency'] });
    },
  });
}
