/**
 * Layout Engine — Size-aware CSS Grid layout system for workspace panels.
 *
 * Each layout defines CSS grid templates and slot specifications.
 * Slots declare which panel sizes they accept and which roles they prefer.
 * The engine uses the Hungarian algorithm (O(n³)) for optimal panel-to-slot assignment,
 * replacing the previous O(n!) permutation-based approach.
 */

import type {
  WorkspaceLayout,
  WorkspacePanelInstance,
  PanelRole,
  PanelSizeClass,
  PanelComplexity,
  PanelDensity,
  SpatialBudget,
  SpatialOption,
} from '../types';
import { PANEL_REGISTRY } from './panelRegistry';
import { createScoringEngine, type ScoringCriterion, type ScoringEngine } from '@/lib/scoring';

// ─── Types ───────────────────────────────────────────────

export interface SlotSpec {
  style: React.CSSProperties;
  acceptsSizes: PanelSizeClass[];
  preferredRole: PanelRole;
  isNarrow: boolean;
}

export interface LayoutTemplate {
  id: WorkspaceLayout;
  label: string;
  gridTemplateRows: string;
  gridTemplateColumns: string;
  slots: SlotSpec[];
}

// ─── Helpers ─────────────────────────────────────────────

const ALL_SIZES: PanelSizeClass[] = ['compact', 'standard', 'wide'];

function slot(
  style: React.CSSProperties,
  acceptsSizes: PanelSizeClass[],
  preferredRole: PanelRole,
  isNarrow = false,
): SlotSpec {
  return { style, acceptsSizes, preferredRole, isNarrow };
}

// ─── Responsive Breakpoints ─────────────────────────────

export const VIEWPORT_BREAKPOINTS = {
  /** Below this: force stack */
  mobile: 768,
  /** Below this: max split-2 / primary-sidebar */
  tablet: 1024,
  /** Below this: no triptych / grid-4 / studio */
  desktop: 1280,
} as const;

/**
 * Returns the set of layouts allowed at a given viewport width.
 * Layouts not in this set should be auto-downgraded.
 */
export function getAllowedLayouts(viewportWidth: number): Set<WorkspaceLayout> {
  if (viewportWidth < VIEWPORT_BREAKPOINTS.mobile) {
    return new Set<WorkspaceLayout>(['stack', 'single']);
  }
  if (viewportWidth < VIEWPORT_BREAKPOINTS.tablet) {
    return new Set<WorkspaceLayout>(['stack', 'single', 'split-2', 'primary-sidebar']);
  }
  if (viewportWidth < VIEWPORT_BREAKPOINTS.desktop) {
    return new Set<WorkspaceLayout>(['stack', 'single', 'split-2', 'split-3', 'primary-sidebar']);
  }
  // Full desktop — all layouts allowed
  return new Set<WorkspaceLayout>(LAYOUT_ORDER);
}

/**
 * Clamp a requested layout to the best allowed alternative for the current viewport.
 */
export function clampLayoutToViewport(
  requested: WorkspaceLayout,
  viewportWidth: number,
): WorkspaceLayout {
  const allowed = getAllowedLayouts(viewportWidth);
  if (allowed.has(requested)) return requested;

  // Downgrade: find the closest allowed layout in LAYOUT_ORDER (highest index that's allowed)
  const requestedIdx = LAYOUT_ORDER.indexOf(requested);
  for (let i = requestedIdx - 1; i >= 0; i--) {
    if (allowed.has(LAYOUT_ORDER[i])) return LAYOUT_ORDER[i];
  }
  // Fallback
  return viewportWidth < VIEWPORT_BREAKPOINTS.mobile ? 'stack' : 'single';
}

// ─── Layout Templates ────────────────────────────────────

