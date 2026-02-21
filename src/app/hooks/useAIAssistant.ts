import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AIAssistantRequest,
  AIAssistantResponse,
  AISuggestion,
  AIAssistantSettings,
  SuggestionType,
} from '@/app/types/AIAssistant';
import { defaultAssistantSettings } from '@/app/types/AIAssistant';

interface UseAIAssistantOptions {
  projectId?: string;
  autoSuggest?: boolean;
}

export const useAIAssistant = (options: UseAIAssistantOptions = {}) => {
  const { projectId, autoSuggest = false } = options;
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState<AIAssistantSettings>({
    ...defaultAssistantSettings,
    auto_suggest: autoSuggest,
  });

  const [activeSuggestions, setActiveSuggestions] = useState<AISuggestion[]>([]);

  // Health check query
  const healthQuery = useQuery({
    queryKey: ['ai-assistant', 'health'],
    queryFn: async () => {
      const response = await fetch('/api/narrative-assistant');
      if (!response.ok) throw new Error('Health check failed');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Generate suggestions mutation
  const generateSuggestionsMutation = useMutation({
    mutationFn: async (request: AIAssistantRequest) => {
      const response = await fetch('/api/narrative-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate suggestions');
      }

      return response.json() as Promise<AIAssistantResponse>;
    },
    onSuccess: (data) => {
      setActiveSuggestions(data.suggestions);
      queryClient.invalidateQueries({ queryKey: ['ai-assistant', 'suggestions'] });
    },
    onError: (error) => {
      console.error('Error generating suggestions:', error);
    },
  });

  // Generate suggestions function
  const generateSuggestions = useCallback(
    async (
      contextType: 'act' | 'beat' | 'character' | 'scene' | 'general',
      contextId?: string,
      suggestionTypes?: SuggestionType[]
    ) => {
      if (!projectId) {
        console.warn('No project ID provided for AI assistant');
        return;
      }

      if (!settings.enabled) {
        console.warn('AI assistant is disabled');
        return;
      }

      const request: AIAssistantRequest = {
        project_id: projectId,
        context_type: contextType,
        context_id: contextId,
        suggestion_types: suggestionTypes || settings.suggestion_types,
        genre: settings.genre_filter,
        depth: settings.depth,
        max_suggestions: settings.max_suggestions,
      };

      return generateSuggestionsMutation.mutateAsync(request);
    },
    [projectId, settings, generateSuggestionsMutation]
  );

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setActiveSuggestions([]);
  }, []);

  // Add suggestion manually
  const addSuggestion = useCallback((suggestion: AISuggestion) => {
    setActiveSuggestions((prev) => [...prev, suggestion]);
  }, []);

  // Remove suggestion
  const removeSuggestion = useCallback((suggestionId: string) => {
    setActiveSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<AIAssistantSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Toggle enabled state
  const toggleEnabled = useCallback(() => {
    setSettings((prev) => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  // Copy suggestion to clipboard
  const copySuggestion = useCallback(async (suggestion: AISuggestion) => {
    try {
      await navigator.clipboard.writeText(suggestion.content);
      return true;
    } catch (error) {
      console.error('Failed to copy suggestion:', error);
      return false;
    }
  }, []);

  return {
    // State
    settings,
    activeSuggestions,
    isEnabled: settings.enabled,
    isHealthy: healthQuery.isSuccess,

    // Status
    isGenerating: generateSuggestionsMutation.isPending,
    isError: generateSuggestionsMutation.isError || healthQuery.isError,
    error: generateSuggestionsMutation.error || healthQuery.error,

    // Actions
    generateSuggestions,
    clearSuggestions,
    addSuggestion,
    removeSuggestion,
    updateSettings,
    toggleEnabled,
    copySuggestion,

    // Query info
    healthCheck: healthQuery.data,
  };
};

// Export standalone functions for use without hook
export const checkAIAssistantHealth = async () => {
  const response = await fetch('/api/narrative-assistant');
  if (!response.ok) throw new Error('AI Assistant is not available');
  return response.json();
};

export const generateNarrativeSuggestions = async (request: AIAssistantRequest) => {
  const response = await fetch('/api/narrative-assistant', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate suggestions');
  }

  return response.json() as Promise<AIAssistantResponse>;
};
