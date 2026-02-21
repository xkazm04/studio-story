/**
 * Recommendation System
 *
 * Cross-feature AI recommendations that surface relevant characters,
 * scenes, assets, and story connections as users work.
 */

// Core engine
export { recommendationEngine, RecommendationEngineClass } from './RecommendationEngine';

// Context tracking
export { contextTracker, ContextTrackerClass } from './ContextTracker';

// Feedback & learning
export { feedbackCollector, FeedbackCollectorClass } from './FeedbackCollector';

// Proactive triggers
export {
  suggestionTrigger,
  SuggestionTriggerClass,
  type TriggerType,
  type TriggerEvent,
  type TriggerConfig,
} from './SuggestionTrigger';

// Providers
export {
  SceneEditorProvider,
  CharacterProvider,
  AssetProvider,
  RelationshipProvider,
  registerAllProviders,
} from './providers';

// Types
export type {
  Recommendation,
  RecommendationType,
  RecommendationSource,
  RecommendationPriority,
  RecommendationStatus,
  RecommendationContext,
  RecommendationProvider,
  RecommendationFeedback,
  RecommendationEvent,
  RecommendationEventType,
  RecommendationEventHandler,
  RecommendationEngineConfig,
  RecommendationAction,
  RelevanceFactor,
  FeatureArea,
  TaskType,
  RecentEntity,
  ProviderOptions,
  UserPreferences,
  PatternScore,
  ScoringWeights,
  EntityScore,
  ScoredRecommendation,
  FeedbackAction,
} from './types';
