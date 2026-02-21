/**
 * Context Compression Library
 *
 * Intelligent context management for LLM prompts with relevance scoring,
 * compression, and token budget optimization.
 */

export {
  relevanceScorer,
  RelevanceScorer,
  type ContextType,
  type RelevanceLevel,
  type ContextElement,
  type ScoredContext,
  type RelevanceFactors,
  type ScoringConfig,
  type ScoringWeights,
} from './RelevanceScorer';

export {
  contextCompressor,
  ContextCompressor,
  type CompressionLevel,
  type TokenBudget,
  type CompressionConfig,
  type CompressedContext,
  type BudgetUsage,
  type CompressionResult,
  type CompressionAnalytics,
} from './ContextCompressor';

export {
  presenceDetector,
  type CharacterPresence,
  type PresenceRole,
  type PresenceAnalysis,
  type DialogueLine,
} from './PresenceDetector';
