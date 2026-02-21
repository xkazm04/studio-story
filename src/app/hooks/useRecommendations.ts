'use client';

/**
 * useRecommendations Hook
 *
 * Provides easy access to the recommendation system for React components.
 * Handles context tracking, recommendation generation, and feedback.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { recommendationEngine } from '@/lib/recommendations/RecommendationEngine';
import { contextTracker } from '@/lib/recommendations/ContextTracker';
import { feedbackCollector } from '@/lib/recommendations/FeedbackCollector';
import { suggestionTrigger, TriggerEvent } from '@/lib/recommendations/SuggestionTrigger';
import { registerAllProviders } from '@/lib/recommendations/providers';
import type {
  Recommendation,
  RecommendationContext,
  RecommendationType,
  FeatureArea,
  FeedbackAction,
} from '@/lib/recommendations/types';

// ============================================================================
// Types
// ============================================================================

export interface UseRecommendationsOptions {
  projectId?: string;
  featureArea?: FeatureArea;
  autoGenerate?: boolean;
  maxRecommendations?: number;
  enabledTypes?: RecommendationType[];
  onTrigger?: (event: TriggerEvent) => void;
}

export interface UseRecommendationsReturn {
  recommendations: Recommendation[];
  isLoading: boolean;
  error: Error | null;

  // Actions
  refresh: () => Promise<void>;
  accept: (recommendation: Recommendation) => void;
  dismiss: (recommendation: Recommendation) => void;
  expand: (recommendation: Recommendation) => void;

  // Context tracking
  trackFocus: (entityId: string, entityType: string, entityName: string) => void;
  trackBlur: () => void;

  // Stats
  stats: {
    acceptRate: number;
    totalShown: number;
    isReady: boolean;
  };
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useRecommendations(
  options: UseRecommendationsOptions = {}
): UseRecommendationsReturn {
  const {
    projectId,
    featureArea,
    autoGenerate = true,
    maxRecommendations = 5,
    enabledTypes,
    onTrigger,
  } = options;

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isReady, setIsReady] = useState(false);

  const mountedRef = useRef(true);
  const showTimestampsRef = useRef<Map<string, number>>(new Map());

  // Initialize the system
  useEffect(() => {
    registerAllProviders();
    setIsReady(recommendationEngine.isReady());

    // Start trigger monitoring
    suggestionTrigger.start();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Set project context
  useEffect(() => {
    if (projectId) {
      contextTracker.setProject(projectId);
    }
  }, [projectId]);

  // Set feature area context
  useEffect(() => {
    if (featureArea) {
      contextTracker.setFeatureArea(featureArea);
    }
  }, [featureArea]);

  // Subscribe to recommendation events
  useEffect(() => {
    const unsubscribe = recommendationEngine.subscribe(event => {
      if (!mountedRef.current) return;

      if (event.type === 'recommendations:generated' && event.recommendations) {
        let recs = event.recommendations;

        // Filter by enabled types if specified
        if (enabledTypes && enabledTypes.length > 0) {
          recs = recs.filter(r => enabledTypes.includes(r.type));
        }

        // Limit
        recs = recs.slice(0, maxRecommendations);

        setRecommendations(recs);
        setIsLoading(false);

        // Record 'shown' feedback for each
        recs.forEach(rec => {
          if (!showTimestampsRef.current.has(rec.id)) {
            showTimestampsRef.current.set(rec.id, Date.now());
            feedbackCollector.recordFeedback(
              {
                recommendationId: rec.id,
                action: 'shown',
                timestamp: Date.now(),
                context: event.context!,
              },
              rec.type,
              rec.source
            );
          }
        });
      }

      if (event.type === 'error' && event.error) {
        setError(event.error);
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, [enabledTypes, maxRecommendations]);

  // Subscribe to trigger events
  useEffect(() => {
    if (!autoGenerate) return;

    const unsubscribe = suggestionTrigger.subscribe(event => {
      if (!mountedRef.current) return;

      // Notify callback if provided
      onTrigger?.(event);

      // Auto-refresh on trigger
      if (event.priority !== 'low') {
        refresh();
      }
    });

    return unsubscribe;
  }, [autoGenerate, onTrigger]);

  // Auto-generate on context change
  useEffect(() => {
    if (!autoGenerate || !isReady) return;

    const unsubscribe = contextTracker.subscribe(context => {
      if (context.featureArea && context.projectId) {
        setIsLoading(true);
        recommendationEngine.generateRecommendations(context, {
          limit: maxRecommendations,
          includeTypes: enabledTypes,
        });
      }
    });

    return unsubscribe;
  }, [autoGenerate, isReady, maxRecommendations, enabledTypes]);

  // ============================================================================
  // Actions
  // ============================================================================

  const refresh = useCallback(async () => {
    const context = contextTracker.getContext();
    if (!context) return;

    setIsLoading(true);
    setError(null);

    try {
      await recommendationEngine.generateRecommendations(context, {
        limit: maxRecommendations,
        includeTypes: enabledTypes,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setIsLoading(false);
    }
  }, [maxRecommendations, enabledTypes]);

  const recordFeedback = useCallback((
    recommendation: Recommendation,
    action: FeedbackAction
  ) => {
    const context = contextTracker.getContext();
    if (!context) return;

    const showTime = showTimestampsRef.current.get(recommendation.id);
    const timeToAction = showTime ? Date.now() - showTime : undefined;

    feedbackCollector.recordFeedback(
      {
        recommendationId: recommendation.id,
        action,
        timestamp: Date.now(),
        context,
        timeToAction,
      },
      recommendation.type,
      recommendation.source
    );

    recommendationEngine.recordFeedback({
      recommendationId: recommendation.id,
      action,
      timestamp: Date.now(),
      context,
      timeToAction,
    });
  }, []);

  const accept = useCallback((recommendation: Recommendation) => {
    recordFeedback(recommendation, 'accepted');

    // Remove from list
    setRecommendations(prev => prev.filter(r => r.id !== recommendation.id));
  }, [recordFeedback]);

  const dismiss = useCallback((recommendation: Recommendation) => {
    recordFeedback(recommendation, 'dismissed');

    // Remove from list
    setRecommendations(prev => prev.filter(r => r.id !== recommendation.id));
  }, [recordFeedback]);

  const expand = useCallback((recommendation: Recommendation) => {
    recordFeedback(recommendation, 'expanded');
  }, [recordFeedback]);

  // ============================================================================
  // Context Tracking
  // ============================================================================

  const trackFocus = useCallback((
    entityId: string,
    entityType: string,
    entityName: string
  ) => {
    contextTracker.trackFocus(entityId, entityType, entityName, 'view');
  }, []);

  const trackBlur = useCallback(() => {
    contextTracker.trackBlur();
  }, []);

  // ============================================================================
  // Stats
  // ============================================================================

  const prefs = feedbackCollector.getPreferences();
  const stats = {
    acceptRate: prefs.totalShown > 0 ? prefs.totalAccepted / prefs.totalShown : 0,
    totalShown: prefs.totalShown,
    isReady,
  };

  return {
    recommendations,
    isLoading,
    error,
    refresh,
    accept,
    dismiss,
    expand,
    trackFocus,
    trackBlur,
    stats,
  };
}

// ============================================================================
// Specialized Hooks
// ============================================================================

/**
 * Hook for scene editor recommendations
 */
