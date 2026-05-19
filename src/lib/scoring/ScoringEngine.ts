/**
 * Generic Scoring Engine — scores candidates against a context using pluggable criteria.
 *
 * The same pattern recurs across domains: outfit recommendations, layout assignment,
 * scene recommendations, voice casting, template matching. This engine extracts the
 * shared vocabulary: "criterion", "weight", "context", "breakdown".
 *
 * Usage:
 *   const engine = createScoringEngine<Outfit, SceneContext>([
 *     { name: 'location', weight: 30, match: (outfit, ctx) => ... },
 *     { name: 'weather',  weight: 25, match: (outfit, ctx) => ... },
 *   ]);
 *   const ranked = engine.rank(outfits, context);
 */

// ─── Types ───────────────────────────────────────────────

/** A single match result with optional human-readable reason. */
export interface MatchResult {
  /** Match strength. 0 = no match, 1 = full match, >1 = multiple matches. */
  strength: number;
  /** Human-readable explanation of why this criterion matched. */
  reason?: string;
}

/**
 * A named, weighted scoring criterion.
 *
 * Score contribution = `weight × strength` where strength comes from `match()`.
 *
 * For binary criteria: weight is the points value, match returns 0 or 1.
 * For variable criteria: weight is the per-unit value, match returns the count.
 * For asymmetric criteria (different bonus/penalty): weight can be 1 and
 * match returns the raw point value directly.
 */
export interface ScoringCriterion<T, Ctx> {
  /** Unique identifier for this criterion (used in breakdown keys). */
  name: string;
  /** Scaling factor. Final contribution = weight × match strength. */
  weight: number;
  /**
   * Evaluate how well the candidate matches this criterion in the given context.
   *
   * Return a number for simple cases (0 = no match, 1 = full match).
   * Return a MatchResult object to include a human-readable reason.
   */
  match: (candidate: T, context: Ctx) => number | MatchResult;
}

/** Scored result for a single candidate. */
export interface ScoredResult<T> {
  candidate: T;
  /** Total score (sum of weight × strength across all criteria). */
  score: number;
  /** Human-readable reasons from criteria that matched. */
  reasons: string[];
  /** Per-criterion score breakdown: criterion name → points contributed. */
  breakdown: Record<string, number>;
}

/** A scoring engine instance bound to specific criteria. */
export interface ScoringEngine<T, Ctx> {
  /** Score a single candidate against a context. */
  scoreOne(candidate: T, context: Ctx): ScoredResult<T>;
  /** Score and rank all candidates, descending by score. */
  rank(candidates: T[], context: Ctx): ScoredResult<T>[];
  /** The criteria this engine uses (for introspection/debugging). */
  readonly criteria: ReadonlyArray<ScoringCriterion<T, Ctx>>;
}

// ─── Factory ─────────────────────────────────────────────

/**
 * Create a scoring engine from an array of criteria.
 *
 * The engine is stateless — safe to reuse across calls.
 * Creating an engine is cheap (no allocations beyond the criteria array copy).
 */
export function createScoringEngine<T, Ctx>(
  criteria: ScoringCriterion<T, Ctx>[],
): ScoringEngine<T, Ctx> {
  const frozenCriteria = Object.freeze([...criteria]);

  function scoreOne(candidate: T, context: Ctx): ScoredResult<T> {
    let total = 0;
    const reasons: string[] = [];
    const breakdown: Record<string, number> = {};

    for (const criterion of frozenCriteria) {
      const result = criterion.match(candidate, context);
      const strength = typeof result === 'number' ? result : result.strength;
      const reason = typeof result === 'object' ? result.reason : undefined;
      const points = (criterion.weight * strength) || 0; // normalize -0 → 0

      total += points;
      breakdown[criterion.name] = points;
      if (reason) reasons.push(reason);
    }

    return { candidate, score: total, reasons, breakdown };
  }

  function rank(candidates: T[], context: Ctx): ScoredResult<T>[] {
    return candidates
      .map(c => scoreOne(c, context))
      .sort((a, b) => b.score - a.score);
  }

  return { scoreOne, rank, criteria: frozenCriteria };
}
