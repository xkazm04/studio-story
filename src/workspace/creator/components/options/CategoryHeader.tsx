'use client';

import React from 'react';
import { FacetHeader } from '@/lib/faceted-spec';
import { useCreatorUIStore } from '../../store/creatorUIStore';
import { useCreatorCharacterStore } from '../../store/creatorCharacterStore';
import { characterSpecConfig } from '../../characterSpecConfig';
import type { FacetSelection } from '@/lib/faceted-spec';

/**
 * Character-specific CategoryHeader — thin wrapper around FacetHeader
 * that reads from the character creator stores.
 */
export function CategoryHeader() {
  const activeCategory = useCreatorUIStore((s) => s.activeCategory);
  const selections = useCreatorCharacterStore((s) => s.selections);
  const setSelection = useCreatorCharacterStore((s) => s.setSelection);
  const clearCustomPrompt = useCreatorCharacterStore((s) => s.clearCustomPrompt);

  const facetSelections: Record<string, FacetSelection> = {};
  for (const [key, sel] of Object.entries(selections)) {
    facetSelections[key] = {
      dimensionId: key,
      optionId: sel.optionId,
      customPrompt: sel.customPrompt,
      isCustom: sel.isCustom,
    };
  }

  const handleClear = (dimensionId: string) => {
    type CatId = Parameters<typeof setSelection>[0];
    setSelection(dimensionId as CatId, null);
    clearCustomPrompt(dimensionId as CatId);
  };

  return (
    <FacetHeader
      config={characterSpecConfig}
      activeDimensionId={activeCategory}
      selections={facetSelections}
      onClear={handleClear}
    />
  );
}