export function useSceneRecommendations(
  projectId: string,
  sceneId?: string
): UseRecommendationsReturn {
  const result = useRecommendations({
    projectId,
    featureArea: 'scene-editor',
    enabledTypes: ['character', 'scene', 'asset', 'narrative', 'location'],
  });

  // Track scene focus
  useEffect(() => {
    if (sceneId) {
      contextTracker.trackFocus(sceneId, 'scene', 'Current Scene', 'edit');
    }
  }, [sceneId]);

  return result;
}

/**
 * Hook for character recommendations
 */
export function useCharacterRecommendations(
  projectId: string,
  characterId?: string
): UseRecommendationsReturn {
  const result = useRecommendations({
    projectId,
    featureArea: 'character-creator',
    enabledTypes: ['relationship', 'faction', 'connection', 'scene'],
  });

  // Track character focus
  useEffect(() => {
    if (characterId) {
      contextTracker.trackFocus(characterId, 'character', 'Current Character', 'edit');
    }
  }, [characterId]);

  return result;
}

/**
 * Hook for storyboard recommendations
 */
export function useStoryboardRecommendations(projectId: string): UseRecommendationsReturn {
  return useRecommendations({
    projectId,
    featureArea: 'storyboard',
    enabledTypes: ['asset', 'character', 'style'],
  });
}

/**
 * Hook for relationship map recommendations
 */
export function useRelationshipRecommendations(projectId: string): UseRecommendationsReturn {
  return useRecommendations({
    projectId,
    featureArea: 'relationship-map',
    enabledTypes: ['relationship', 'connection', 'character', 'faction'],
  });
}

export default useRecommendations;