export const LAYOUT_TEMPLATES: Record<WorkspaceLayout, LayoutTemplate> = {
  stack: {
    id: 'stack',
    label: 'Stack',
    gridTemplateRows: 'repeat(auto-fill, minmax(200px, 1fr))',
    gridTemplateColumns: '1fr',
    slots: [
      slot({ gridColumn: '1' }, ALL_SIZES, 'primary'),
      slot({ gridColumn: '1' }, ALL_SIZES, 'secondary'),
      slot({ gridColumn: '1' }, ALL_SIZES, 'tertiary'),
      slot({ gridColumn: '1' }, ALL_SIZES, 'sidebar'),
    ],
  },
  single: {
    id: 'single',
    label: 'Single',
    gridTemplateRows: '1fr',
    gridTemplateColumns: '1fr',
    slots: [
      slot({ gridRow: '1', gridColumn: '1' }, ALL_SIZES, 'primary'),
    ],
  },
  'split-2': {
    id: 'split-2',
    label: 'Split',
    gridTemplateRows: '1fr',
    gridTemplateColumns: '3fr 2fr',
    slots: [
      slot({ gridRow: '1', gridColumn: '1' }, ALL_SIZES, 'primary'),
      slot({ gridRow: '1', gridColumn: '2' }, ALL_SIZES, 'secondary'),
    ],
  },
  'split-3': {
    id: 'split-3',
    label: 'Triple',
    gridTemplateRows: '1fr 1fr',
    gridTemplateColumns: '3fr 2fr',
    slots: [
      slot({ gridRow: '1 / -1', gridColumn: '1' }, ALL_SIZES, 'primary'),
      slot({ gridRow: '1', gridColumn: '2' }, ALL_SIZES, 'secondary'),
      slot({ gridRow: '2', gridColumn: '2' }, ALL_SIZES, 'tertiary'),
    ],
  },
  'grid-4': {
    id: 'grid-4',
    label: 'Grid',
    gridTemplateRows: '1fr 1fr',
    gridTemplateColumns: '1fr 1fr',
    slots: [
      slot({ gridRow: '1', gridColumn: '1' }, ALL_SIZES, 'primary'),
      slot({ gridRow: '1', gridColumn: '2' }, ALL_SIZES, 'secondary'),
      slot({ gridRow: '2', gridColumn: '1' }, ALL_SIZES, 'tertiary'),
      slot({ gridRow: '2', gridColumn: '2' }, ALL_SIZES, 'sidebar'),
    ],
  },
  'primary-sidebar': {
    id: 'primary-sidebar',
    label: 'Sidebar',
    gridTemplateRows: '1fr',
    gridTemplateColumns: '1fr clamp(200px, 18vw, 280px)',
    slots: [
      slot({ gridRow: '1', gridColumn: '1' }, ALL_SIZES, 'primary'),
      slot({ gridRow: '1', gridColumn: '2' }, ['compact'], 'sidebar', true),
    ],
  },
  triptych: {
    id: 'triptych',
    label: 'Triptych',
    gridTemplateRows: '1fr',
    gridTemplateColumns: 'clamp(200px, 18vw, 250px) 1fr clamp(200px, 18vw, 280px)',
    slots: [
      slot({ gridRow: '1', gridColumn: '1' }, ['compact'], 'sidebar', true),
      slot({ gridRow: '1', gridColumn: '2' }, ALL_SIZES, 'primary'),
      slot({ gridRow: '1', gridColumn: '3' }, ['compact'], 'sidebar', true),
    ],
  },
  studio: {
    id: 'studio',
    label: 'Studio',
    gridTemplateRows: '42px 1fr 160px',
    gridTemplateColumns: 'clamp(200px, 18vw, 240px) 1fr clamp(200px, 18vw, 260px)',
    slots: [
      slot({ gridRow: '1', gridColumn: '1 / -1' }, ['compact'], 'tertiary', true),
      slot({ gridRow: '2', gridColumn: '1' }, ['compact'], 'sidebar', true),
      slot({ gridRow: '2', gridColumn: '2' }, ALL_SIZES, 'primary'),
      slot({ gridRow: '2', gridColumn: '3' }, ['compact'], 'sidebar', true),
      slot({ gridRow: '3', gridColumn: '1 / -1' }, ['compact', 'standard'], 'secondary'),
    ],
  },
};

// ─── Role Priority ───────────────────────────────────────

const ROLE_PRIORITY: PanelRole[] = ['primary', 'secondary', 'tertiary', 'sidebar'];

export function sortPanelsByRole(panels: WorkspacePanelInstance[]): WorkspacePanelInstance[] {
  return [...panels].sort((a, b) => {
    const aIdx = ROLE_PRIORITY.indexOf(a.role);
    const bIdx = ROLE_PRIORITY.indexOf(b.role);
    return aIdx - bIdx;
  });
}

// ─── Hungarian Algorithm (O(n³) Assignment Solver) ──────

/**
 * Solves the assignment problem: given an n×n cost matrix,
 * find a 1-to-1 assignment of rows to columns that minimizes total cost.
 * Returns an array where result[row] = assigned column index.
 *
 * We negate scores to convert our maximization problem into minimization.
 * Uses the classic Hungarian (Kuhn-Munkres) algorithm.
 */
