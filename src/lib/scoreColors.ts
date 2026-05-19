/**
 * Score-to-color mapping utility.
 *
 * Replaces duplicated inline closures across analytics/consistency components.
 * Thresholds are checked from first to last; the first level where score >= min wins.
 */

export interface ScoreThreshold<T = string> {
  readonly min: number;
  readonly value: T;
}

/**
 * Map a numeric score to a value based on descending threshold levels.
 *
 * @example
 * getScoreColor(85, SCORE_3TIER_TEXT)     // 'text-emerald-400'
 * getScoreColor(55, SCORE_4TIER_TEXT)     // 'text-cyan-400'
 * getScoreColor(30, SCORE_4TIER_HEALTH)  // { bg: 'bg-red-500', text: 'text-red-400', ring: 'ring-red-500/30' }
 */
export function getScoreColor<T>(score: number, thresholds: readonly ScoreThreshold<T>[]): T {
  for (const t of thresholds) {
    if (score >= t.min) return t.value;
  }
  return thresholds[thresholds.length - 1].value;
}

// ---------------------------------------------------------------------------
// Presets — text color classes
// ---------------------------------------------------------------------------

/** 75/50 thresholds — emerald / amber / red */
export const SCORE_3TIER_TEXT = [
  { min: 75, value: 'text-emerald-400' },
  { min: 50, value: 'text-amber-400' },
  { min: 0, value: 'text-red-400' },
] as const;

/** 75/50 thresholds — stroke variant */
export const SCORE_3TIER_STROKE = [
  { min: 75, value: 'stroke-emerald-400' },
  { min: 50, value: 'stroke-amber-400' },
  { min: 0, value: 'stroke-red-400' },
] as const;

/** 75/50 thresholds — bg variant */
export const SCORE_3TIER_BG = [
  { min: 75, value: 'bg-emerald-500' },
  { min: 50, value: 'bg-amber-500' },
  { min: 0, value: 'bg-red-500' },
] as const;

/** 80/60/40 thresholds — emerald / cyan / amber / red */
export const SCORE_4TIER_TEXT = [
  { min: 80, value: 'text-emerald-400' },
  { min: 60, value: 'text-cyan-400' },
  { min: 40, value: 'text-amber-400' },
  { min: 0, value: 'text-red-400' },
] as const;

export interface HealthScoreColors {
  bg: string;
  text: string;
  ring: string;
}

/** 80/60/40 thresholds — compound classes (bg + text + ring) */
export const SCORE_4TIER_HEALTH: readonly ScoreThreshold<HealthScoreColors>[] = [
  { min: 80, value: { bg: 'bg-emerald-500', text: 'text-emerald-400', ring: 'ring-emerald-500/30' } },
  { min: 60, value: { bg: 'bg-cyan-500', text: 'text-cyan-400', ring: 'ring-cyan-500/30' } },
  { min: 40, value: { bg: 'bg-amber-500', text: 'text-amber-400', ring: 'ring-amber-500/30' } },
  { min: 0, value: { bg: 'bg-red-500', text: 'text-red-400', ring: 'ring-red-500/30' } },
];
