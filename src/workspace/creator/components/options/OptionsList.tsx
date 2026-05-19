'use client';

import React from 'react';
import { FacetOptionsList } from '@/lib/faceted-spec';
import { useCreatorUIStore } from '../../store/creatorUIStore';
import { useCreatorCharacterStore } from '../../store/creatorCharacterStore';
import { characterSpecConfig } from '../../characterSpecConfig';
import { CreatorIcon } from '../../icons';
import type { FacetSelection } from '@/lib/faceted-spec';

interface OptionsListProps {
  searchQuery: string;
}

/**
 * Character-specific OptionsList — thin wrapper around FacetOptionsList
 * that reads from the character creator stores and plugs in CreatorIcon.
 */
export function OptionsList({ searchQuery }: OptionsListProps) {
  const activeCategory = useCreatorUIStore((s) => s.activeCategory);
  const selections = useCreatorCharacterStore((s) => s.selections);
  const setSelection = useCreatorCharacterStore((s) => s.setSelection);
  const clearCustomPrompt = useCreatorCharacterStore((s) => s.clearCustomPrompt);

  // Convert CategorySelection → FacetSelection for the generic component
  const facetSelections: Record<string, FacetSelection> = {};
  for (const [key, sel] of Object.entries(selections)) {
    facetSelections[key] = {
      dimensionId: key,
      optionId: sel.optionId,
      customPrompt: sel.customPrompt,
      isCustom: sel.isCustom,
    };
  }

  return (
    <FacetOptionsList
      searchQuery={searchQuery}
      config={characterSpecConfig}
      activeDimensionId={activeCategory}
      selections={facetSelections}
      onSelect={(dimId, optionId) => setSelection(dimId as Parameters<typeof setSelection>[0], optionId)}
      onClearCustom={(dimId) => clearCustomPrompt(dimId as Parameters<typeof clearCustomPrompt>[0])}
      renderIcon={(preview, size) => <CreatorIcon name={preview} size={size} />}
    />
  );
}
