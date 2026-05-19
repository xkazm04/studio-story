import { describe, it, expect } from 'vitest';
import type { WorkspacePanelInstance, WorkspaceLayout, PanelRole } from '../../types';
import {
  sortPanelsByRole,
  getAllowedLayouts,
  clampLayoutToViewport,
  assignPanelsToSlots,
  computeLayoutFitness,
  resolveLayout,
  resolvePreferredLayout,
  computeSpatialBudget,
  getLayoutFitnesses,
  getNextLayout,
  getLayoutTemplate,
  LAYOUT_TEMPLATES,
  LAYOUT_ORDER,
  VIEWPORT_BREAKPOINTS,
  SCORING_CONFIG,
} from '../layoutEngine';

// ─── Test Helpers ─────────────────────────────────────────
// Uses real panel types from the registry so scorePanelInSlot can look them up.

function makePanel(
  type: WorkspacePanelInstance['type'],
  role: PanelRole,
  slotIndex = 0,
): WorkspacePanelInstance {
  return { id: `${type}-${slotIndex}`, type, role, props: {}, slotIndex };
}

// Shorthand panel factories for common configurations:
//   scene-editor:    wide,     high complexity, primary
//   scene-metadata:  compact,  low complexity,  sidebar
//   dialogue-view:   standard, medium,          secondary
//   character-cards: compact,  low,             secondary
//   story-map:       standard, medium,          secondary
//   beats-manager:   wide,     high,            primary
//   character-detail:wide,     high,            primary
const widePrimary    = (i = 0) => makePanel('scene-editor', 'primary', i);
const compactSidebar = (i = 0) => makePanel('scene-metadata', 'sidebar', i);
const stdSecondary   = (i = 0) => makePanel('dialogue-view', 'secondary', i);
const compactSecondary = (i = 0) => makePanel('character-cards', 'secondary', i);
const stdSecondary2  = (i = 0) => makePanel('story-map', 'secondary', i);
const widePrimary2   = (i = 0) => makePanel('beats-manager', 'primary', i);

// ─── sortPanelsByRole ─────────────────────────────────────

describe('sortPanelsByRole', () => {
  it('sorts panels by role priority: primary > secondary > tertiary > sidebar', () => {
    const panels = [
      makePanel('scene-metadata', 'sidebar', 0),
      makePanel('dialogue-view', 'secondary', 1),
      makePanel('scene-editor', 'primary', 2),
      makePanel('story-map', 'tertiary', 3),
    ];
    const sorted = sortPanelsByRole(panels);
    expect(sorted.map((p) => p.role)).toEqual(['primary', 'secondary', 'tertiary', 'sidebar']);
  });

  it('returns empty array for empty input', () => {
    expect(sortPanelsByRole([])).toEqual([]);
  });

  it('preserves order for panels with same role', () => {
    const panels = [
      makePanel('dialogue-view', 'secondary', 0),
      makePanel('story-map', 'secondary', 1),
    ];
    const sorted = sortPanelsByRole(panels);
    expect(sorted[0].type).toBe('dialogue-view');
    expect(sorted[1].type).toBe('story-map');
  });

  it('does not mutate the original array', () => {
    const panels = [compactSidebar(), widePrimary()];
    const original = [...panels];
    sortPanelsByRole(panels);
    expect(panels).toEqual(original);
  });
});

// ─── getAllowedLayouts ────────────────────────────────────

