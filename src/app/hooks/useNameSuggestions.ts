import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../utils/api';
import { EntityType, NameSuggestion } from '../types/NameSuggestion';

export interface NameSuggestionsContext {
  partialName?: string;
  projectTitle?: string;
  projectDescription?: string;
  genre?: string;
  [key: string]: any; // Allow additional context properties
}

interface UseNameSuggestionsOptions {
  debounceMs?: number;
  minChars?: number;
  enabled?: boolean;
}

/**
 * Unified hook for fetching name suggestions for any entity type
 *
 * @param entityType - The type of entity (character, scene, beat, faction, location)
 * @param context - Context information for generating relevant suggestions
 * @param options - Configuration options
 */
export const useNameSuggestions = (
  entityType: EntityType,
  context: NameSuggestionsContext,
  options: UseNameSuggestionsOptions = {}
) => {
  const {
    debounceMs = 500,
    minChars = 2,
    enabled = true,
  } = options;

  const [suggestions, setSuggestions] = useState<NameSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSuggestions = useCallback(
    async (signal: AbortSignal) => {
      if (!enabled) return;

      // Skip if partial name is too short
      if (context.partialName && context.partialName.trim().length < minChars) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiFetch<{
          suggestions: NameSuggestion[];
          success: boolean;
        }>({
          url: '/api/name-suggestions',
          method: 'POST',
          body: {
            entityType,
            partialName: context.partialName,
            context,
          },
          signal,
        });

        if (!signal.aborted) {
          if (response.success && response.suggestions) {
            setSuggestions(response.suggestions);
          } else {
            setSuggestions([]);
          }
        }
      } catch (err) {
        if (!signal.aborted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch suggestions';
          setError(errorMessage);
          setSuggestions([]);
          console.error('Error fetching name suggestions:', err);
        }
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [entityType, context, enabled, minChars]
  );

  useEffect(() => {
    if (!enabled) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Debounce the API call
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(abortController.signal);
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      abortController.abort();
    };
  }, [fetchSuggestions, debounceMs, enabled]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  const refetch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    fetchSuggestions(abortController.signal);
  }, [fetchSuggestions]);

  return {
    suggestions,
    isLoading,
    error,
    clearSuggestions,
    refetch,
  };
};
