/**
 * RelevanceScorer - Context Importance Calculator
 *
 * Scores the relevance of different context elements based on:
 * - Recency (how recent is this element)
 * - Proximity (how close to current focus)
 * - Type weight (inherent importance of context type)
 * - Usage frequency (how often referenced)
 * - Direct mention (explicitly mentioned in current scene)
 */

// ============================================================================
// Types
// ============================================================================

export type ContextType =
  | 'project'
  | 'scene'
  | 'character'
  | 'relationship'
  | 'faction'
  | 'beat'
  | 'act'
  | 'theme'
  | 'visual'
  | 'dialogue'
  | 'location';

export type RelevanceLevel = 'critical' | 'high' | 'medium' | 'low' | 'minimal';

export interface ContextElement {
  id: string;
  type: ContextType;
  name: string;
  content: string;
  metadata?: {
    sceneId?: string;
    actId?: string;
    characterIds?: string[];
    createdAt?: number;
    updatedAt?: number;
    mentions?: number;
  };
}

export interface ScoredContext {
  element: ContextElement;
  score: number;
  relevanceLevel: RelevanceLevel;
  factors: RelevanceFactors;
  tokenEstimate: number;
}

export interface RelevanceFactors {
  recency: number;       // 0-1, how recent
  proximity: number;     // 0-1, closeness to focus
  typeWeight: number;    // 0-1, inherent type importance
  frequency: number;     // 0-1, usage frequency
  directMention: number; // 0-1, explicitly mentioned
}

export interface ScoringConfig {
  focusSceneId?: string;
  focusCharacterIds?: string[];
  focusActId?: string;
  currentContent?: string;
  weights?: Partial<ScoringWeights>;
  typeWeights?: Partial<Record<ContextType, number>>;
}

export interface ScoringWeights {
  recency: number;
  proximity: number;
  typeWeight: number;
  frequency: number;
  directMention: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_WEIGHTS: ScoringWeights = {
  recency: 0.15,
  proximity: 0.30,
  typeWeight: 0.20,
  frequency: 0.10,
  directMention: 0.25,
};

const DEFAULT_TYPE_WEIGHTS: Record<ContextType, number> = {
  project: 0.9,     // Always important - overall context
  scene: 0.95,      // Current scene is critical
  character: 0.85,  // Characters in scene are very important
  relationship: 0.7, // Relationships provide depth
  faction: 0.6,     // Group dynamics
  beat: 0.75,       // Story beats guide narrative
  act: 0.65,        // Act context for structure
  theme: 0.5,       // Themes for consistency
  visual: 0.4,      // Visual style reference
  dialogue: 0.8,    // Dialogue patterns
  location: 0.55,   // Setting details
};

const RELEVANCE_THRESHOLDS: Record<RelevanceLevel, number> = {
  critical: 0.85,
  high: 0.7,
  medium: 0.5,
  low: 0.3,
  minimal: 0,
};

// Average tokens per character (rough estimate)
const TOKENS_PER_CHAR = 0.25;

// ============================================================================
// RelevanceScorer Class
// ============================================================================

export class RelevanceScorer {
  private static instance: RelevanceScorer;
  private weights: ScoringWeights = DEFAULT_WEIGHTS;
  private typeWeights: Record<ContextType, number> = DEFAULT_TYPE_WEIGHTS;

  private constructor() {}

  static getInstance(): RelevanceScorer {
    if (!RelevanceScorer.instance) {
      RelevanceScorer.instance = new RelevanceScorer();
    }
    return RelevanceScorer.instance;
  }

  // -------------------------------------------------------------------------
  // Configuration
  // -------------------------------------------------------------------------

  setWeights(weights: Partial<ScoringWeights>): void {
    this.weights = { ...this.weights, ...weights };
    this.normalizeWeights();
  }

  setTypeWeights(typeWeights: Partial<Record<ContextType, number>>): void {
    this.typeWeights = { ...this.typeWeights, ...typeWeights };
  }

