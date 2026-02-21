/**
 * RecommendationEngine
 *
 * Core engine for generating cross-feature AI recommendations.
 * Manages providers, scoring, deduplication, and feedback learning.
 */

import {
  Recommendation,
  RecommendationContext,
  RecommendationProvider,
  RecommendationEngineConfig,
  RecommendationFeedback,
  RecommendationEvent,
  RecommendationEventHandler,
  RecommendationType,
  RecommendationSource,
  ScoringWeights,
  UserPreferences,
  ScoredRecommendation,
  ProviderOptions,
  RelevanceFactor,
} from './types';

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: RecommendationEngineConfig = {
  debounceMs: 500,
  maxAgeMs: 5 * 60 * 1000,      // 5 minutes
  cooldownMs: 60 * 1000,         // 1 minute
  maxRecommendations: 5,
  maxPerType: 3,
  minScore: 0.3,
  weights: {
    recency: 0.15,
    relevance: 0.35,
    usage: 0.15,
    pattern: 0.15,
    preference: 0.10,
    confidence: 0.10,
  },
  enableLearning: true,
  enableProactive: true,
  enableCrossFeatured: true,
};

const DEFAULT_PREFERENCES: UserPreferences = {
  userId: 'default',
  typePreferences: {},
  sourcePreferences: {},
  acceptedPatterns: [],
  dismissedPatterns: [],
  enabledTypes: [
    'character', 'scene', 'asset', 'relationship',
    'beat', 'faction', 'location', 'connection', 'style', 'narrative'
  ],
  maxSuggestionsPerSession: 50,
  cooldownBetweenSuggestions: 30000,
  totalShown: 0,
  totalAccepted: 0,
  totalDismissed: 0,
  lastUpdated: Date.now(),
};

// ============================================================================
// RecommendationEngine Class
// ============================================================================

class RecommendationEngineClass {
  private static instance: RecommendationEngineClass;

  private config: RecommendationEngineConfig;
  private providers: Map<string, RecommendationProvider> = new Map();
  private recommendations: Map<string, Recommendation> = new Map();
  private recentRecommendations: Map<string, number> = new Map(); // entityId -> lastShownTime
  private feedback: RecommendationFeedback[] = [];
  private preferences: UserPreferences = DEFAULT_PREFERENCES;
  private eventHandlers: Set<RecommendationEventHandler> = new Set();

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private currentContext: RecommendationContext | null = null;
  private isGenerating: boolean = false;

