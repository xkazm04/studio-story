'use client';

import { create } from 'zustand';
import type {
  FacetedSpecConfig,
  FacetedSpecState,
  FacetedSpecSelectors,
  FacetSelection,
} from './types';

function createInitialSelections(
  config: FacetedSpecConfig
): Record<string, FacetSelection> {
  const selections: Record<string, FacetSelection> = {};
  for (const dim of config.dimensions) {
    selections[dim.id] = {
      dimensionId: dim.id,
      optionId: null,
      customPrompt: undefined,
      isCustom: false,
    };
  }
  return selections;
}

/**
 * Creates a Zustand store for a faceted specification domain.
 *
 * Usage:
 * ```ts
 * const useCharacterSpec = createFacetedSpecStore(characterConfig);
 * const composedPrompt = useCharacterSpec(characterSelectors.selectComposedPrompt);
 * ```
 */
export function createFacetedSpecStore(config: FacetedSpecConfig) {
  const dimensionIds = new Set(config.dimensions.map((d) => d.id));

  return create<FacetedSpecState>((set) => ({
    label: '',
    selections: createInitialSelections(config),
    activeDimensionId: null,

    setSelection: (dimensionId, optionId) => {
      if (!dimensionIds.has(dimensionId)) return;
      set((state) => ({
        selections: {
          ...state.selections,
          [dimensionId]: {
            ...state.selections[dimensionId],
            optionId,
            isCustom: false,
          },
        },
      }));
    },

    setCustomPrompt: (dimensionId, customPrompt) => {
      if (!dimensionIds.has(dimensionId)) return;
      set((state) => ({
        selections: {
          ...state.selections,
          [dimensionId]: {
            ...state.selections[dimensionId],
            customPrompt,
            isCustom: true,
          },
        },
      }));
    },

    clearCustomPrompt: (dimensionId) => {
      if (!dimensionIds.has(dimensionId)) return;
      set((state) => ({
        selections: {
          ...state.selections,
          [dimensionId]: {
            ...state.selections[dimensionId],
            customPrompt: undefined,
            isCustom: false,
          },
        },
      }));
    },

    setLabel: (label) => set({ label }),
    setActiveDimension: (dimensionId) =>
      set({ activeDimensionId: dimensionId }),

    reset: () =>
      set({
        label: '',
        selections: createInitialSelections(config),
        activeDimensionId: null,
      }),

    applyBulkUpdate: (update) =>
      set((state) => {
        const next = { ...state.selections };
        for (const [dimId, value] of Object.entries(update)) {
          if (!dimensionIds.has(dimId)) continue;
          if (value.customPrompt) {
            next[dimId] = {
              ...next[dimId],
              customPrompt: value.customPrompt,
              isCustom: true,
            };
          } else if (value.optionId !== undefined) {
            next[dimId] = {
              ...next[dimId],
              optionId: value.optionId,
              isCustom: false,
            };
          }
        }
        return { selections: next };
      }),

    loadFromData: (label, data) =>
      set(() => {
        const next = createInitialSelections(config);
        for (const [dimId, text] of Object.entries(data)) {
          if (!next[dimId]) continue;
          const options = config.options[dimId] || [];
          const lower = text.toLowerCase();
          const match = options.find(
            (o) =>
              o.name.toLowerCase() === lower ||
              o.promptValue.toLowerCase() === lower ||
              lower.includes(o.name.toLowerCase()) ||
              lower.includes(o.promptValue.toLowerCase())
          );
          if (match) {
            next[dimId] = { ...next[dimId], optionId: match.id, isCustom: false };
          } else {
            next[dimId] = { ...next[dimId], customPrompt: text, isCustom: true };
          }
        }
        return { label, selections: next };
      }),
  }));
}

/**
 * Creates derived selectors bound to a specific config.
 * These can be passed directly to useStore(selector).
 */
export function createFacetedSpecSelectors(
  config: FacetedSpecConfig
): FacetedSpecSelectors {
  const separator = config.separator ?? ', ';
  const suffix = config.suffix ?? '.';

  const dimensionMap = new Map(config.dimensions.map((d) => [d.id, d]));

  const selectComposedPrompt = (state: FacetedSpecState): string => {
    const parts: string[] = [config.promptPrefix];

    for (const dimId of config.compositionOrder) {
      const selection = state.selections[dimId];
      if (!selection) continue;

      if (selection.isCustom && selection.customPrompt) {
        parts.push(selection.customPrompt);
        continue;
      }

      if (selection.optionId !== null) {
        const options = config.options[dimId] || [];
        const option = options.find((o) => o.id === selection.optionId);
        if (option && option.promptValue) {
          const dimension = dimensionMap.get(dimId);
          if (dimension) {
            parts.push(
              dimension.promptTemplate.replace('{value}', option.promptValue)
            );
          }
        }
      }
    }

    return parts.join(separator) + suffix;
  };

  const selectActiveSelectionCount = (state: FacetedSpecState): number =>
    Object.values(state.selections).filter(
      (s) => s.optionId !== null || s.isCustom
    ).length;

  return { selectComposedPrompt, selectActiveSelectionCount };
}