function hungarianSolve(costMatrix: number[][]): number[] {
  const n = costMatrix.length;
  if (n === 0) return [];

  // u[i], v[j] = potentials for workers/jobs (1-indexed, 0 is dummy)
  const u = new Float64Array(n + 1);
  const v = new Float64Array(n + 1);
  // p[j] = worker assigned to job j
  const p = new Int32Array(n + 1);
  // way[j] = previous job in the augmenting path to j
  const way = new Int32Array(n + 1);

  for (let i = 1; i <= n; i++) {
    // Start augmenting path from worker i
    p[0] = i;
    let j0 = 0;
    const minv = new Float64Array(n + 1).fill(Infinity);
    const used = new Uint8Array(n + 1);

    do {
      used[j0] = 1;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;

      for (let j = 1; j <= n; j++) {
        if (used[j]) continue;
        const cur = costMatrix[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) {
          minv[j] = cur;
          way[j] = j0;
        }
        if (minv[j] < delta) {
          delta = minv[j];
          j1 = j;
        }
      }

      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }

      j0 = j1;
    } while (p[j0] !== 0);

    // Trace augmenting path back
    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }

  // Convert: result[row] = column
  const result = new Array<number>(n);
  for (let j = 1; j <= n; j++) {
    if (p[j] !== 0) {
      result[p[j] - 1] = j - 1;
    }
  }
  return result;
}

// ─── Scoring Configuration ────────────────────────────────
//
// All tunable scoring constants are grouped here. Each value has a JSDoc
// explaining its purpose and how changing it affects layout selection.
//
// **How scoring works (in brief)**:
//   1. Each layout gets a "fitness" score for a given set of panels.
//   2. The layout with the highest fitness wins.
//   3. Fitness = count prior + slot utilization bonus + count match bonus + sum of per-panel scores.
//   4. Per-panel scores reward size/role matches and penalize mismatches.
//

/**
 * Central configuration for all layout-engine scoring constants.
 *
 * To tune layout behavior (e.g., prefer triptych for 3-panel compositions),
 * adjust the relevant values here rather than hunting through scoring functions.
 */