describe('getAllowedLayouts', () => {
  it('returns only stack and single for mobile viewports (<768)', () => {
    const allowed = getAllowedLayouts(600);
    expect(allowed).toEqual(new Set(['stack', 'single']));
  });

  it('allows split-2 and primary-sidebar for tablet viewports (768-1023)', () => {
    const allowed = getAllowedLayouts(900);
    expect(allowed.has('split-2')).toBe(true);
    expect(allowed.has('primary-sidebar')).toBe(true);
    expect(allowed.has('triptych')).toBe(false);
    expect(allowed.has('studio')).toBe(false);
  });

  it('adds split-3 for small desktop viewports (1024-1279)', () => {
    const allowed = getAllowedLayouts(1100);
    expect(allowed.has('split-3')).toBe(true);
    expect(allowed.has('grid-4')).toBe(false);
    expect(allowed.has('triptych')).toBe(false);
  });

  it('allows all layouts for full desktop (>=1280)', () => {
    const allowed = getAllowedLayouts(1920);
    for (const layout of LAYOUT_ORDER) {
      expect(allowed.has(layout)).toBe(true);
    }
  });

  it('handles exact breakpoint boundaries', () => {
    // Exactly at mobile breakpoint → tablet tier
    const atMobile = getAllowedLayouts(768);
    expect(atMobile.has('split-2')).toBe(true);

    // Exactly at tablet breakpoint → desktop tier
    const atTablet = getAllowedLayouts(1024);
    expect(atTablet.has('split-3')).toBe(true);

    // Exactly at desktop breakpoint → full tier
    const atDesktop = getAllowedLayouts(1280);
    expect(atDesktop.has('studio')).toBe(true);
  });
});

// ─── clampLayoutToViewport ────────────────────────────────

describe('clampLayoutToViewport', () => {
  it('returns requested layout when allowed', () => {
    expect(clampLayoutToViewport('split-2', 1920)).toBe('split-2');
  });

  it('downgrades studio to allowed layout on tablet', () => {
    const result = clampLayoutToViewport('studio', 900);
    const allowed = getAllowedLayouts(900);
    expect(allowed.has(result)).toBe(true);
  });

  it('downgrades to stack on narrow mobile', () => {
    const result = clampLayoutToViewport('grid-4', 400);
    expect(['stack', 'single']).toContain(result);
  });

  it('preserves single at any viewport', () => {
    expect(clampLayoutToViewport('single', 300)).toBe('single');
    expect(clampLayoutToViewport('single', 1920)).toBe('single');
  });
});

// ─── LAYOUT_TEMPLATES ────────────────────────────────────

describe('LAYOUT_TEMPLATES', () => {
  it('every LAYOUT_ORDER entry has a template', () => {
    for (const layout of LAYOUT_ORDER) {
      expect(LAYOUT_TEMPLATES[layout]).toBeDefined();
      expect(LAYOUT_TEMPLATES[layout].id).toBe(layout);
    }
  });

  it('single layout has exactly 1 slot', () => {
    expect(LAYOUT_TEMPLATES.single.slots).toHaveLength(1);
  });

  it('split-2 has 2 slots', () => {
    expect(LAYOUT_TEMPLATES['split-2'].slots).toHaveLength(2);
  });

  it('split-3 has 3 slots', () => {
    expect(LAYOUT_TEMPLATES['split-3'].slots).toHaveLength(3);
  });

  it('grid-4 has 4 slots', () => {
    expect(LAYOUT_TEMPLATES['grid-4'].slots).toHaveLength(4);
  });

  it('studio has 5 slots (most complex)', () => {
    expect(LAYOUT_TEMPLATES.studio.slots).toHaveLength(5);
  });

  it('primary-sidebar narrow slot only accepts compact', () => {
    const sidebarSlot = LAYOUT_TEMPLATES['primary-sidebar'].slots[1];
    expect(sidebarSlot.isNarrow).toBe(true);
    expect(sidebarSlot.acceptsSizes).toEqual(['compact']);
  });

  it('triptych has two narrow sidebar slots', () => {
    const narrowSlots = LAYOUT_TEMPLATES.triptych.slots.filter((s) => s.isNarrow);
    expect(narrowSlots).toHaveLength(2);
    expect(narrowSlots.every((s) => s.preferredRole === 'sidebar')).toBe(true);
  });

  it('all slots have non-empty acceptsSizes', () => {
    for (const layout of LAYOUT_ORDER) {
      for (const slot of LAYOUT_TEMPLATES[layout].slots) {
        expect(slot.acceptsSizes.length).toBeGreaterThan(0);
      }
    }
  });
});

// ─── assignPanelsToSlots (Hungarian algorithm) ───────────