  private normalizeWeights(): void {
    const total = Object.values(this.weights).reduce((sum, w) => sum + w, 0);
    if (total > 0 && Math.abs(total - 1) > 0.001) {
      for (const key of Object.keys(this.weights) as (keyof ScoringWeights)[]) {
        this.weights[key] = this.weights[key] / total;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Main Scoring Methods
  // -------------------------------------------------------------------------

  /**
   * Score a single context element
   */
  scoreElement(element: ContextElement, config: ScoringConfig = {}): ScoredContext {
    const factors = this.calculateFactors(element, config);
    const score = this.calculateScore(factors);
    const relevanceLevel = this.getRelevanceLevel(score);
    const tokenEstimate = this.estimateTokens(element.content);

    return {
      element,
      score,
      relevanceLevel,
      factors,
      tokenEstimate,
    };
  }

  /**
   * Score and sort multiple context elements
   */
  scoreElements(elements: ContextElement[], config: ScoringConfig = {}): ScoredContext[] {
    const scored = elements.map(element => this.scoreElement(element, config));
    return scored.sort((a, b) => b.score - a.score);
  }

  /**
   * Get elements that fit within a token budget, prioritized by relevance
   */
  selectForBudget(
    elements: ContextElement[],
    tokenBudget: number,
    config: ScoringConfig = {}
  ): { selected: ScoredContext[]; excluded: ScoredContext[]; totalTokens: number } {
    const scored = this.scoreElements(elements, config);
    const selected: ScoredContext[] = [];
    const excluded: ScoredContext[] = [];
    let totalTokens = 0;

    for (const item of scored) {
      if (totalTokens + item.tokenEstimate <= tokenBudget) {
        selected.push(item);
        totalTokens += item.tokenEstimate;
      } else {
        excluded.push(item);
      }
    }

    return { selected, excluded, totalTokens };
  }

  // -------------------------------------------------------------------------
  // Factor Calculations
  // -------------------------------------------------------------------------

  private calculateFactors(element: ContextElement, config: ScoringConfig): RelevanceFactors {
    return {
      recency: this.calculateRecency(element),
      proximity: this.calculateProximity(element, config),
      typeWeight: this.getTypeWeight(element.type),
      frequency: this.calculateFrequency(element),
      directMention: this.calculateDirectMention(element, config),
    };
  }

  private calculateRecency(element: ContextElement): number {
    const updatedAt = element.metadata?.updatedAt || element.metadata?.createdAt;
    if (!updatedAt) return 0.5; // Default if no timestamp

    const now = Date.now();
    const ageHours = (now - updatedAt) / (1000 * 60 * 60);

    // Decay function: full relevance within 1 hour, decays over 24 hours
    if (ageHours < 1) return 1;
    if (ageHours > 24) return 0.2;
    return 1 - (ageHours - 1) / 23 * 0.8;
  }

  private calculateProximity(element: ContextElement, config: ScoringConfig): number {
    let proximity = 0.3; // Base proximity

    // Same scene = highest proximity
    if (config.focusSceneId && element.metadata?.sceneId === config.focusSceneId) {
      proximity = 1;
    }
    // Same act = high proximity
    else if (config.focusActId && element.metadata?.actId === config.focusActId) {
      proximity = 0.7;
    }
    // Character in focus = high proximity
    else if (
      config.focusCharacterIds &&
      element.metadata?.characterIds?.some(id => config.focusCharacterIds?.includes(id))
    ) {
      proximity = 0.8;
    }

    return proximity;
  }

  private getTypeWeight(type: ContextType): number {
    return this.typeWeights[type] ?? 0.5;
  }

  private calculateFrequency(element: ContextElement): number {
    const mentions = element.metadata?.mentions ?? 0;
    // Logarithmic scale: 0 mentions = 0.3, 10+ mentions = 1
    if (mentions === 0) return 0.3;
    return Math.min(1, 0.3 + Math.log10(mentions + 1) * 0.7);
  }

  private calculateDirectMention(element: ContextElement, config: ScoringConfig): number {
    if (!config.currentContent) return 0;

    const content = config.currentContent.toLowerCase();
    const name = element.name.toLowerCase();

    // Direct name match
    if (content.includes(name)) return 1;

    // Partial match (for longer names)
    const words = name.split(/\s+/);
    const matchedWords = words.filter(word => word.length > 2 && content.includes(word));
    if (matchedWords.length > 0) {
      return matchedWords.length / words.length;
    }

    return 0;
  }

  private calculateScore(factors: RelevanceFactors): number {
    return (
      factors.recency * this.weights.recency +
      factors.proximity * this.weights.proximity +
      factors.typeWeight * this.weights.typeWeight +
      factors.frequency * this.weights.frequency +
      factors.directMention * this.weights.directMention
    );
  }

  // -------------------------------------------------------------------------
  // Utility Methods
  // -------------------------------------------------------------------------

  private getRelevanceLevel(score: number): RelevanceLevel {
    if (score >= RELEVANCE_THRESHOLDS.critical) return 'critical';
    if (score >= RELEVANCE_THRESHOLDS.high) return 'high';
    if (score >= RELEVANCE_THRESHOLDS.medium) return 'medium';
    if (score >= RELEVANCE_THRESHOLDS.low) return 'low';
    return 'minimal';
  }

  private estimateTokens(content: string): number {
    return Math.ceil(content.length * TOKENS_PER_CHAR);
  }

  /**
   * Get relevance level color for UI
   */
  getRelevanceLevelColor(level: RelevanceLevel): string {
    const colors: Record<RelevanceLevel, string> = {
      critical: 'text-red-400',
      high: 'text-amber-400',
      medium: 'text-emerald-400',
      low: 'text-blue-400',
      minimal: 'text-slate-500',
    };
    return colors[level];
  }

  /**
   * Get relevance level background for UI
   */
  getRelevanceLevelBg(level: RelevanceLevel): string {
    const colors: Record<RelevanceLevel, string> = {
      critical: 'bg-red-500/20',
      high: 'bg-amber-500/20',
      medium: 'bg-emerald-500/20',
      low: 'bg-blue-500/20',
      minimal: 'bg-slate-500/20',
    };
    return colors[level];
  }

  /**
   * Get factor breakdown for display
   */
  getFactorBreakdown(factors: RelevanceFactors): Array<{ label: string; value: number; weight: number }> {
    return [
      { label: 'Recency', value: factors.recency, weight: this.weights.recency },
      { label: 'Proximity', value: factors.proximity, weight: this.weights.proximity },
      { label: 'Type Weight', value: factors.typeWeight, weight: this.weights.typeWeight },
      { label: 'Frequency', value: factors.frequency, weight: this.weights.frequency },
      { label: 'Direct Mention', value: factors.directMention, weight: this.weights.directMention },
    ];
  }

  /**
   * Get current weights configuration
   */
  getWeights(): ScoringWeights {
    return { ...this.weights };
  }

  /**
   * Get current type weights configuration
   */
  getTypeWeights(): Record<ContextType, number> {
    return { ...this.typeWeights };
  }

  /**
   * Reset to default configuration
   */
  reset(): void {
    this.weights = { ...DEFAULT_WEIGHTS };
    this.typeWeights = { ...DEFAULT_TYPE_WEIGHTS };
  }
}

// Export singleton instance
export const relevanceScorer = RelevanceScorer.getInstance();