export const SCORING_CONFIG = {
  // ── Per-panel scoring (scorePanelInSlot) ──────────────

  /** Bonus when a panel's sizeClass is accepted by the slot. Higher = stronger preference for matching. */
  SIZE_MATCH_BONUS: 15,
  /** Penalty when a panel's sizeClass is NOT accepted by the slot. More negative = harder rejection. */
  SIZE_MISMATCH_PENALTY: -25,
  /** Bonus when a panel's role matches the slot's preferred role. */
  ROLE_MATCH_BONUS: 5,
  /** Bonus when a compact panel is placed in a narrow slot (natural fit). */
  COMPACT_IN_NARROW_BONUS: 3,

  /** Max stability bonus for panels retaining their current slot position. Decays with slot index. */
  SLOT_STABILITY_MAX: 6,
  /** Rate at which stability bonus decays per slot index. score = max(0, MAX - index * DECAY). */
  SLOT_STABILITY_DECAY: 0.5,

  /** Penalty for placing a high-complexity panel in a narrow slot (too cramped). */
  HIGH_COMPLEXITY_NARROW_PENALTY: -12,
  /** Bonus for placing a low-complexity panel in a narrow slot (simple content fits well). */
  LOW_COMPLEXITY_NARROW_BONUS: 4,
  /** Bonus for placing a high-complexity panel in a wide slot (room to breathe). */
  HIGH_COMPLEXITY_WIDE_BONUS: 3,

  // ── Candidate ranking (pickCandidatesForTemplate) ─────

  /** Elevated role-match bonus used when ranking which panels to include in a layout. */
  RANK_ROLE_MATCH_BONUS: 6,
  /** Elevated compact-narrow bonus used when ranking candidates. */
  RANK_COMPACT_NARROW_BONUS: 4,
  /** Max stability boost when ranking candidates. Prevents recently-added panels from evicting established ones. */
  CANDIDATE_STABILITY_MAX: 8,
  /** Rate at which candidate stability decays per slot index. score = max(0, MAX - index * DECAY). */
  CANDIDATE_STABILITY_DECAY: 0.75,

  // ── Slot utilization ──────────────────────────────────

  /** Penalty per empty (unused) slot in the chosen layout. Discourages oversized layouts. */
  UNUSED_SLOT_PENALTY: -6,

  // ── Layout fitness (computeLayoutFitness) ─────────────

  /** Large bonus when panel count exactly matches slot count (perfect fit). */
  EXACT_COUNT_MATCH_BONUS: 40,
  /** Per-panel penalty when there are MORE panels than slots (overflow — panels get dropped). */
  OVERFLOW_PANEL_PENALTY: -25,
  /** Per-slot penalty when there are FEWER panels than slots (underflow — empty slots). */
  UNDERFLOW_SLOT_PENALTY: -15,
  /** Score returned for non-single layouts when there are zero panels. */
  EMPTY_LAYOUT_PENALTY: -100,

  // ── Layout-count prior table ──────────────────────────
  //
  // Encodes a "natural affinity" between each layout and a panel count.
  // Positive = this layout is a good default for N panels.
  // Negative = this layout is a poor match for N panels.
  //
  // Rows: layout type.  Columns: clamped panel count (1–4).
  //
  // Example: single has +36 for 1 panel (ideal) but -32 for 4 panels (terrible).
  //          grid-4 has +22 for 4 panels (ideal) but -24 for 1 panel (wasteful).
  //
  COUNT_PRIOR: {
    stack:             { 1: -20, 2: -10, 3:  -5, 4:  -5 },  // Stack is a fallback, never strongly preferred
    single:            { 1:  36, 2: -12, 3: -24, 4: -32 },  // Ideal for 1, penalizes having >1 panel
    'split-2':         { 1: -10, 2:  28, 3:  -6, 4: -16 },  // Designed for 2-panel compositions
    'split-3':         { 1: -18, 2:   4, 3:  24, 4:  -8 },  // Sweet spot at 3 panels
    'grid-4':          { 1: -24, 2:  -8, 3:  10, 4:  22 },  // Best at 4, acceptable at 3
    'primary-sidebar': { 1:  -8, 2:  16, 3:   2, 4: -12 },  // Sidebar layout, best at 2
    triptych:          { 1: -18, 2:  10, 3:  18, 4: -10 },  // 3-column, peaks at 3
    studio:            { 1: -30, 2: -20, 3:   8, 4:  20 },  // Complex 5-slot layout, needs 3–4+ panels
  },
} as const;

interface ScoringWeights {
  sizeMatch?: number;
  sizeMiss?: number;
  roleMatch?: number;
  compactNarrow?: number;
  includeSlotIndex?: boolean;
}

const DEFAULT_WEIGHTS: Required<ScoringWeights> = {
  sizeMatch: SCORING_CONFIG.SIZE_MATCH_BONUS,
  sizeMiss: SCORING_CONFIG.SIZE_MISMATCH_PENALTY,
  roleMatch: SCORING_CONFIG.ROLE_MATCH_BONUS,
  compactNarrow: SCORING_CONFIG.COMPACT_IN_NARROW_BONUS,
  includeSlotIndex: true,
};

// ─── Layout Scoring via Generic ScoringEngine ────────────
//
// Panel-to-slot scoring is expressed as ScoringCriterion[] and evaluated by
// createScoringEngine. This makes the criteria declarative and provides
// per-criterion breakdown for debugging layout decisions.