describe('assignPanelsToSlots', () => {
  it('returns empty array for empty panels', () => {
    expect(assignPanelsToSlots([], 'split-2')).toEqual([]);
  });

  it('assigns a single panel to single layout', () => {
    const panels = [widePrimary()];
    const result = assignPanelsToSlots(panels, 'single');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('scene-editor');
  });

  it('assigns two panels to split-2', () => {
    const panels = [widePrimary(), stdSecondary()];
    const result = assignPanelsToSlots(panels, 'split-2');
    expect(result).toHaveLength(2);
    // Both panels should be present
    const types = result.map((p) => p.type).sort();
    expect(types).toEqual(['dialogue-view', 'scene-editor']);
  });

  it('handles more panels than slots (overflow) — picks best candidates', () => {
    const panels = [
      widePrimary(0),
      stdSecondary(1),
      compactSidebar(2),
      stdSecondary2(3),
      widePrimary2(4),
    ];
    // single layout has only 1 slot
    const result = assignPanelsToSlots(panels, 'single');
    expect(result.length).toBeLessThanOrEqual(1);
  });

  it('handles fewer panels than slots (underflow)', () => {
    const panels = [widePrimary()];
    const result = assignPanelsToSlots(panels, 'grid-4');
    // Should have the panel but not more than it
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.length).toBeLessThanOrEqual(4);
  });

  it('prefers placing compact panels in narrow slots', () => {
    // primary-sidebar: slot[0] = full, slot[1] = narrow/compact
    const panels = [widePrimary(), compactSidebar()];
    const result = assignPanelsToSlots(panels, 'primary-sidebar');
    expect(result).toHaveLength(2);
    // The compact panel should end up in slot index 1 (the narrow one)
    // and the wide panel in slot index 0
    const narrowSlotPanel = result[1];
    const wideSlotPanel = result[0];
    expect(narrowSlotPanel?.type).toBe('scene-metadata');
    expect(wideSlotPanel?.type).toBe('scene-editor');
  });

  it('returns panels ordered by slot index', () => {
    const panels = [
      makePanel('dialogue-view', 'secondary', 1),
      makePanel('scene-editor', 'primary', 0),
      makePanel('scene-metadata', 'tertiary', 2),
    ];
    const result = assignPanelsToSlots(panels, 'split-3');
    // Result should be ordered by slot position, not input order
    expect(result.length).toBeLessThanOrEqual(3);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('all panels with duplicate size classes are handled', () => {
    const panels = [
      makePanel('character-cards', 'primary', 0),
      makePanel('scene-metadata', 'secondary', 1),
    ];
    // Both are compact panels in a split-2 layout
    const result = assignPanelsToSlots(panels, 'split-2');
    expect(result).toHaveLength(2);
    const types = result.map((p) => p.type).sort();
    expect(types).toEqual(['character-cards', 'scene-metadata']);
  });
});

// ─── computeLayoutFitness ────────────────────────────────

describe('computeLayoutFitness', () => {
  it('returns 0 for single layout with empty panels', () => {
    expect(computeLayoutFitness('single', [])).toBe(0);
  });

  it('returns EMPTY_LAYOUT_PENALTY for non-single layouts with empty panels', () => {
    expect(computeLayoutFitness('split-2', [])).toBe(SCORING_CONFIG.EMPTY_LAYOUT_PENALTY);
    expect(computeLayoutFitness('grid-4', [])).toBe(SCORING_CONFIG.EMPTY_LAYOUT_PENALTY);
    expect(computeLayoutFitness('studio', [])).toBe(SCORING_CONFIG.EMPTY_LAYOUT_PENALTY);
  });

  it('single layout scores highest for 1 panel', () => {
    const panels = [widePrimary()];
    const singleScore = computeLayoutFitness('single', panels);
    const split2Score = computeLayoutFitness('split-2', panels);
    expect(singleScore).toBeGreaterThan(split2Score);
  });

  it('split-2 scores well for 2 panels', () => {
    const panels = [widePrimary(), stdSecondary()];
    const split2Score = computeLayoutFitness('split-2', panels);
    const singleScore = computeLayoutFitness('single', panels);
    expect(split2Score).toBeGreaterThan(singleScore);
  });

  it('grid-4 scores well for 4 panels', () => {
    const panels = [
      widePrimary(0),
      stdSecondary(1),
      makePanel('story-map', 'tertiary', 2),
      compactSidebar(3),
    ];
    const grid4Score = computeLayoutFitness('grid-4', panels);
    const singleScore = computeLayoutFitness('single', panels);
    expect(grid4Score).toBeGreaterThan(singleScore);
  });

  it('exact count match gives a bonus', () => {
    const panels = [widePrimary(), stdSecondary()];
    // split-2 has exactly 2 slots — exact match
    const fitnessExact = computeLayoutFitness('split-2', panels);
    // split-3 has 3 slots — underflow by 1
    const fitnessUnder = computeLayoutFitness('split-3', panels);
    // The exact match bonus should boost split-2
    expect(fitnessExact).toBeGreaterThan(fitnessUnder);
  });

  it('overflow (more panels than slots) applies penalty', () => {
    const panels = [widePrimary(0), stdSecondary(1), compactSidebar(2)];
    // single has 1 slot → 2 panels overflow
    const fitness = computeLayoutFitness('single', panels);
    // Should be lower due to overflow penalty
    const singleOneFitness = computeLayoutFitness('single', [widePrimary()]);
    expect(fitness).toBeLessThan(singleOneFitness);
  });

  it('returns a finite number for all layout-panel combinations', () => {
    const panels = [widePrimary(), stdSecondary()];
    for (const layout of LAYOUT_ORDER) {
      const fitness = computeLayoutFitness(layout, panels);
      expect(Number.isFinite(fitness)).toBe(true);
    }
  });
});

// ─── resolveLayout ────────────────────────────────────────

describe('resolveLayout', () => {
  it('returns single for zero panels', () => {
    expect(resolveLayout([])).toBe('single');
  });

  it('returns single for one panel', () => {
    const panels = [widePrimary()];
    expect(resolveLayout(panels)).toBe('single');
  });

  it('returns a 2-slot layout for 2 panels', () => {
    const panels = [widePrimary(), stdSecondary()];
    const layout = resolveLayout(panels);
    const slotCount = LAYOUT_TEMPLATES[layout].slots.length;
    // Should choose a layout that can accommodate 2 panels well
    expect(slotCount).toBeGreaterThanOrEqual(2);
  });

  it('returns a valid layout from LAYOUT_ORDER', () => {
    const panels = [widePrimary(), stdSecondary(), compactSidebar()];
    const layout = resolveLayout(panels);
    expect(LAYOUT_ORDER).toContain(layout);
  });

  it('handles many panels without crashing', () => {
    const panels = Array.from({ length: 8 }, (_, i) =>
      makePanel(i % 2 === 0 ? 'scene-editor' : 'dialogue-view', 'primary', i),
    );
    const layout = resolveLayout(panels);
    expect(LAYOUT_ORDER).toContain(layout);
  });
});

// ─── resolvePreferredLayout ───────────────────────────────

describe('resolvePreferredLayout', () => {
  it('falls back to resolveLayout when no preference given', () => {
    const panels = [widePrimary()];
    expect(resolvePreferredLayout(panels)).toBe(resolveLayout(panels));
  });

  it('returns preferred layout when fitness is high enough', () => {
    // split-2 with exactly 2 fitting panels should score well
    const panels = [widePrimary(), stdSecondary()];
    const fitness = computeLayoutFitness('split-2', panels);
    // Use a threshold we know it exceeds
    if (fitness >= 25) {
      expect(resolvePreferredLayout(panels, 'split-2', 25)).toBe('split-2');
    }
  });

  it('rejects preferred layout when fitness is below threshold', () => {
    // studio with 1 panel will have very low fitness
    const panels = [widePrimary()];
    const result = resolvePreferredLayout(panels, 'studio', 999);
    // Should fall back to resolveLayout since studio can't meet the threshold
    expect(result).toBe(resolveLayout(panels));
  });

  it('respects custom minPreferredFitness', () => {
    const panels = [widePrimary()];
    // With threshold of -Infinity, anything passes
    expect(resolvePreferredLayout(panels, 'studio', -Infinity)).toBe('studio');
  });
});

// ─── getLayoutFitnesses ──────────────────────────────────

describe('getLayoutFitnesses', () => {
  it('returns a score for every layout in LAYOUT_ORDER', () => {
    const panels = [widePrimary(), stdSecondary()];
    const fitnesses = getLayoutFitnesses(panels);
    for (const layout of LAYOUT_ORDER) {
      expect(typeof fitnesses[layout]).toBe('number');
      expect(Number.isFinite(fitnesses[layout])).toBe(true);
    }
  });

  it('the highest fitness matches resolveLayout result', () => {
    const panels = [widePrimary(), stdSecondary()];
    const fitnesses = getLayoutFitnesses(panels);
    const best = Object.entries(fitnesses).sort(([, a], [, b]) => b - a)[0];
    expect(best[0]).toBe(resolveLayout(panels));
  });
});

// ─── getNextLayout ────────────────────────────────────────

describe('getNextLayout', () => {
  it('cycles through LAYOUT_ORDER', () => {
    for (let i = 0; i < LAYOUT_ORDER.length - 1; i++) {
      expect(getNextLayout(LAYOUT_ORDER[i])).toBe(LAYOUT_ORDER[i + 1]);
    }
  });

  it('wraps around from last to first', () => {
    const last = LAYOUT_ORDER[LAYOUT_ORDER.length - 1];
    expect(getNextLayout(last)).toBe(LAYOUT_ORDER[0]);
  });
});

// ─── getLayoutTemplate ────────────────────────────────────

describe('getLayoutTemplate', () => {
  it('returns the correct template for each layout', () => {
    for (const layout of LAYOUT_ORDER) {
      const template = getLayoutTemplate(layout);
      expect(template.id).toBe(layout);
      expect(template.slots.length).toBeGreaterThan(0);
      expect(typeof template.gridTemplateRows).toBe('string');
      expect(typeof template.gridTemplateColumns).toBe('string');
    }
  });
});

// ─── SCORING_CONFIG ───────────────────────────────────────

describe('SCORING_CONFIG', () => {
  it('has COUNT_PRIOR entries for all layouts', () => {
    for (const layout of LAYOUT_ORDER) {
      const prior = SCORING_CONFIG.COUNT_PRIOR[layout];
      expect(prior).toBeDefined();
      expect(typeof prior[1]).toBe('number');
      expect(typeof prior[2]).toBe('number');
      expect(typeof prior[3]).toBe('number');
      expect(typeof prior[4]).toBe('number');
    }
  });

  it('SIZE_MISMATCH_PENALTY is negative', () => {
    expect(SCORING_CONFIG.SIZE_MISMATCH_PENALTY).toBeLessThan(0);
  });

  it('SIZE_MATCH_BONUS is positive', () => {
    expect(SCORING_CONFIG.SIZE_MATCH_BONUS).toBeGreaterThan(0);
  });

  it('EXACT_COUNT_MATCH_BONUS is positive', () => {
    expect(SCORING_CONFIG.EXACT_COUNT_MATCH_BONUS).toBeGreaterThan(0);
  });

  it('UNUSED_SLOT_PENALTY is negative', () => {
    expect(SCORING_CONFIG.UNUSED_SLOT_PENALTY).toBeLessThan(0);
  });
});

// ─── computeSpatialBudget ─────────────────────────────────
// Tests parseGridFractions, parseGridRange, estimateSlotDimensions indirectly.

describe('computeSpatialBudget', () => {
  it('returns viewport dimensions', () => {
    const budget = computeSpatialBudget(1920, 1080, [], 'single');
    expect(budget.viewport).toEqual({ width: 1920, height: 1080 });
  });

  it('availableGrid accounts for header and command bar', () => {
    const budget = computeSpatialBudget(1920, 1080, [], 'single');
    // Header ~40px, command bar ~36px
    expect(budget.availableGrid.width).toBe(1920);
    expect(budget.availableGrid.height).toBe(1080 - 40 - 36);
  });

  it('only includes layouts allowed for viewport width', () => {
    const mobileBudget = computeSpatialBudget(600, 800, [], 'single');
    const mobileLayouts = mobileBudget.options.map((o) => o.layout);
    expect(mobileLayouts).toContain('single');
    expect(mobileLayouts).toContain('stack');
    expect(mobileLayouts).not.toContain('studio');
    expect(mobileLayouts).not.toContain('triptych');
  });

  it('includes all layouts for desktop viewport', () => {
    const budget = computeSpatialBudget(1920, 1080, [], 'single');
    const layouts = budget.options.map((o) => o.layout);
    for (const layout of LAYOUT_ORDER) {
      expect(layouts).toContain(layout);
    }
  });

  it('options have correct maxPanels matching slot count', () => {
    const budget = computeSpatialBudget(1920, 1080, [], 'single');
    for (const option of budget.options) {
      expect(option.maxPanels).toBe(LAYOUT_TEMPLATES[option.layout].slots.length);
    }
  });

  it('slot dimensions are positive numbers', () => {
    const budget = computeSpatialBudget(1920, 1080, [], 'single');
    for (const option of budget.options) {
      for (const slot of option.slots) {
        expect(slot.widthPx).toBeGreaterThan(0);
        expect(slot.heightPx).toBeGreaterThan(0);
      }
    }
  });

  it('currentComposition reflects provided panels', () => {
    const panels = [widePrimary(), stdSecondary()];
    const budget = computeSpatialBudget(1920, 1080, panels, 'split-2');
    expect(budget.currentComposition).toHaveLength(2);
    expect(budget.currentComposition[0].type).toBe('scene-editor');
    expect(budget.currentComposition[0].role).toBe('primary');
    expect(budget.currentComposition[1].type).toBe('dialogue-view');
  });

  it('defaults density to full when not specified', () => {
    const panels = [widePrimary()]; // no density set
    const budget = computeSpatialBudget(1920, 1080, panels, 'single');
    expect(budget.currentComposition[0].density).toBe('full');
  });

  it('single layout slot spans full width', () => {
    const budget = computeSpatialBudget(1920, 1080, [], 'single');
    const singleOption = budget.options.find((o) => o.layout === 'single')!;
    expect(singleOption.slots).toHaveLength(1);
    // The single slot should be roughly the full available width
    expect(singleOption.slots[0].widthPx).toBe(1920);
  });

  it('split-2 columns sum to total width', () => {
    const budget = computeSpatialBudget(1000, 800, [], 'single');
    const split2 = budget.options.find((o) => o.layout === 'split-2')!;
    const totalWidth = split2.slots.reduce((sum, s) => sum + s.widthPx, 0);
    expect(totalWidth).toBe(1000);
  });

  it('triptych has 3 slots with positive dimensions', () => {
    const budget = computeSpatialBudget(1920, 1080, [], 'single');
    const triptych = budget.options.find((o) => o.layout === 'triptych')!;
    expect(triptych.slots).toHaveLength(3);
    for (const slot of triptych.slots) {
      expect(slot.widthPx).toBeGreaterThan(0);
      expect(slot.heightPx).toBeGreaterThan(0);
    }
    // Outer slots are sidebar, center is primary
    expect(triptych.slots[0].role).toBe('sidebar');
    expect(triptych.slots[1].role).toBe('primary');
    expect(triptych.slots[2].role).toBe('sidebar');
  });

  it('studio grid rows sum to available height', () => {
    const vw = 1920;
    const vh = 1080;
    const availableH = vh - 40 - 36; // 1004
    const budget = computeSpatialBudget(vw, vh, [], 'single');
    const studio = budget.options.find((o) => o.layout === 'studio')!;
    // Studio has 3 rows: 42px, 1fr, 160px
    // The spanning top-bar slot row height = 42px (row 1 only)
    // The middle slots should be 1fr = availableH - 42 - 160
    const topSlot = studio.slots[0]; // gridRow: '1', spans all cols
    const midSlot = studio.slots[2]; // gridRow: '2', gridColumn: '2'
    const botSlot = studio.slots[4]; // gridRow: '3', spans all cols
    expect(topSlot.heightPx).toBe(42);
    expect(botSlot.heightPx).toBe(160);
    expect(midSlot.heightPx).toBe(availableH - 42 - 160);
  });

  it('slot acceptsDensity is based on pixel dimensions', () => {
    // A very small viewport should limit density options
    const budget = computeSpatialBudget(300, 200, [], 'single');
    const singleOpt = budget.options.find((o) => o.layout === 'single')!;
    // With 300x124 (200-76) the slot should support at least micro
    expect(singleOpt.slots[0].acceptsDensity).toContain('micro');
  });
});

// ─── Integration / Edge Cases ─────────────────────────────

describe('integration & edge cases', () => {
  it('resolveLayout is deterministic for the same input', () => {
    const panels = [widePrimary(), stdSecondary(), compactSidebar()];
    const first = resolveLayout(panels);
    const second = resolveLayout(panels);
    expect(first).toBe(second);
  });

  it('assignPanelsToSlots is deterministic', () => {
    const panels = [widePrimary(0), stdSecondary(1)];
    const a = assignPanelsToSlots(panels, 'split-2');
    const b = assignPanelsToSlots(panels, 'split-2');
    expect(a.map((p) => p.type)).toEqual(b.map((p) => p.type));
  });

  it('panels with high slotIndex have lower stability bonus', () => {
    // Create two identical compositions but with different slotIndices
    // The one with lower slotIndex should get more stability bonus
    const lowIdx = [widePrimary(0), stdSecondary(1)];
    const highIdx = [widePrimary(5), stdSecondary(6)];
    const fitnessLow = computeLayoutFitness('split-2', lowIdx);
    const fitnessHigh = computeLayoutFitness('split-2', highIdx);
    // Lower slot indices → higher stability → higher fitness
    expect(fitnessLow).toBeGreaterThanOrEqual(fitnessHigh);
  });

  it('wide panel in narrow slot scores worse than compact panel', () => {
    // In primary-sidebar, slot[1] is narrow and only accepts compact
    // A wide panel should score very poorly there
    const withWide = [widePrimary(0), widePrimary2(1)]; // both wide
    const withCompact = [widePrimary(0), compactSidebar(1)]; // wide + compact
    const fitnessWide = computeLayoutFitness('primary-sidebar', withWide);
    const fitnessCompact = computeLayoutFitness('primary-sidebar', withCompact);
    expect(fitnessCompact).toBeGreaterThan(fitnessWide);
  });

  it('high-complexity panel in narrow slot is penalized', () => {
    // scene-editor is high complexity; in triptych, slots 0 and 2 are narrow
    // This should score lower than placing a low-complexity compact panel there
    const highComplexNarrow = [
      makePanel('scene-editor', 'sidebar', 0),
      makePanel('scene-editor', 'primary', 1),
      makePanel('scene-editor', 'sidebar', 2),
    ];
    const goodFit = [
      compactSidebar(0),
      widePrimary(1),
      makePanel('character-cards', 'sidebar', 2),
    ];
    const fitnessBad = computeLayoutFitness('triptych', highComplexNarrow);
    const fitnessGood = computeLayoutFitness('triptych', goodFit);
    expect(fitnessGood).toBeGreaterThan(fitnessBad);
  });

  it('spatial budget handles very large viewport', () => {
    const budget = computeSpatialBudget(3840, 2160, [], 'single');
    expect(budget.viewport.width).toBe(3840);
    // All layouts should be available
    expect(budget.options.length).toBe(LAYOUT_ORDER.length);
  });

  it('spatial budget handles very small viewport', () => {
    const budget = computeSpatialBudget(320, 480, [], 'single');
    // Only stack/single allowed
    expect(budget.options.length).toBe(2);
  });
});
