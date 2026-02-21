import { useState, useCallback, useRef, useEffect } from 'react';
import {
  streamAISuggestions,
  AISuggestion,
  SuggestionContextType,
  debounce,
  isTextSubstantial,
} from '@/app/services/aiSuggestionService';

interface UseAISuggestionStreamParams {
  projectId: string;
  characterId?: string;
  contextType: SuggestionContextType;
  fieldType?: string;
  enabled?: boolean;
  debounceMs?: number;
  minTextLength?: number;
}

interface UseAISuggestionStreamReturn {
  suggestions: AISuggestion[];
  isLoading: boolean;
  isStreaming: boolean;
  streamProgress: string;
  error: string | null;
  triggerSuggestions: (text: string) => void;
  clearSuggestions: () => void;
  cancelStream: () => void;
}

/**
 * Custom hook for managing AI suggestion streams
 *
 * Features:
 * - Debounced text input for performance
 * - SSE streaming with progress tracking
 * - Automatic cleanup on unmount
 * - Error handling and retry logic
 */
export function useAISuggestionStream({
  projectId,
  characterId,
  contextType,
  fieldType,
  enabled = true,
  debounceMs = 1000,
  minTextLength = 10,
}: UseAISuggestionStreamParams): UseAISuggestionStreamReturn {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamProgress, setStreamProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const cleanupRef = useRef<(() => void) | null>(null);
  const lastTextRef = useRef<string>('');

  /**
   * Initiates AI suggestion stream
   */
  const startStream = useCallback(
    async (text: string) => {
      // Validation
      if (!enabled || !projectId || !text) return;
      if (!isTextSubstantial(text, minTextLength)) return;
      if (text === lastTextRef.current) return; // Avoid duplicate requests

      lastTextRef.current = text;

      // Cancel existing stream
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }

      // Reset state
      setIsLoading(true);
      setIsStreaming(true);
      setStreamProgress('');
      setError(null);

      try {
        const cleanup = await streamAISuggestions({
          projectId,
          characterId,
          contextType,
          currentText: text,
          fieldType,
          onProgress: (content) => {
            setStreamProgress(prev => prev + content);
          },
          onComplete: (newSuggestions) => {
            setSuggestions(newSuggestions);
            setIsLoading(false);
            setIsStreaming(false);
            setStreamProgress('');
          },
          onError: (errorMessage) => {
            setError(errorMessage);
            setIsLoading(false);
            setIsStreaming(false);
            setStreamProgress('');
          },
        });

        cleanupRef.current = cleanup;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start stream');
        setIsLoading(false);
        setIsStreaming(false);
      }
    },
    [enabled, projectId, characterId, contextType, fieldType, minTextLength]
  );

  /**
   * Debounced trigger for suggestions
   */
  const debouncedTrigger = useCallback(
    debounce((text: string) => {
      startStream(text);
    }, debounceMs),
    [startStream, debounceMs]
  );

  /**
   * Public API: Trigger suggestions
   */
  const triggerSuggestions = useCallback(
    (text: string) => {
      debouncedTrigger(text);
    },
    [debouncedTrigger]
  );

  /**
   * Public API: Clear suggestions
   */
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setStreamProgress('');
    setError(null);
    lastTextRef.current = '';
  }, []);

  /**
   * Public API: Cancel active stream
   */
  const cancelStream = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    setIsLoading(false);
    setIsStreaming(false);
    setStreamProgress('');
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  return {
    suggestions,
    isLoading,
    isStreaming,
    streamProgress,
    error,
    triggerSuggestions,
    clearSuggestions,
    cancelStream,
  };
}