/** Build panel-to-slot scoring criteria from a weight configuration. */
function createPanelSlotCriteria(
  w: Required<ScoringWeights>,
): ScoringCriterion<WorkspacePanelInstance, SlotSpec>[] {
  const criteria: ScoringCriterion<WorkspacePanelInstance, SlotSpec>[] = [
    {
      name: 'sizeMatch',
      weight: w.sizeMatch,
      match: (panel, slot) => {
        const entry = PANEL_REGISTRY[panel.type];
        return slot.acceptsSizes.includes(entry.sizeClass) ? 1 : 0;
      },
    },
    {
      name: 'sizeMismatch',
      weight: w.sizeMiss,
      match: (panel, slot) => {
        const entry = PANEL_REGISTRY[panel.type];
        return !slot.acceptsSizes.includes(entry.sizeClass) ? 1 : 0;
      },
    },
    {
      name: 'roleMatch',
      weight: w.roleMatch,
      match: (panel, slot) => panel.role === slot.preferredRole ? 1 : 0,
    },
    {
      name: 'compactNarrow',
      weight: w.compactNarrow,
      match: (panel, slot) => {
        const entry = PANEL_REGISTRY[panel.type];
        return (entry.sizeClass === 'compact' && slot.isNarrow) ? 1 : 0;
      },
    },
    {
      name: 'highComplexityNarrow',
      weight: SCORING_CONFIG.HIGH_COMPLEXITY_NARROW_PENALTY,
      match: (panel, slot) => {
        const c = PANEL_REGISTRY[panel.type].complexity ?? 'medium';
        return (c === 'high' && slot.isNarrow) ? 1 : 0;
      },
    },
    {
      name: 'lowComplexityNarrow',
      weight: SCORING_CONFIG.LOW_COMPLEXITY_NARROW_BONUS,
      match: (panel, slot) => {
        const c = PANEL_REGISTRY[panel.type].complexity ?? 'medium';
        return (c === 'low' && slot.isNarrow) ? 1 : 0;
      },
    },
    {
      name: 'highComplexityWide',
      weight: SCORING_CONFIG.HIGH_COMPLEXITY_WIDE_BONUS,
      match: (panel, slot) => {
        const c = PANEL_REGISTRY[panel.type].complexity ?? 'medium';
        return (c === 'high' && !slot.isNarrow && slot.acceptsSizes.includes('wide')) ? 1 : 0;
      },
    },
  ];

  if (w.includeSlotIndex) {
    criteria.push({
      name: 'slotStability',
      weight: 1,
      match: (panel) =>
        Math.max(0, SCORING_CONFIG.SLOT_STABILITY_MAX - panel.slotIndex * SCORING_CONFIG.SLOT_STABILITY_DECAY),
    });
  }

  return criteria;
}

const RANK_WEIGHTS: ScoringWeights = {
  roleMatch: SCORING_CONFIG.RANK_ROLE_MATCH_BONUS,
  compactNarrow: SCORING_CONFIG.RANK_COMPACT_NARROW_BONUS,
  includeSlotIndex: false,
};

/** Default panel-to-slot scorer (used in assignment and fitness). */
const defaultPanelScorer: ScoringEngine<WorkspacePanelInstance, SlotSpec> =
  createScoringEngine(createPanelSlotCriteria(DEFAULT_WEIGHTS));

/** Ranking scorer (elevated role/compact weights, no slot stability). */
const rankPanelScorer: ScoringEngine<WorkspacePanelInstance, SlotSpec> =
  createScoringEngine(createPanelSlotCriteria({ ...DEFAULT_WEIGHTS, ...RANK_WEIGHTS }));

/** Exported for testing and debugging layout decisions. */
export { createPanelSlotCriteria };

function scoreAssignment(perm: WorkspacePanelInstance[], slots: SlotSpec[]): number {
  return perm.reduce((sum, panel, i) => sum + scorePanelInSlot(panel, slots[i]), 0);
}

function getCountPrior(layout: WorkspaceLayout, panelCount: number): number {
  const clampedCount = Math.min(4, Math.max(1, panelCount));
  return SCORING_CONFIG.COUNT_PRIOR[layout][clampedCount as 1 | 2 | 3 | 4] ?? 0;
}

function getSlotUtilizationBonus(layout: WorkspaceLayout, panelCount: number): number {
  const slotCount = LAYOUT_TEMPLATES[layout].slots.length;
  const unused = Math.max(0, slotCount - panelCount);
  return unused * SCORING_CONFIG.UNUSED_SLOT_PENALTY;
}

function rankPanelForSlot(panel: WorkspacePanelInstance, slot: SlotSpec): number {
  return rankPanelScorer.scoreOne(panel, slot).score;
}

