/**
 * Scoring adapters — bridge existing quality engines into the generic ScoringFn
 * expected by QualityController.
 *
 * Each adapter is a factory that closes over the engine/config and returns
 * a simple `(result: T) => number` (deviation score 0-100, lower is better).
 */

import type { ScoringFn, PromptStrengthener } from './QualityController';
import type {
  CharacterStyleProfile,
  StyleDefinition,
} from '@/app/features/characters/sub_AvatarGenerator/lib/styleEngine';
import {
  calculateStyleDeviation,
  strengthenStylePrompt,
} from '@/app/features/characters/sub_AvatarGenerator/lib/styleEngine';
import type { ImageFingerprint, SimilarityMatch } from '@/lib/similarity/SimilarityEngine';

// ============================================================================
// StyleEngine adapter
// ============================================================================

/**
 * Create a scorer that uses styleEngine's calculateStyleDeviation.
 * Returns deviation 0-100 (lower = closer to the target style).
 */
export function createStyleDeviationScorer(
  definition: StyleDefinition,
): ScoringFn<CharacterStyleProfile> {
  return (profile) => calculateStyleDeviation(profile, definition);
}

/**
 * Create a prompt strengthener backed by styleEngine's strengthenStylePrompt.
 */
export function createStylePromptStrengthener(
  definition: StyleDefinition,
): PromptStrengthener {
  return (basePrompt, attempt) => {
    const { prompt } = strengthenStylePrompt(basePrompt, definition, attempt);
    return prompt;
  };
}

// ============================================================================
// SimilarityEngine adapter
// ============================================================================

/**
 * Create a scorer from SimilarityEngine match details.
 * Similarity scores are 0-1 (higher = more similar), so we invert to 0-100 deviation.
 */
export function createSimilarityScorer(
  getSimilarityScore: (details: SimilarityMatch['details']) => number,
  referenceFingerprint: ImageFingerprint,
  calculateSimilarity: (fp1: ImageFingerprint, fp2: ImageFingerprint) => SimilarityMatch['details'],
): ScoringFn<ImageFingerprint> {
  return (candidateFingerprint) => {
    const details = calculateSimilarity(referenceFingerprint, candidateFingerprint);
    const similarity = getSimilarityScore(details); // 0-1
    return Math.round((1 - similarity) * 100); // invert to deviation 0-100
  };
}

// ============================================================================
// StyleDNA fingerprint adapter
// ============================================================================

export interface StyleDNAFingerprintPair {
  referenceHash: string;
  candidateHash: string;
}

/**
 * Create a scorer that compares two StyleDNA fingerprint hashes.
 * Uses simple string-distance heuristic: identical hashes = 0 deviation,
 * completely different = 100 deviation.
 */
export function createStyleDNAScorer(): ScoringFn<StyleDNAFingerprintPair> {
  return ({ referenceHash, candidateHash }) => {
    if (referenceHash === candidateHash) return 0;

    // Character-level comparison of base-36 hashes
    const maxLen = Math.max(referenceHash.length, candidateHash.length);
    if (maxLen === 0) return 100;

    let matches = 0;
    for (let i = 0; i < maxLen; i++) {
      if (referenceHash[i] === candidateHash[i]) matches++;
    }
    return Math.round((1 - matches / maxLen) * 100);
  };
}

// ============================================================================
// Generic numeric scorer
// ============================================================================

/**
 * Create a scorer from any numeric evaluation function.
 * Useful for one-off or custom quality checks.
 *
 * @param evaluator - Function that returns a raw score.
 * @param invert - If true, treat higher raw scores as better (converts to deviation).
 * @param maxRawScore - Maximum possible raw score (used for inversion normalisation).
 */
export function createNumericScorer<T>(
  evaluator: (result: T) => number,
  invert = false,
  maxRawScore = 100,
): ScoringFn<T> {
  return (result) => {
    const raw = evaluator(result);
    if (invert) {
      return Math.round((1 - raw / maxRawScore) * 100);
    }
    return Math.round(Math.min(100, Math.max(0, raw)));
  };
}
