/**
 * Layout Engine — Size-aware CSS Grid layout system for workspace panels.
 *
 * Each layout defines CSS grid templates and slot specifications.
 * Slots declare which panel sizes they accept and which roles they prefer.
 * The engine uses permutation-based scoring to optimally assign panels to slots.
 */

import type { WorkspaceLayout, WorkspacePanelInstance, PanelRole, PanelSizeClass } from '../types';
import { PANEL_REGISTRY } from './panelRegistry';

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

// ─── Layout Templates ────────────────────────────────────

export const LAYOUT_TEMPLATES: Record<WorkspaceLayout, LayoutTemplate> = {
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
    gridTemplateColumns: '1fr 280px',
    slots: [
      slot({ gridRow: '1', gridColumn: '1' }, ALL_SIZES, 'primary'),
      slot({ gridRow: '1', gridColumn: '2' }, ['compact'], 'sidebar', true),
    ],
  },
  triptych: {
    id: 'triptych',
    label: 'Triptych',
    gridTemplateRows: '1fr',
    gridTemplateColumns: '250px 1fr 280px',
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
    gridTemplateColumns: '240px 1fr 260px',
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

// ─── Permutation Helper ──────────────────────────────────

function getPermutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of getPermutations(rest)) {
      result.push([arr[i], ...perm]);
    }
  }
  return result;
}

// ─── Scoring ─────────────────────────────────────────────

function scoreAssignment(perm: WorkspacePanelInstance[], slots: SlotSpec[]): number {
  let score = 0;
  for (let i = 0; i < perm.length; i++) {
    const s = slots[i];
    const entry = PANEL_REGISTRY[perm[i].type];
    score += s.acceptsSizes.includes(entry.sizeClass) ? 15 : -25;
    score += perm[i].role === s.preferredRole ? 5 : 0;
    score += (entry.sizeClass === 'compact' && s.isNarrow) ? 3 : 0;
    score += Math.max(0, 6 - perm[i].slotIndex * 0.5);
  }
  return score;
}

const LAYOUT_COUNT_PRIOR: Record<WorkspaceLayout, Record<number, number>> = {
  single: { 1: 36, 2: -12, 3: -24, 4: -32 },
  'split-2': { 1: -10, 2: 28, 3: -6, 4: -16 },
  'split-3': { 1: -18, 2: 4, 3: 24, 4: -8 },
  'grid-4': { 1: -24, 2: -8, 3: 10, 4: 22 },
  'primary-sidebar': { 1: -8, 2: 16, 3: 2, 4: -12 },
  triptych: { 1: -18, 2: 10, 3: 18, 4: -10 },
  studio: { 1: -30, 2: -20, 3: 8, 4: 20 },
};

function getCountPrior(layout: WorkspaceLayout, panelCount: number): number {
  const clampedCount = Math.min(4, Math.max(1, panelCount));
  return LAYOUT_COUNT_PRIOR[layout][clampedCount] ?? 0;
}

function getSlotUtilizationBonus(layout: WorkspaceLayout, panelCount: number): number {
  const slotCount = LAYOUT_TEMPLATES[layout].slots.length;
  const unused = Math.max(0, slotCount - panelCount);
  return -unused * 6;
}

function rankPanelForSlot(panel: WorkspacePanelInstance, slot: SlotSpec): number {
  const entry = PANEL_REGISTRY[panel.type];
  let score = 0;
  score += slot.acceptsSizes.includes(entry.sizeClass) ? 15 : -25;
  score += panel.role === slot.preferredRole ? 6 : 0;
  score += (entry.sizeClass === 'compact' && slot.isNarrow) ? 4 : 0;
  return score;
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
    const stabilityBoost = Math.max(0, 8 - panel.slotIndex * 0.75);
    return {
      panel,
      score: bestSlotScore + rolePriorityBoost + stabilityBoost,
    };
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, slotCount).map((item) => item.panel);
}

// ─── Panel-to-Slot Assignment ────────────────────────────

export function assignPanelsToSlots(
  panels: WorkspacePanelInstance[],
  layout: WorkspaceLayout,
): WorkspacePanelInstance[] {
  const template = LAYOUT_TEMPLATES[layout];

  if (panels.length === 0) return [];

  const candidates = pickCandidatesForTemplate(panels, template);

  if (candidates.length <= 1) return candidates;

  const perms = getPermutations(candidates);
  let bestPerm = perms[0];
  let bestScore = -Infinity;

  for (const perm of perms) {
    const score = scoreAssignment(perm, template.slots);
    if (score > bestScore) {
      bestScore = score;
      bestPerm = perm;
    }
  }

  return bestPerm;
}

// ─── Layout Fitness ──────────────────────────────────────

export function computeLayoutFitness(
  layout: WorkspaceLayout,
  panels: WorkspacePanelInstance[],
): number {
  const template = LAYOUT_TEMPLATES[layout];
  const slotCount = template.slots.length;
  if (panels.length === 0) return layout === 'single' ? 0 : -100;

  let score = 0;

  score += getCountPrior(layout, panels.length);
  score += getSlotUtilizationBonus(layout, panels.length);

  const diff = panels.length - slotCount;
  if (diff === 0) score += 40;
  else if (diff > 0) score -= diff * 25;
  else score -= Math.abs(diff) * 15;

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