function pickCandidatesForTemplate(
  panels: WorkspacePanelInstance[],
  template: LayoutTemplate,
): WorkspacePanelInstance[] {
  const slotCount = template.slots.length;
  if (panels.length <= slotCount) return [...panels];

  const ranked = [...panels].map((panel) => {
    const slotScores = template.slots.map((slot) => rankPanelForSlot(panel, slot));
    const bestSlotScore = Math.max(...slotScores);
    const rolePriorityBoost = ROLE_PRIORITY.length - ROLE_PRIORITY.indexOf(panel.role);
    const stabilityBoost = Math.max(0, SCORING_CONFIG.CANDIDATE_STABILITY_MAX - panel.slotIndex * SCORING_CONFIG.CANDIDATE_STABILITY_DECAY);
    return {
      panel,
      score: bestSlotScore + rolePriorityBoost + stabilityBoost,
    };
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, slotCount).map((item) => item.panel);
}

// ─── Panel-to-Slot Assignment ────────────────────────────

/**
 * Score a single panel placed in a specific slot (used to build cost matrix).
 *
 * Delegates to the generic ScoringEngine. Uses the default scorer for normal
 * assignment and creates an on-demand scorer for custom weight overrides.
 */
function scorePanelInSlot(panel: WorkspacePanelInstance, s: SlotSpec, weights?: ScoringWeights): number {
  if (!weights) {
    return defaultPanelScorer.scoreOne(panel, s).score;
  }
  // Custom weights — create scorer on demand (rare path, only used by rank overrides)
  const merged = { ...DEFAULT_WEIGHTS, ...weights };
  return createScoringEngine(createPanelSlotCriteria(merged)).scoreOne(panel, s).score;
}

export function assignPanelsToSlots(
  panels: WorkspacePanelInstance[],
  layout: WorkspaceLayout,
): WorkspacePanelInstance[] {
  const template = LAYOUT_TEMPLATES[layout];

  if (panels.length === 0) return [];

  const candidates = pickCandidatesForTemplate(panels, template);

  if (candidates.length <= 1) return candidates;

  const n = Math.max(candidates.length, template.slots.length);

  // Build cost matrix (negated scores — Hungarian minimizes)
  const costMatrix: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      if (i < candidates.length && j < template.slots.length) {
        row.push(-scorePanelInSlot(candidates[i], template.slots[j]));
      } else {
        // Dummy row/col: zero cost (no real panel or slot)
        row.push(0);
      }
    }
    costMatrix.push(row);
  }

  const assignment = hungarianSolve(costMatrix);

  // Build result: ordered by slot index
  const result: WorkspacePanelInstance[] = new Array(
    Math.min(candidates.length, template.slots.length)
  );
  for (let i = 0; i < candidates.length; i++) {
    const slotIdx = assignment[i];
    if (slotIdx < template.slots.length) {
      result[slotIdx] = candidates[i];
    }
  }

  // Filter out any undefined entries (from dummy assignments)
  return result.filter(Boolean);
}

// ─── Layout Fitness ──────────────────────────────────────

export function computeLayoutFitness(
  layout: WorkspaceLayout,
  panels: WorkspacePanelInstance[],
): number {
  const template = LAYOUT_TEMPLATES[layout];
  const slotCount = template.slots.length;
  if (panels.length === 0) return layout === 'single' ? 0 : SCORING_CONFIG.EMPTY_LAYOUT_PENALTY;

  let score = 0;

  score += getCountPrior(layout, panels.length);
  score += getSlotUtilizationBonus(layout, panels.length);

  const diff = panels.length - slotCount;
  if (diff === 0) score += SCORING_CONFIG.EXACT_COUNT_MATCH_BONUS;
  else if (diff > 0) score += diff * SCORING_CONFIG.OVERFLOW_PANEL_PENALTY;
  else score += Math.abs(diff) * SCORING_CONFIG.UNDERFLOW_SLOT_PENALTY;

  const assigned = assignPanelsToSlots(panels, layout);
  score += scoreAssignment(assigned, template.slots);

  return score;
}

export function getLayoutFitnesses(
  panels: WorkspacePanelInstance[],
): Record<WorkspaceLayout, number> {
  const result = {} as Record<WorkspaceLayout, number>;
  for (const layout of LAYOUT_ORDER) {
    result[layout] = computeLayoutFitness(layout, panels);
  }
  return result;
}

// ─── Layout Resolution ───────────────────────────────────

export function resolveLayout(panels: WorkspacePanelInstance[]): WorkspaceLayout {
  if (panels.length === 0) return 'single';

  return LAYOUT_ORDER
    .map(layout => ({ layout, score: computeLayoutFitness(layout, panels) }))
    .sort((a, b) => b.score - a.score)[0].layout;
}

export function resolvePreferredLayout(
  panels: WorkspacePanelInstance[],
  preferredLayout?: WorkspaceLayout,
  minPreferredFitness = 25,
): WorkspaceLayout {
  if (!preferredLayout) return resolveLayout(panels);
  const preferredScore = computeLayoutFitness(preferredLayout, panels);
  if (preferredScore >= minPreferredFitness) return preferredLayout;
  return resolveLayout(panels);
}