  private constructor(config: Partial<RecommendationEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(config?: Partial<RecommendationEngineConfig>): RecommendationEngineClass {
    if (!RecommendationEngineClass.instance) {
      RecommendationEngineClass.instance = new RecommendationEngineClass(config);
    }
    return RecommendationEngineClass.instance;
  }

  // ============================================================================
  // Provider Management
  // ============================================================================

  registerProvider(provider: RecommendationProvider): void {
    this.providers.set(provider.id, provider);
  }

  unregisterProvider(providerId: string): void {
    this.providers.delete(providerId);
  }

  getProviders(): RecommendationProvider[] {
    return Array.from(this.providers.values())
      .sort((a, b) => b.priority - a.priority);
  }

  // ============================================================================
  // Event Handling
  // ============================================================================

  subscribe(handler: RecommendationEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  private emit(event: RecommendationEvent): void {
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Recommendation event handler error:', error);
      }
    });
  }

  // ============================================================================
  // Context Management
  // ============================================================================

  updateContext(context: RecommendationContext): void {
    const contextChanged = this.hasContextChanged(context);
    this.currentContext = context;

    if (contextChanged) {
      this.emit({
        type: 'context:changed',
        context,
        timestamp: Date.now(),
      });

      // Debounce recommendation generation
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = setTimeout(() => {
        this.generateRecommendations(context);
      }, this.config.debounceMs);
    }
  }

  private hasContextChanged(newContext: RecommendationContext): boolean {
    if (!this.currentContext) return true;

    return (
      this.currentContext.featureArea !== newContext.featureArea ||
      this.currentContext.currentEntityId !== newContext.currentEntityId ||
      this.currentContext.sceneId !== newContext.sceneId ||
      this.currentContext.characterId !== newContext.characterId
    );
  }

  getCurrentContext(): RecommendationContext | null {
    return this.currentContext;
  }

  // ============================================================================
  // Recommendation Generation
  // ============================================================================

  async generateRecommendations(
    context: RecommendationContext,
    options?: ProviderOptions
  ): Promise<Recommendation[]> {
    if (this.isGenerating) {
      return this.getActiveRecommendations();
    }

    this.isGenerating = true;

    try {
      // Get applicable providers
      const applicableProviders = this.getProviders()
        .filter(p => p.isApplicable(context));

      if (applicableProviders.length === 0) {
        return [];
      }

      // Collect recommendations from all providers
      const allRecommendations: Recommendation[] = [];

      await Promise.all(
        applicableProviders.map(async provider => {
          try {
            const recs = await provider.generate(context, {
              ...options,
              excludeIds: Array.from(this.recentRecommendations.keys()),
            });
            allRecommendations.push(...recs);
          } catch (error) {
            console.error(`Provider ${provider.id} error:`, error);
          }
        })
      );

      // Score and filter recommendations
      const scored = this.scoreRecommendations(allRecommendations, context);
      const filtered = this.filterRecommendations(scored);
      const final = this.deduplicateRecommendations(filtered);

      // Update cache
      this.recommendations.clear();
      final.forEach(rec => this.recommendations.set(rec.id, rec));

      // Emit event
      this.emit({
        type: 'recommendations:generated',
        recommendations: final,
        context,
        timestamp: Date.now(),
      });

      return final;
    } catch (error) {
      this.emit({
        type: 'error',
        error: error instanceof Error ? error : new Error('Unknown error'),
        timestamp: Date.now(),
      });
      return [];
    } finally {
      this.isGenerating = false;
    }
  }

  // ============================================================================
  // Scoring System
  // ============================================================================

  private scoreRecommendations(
    recommendations: Recommendation[],
    context: RecommendationContext
  ): ScoredRecommendation[] {
    return recommendations.map(rec => {
      const rawScore = this.calculateRawScore(rec, context);
      const boost = this.calculateBoost(rec, context);
      const penalty = this.calculatePenalty(rec);
      const normalizedScore = Math.max(0, Math.min(1, (rawScore + boost - penalty)));

      return {
        ...rec,
        rawScore,
        normalizedScore,
        boost,
        penalty,
        score: normalizedScore,
      };
    });
  }

  private calculateRawScore(rec: Recommendation, context: RecommendationContext): number {
    const { weights } = this.config;
    let score = 0;

    // Relevance (from provider)
    score += rec.score * weights.relevance;

    // Confidence (from provider)
    score += rec.confidence * weights.confidence;

    // Recency of related entities
    const recency = this.calculateRecencyScore(rec, context);
    score += recency * weights.recency;

    // Usage patterns
    const usage = this.calculateUsageScore(rec);
    score += usage * weights.usage;

    // Pattern matching
    const pattern = this.calculatePatternScore(rec);
    score += pattern * weights.pattern;

    // User preferences
    const preference = this.calculatePreferenceScore(rec);
    score += preference * weights.preference;

    return score;
  }

  private calculateRecencyScore(rec: Recommendation, context: RecommendationContext): number {
    // Check if entity was recently accessed
    const recent = context.recentEntities.find(e => e.id === rec.entityId);
    if (!recent) return 0.5;

    const age = Date.now() - recent.accessedAt;
    const maxAge = 30 * 60 * 1000; // 30 minutes

    // Recent access should boost score, but very recent might not need recommendation
    if (age < 60000) return 0.3; // Just accessed - lower priority
    if (age < maxAge) return 0.9 - (age / maxAge) * 0.4;
    return 0.5;
  }

  private calculateUsageScore(rec: Recommendation): number {
    // Could be enhanced with actual usage tracking
    // For now, return moderate score
    return 0.5;
  }

  private calculatePatternScore(rec: Recommendation): number {
    // Check if recommendation matches learned patterns
    const patternKey = `${rec.type}:${rec.source}`;

    const acceptedPattern = this.preferences.acceptedPatterns.find(
      p => p.pattern === patternKey
    );
    if (acceptedPattern) {
      return Math.min(1, 0.5 + acceptedPattern.score * 0.5);
    }

    const dismissedPattern = this.preferences.dismissedPatterns.find(
      p => p.pattern === patternKey
    );
    if (dismissedPattern) {
      return Math.max(0, 0.5 - dismissedPattern.score * 0.5);
    }

    return 0.5;
  }

  private calculatePreferenceScore(rec: Recommendation): number {
    const typePreference = this.preferences.typePreferences[rec.type] ?? 0;
    const sourcePreference = this.preferences.sourcePreferences[rec.source] ?? 0;

    return 0.5 + (typePreference + sourcePreference) / 4;
  }

  private calculateBoost(rec: Recommendation, context: RecommendationContext): number {
    let boost = 0;

    // Boost high priority recommendations
    if (rec.priority === 'high') boost += 0.1;

    // Boost gap recommendations (underused elements)
    if (rec.source === 'gap') boost += 0.05;

    // Boost cross-feature recommendations if enabled
    if (this.config.enableCrossFeatured && this.isCrossFeature(rec, context)) {
      boost += 0.05;
    }

    return boost;
  }

  private calculatePenalty(rec: Recommendation): number {
    let penalty = 0;

    // Penalize recently shown recommendations
    const lastShown = this.recentRecommendations.get(rec.entityId);
    if (lastShown) {
      const timeSince = Date.now() - lastShown;
      if (timeSince < this.config.cooldownMs) {
        penalty += 0.3;
      }
    }

    // Penalize low confidence
    if (rec.confidence < 0.3) penalty += 0.1;

    return penalty;
  }

  private isCrossFeature(rec: Recommendation, context: RecommendationContext): boolean {
    // Check if recommendation comes from a different feature area
    const recFeature = this.getFeatureForType(rec.type);
    return recFeature !== context.featureArea;
  }

  private getFeatureForType(type: RecommendationType): string {
    const mapping: Record<RecommendationType, string> = {
      character: 'character-creator',
      scene: 'scene-editor',
      asset: 'asset-manager',
      relationship: 'relationship-map',
      beat: 'beat-overview',
      faction: 'faction-manager',
      location: 'scene-editor',
      connection: 'relationship-map',
      style: 'asset-manager',
      narrative: 'scene-editor',
    };
    return mapping[type] || 'unknown';
  }

  // ============================================================================
  // Filtering & Deduplication
  // ============================================================================

  private filterRecommendations(recommendations: ScoredRecommendation[]): ScoredRecommendation[] {
    // Filter by minimum score
    let filtered = recommendations.filter(r => r.score >= this.config.minScore);

    // Filter by enabled types
    filtered = filtered.filter(r => this.preferences.enabledTypes.includes(r.type));

    // Sort by score
    filtered.sort((a, b) => b.score - a.score);

    // Limit per type
    const byType = new Map<RecommendationType, number>();
    filtered = filtered.filter(r => {
      const count = byType.get(r.type) ?? 0;
      if (count >= this.config.maxPerType) return false;
      byType.set(r.type, count + 1);
      return true;
    });

    // Overall limit
    return filtered.slice(0, this.config.maxRecommendations);
  }

  private deduplicateRecommendations(recommendations: ScoredRecommendation[]): Recommendation[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      const key = `${rec.entityType}:${rec.entityId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // ============================================================================
  // Feedback & Learning
  // ============================================================================

  recordFeedback(feedback: RecommendationFeedback): void {
    this.feedback.push(feedback);

    // Update recent recommendations
    const rec = this.recommendations.get(feedback.recommendationId);
    if (rec) {
      if (feedback.action === 'shown') {
        this.recentRecommendations.set(rec.entityId, feedback.timestamp);
      }

      // Update recommendation status
      rec.status = feedback.action === 'accepted' ? 'accepted' :
                   feedback.action === 'dismissed' ? 'dismissed' :
                   feedback.action === 'shown' ? 'shown' : rec.status;
    }

    // Learn from feedback if enabled
    if (this.config.enableLearning) {
      this.learnFromFeedback(feedback);
    }

    // Emit event
    const eventType = feedback.action === 'accepted' ? 'recommendation:accepted' :
                      feedback.action === 'dismissed' ? 'recommendation:dismissed' :
                      'recommendation:shown';

    this.emit({
      type: eventType,
      recommendation: rec,
      feedback,
      timestamp: Date.now(),
    });

    // Update preferences stats
    this.preferences.totalShown++;
    if (feedback.action === 'accepted') this.preferences.totalAccepted++;
    if (feedback.action === 'dismissed') this.preferences.totalDismissed++;
    this.preferences.lastUpdated = Date.now();
  }

  private learnFromFeedback(feedback: RecommendationFeedback): void {
    const rec = this.recommendations.get(feedback.recommendationId);
    if (!rec) return;

    const patternKey = `${rec.type}:${rec.source}`;
    const delta = feedback.action === 'accepted' ? 0.1 :
                  feedback.action === 'dismissed' ? -0.1 : 0;

    if (delta === 0) return;

    // Update type preferences
    const currentTypePref = this.preferences.typePreferences[rec.type] ?? 0;
    this.preferences.typePreferences[rec.type] = Math.max(-1, Math.min(1, currentTypePref + delta));

    // Update source preferences
    const currentSourcePref = this.preferences.sourcePreferences[rec.source] ?? 0;
    this.preferences.sourcePreferences[rec.source] = Math.max(-1, Math.min(1, currentSourcePref + delta));

    // Update pattern scores
    if (feedback.action === 'accepted') {
      this.updatePatternScore(this.preferences.acceptedPatterns, patternKey, 0.1);
    } else if (feedback.action === 'dismissed') {
      this.updatePatternScore(this.preferences.dismissedPatterns, patternKey, 0.1);
    }
  }

  private updatePatternScore(patterns: Array<{ pattern: string; score: number; count: number }>, key: string, delta: number): void {
    const existing = patterns.find(p => p.pattern === key);
    if (existing) {
      existing.score = Math.min(1, existing.score + delta * (1 / (existing.count + 1)));
      existing.count++;
    } else {
      patterns.push({ pattern: key, score: delta, count: 1 });
    }
  }

  // ============================================================================
  // Accessors
  // ============================================================================

  getActiveRecommendations(): Recommendation[] {
    const now = Date.now();
    return Array.from(this.recommendations.values())
      .filter(rec => {
        if (rec.status === 'accepted' || rec.status === 'dismissed') return false;
        if (rec.expiresAt && rec.expiresAt < now) return false;
        return true;
      })
      .sort((a, b) => b.score - a.score);
  }

  getRecommendation(id: string): Recommendation | undefined {
    return this.recommendations.get(id);
  }

  getRecommendationsByType(type: RecommendationType): Recommendation[] {
    return this.getActiveRecommendations().filter(r => r.type === type);
  }

  getPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  updatePreferences(updates: Partial<UserPreferences>): void {
    this.preferences = { ...this.preferences, ...updates, lastUpdated: Date.now() };
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  clearRecommendations(): void {
    this.recommendations.clear();
    this.recentRecommendations.clear();
  }

  clearFeedback(): void {
    this.feedback = [];
  }

  updateConfig(config: Partial<RecommendationEngineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): RecommendationEngineConfig {
    return { ...this.config };
  }

  isReady(): boolean {
    return this.providers.size > 0;
  }

  getStats(): {
    providersCount: number;
    activeRecommendations: number;
    totalFeedback: number;
    acceptRate: number;
  } {
    const total = this.preferences.totalShown;
    const accepted = this.preferences.totalAccepted;

    return {
      providersCount: this.providers.size,
      activeRecommendations: this.getActiveRecommendations().length,
      totalFeedback: this.feedback.length,
      acceptRate: total > 0 ? accepted / total : 0,
    };
  }
}

// Export singleton instance
export const recommendationEngine = RecommendationEngineClass.getInstance();

// Export class for testing
export { RecommendationEngineClass };

export default recommendationEngine;
