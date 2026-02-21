/**
 * ContextCompressor - Intelligent Context Compression System
 *
 * Compresses and prioritizes story context to fit within token budgets
 * while maintaining essential information through:
 * - Extractive summarization
 * - Priority-based selection
 * - Graduated compression levels
 * - Token budget allocation
 */

import {
  relevanceScorer,
  type ContextElement,
  type ScoredContext,
  type ScoringConfig,
  type ContextType,
  type RelevanceLevel,
} from './RelevanceScorer';

// ============================================================================
// Types
// ============================================================================

export type CompressionLevel = 'none' | 'light' | 'moderate' | 'heavy' | 'extreme';

export interface TokenBudget {
  total: number;
  allocated: Record<ContextType, number>;
  reserved: number; // Reserved for system prompt and response
}

export interface CompressionConfig {
  tokenBudget: TokenBudget;
  compressionLevel: CompressionLevel;
  preserveNames: boolean;
  preserveRelationships: boolean;
  maxSentences?: number;
  scoringConfig?: ScoringConfig;
}

export interface CompressedContext {
  content: string;
  originalTokens: number;
  compressedTokens: number;
  compressionRatio: number;
  includedElements: ScoredContext[];
  excludedElements: ScoredContext[];
  budgetUsage: BudgetUsage;
}

export interface BudgetUsage {
  total: number;
  used: number;
  remaining: number;
  byType: Record<ContextType, { allocated: number; used: number }>;
  utilizationPercent: number;
}

export interface CompressionResult {
  original: string;
  compressed: string;
  originalTokens: number;
  compressedTokens: number;
  compressionRatio: number;
}

export interface CompressionAnalytics {
  totalElements: number;
  includedElements: number;
  excludedElements: number;
  averageRelevanceScore: number;
  tokenSavings: number;
  compressionEfficiency: number;
  typeDistribution: Record<ContextType, number>;
  relevanceLevelDistribution: Record<RelevanceLevel, number>;
}

// ============================================================================
// Constants
// ============================================================================

const COMPRESSION_RATIOS: Record<CompressionLevel, number> = {
  none: 1.0,
  light: 0.8,
  moderate: 0.6,
  heavy: 0.4,
  extreme: 0.25,
};

const DEFAULT_TYPE_ALLOCATION: Record<ContextType, number> = {
  project: 0.10,
  scene: 0.25,
  character: 0.25,
  relationship: 0.10,
  faction: 0.05,
  beat: 0.08,
  act: 0.05,
  theme: 0.04,
  visual: 0.04,
  dialogue: 0.02,
  location: 0.02,
};

// Average tokens per character
const TOKENS_PER_CHAR = 0.25;

// ============================================================================
// ContextCompressor Class
// ============================================================================

export class ContextCompressor {
  private static instance: ContextCompressor;

  private constructor() {}

  static getInstance(): ContextCompressor {
    if (!ContextCompressor.instance) {
      ContextCompressor.instance = new ContextCompressor();
    }
    return ContextCompressor.instance;
  }

  // -------------------------------------------------------------------------
  // Main Compression Methods
  // -------------------------------------------------------------------------

  /**
   * Compress a collection of context elements to fit within budget
   */
  compress(elements: ContextElement[], config: CompressionConfig): CompressedContext {
    // Score all elements
    const scored = relevanceScorer.scoreElements(elements, config.scoringConfig);

    // Calculate original token count
    const originalTokens = scored.reduce((sum, s) => sum + s.tokenEstimate, 0);

    // Select elements by priority and budget
    const { included, excluded, usage } = this.selectByBudget(scored, config);

    // Apply compression to selected elements
    const compressedParts = included.map(item =>
      this.compressElement(item, config.compressionLevel, {
        preserveNames: config.preserveNames,
        preserveRelationships: config.preserveRelationships,
        maxSentences: config.maxSentences,
      })
    );

    // Build final content
    const content = this.buildCompressedContent(compressedParts, included);
    const compressedTokens = this.estimateTokens(content);

    return {
      content,
      originalTokens,
      compressedTokens,
      compressionRatio: originalTokens > 0 ? compressedTokens / originalTokens : 1,
      includedElements: included,
      excludedElements: excluded,
      budgetUsage: usage,
    };
  }