// ─── Utilities ───────────────────────────────────────────

export function getLayoutTemplate(layout: WorkspaceLayout): LayoutTemplate {
  return LAYOUT_TEMPLATES[layout];
}

export const LAYOUT_ORDER: WorkspaceLayout[] = [
  'stack',
  'single',
  'split-2',
  'split-3',
  'grid-4',
  'primary-sidebar',
  'triptych',
  'studio',
];

export function getNextLayout(current: WorkspaceLayout): WorkspaceLayout {
  const idx = LAYOUT_ORDER.indexOf(current);
  return LAYOUT_ORDER[(idx + 1) % LAYOUT_ORDER.length];
}

// ─── Spatial Budget ───────────────────────────────────────

/** Density levels a slot can accept based on its pixel dimensions */
function slotDensities(widthPx: number, heightPx: number): PanelDensity[] {
  const densities: PanelDensity[] = [];
  if (heightPx >= 48) densities.push('micro');
  if (widthPx >= 140 && heightPx >= 100) densities.push('compact');
  if (widthPx >= 250 && heightPx >= 180) densities.push('full');
  return densities;
}

/** Map a role to a description string */
function roleLabel(role: PanelRole): string {
  const labels: Record<PanelRole, string> = {
    primary: 'main focus area',
    secondary: 'supporting panel',
    tertiary: 'minor/toolbar area',
    sidebar: 'narrow navigation column',
  };
  return labels[role] ?? role;
}

/**
 * Compute spatial budget for the LLM — describes available viewport space,
 * pre-computed layout options with slot dimensions, and current composition.
 */
export function computeSpatialBudget(
  viewportWidth: number,
  viewportHeight: number,
  currentPanels: WorkspacePanelInstance[],
  currentLayout: WorkspaceLayout,
): SpatialBudget {
  // Header is ~40px, command bar collapsed is ~36px
  const headerHeight = 40;
  const commandBarHeight = 36;
  const availableHeight = viewportHeight - headerHeight - commandBarHeight;
  const availableWidth = viewportWidth;

  const allowed = getAllowedLayouts(viewportWidth);

  const options: SpatialOption[] = [];
  for (const layoutId of LAYOUT_ORDER) {
    if (!allowed.has(layoutId)) continue;

    const template = LAYOUT_TEMPLATES[layoutId];
    const slots = template.slots.map((s) => {
      // Estimate slot pixel dimensions from grid template
      const { widthPx, heightPx } = estimateSlotDimensions(
        template, s, availableWidth, availableHeight
      );
      return {
        role: s.preferredRole,
        acceptsDensity: slotDensities(widthPx, heightPx),
        widthPx,
        heightPx,
      };
    });

    options.push({
      layout: layoutId,
      maxPanels: template.slots.length,
      description: template.label,
      slots,
    });
  }

  return {
    viewport: { width: viewportWidth, height: viewportHeight },
    availableGrid: { width: availableWidth, height: availableHeight },
    currentComposition: currentPanels.map((p) => ({
      type: p.type,
      density: p.density ?? 'full',
      role: p.role,
    })),
    options,
  };
}

// ─── Auto-Density Compaction ──────────────────────────────

/** Density hierarchy from most to least compact */
const DENSITY_ORDER: PanelDensity[] = ['micro', 'compact', 'full'];

/**
 * Auto-compact panels whose current density exceeds what the slot can fit.
 *
 * For each panel assigned to a slot, compute the slot's pixel dimensions and
 * determine which density levels fit via `slotDensities()`. If the panel's
 * current density is not supported, downgrade to the best available density.
 *
 * Returns a map of panelId → compacted density for panels that were changed,
 * plus the full set of updated panels.
 */
