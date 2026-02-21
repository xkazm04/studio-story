/**
 * FeedbackCollector
 *
 * Collects and processes recommendation feedback for learning.
 * Persists preferences to localStorage for cross-session learning.
 */

import type {
  RecommendationFeedback,
  UserPreferences,
  RecommendationType,
  RecommendationSource,
  PatternScore,
} from './types';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'story-recommendation-preferences';
const FEEDBACK_STORAGE_KEY = 'story-recommendation-feedback';
const MAX_STORED_FEEDBACK = 500;

// ============================================================================
// Types
// ============================================================================

interface FeedbackStats {
  totalShown: number;
  totalAccepted: number;
  totalDismissed: number;
  totalIgnored: number;
  acceptRate: number;
  averageTimeToAction: number;
  byType: Map<RecommendationType, TypeStats>;
  bySource: Map<RecommendationSource, SourceStats>;
}

interface TypeStats {
  shown: number;
  accepted: number;
  dismissed: number;
  acceptRate: number;
}

interface SourceStats {
  shown: number;
  accepted: number;
  dismissed: number;
  acceptRate: number;
}

interface StoredFeedback extends RecommendationFeedback {
  recommendationType?: RecommendationType;
  recommendationSource?: RecommendationSource;
}

// ============================================================================
// Default Preferences
// ============================================================================

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
// FeedbackCollector Class
// ============================================================================

class FeedbackCollectorClass {
  private static instance: FeedbackCollectorClass;

  private preferences: UserPreferences;
  private sessionFeedback: StoredFeedback[] = [];
  private storedFeedback: StoredFeedback[] = [];

  private constructor() {
    this.preferences = this.loadPreferences();
    this.storedFeedback = this.loadStoredFeedback();
  }

  static getInstance(): FeedbackCollectorClass {
    if (!FeedbackCollectorClass.instance) {
      FeedbackCollectorClass.instance = new FeedbackCollectorClass();
    }
    return FeedbackCollectorClass.instance;
  }

  // ============================================================================
  // Feedback Recording
  // ============================================================================

  /**
   * Record feedback for a recommendation
   */
  recordFeedback(
    feedback: RecommendationFeedback,
    recommendationType?: RecommendationType,
    recommendationSource?: RecommendationSource
  ): void {
    const storedFeedback: StoredFeedback = {
      ...feedback,
      recommendationType,
      recommendationSource,
    };

    // Add to session feedback
    this.sessionFeedback.push(storedFeedback);

    // Add to stored feedback
    this.storedFeedback.push(storedFeedback);

    // Trim if too many
    if (this.storedFeedback.length > MAX_STORED_FEEDBACK) {
      this.storedFeedback = this.storedFeedback.slice(-MAX_STORED_FEEDBACK);
    }

    // Update preferences based on feedback
    this.updatePreferencesFromFeedback(storedFeedback);

    // Persist
    this.saveStoredFeedback();
    this.savePreferences();
  }

  // ============================================================================
  // Learning
  // ============================================================================

  private updatePreferencesFromFeedback(feedback: StoredFeedback): void {
    // Update stats
    this.preferences.totalShown++;
    if (feedback.action === 'accepted') {
      this.preferences.totalAccepted++;
    } else if (feedback.action === 'dismissed') {
      this.preferences.totalDismissed++;
    }

    // Update type preferences
    if (feedback.recommendationType) {
      const delta = this.calculateDelta(feedback.action);
      const current = this.preferences.typePreferences[feedback.recommendationType] ?? 0;
      this.preferences.typePreferences[feedback.recommendationType] =
        Math.max(-1, Math.min(1, current + delta));
    }

    // Update source preferences
    if (feedback.recommendationSource) {
      const delta = this.calculateDelta(feedback.action);
      const current = this.preferences.sourcePreferences[feedback.recommendationSource] ?? 0;
      this.preferences.sourcePreferences[feedback.recommendationSource] =
        Math.max(-1, Math.min(1, current + delta));
    }

    // Update patterns
    if (feedback.recommendationType && feedback.recommendationSource) {
      const patternKey = `${feedback.recommendationType}:${feedback.recommendationSource}`;

      if (feedback.action === 'accepted') {
        this.updatePattern(this.preferences.acceptedPatterns, patternKey, 0.1);
      } else if (feedback.action === 'dismissed') {
        this.updatePattern(this.preferences.dismissedPatterns, patternKey, 0.1);
      }
    }

    this.preferences.lastUpdated = Date.now();
  }

  private calculateDelta(action: string): number {
    switch (action) {
      case 'accepted':
        return 0.1;
      case 'clicked':
        return 0.05;
      case 'expanded':
        return 0.02;
      case 'dismissed':
        return -0.1;
      case 'ignored':
        return -0.02;
      default:
        return 0;
    }
  }

