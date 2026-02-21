/**
 * Recommendation System Types
 *
 * Defines all types for the cross-feature recommendation engine
 */

// ============================================================================
// Core Recommendation Types
// ============================================================================

export type RecommendationType =
  | 'character'
  | 'scene'
  | 'asset'
  | 'relationship'
  | 'beat'
  | 'faction'
  | 'location'
  | 'connection'
  | 'style'
  | 'narrative';

export type RecommendationSource =
  | 'context'      // Based on current context
  | 'pattern'      // Based on usage patterns
  | 'similarity'   // Based on content similarity
  | 'gap'          // Missing/underused elements
  | 'learning'     // From learned preferences
  | 'ai';          // AI-generated suggestion

export type RecommendationPriority = 'high' | 'medium' | 'low';

export type RecommendationStatus = 'pending' | 'shown' | 'accepted' | 'dismissed' | 'expired';

export interface Recommendation {
  id: string;
  type: RecommendationType;
  source: RecommendationSource;
  priority: RecommendationPriority;
  status: RecommendationStatus;

  // Display info
  title: string;
  description: string;
  reason: string;

  // Relevance
  score: number;              // 0-1, combined relevance score
  confidence: number;         // 0-1, how confident we are
  relevanceFactors: RelevanceFactor[];

  // Entity reference
  entityId: string;
  entityType: string;
  entityName: string;
  entityPreview?: string;     // Brief preview text or image URL

  // Context
  targetContext: RecommendationContext;
  createdAt: number;
  expiresAt?: number;

  // Action
  action?: RecommendationAction;

  // Metadata
  metadata?: Record<string, unknown>;
}

export interface RelevanceFactor {
  name: string;
  weight: number;
  score: number;
  explanation?: string;
}

export interface RecommendationAction {
  type: 'navigate' | 'insert' | 'create' | 'link' | 'apply';
  label: string;
  payload: Record<string, unknown>;
}

// ============================================================================
// Context Types
// ============================================================================

export interface RecommendationContext {
  // Current focus
  projectId: string;
  featureArea: FeatureArea;
  currentEntityId?: string;
  currentEntityType?: string;

  // Session context
  recentEntities: RecentEntity[];
  currentTask?: TaskType;

  // Additional context
  sceneId?: string;
  characterId?: string;
  actId?: string;
  beatId?: string;

  // Timestamps
  lastActivity: number;
  sessionStart: number;
}

export type FeatureArea =
  | 'scene-editor'
  | 'character-creator'
  | 'character-list'
  | 'faction-manager'
  | 'relationship-map'
  | 'asset-manager'
  | 'storyboard'
  | 'beat-overview'
  | 'scene-graph'
  | 'ai-companion'
  | 'landing';

export type TaskType =
  | 'writing'
  | 'editing'
  | 'planning'
  | 'organizing'
  | 'generating'
  | 'reviewing'
  | 'exploring';

export interface RecentEntity {
  id: string;
  type: string;
  name: string;
  accessedAt: number;
  action: 'view' | 'edit' | 'create' | 'select';
}

// ============================================================================
// Provider Types
// ============================================================================

export interface RecommendationProvider {
  id: string;
  name: string;
  types: RecommendationType[];
  featureAreas: FeatureArea[];

  // Generate recommendations for given context
  generate: (context: RecommendationContext, options?: ProviderOptions) => Promise<Recommendation[]>;

  // Check if provider is applicable
  isApplicable: (context: RecommendationContext) => boolean;

  // Priority among providers (higher runs first)
  priority: number;
}

export interface ProviderOptions {
  limit?: number;
  minScore?: number;
  excludeIds?: string[];
  includeTypes?: RecommendationType[];
}

// ============================================================================
// Feedback & Learning Types
// ============================================================================

export interface RecommendationFeedback {
  recommendationId: string;
  action: FeedbackAction;
  timestamp: number;
  context: RecommendationContext;
  timeToAction?: number;      // ms from shown to action
}

export type FeedbackAction =
  | 'shown'
  | 'clicked'
  | 'accepted'
  | 'dismissed'
  | 'ignored'
  | 'expanded';

export interface UserPreferences {
  userId: string;
  projectId?: string;

  // Type preferences (positive scores = preferred)
  typePreferences: Partial<Record<RecommendationType, number>>;

  // Source preferences
  sourcePreferences: Partial<Record<RecommendationSource, number>>;

  // Learned patterns
  acceptedPatterns: PatternScore[];
  dismissedPatterns: PatternScore[];

  // Settings
  enabledTypes: RecommendationType[];
  maxSuggestionsPerSession: number;
  cooldownBetweenSuggestions: number;

  // Stats
  totalShown: number;
  totalAccepted: number;
  totalDismissed: number;
  lastUpdated: number;
}

export interface PatternScore {
  pattern: string;
  score: number;
  count: number;
}

// ============================================================================
// Engine Configuration
// ============================================================================

export interface RecommendationEngineConfig {
  // Timing
  debounceMs: number;              // Wait before generating (default: 500)
  maxAgeMs: number;                // Max age before expiring (default: 5 min)
  cooldownMs: number;              // Min time between same recommendation (default: 1 min)

  // Limits
  maxRecommendations: number;      // Max to show at once (default: 5)
  maxPerType: number;              // Max per type (default: 3)
  minScore: number;                // Minimum score to show (default: 0.3)

  // Scoring weights
  weights: ScoringWeights;

  // Feature flags
  enableLearning: boolean;
  enableProactive: boolean;
  enableCrossFeatured: boolean;
}

export interface ScoringWeights {
  recency: number;           // How recent the entity was used
  relevance: number;         // Content/context relevance
  usage: number;             // Usage frequency
  pattern: number;           // Pattern matching
  preference: number;        // User preference match
  confidence: number;        // Provider confidence
}

// ============================================================================
// Events
// ============================================================================

export interface RecommendationEvent {
  type: RecommendationEventType;
  recommendations?: Recommendation[];
  recommendation?: Recommendation;
  context?: RecommendationContext;
  feedback?: RecommendationFeedback;
  error?: Error;
  timestamp: number;
}

export type RecommendationEventType =
  | 'recommendations:generated'
  | 'recommendation:shown'
  | 'recommendation:accepted'
  | 'recommendation:dismissed'
  | 'recommendation:expired'
  | 'context:changed'
  | 'error';

export type RecommendationEventHandler = (event: RecommendationEvent) => void;

// ============================================================================
// Helper Types
// ============================================================================

export interface EntityScore {
  entityId: string;
  entityType: string;
  entityName: string;
  score: number;
  factors: RelevanceFactor[];
}

export interface ScoredRecommendation extends Recommendation {
  rawScore: number;
  normalizedScore: number;
  boost: number;
  penalty: number;
}