export function autoCompactPanels(
  panels: WorkspacePanelInstance[],
  layout: WorkspaceLayout,
  viewportWidth: number,
  viewportHeight: number,
): { compactedIds: Set<string>; panels: WorkspacePanelInstance[] } {
  const template = LAYOUT_TEMPLATES[layout];
  const headerHeight = 40;
  const commandBarHeight = 36;
  const availableHeight = viewportHeight - headerHeight - commandBarHeight;
  const availableWidth = viewportWidth;

  const compactedIds = new Set<string>();
  const updatedPanels = panels.map((panel, i) => {
    const slotSpec = template.slots[i];
    if (!slotSpec) return panel;

    const { widthPx, heightPx } = estimateSlotDimensions(
      template, slotSpec, availableWidth, availableHeight,
    );
    const allowed = slotDensities(widthPx, heightPx);
    const currentDensity = panel.density ?? 'full';

    // If the current density is already supported, no change needed
    if (allowed.includes(currentDensity)) return panel;

    // Find the best (highest-fidelity) allowed density
    const bestAllowed = [...DENSITY_ORDER].reverse().find(d => allowed.includes(d));
    if (!bestAllowed) return panel; // slot too small for anything — leave as-is

    // Only downgrade, never upgrade
    const currentIdx = DENSITY_ORDER.indexOf(currentDensity);
    const bestIdx = DENSITY_ORDER.indexOf(bestAllowed);
    if (bestIdx >= currentIdx) return panel; // bestAllowed is same or higher — no downgrade needed

    compactedIds.add(panel.id);
    return { ...panel, density: bestAllowed };
  });

  return { compactedIds, panels: updatedPanels };
}

/** Rough pixel estimate for a grid slot based on template proportions */
function estimateSlotDimensions(
  template: LayoutTemplate,
  slot: SlotSpec,
  totalWidth: number,
  totalHeight: number,
): { widthPx: number; heightPx: number } {
  const colParts = parseGridFractions(template.gridTemplateColumns, totalWidth);
  const rowParts = parseGridFractions(template.gridTemplateRows, totalHeight);

  const colSpec = slot.style.gridColumn as string | undefined;
  const rowSpec = slot.style.gridRow as string | undefined;

  const colRange = parseGridRange(colSpec, colParts.length);
  const rowRange = parseGridRange(rowSpec, rowParts.length);

  const widthPx = colParts.slice(colRange.start, colRange.end).reduce((a, b) => a + b, 0);
  const heightPx = rowParts.slice(rowRange.start, rowRange.end).reduce((a, b) => a + b, 0);

  return { widthPx: Math.round(widthPx), heightPx: Math.round(heightPx) };
}

/** Parse CSS grid template into pixel values, treating fr as proportional and clamp/px as fixed */
function parseGridFractions(template: string, totalPx: number): number[] {
  const parts = template.split(/\s+/);
  const values: { px: number | null; fr: number }[] = [];
  let totalFr = 0;
  let usedPx = 0;

  for (const part of parts) {
    const frMatch = part.match(/^(\d+(?:\.\d+)?)fr$/);
    if (frMatch) {
      const fr = parseFloat(frMatch[1]);
      totalFr += fr;
      values.push({ px: null, fr });
      continue;
    }

    const pxMatch = part.match(/^(\d+)px$/);
    if (pxMatch) {
      const px = parseInt(pxMatch[1]);
      usedPx += px;
      values.push({ px, fr: 0 });
      continue;
    }

    // clamp(min, preferred, max) — use the preferred value
    const clampMatch = part.match(/clamp\((\d+)px,\s*([^,]+),\s*(\d+)px\)/);
    if (clampMatch) {
      const min = parseInt(clampMatch[1]);
      const max = parseInt(clampMatch[3]);
      const mid = Math.round((min + max) / 2);
      usedPx += mid;
      values.push({ px: mid, fr: 0 });
      continue;
    }

    // repeat(auto-fill, ...) — treat as 1fr
    if (part.startsWith('repeat(')) {
      totalFr += 1;
      values.push({ px: null, fr: 1 });
      continue;
    }

    // Fallback: treat as 1fr
    totalFr += 1;
    values.push({ px: null, fr: 1 });
  }

  const remainingPx = Math.max(0, totalPx - usedPx);
  return values.map((v) => v.px ?? (totalFr > 0 ? (v.fr / totalFr) * remainingPx : 0));
}

/** Parse a grid line spec like "1 / -1" or "2" into {start, end} indices (0-based) */
function parseGridRange(spec: string | undefined, trackCount: number): { start: number; end: number } {
  if (!spec) return { start: 0, end: trackCount };

  const parts = spec.split('/').map((s) => s.trim());
  const parseLine = (s: string): number => {
    const n = parseInt(s);
    if (isNaN(n)) return 0;
    // CSS grid lines are 1-based; -1 means last
    return n < 0 ? trackCount + n + 1 : n;
  };

  const start = Math.max(0, parseLine(parts[0]) - 1);
  const end = parts.length > 1 ? Math.max(start + 1, parseLine(parts[1]) - 1) : start + 1;
  return { start, end: Math.min(end, trackCount) };
}