  /**
   * Compress a single text string
   */
  compressText(text: string, level: CompressionLevel): CompressionResult {
    const originalTokens = this.estimateTokens(text);

    if (level === 'none') {
      return {
        original: text,
        compressed: text,
        originalTokens,
        compressedTokens: originalTokens,
        compressionRatio: 1,
      };
    }

    const compressed = this.applyCompression(text, level);
    const compressedTokens = this.estimateTokens(compressed);

    return {
      original: text,
      compressed,
      originalTokens,
      compressedTokens,
      compressionRatio: compressedTokens / originalTokens,
    };
  }

  /**
   * Create a default token budget
   */
  createBudget(totalTokens: number, reservedTokens: number = 1000): TokenBudget {
    const available = totalTokens - reservedTokens;
    const allocated: Record<ContextType, number> = {} as Record<ContextType, number>;

    for (const [type, ratio] of Object.entries(DEFAULT_TYPE_ALLOCATION)) {
      allocated[type as ContextType] = Math.floor(available * ratio);
    }

    return {
      total: totalTokens,
      allocated,
      reserved: reservedTokens,
    };
  }

  /**
   * Adjust budget allocation for specific types
   */
  adjustBudgetAllocation(
    budget: TokenBudget,
    adjustments: Partial<Record<ContextType, number>>
  ): TokenBudget {
    const newAllocated = { ...budget.allocated };
    const available = budget.total - budget.reserved;

    // Apply adjustments
    for (const [type, ratio] of Object.entries(adjustments)) {
      newAllocated[type as ContextType] = Math.floor(available * ratio);
    }

    // Normalize to ensure we don't exceed available
    const totalAllocated = Object.values(newAllocated).reduce((sum, v) => sum + v, 0);
    if (totalAllocated > available) {
      const scale = available / totalAllocated;
      for (const type of Object.keys(newAllocated) as ContextType[]) {
        newAllocated[type] = Math.floor(newAllocated[type] * scale);
      }
    }

    return {
      ...budget,
      allocated: newAllocated,
    };
  }

  // -------------------------------------------------------------------------
  // Selection Methods
  // -------------------------------------------------------------------------

  private selectByBudget(
    scored: ScoredContext[],
    config: CompressionConfig
  ): { included: ScoredContext[]; excluded: ScoredContext[]; usage: BudgetUsage } {
    const included: ScoredContext[] = [];
    const excluded: ScoredContext[] = [];
    const usedByType: Record<ContextType, number> = {} as Record<ContextType, number>;

    // Initialize type usage
    for (const type of Object.keys(config.tokenBudget.allocated) as ContextType[]) {
      usedByType[type] = 0;
    }

    // Target compression ratio for budget
    const compressionRatio = COMPRESSION_RATIOS[config.compressionLevel];

    for (const item of scored) {
      const type = item.element.type;
      const typeAllocation = config.tokenBudget.allocated[type] || 0;
      const estimatedCompressedTokens = Math.ceil(item.tokenEstimate * compressionRatio);

      // Check if fits in type budget
      if (usedByType[type] + estimatedCompressedTokens <= typeAllocation) {
        included.push(item);
        usedByType[type] += estimatedCompressedTokens;
      } else {
        excluded.push(item);
      }
    }

    // Calculate usage
    const totalUsed = Object.values(usedByType).reduce((sum, v) => sum + v, 0);
    const available = config.tokenBudget.total - config.tokenBudget.reserved;

    const byType: Record<ContextType, { allocated: number; used: number }> = {} as Record<
      ContextType,
      { allocated: number; used: number }
    >;
    for (const type of Object.keys(config.tokenBudget.allocated) as ContextType[]) {
      byType[type] = {
        allocated: config.tokenBudget.allocated[type],
        used: usedByType[type],
      };
    }

    const usage: BudgetUsage = {
      total: config.tokenBudget.total,
      used: totalUsed + config.tokenBudget.reserved,
      remaining: config.tokenBudget.total - totalUsed - config.tokenBudget.reserved,
      byType,
      utilizationPercent: available > 0 ? (totalUsed / available) * 100 : 0,
    };

    return { included, excluded, usage };
  }

  // -------------------------------------------------------------------------
  // Compression Methods
  // -------------------------------------------------------------------------

