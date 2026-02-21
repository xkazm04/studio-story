import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../utils/api';

export interface BeatSuggestion {
  name: string;
  description: string;
  reasoning: string;
}

export interface BeatSuggestionsContext {
  partialName?: string;
  projectTitle?: string;
  projectDescription?: string;
  actName?: string;
  actDescription?: string;
  beatType?: 'story' | 'act';
  existingBeats?: Array<{ name: string; description?: string }>;
  characters?: string[];
  precedingBeats?: Array<{ name: string; description?: string }>;
}

interface UseBeatNameSuggestionsOptions {
  debounceMs?: number;
  minChars?: number;
  enabled?: boolean;
}

export const useBeatNameSuggestions = (
  context: BeatSuggestionsContext,
  options: UseBeatNameSuggestionsOptions = {}
) => {
  const {
    debounceMs = 500,
    minChars = 2,
    enabled = true,
  } = options;

  const [suggestions, setSuggestions] = useState<BeatSuggestion[]>([]);
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
          suggestions: BeatSuggestion[];
          success: boolean;
        }>({
          url: '/api/beat-suggestions',
          method: 'POST',
          body: context,
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
          console.error('Error fetching beat suggestions:', err);
        }
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [context, enabled, minChars]
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
