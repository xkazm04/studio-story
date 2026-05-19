/**
 * QualityController - Reusable closed-loop quality gate for any generation path.
 *
 * Implements the generate → evaluate deviation → strengthen prompt → retry pattern.
 * Accepts any scoring function so it works with styleEngine deviation,
 * SimilarityEngine scores, StyleDNA fingerprint comparison, or custom scorers.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Scoring function: given a generation result, return a deviation score 0-100.
 * Lower is better (0 = perfect match, 100 = maximum deviation).
 */
export type ScoringFn<T> = (result: T) => number;

/**
 * Prompt strengthener: adjusts the prompt for retry attempts.
 * Receives the current prompt and the attempt number (1-based for retries).
 * Returns the strengthened prompt string.
 */
export type PromptStrengthener = (currentPrompt: string, attempt: number) => string;

export interface QualityGateConfig<T> {
  /** Deviation threshold (0-100). Results at or below this are accepted. */
  deviationThreshold: number;
  /** Maximum retry attempts before force-accepting. */
  maxRetries: number;
  /** Scoring function that evaluates the generation result. */
  scorer: ScoringFn<T>;
  /** Optional prompt strengthener for retries. If omitted, prompt stays unchanged. */
  strengthener?: PromptStrengthener;
}

export interface QualityGateResult {
  /** Whether the result was accepted (within threshold or retries exhausted). */
  accepted: boolean;
  /** The deviation score from the last evaluation. */
  deviationScore: number;
  /** Number of attempts made (0-based: 0 = first try). */
  attempt: number;
  /** Whether any retries occurred. */
  wasRetried: boolean;
  /** Whether acceptance was forced due to exhausted retries. */
  forcedAccept: boolean;
}

export interface QualityLoopResult<T> {
  /** The final generation result. */
  result: T;
  /** Quality gate evaluation details. */
  quality: QualityGateResult;
  /** The prompt used for the final (accepted) generation. */
  finalPrompt: string;
}

export const DEFAULT_QUALITY_GATE = {
  deviationThreshold: 40,
  maxRetries: 2,
} as const;

// ============================================================================
// QualityController
// ============================================================================

export class QualityController<T> {
  private readonly config: QualityGateConfig<T>;

  constructor(config: QualityGateConfig<T>) {
    this.config = config;
  }

  /**
   * Evaluate a single result against the quality gate.
   * Does not trigger retries — just returns the verdict.
   */
  evaluate(result: T, attempt: number): QualityGateResult {
    const deviationScore = this.config.scorer(result);
    const withinThreshold = deviationScore <= this.config.deviationThreshold;
    const retriesExhausted = attempt >= this.config.maxRetries;

    return {
      accepted: withinThreshold || retriesExhausted,
      deviationScore,
      attempt,
      wasRetried: attempt > 0,
      forcedAccept: !withinThreshold && retriesExhausted,
    };
  }

  /**
   * Strengthen the prompt for the next retry attempt.
   * Returns the original prompt if no strengthener is configured.
   */
  strengthenPrompt(prompt: string, attempt: number): string {
    if (!this.config.strengthener) return prompt;
    return this.config.strengthener(prompt, attempt);
  }

  /**
   * Run the full closed-loop: generate → evaluate → strengthen → retry.
   *
   * @param generate - Async function that produces a result given a prompt and attempt number.
   * @param initialPrompt - The starting prompt.
   * @param onAttempt - Optional callback fired before each attempt (useful for UI updates).
   * @returns The final result with quality metadata.
   */
  async runLoop(
    generate: (prompt: string, attempt: number) => Promise<T>,
    initialPrompt: string,
    onAttempt?: (attempt: number, prompt: string) => void,
  ): Promise<QualityLoopResult<T>> {
    let currentPrompt = initialPrompt;
    let attempt = 0;

    while (true) {
      onAttempt?.(attempt, currentPrompt);

      const result = await generate(currentPrompt, attempt);
      const evaluation = this.evaluate(result, attempt);

      if (evaluation.accepted) {
        return {
          result,
          quality: evaluation,
          finalPrompt: currentPrompt,
        };
      }

      // Prepare next retry
      attempt++;
      currentPrompt = this.strengthenPrompt(currentPrompt, attempt);
    }
  }

  /** Access the current configuration (read-only). */
  get threshold(): number {
    return this.config.deviationThreshold;
  }

  get maxRetries(): number {
    return this.config.maxRetries;
  }
}