  private compressElement(
    item: ScoredContext,
    level: CompressionLevel,
    options: { preserveNames: boolean; preserveRelationships: boolean; maxSentences?: number }
  ): string {
    if (level === 'none') {
      return item.element.content;
    }

    let compressed = item.element.content;

    // Apply compression strategies based on level
    switch (level) {
      case 'light':
        compressed = this.removeRedundancy(compressed);
        break;
      case 'moderate':
        compressed = this.removeRedundancy(compressed);
        compressed = this.condenseSentences(compressed);
        break;
      case 'heavy':
        compressed = this.removeRedundancy(compressed);
        compressed = this.condenseSentences(compressed);
        compressed = this.extractKeyPoints(compressed, options.maxSentences || 3);
        break;
      case 'extreme':
        compressed = this.extractKeyPoints(compressed, options.maxSentences || 2);
        compressed = this.abbreviate(compressed);
        break;
    }

    return compressed;
  }

  private applyCompression(text: string, level: CompressionLevel): string {
    let result = text;

    switch (level) {
      case 'light':
        result = this.removeRedundancy(result);
        break;
      case 'moderate':
        result = this.removeRedundancy(result);
        result = this.condenseSentences(result);
        break;
      case 'heavy':
        result = this.removeRedundancy(result);
        result = this.condenseSentences(result);
        result = this.extractKeyPoints(result, 3);
        break;
      case 'extreme':
        result = this.extractKeyPoints(result, 2);
        result = this.abbreviate(result);
        break;
    }

    return result;
  }

  private removeRedundancy(text: string): string {
    // Remove duplicate words
    const words = text.split(/\s+/);
    const seen = new Set<string>();
    const filtered: string[] = [];

    for (const word of words) {
      const normalized = word.toLowerCase().replace(/[^\w]/g, '');
      // Allow common words and first occurrence of others
      if (this.isCommonWord(normalized) || !seen.has(normalized)) {
        filtered.push(word);
        seen.add(normalized);
      }
    }

    // Remove filler phrases
    let result = filtered.join(' ');
    const fillerPhrases = [
      'in order to',
      'due to the fact that',
      'for the purpose of',
      'in the event that',
      'with regard to',
      'in terms of',
      'as a matter of fact',
      'it is important to note that',
      'it should be noted that',
    ];

    for (const phrase of fillerPhrases) {
      result = result.replace(new RegExp(phrase, 'gi'), '');
    }

    return result.replace(/\s+/g, ' ').trim();
  }

