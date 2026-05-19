'use client';

/**
 * Character creator store — selection state for the character appearance spec.
 *
 * This store follows the generic FacetedSpecBuilder pattern (see `@/lib/faceted-spec`).
 * New domains (scene environments, art styles, voice profiles) should use
 * `createFacetedSpecStore(config)` directly instead of duplicating this store.
 *
 * Selectors delegate to the generic `createFacetedSpecSelectors` to prove
 * parity between the domain-specific and generic implementations.
 */

import { create } from 'zustand';
import { createFacetedSpecSelectors } from '@/lib/faceted-spec';
import type { FacetedSpecState } from '@/lib/faceted-spec';
import { characterSpecConfig } from '../characterSpecConfig';
import type { CategoryId, CategorySelection } from '../types';
import { CATEGORIES } from '../constants/categories';
import { getOptionsForCategory } from '../constants/options';

// ── Generic selectors bound to character config ─────────────────────

const _genericSelectors = createFacetedSpecSelectors(characterSpecConfig);

// ── Initial state ───────────────────────────────────────────────────

const createInitialSelections = (): Record<CategoryId, CategorySelection> => {
  const selections = {} as Record<CategoryId, CategorySelection>;
  CATEGORIES.forEach((cat) => {
    selections[cat.id] = {
      categoryId: cat.id,
      optionId: null,
      customPrompt: undefined,
      isCustom: false,
    };
  });
  return selections;
};

// ── Types ───────────────────────────────────────────────────────────

interface CliCategoryUpdate {
  optionId?: number | string;
  customPrompt?: string;
}

interface CreatorCharacterState {
  name: string;
  selections: Record<CategoryId, CategorySelection>;

  setSelection: (categoryId: CategoryId, optionId: string | number | null) => void;
  setCustomPrompt: (categoryId: CategoryId, customPrompt: string) => void;
  clearCustomPrompt: (categoryId: CategoryId) => void;
  setCharacterName: (name: string) => void;
  resetCharacter: () => void;
  applyCliUpdate: (update: Record<string, CliCategoryUpdate>) => void;
  loadFromCharacter: (name: string, appearance: Record<string, string>) => void;
}

// ── Store ───────────────────────────────────────────────────────────

export const useCreatorCharacterStore = create<CreatorCharacterState>((set) => ({
  name: 'Unnamed Character',
  selections: createInitialSelections(),

  setSelection: (categoryId, optionId) =>
    set((state) => ({
      selections: {
        ...state.selections,
        [categoryId]: {
          ...state.selections[categoryId],
          optionId,
          isCustom: false,
        },
      },
    })),

  setCustomPrompt: (categoryId, customPrompt) =>
    set((state) => ({
      selections: {
        ...state.selections,
        [categoryId]: {
          ...state.selections[categoryId],
          customPrompt,
          isCustom: true,
        },
      },
    })),

  clearCustomPrompt: (categoryId) =>
    set((state) => ({
      selections: {
        ...state.selections,
        [categoryId]: {
          ...state.selections[categoryId],
          customPrompt: undefined,
          isCustom: false,
        },
      },
    })),

  setCharacterName: (name) => set({ name }),

  resetCharacter: () =>
    set({ name: 'Unnamed Character', selections: createInitialSelections() }),

  applyCliUpdate: (update) =>
    set((state) => {
      const validIds = new Set(CATEGORIES.map((c) => c.id as string));
      const next = { ...state.selections };

      for (const [catId, value] of Object.entries(update)) {
        if (!validIds.has(catId)) continue;
        const id = catId as CategoryId;

        if (value.customPrompt) {
          next[id] = { ...next[id], customPrompt: value.customPrompt, isCustom: true };
        } else if (value.optionId !== undefined) {
          next[id] = { ...next[id], optionId: value.optionId, isCustom: false };
        }
      }

      return { selections: next };
    }),

  loadFromCharacter: (name, appearance) =>
    set(() => {
      const next = { ...createInitialSelections() };

      for (const [catId, text] of Object.entries(appearance)) {
        const id = catId as CategoryId;
        if (!next[id]) continue;

        const options = getOptionsForCategory(id);
        const lower = text.toLowerCase();
        const match = options.find(
          (o) =>
            o.name.toLowerCase() === lower ||
            o.promptValue.toLowerCase() === lower ||
            lower.includes(o.name.toLowerCase()) ||
            lower.includes(o.promptValue.toLowerCase())
        );

        if (match) {
          next[id] = { ...next[id], optionId: match.id, isCustom: false };
        } else {
          next[id] = { ...next[id], customPrompt: text, isCustom: true };
        }
      }

      return { name, selections: next };
    }),
}));

// ── Helpers: convert character state → generic FacetedSpecState ─────

function toFacetState(state: CreatorCharacterState): FacetedSpecState {
  const selections: FacetedSpecState['selections'] = {};
  for (const [dimId, sel] of Object.entries(state.selections)) {
    selections[dimId] = {
      dimensionId: dimId,
      optionId: sel.optionId,
      customPrompt: sel.customPrompt,
      isCustom: sel.isCustom,
    };
  }
  return {
    label: state.name,
    selections,
    activeDimensionId: null,
    setSelection: () => {},
    setCustomPrompt: () => {},
    clearCustomPrompt: () => {},
    setLabel: () => {},
    setActiveDimension: () => {},
    reset: () => {},
    applyBulkUpdate: () => {},
    loadFromData: () => {},
  };
}

// ── Selectors (delegate to generic implementations) ─────────────────

export const selectComposedPrompt = (state: CreatorCharacterState): string =>
  _genericSelectors.selectComposedPrompt(toFacetState(state));

export const selectActiveSelectionCount = (state: CreatorCharacterState): number =>
  _genericSelectors.selectActiveSelectionCount(toFacetState(state));