  private updatePattern(patterns: PatternScore[], key: string, delta: number): void {
    const existing = patterns.find(p => p.pattern === key);
    if (existing) {
      // Decay the impact as count increases (diminishing returns)
      const impact = delta * (1 / Math.log2(existing.count + 2));
      existing.score = Math.min(1, Math.max(0, existing.score + impact));
      existing.count++;
    } else {
      patterns.push({ pattern: key, score: delta, count: 1 });
    }
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  /**
   * Get comprehensive feedback statistics
   */
  getStats(): FeedbackStats {
    const allFeedback = [...this.storedFeedback, ...this.sessionFeedback];

    const byType = new Map<RecommendationType, TypeStats>();
    const bySource = new Map<RecommendationSource, SourceStats>();

    let totalShown = 0;
    let totalAccepted = 0;
    let totalDismissed = 0;
    let totalIgnored = 0;
    let totalTimeToAction = 0;
    let actionsWithTime = 0;

    for (const feedback of allFeedback) {
      totalShown++;

      if (feedback.action === 'accepted') {
        totalAccepted++;
      } else if (feedback.action === 'dismissed') {
        totalDismissed++;
      } else if (feedback.action === 'ignored') {
        totalIgnored++;
      }

      if (feedback.timeToAction) {
        totalTimeToAction += feedback.timeToAction;
        actionsWithTime++;
      }

      // Aggregate by type
      if (feedback.recommendationType) {
        const typeStats = byType.get(feedback.recommendationType) || {
          shown: 0, accepted: 0, dismissed: 0, acceptRate: 0,
        };
        typeStats.shown++;
        if (feedback.action === 'accepted') typeStats.accepted++;
        if (feedback.action === 'dismissed') typeStats.dismissed++;
        typeStats.acceptRate = typeStats.shown > 0 ? typeStats.accepted / typeStats.shown : 0;
        byType.set(feedback.recommendationType, typeStats);
      }

      // Aggregate by source
      if (feedback.recommendationSource) {
        const sourceStats = bySource.get(feedback.recommendationSource) || {
          shown: 0, accepted: 0, dismissed: 0, acceptRate: 0,
        };
        sourceStats.shown++;
        if (feedback.action === 'accepted') sourceStats.accepted++;
        if (feedback.action === 'dismissed') sourceStats.dismissed++;
        sourceStats.acceptRate = sourceStats.shown > 0 ? sourceStats.accepted / sourceStats.shown : 0;
        bySource.set(feedback.recommendationSource, sourceStats);
      }
    }

    return {
      totalShown,
      totalAccepted,
      totalDismissed,
      totalIgnored,
      acceptRate: totalShown > 0 ? totalAccepted / totalShown : 0,
      averageTimeToAction: actionsWithTime > 0 ? totalTimeToAction / actionsWithTime : 0,
      byType,
      bySource,
    };
  }

  /**
   * Get the best performing recommendation types
   */
  getTopPerformingTypes(): Array<{ type: RecommendationType; acceptRate: number }> {
    const stats = this.getStats();
    return Array.from(stats.byType.entries())
      .filter(([_, s]) => s.shown >= 5) // Need minimum sample size
      .map(([type, s]) => ({ type, acceptRate: s.acceptRate }))
      .sort((a, b) => b.acceptRate - a.acceptRate);
  }

  // ============================================================================
  // Preferences Access
  // ============================================================================

  getPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  updatePreferences(updates: Partial<UserPreferences>): void {
    this.preferences = {
      ...this.preferences,
      ...updates,
      lastUpdated: Date.now(),
    };
    this.savePreferences();
  }

  /**
   * Get type preference score (-1 to 1)
   */
  getTypePreference(type: RecommendationType): number {
    return this.preferences.typePreferences[type] ?? 0;
  }

  /**
   * Get source preference score (-1 to 1)
   */
  getSourcePreference(source: RecommendationSource): number {
    return this.preferences.sourcePreferences[source] ?? 0;
  }

  /**
   * Check if a type is enabled
   */
  isTypeEnabled(type: RecommendationType): boolean {
    return this.preferences.enabledTypes.includes(type);
  }

  /**
   * Enable/disable a recommendation type
   */
  setTypeEnabled(type: RecommendationType, enabled: boolean): void {
    if (enabled && !this.preferences.enabledTypes.includes(type)) {
      this.preferences.enabledTypes.push(type);
    } else if (!enabled) {
      this.preferences.enabledTypes = this.preferences.enabledTypes.filter(t => t !== type);
    }
    this.savePreferences();
  }

  // ============================================================================
  // Persistence
  // ============================================================================

  private loadPreferences(): UserPreferences {
    if (typeof window === 'undefined') {
      return DEFAULT_PREFERENCES;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }

    return DEFAULT_PREFERENCES;
  }

  private savePreferences(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  private loadStoredFeedback(): StoredFeedback[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(FEEDBACK_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load feedback:', error);
    }

    return [];
  }

  private saveStoredFeedback(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(this.storedFeedback));
    } catch (error) {
      console.error('Failed to save feedback:', error);
    }
  }

  // ============================================================================
  // Reset
  // ============================================================================

  resetPreferences(): void {
    this.preferences = { ...DEFAULT_PREFERENCES };
    this.savePreferences();
  }

  resetFeedback(): void {
    this.sessionFeedback = [];
    this.storedFeedback = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem(FEEDBACK_STORAGE_KEY);
    }
  }

  resetAll(): void {
    this.resetPreferences();
    this.resetFeedback();
  }
}

// ============================================================================
// Export
// ============================================================================

export const feedbackCollector = FeedbackCollectorClass.getInstance();

export { FeedbackCollectorClass };

export default feedbackCollector;