  private condenseSentences(text: string): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());

    return sentences
      .map(sentence => {
        // Remove verbose phrases
        let condensed = sentence
          .replace(/\bvery\b/gi, '')
          .replace(/\breally\b/gi, '')
          .replace(/\bactually\b/gi, '')
          .replace(/\bbasically\b/gi, '')
          .replace(/\bsomewhat\b/gi, '')
          .replace(/\bquite\b/gi, '');

        // Remove weak modifiers
        condensed = condensed
          .replace(/\ba bit\b/gi, '')
          .replace(/\bkind of\b/gi, '')
          .replace(/\bsort of\b/gi, '');

        return condensed.trim();
      })
      .filter(s => s.length > 0)
      .join('. ') + '.';
  }

  private extractKeyPoints(text: string, maxSentences: number): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);

    if (sentences.length <= maxSentences) {
      return text;
    }

    // Score sentences by importance (simple heuristic)
    const scored = sentences.map(sentence => ({
      sentence,
      score: this.scoreSentence(sentence),
    }));

    // Sort by score and take top N
    scored.sort((a, b) => b.score - a.score);
    const topSentences = scored.slice(0, maxSentences).map(s => s.sentence);

    // Return in original order
    return sentences
      .filter(s => topSentences.includes(s))
      .join('. ')
      .trim() + '.';
  }

  private scoreSentence(sentence: string): number {
    let score = 0;

    // Longer sentences often contain more info
    score += Math.min(sentence.length / 100, 1);

    // Contains names (capitalized words)
    const capitalizedWords = sentence.match(/\b[A-Z][a-z]+\b/g) || [];
    score += capitalizedWords.length * 0.2;

    // Contains numbers (specific details)
    const numbers = sentence.match(/\d+/g) || [];
    score += numbers.length * 0.1;

    // Contains action verbs
    const actionVerbs = ['is', 'was', 'has', 'have', 'does', 'did', 'wants', 'needs', 'creates', 'destroys'];
    for (const verb of actionVerbs) {
      if (sentence.toLowerCase().includes(verb)) {
        score += 0.1;
      }
    }

    return score;
  }

  private abbreviate(text: string): string {
    // Common abbreviations
    const abbreviations: Record<string, string> = {
      'character': 'char',
      'relationship': 'rel',
      'description': 'desc',
      'information': 'info',
      'because': 'bc',
      'without': 'w/o',
      'with': 'w/',
      'approximately': 'approx',
      'including': 'incl',
      'especially': 'esp',
    };

    let result = text;
    for (const [full, abbr] of Object.entries(abbreviations)) {
      result = result.replace(new RegExp(`\\b${full}\\b`, 'gi'), abbr);
    }

    return result;
  }

  private isCommonWord(word: string): boolean {
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'this',
      'that', 'these', 'those', 'it', 'its', 'he', 'she', 'they', 'them',
      'his', 'her', 'their', 'who', 'which', 'what', 'when', 'where', 'why',
      'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
      'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than',
      'too', 'very', 'just', 'also', 'now', 'here', 'there', 'then',
    ]);
    return commonWords.has(word);
  }

  // -------------------------------------------------------------------------
  // Content Building
  // -------------------------------------------------------------------------

  private buildCompressedContent(compressedParts: string[], items: ScoredContext[]): string {
    const sections: Record<ContextType, string[]> = {} as Record<ContextType, string[]>;

    for (let i = 0; i < items.length; i++) {
      const type = items[i].element.type;
      if (!sections[type]) {
        sections[type] = [];
      }
      sections[type].push(`${items[i].element.name}: ${compressedParts[i]}`);
    }

    // Build output with sections
    const parts: string[] = [];

    // Order sections by importance
    const sectionOrder: ContextType[] = [
      'project',
      'scene',
      'character',
      'relationship',
      'beat',
      'act',
      'faction',
      'theme',
      'location',
      'visual',
      'dialogue',
    ];

    for (const type of sectionOrder) {
      if (sections[type] && sections[type].length > 0) {
        parts.push(`## ${this.getTypeSectionName(type)}`);
        parts.push(sections[type].join('\n'));
        parts.push('');
      }
    }

    return parts.join('\n').trim();
  }

  private getTypeSectionName(type: ContextType): string {
    const names: Record<ContextType, string> = {
      project: 'Project Overview',
      scene: 'Current Scene',
      character: 'Characters',
      relationship: 'Relationships',
      faction: 'Factions',
      beat: 'Story Beats',
      act: 'Acts',
      theme: 'Themes',
      visual: 'Visual Style',
      dialogue: 'Dialogue',
      location: 'Locations',
    };
    return names[type];
  }

  // -------------------------------------------------------------------------
  // Analytics
  // -------------------------------------------------------------------------

  /**
   * Generate compression analytics
   */
  getAnalytics(result: CompressedContext): CompressionAnalytics {
    const typeDistribution: Record<ContextType, number> = {} as Record<ContextType, number>;
    const relevanceLevelDistribution: Record<RelevanceLevel, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      minimal: 0,
    };

    let totalRelevance = 0;

    for (const item of result.includedElements) {
      const type = item.element.type;
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
      relevanceLevelDistribution[item.relevanceLevel]++;
      totalRelevance += item.score;
    }

    const totalElements = result.includedElements.length + result.excludedElements.length;
    const tokenSavings = result.originalTokens - result.compressedTokens;

    return {
      totalElements,
      includedElements: result.includedElements.length,
      excludedElements: result.excludedElements.length,
      averageRelevanceScore:
        result.includedElements.length > 0 ? totalRelevance / result.includedElements.length : 0,
      tokenSavings,
      compressionEfficiency: result.originalTokens > 0 ? tokenSavings / result.originalTokens : 0,
      typeDistribution,
      relevanceLevelDistribution,
    };
  }

  // -------------------------------------------------------------------------
  // Utility Methods
  // -------------------------------------------------------------------------

  private estimateTokens(content: string): number {
    return Math.ceil(content.length * TOKENS_PER_CHAR);
  }

  /**
   * Get compression level description
   */
  getCompressionLevelDescription(level: CompressionLevel): string {
    const descriptions: Record<CompressionLevel, string> = {
      none: 'Full context, no compression',
      light: 'Remove redundancy only',
      moderate: 'Condense sentences, remove filler',
      heavy: 'Extract key points only',
      extreme: 'Minimal essential information',
    };
    return descriptions[level];
  }

  /**
   * Get all compression levels
   */
  getCompressionLevels(): Array<{ level: CompressionLevel; ratio: number; description: string }> {
    return Object.entries(COMPRESSION_RATIOS).map(([level, ratio]) => ({
      level: level as CompressionLevel,
      ratio,
      description: this.getCompressionLevelDescription(level as CompressionLevel),
    }));
  }
}

// Export singleton instance
export const contextCompressor = ContextCompressor.getInstance();
