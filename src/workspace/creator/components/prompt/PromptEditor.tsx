'use client';

import React from 'react';
import { FacetPromptEditor } from '@/lib/faceted-spec';
import { useCreatorCharacterStore, selectComposedPrompt } from '../../store/creatorCharacterStore';
import { useCreatorUIStore } from '../../store/creatorUIStore';
import { characterSpecConfig } from '../../characterSpecConfig';
import type { FacetSelection } from '@/lib/faceted-spec';

/**
 * Character-specific PromptEditor — thin wrapper around FacetPromptEditor
 * that reads from the character creator stores.
 */
export function PromptEditor() {
  const activeCategory = useCreatorUIStore((s) => s.activeCategory);
  const selections = useCreatorCharacterStore((s) => s.selections);
  const setCustomPrompt = useCreatorCharacterStore((s) => s.setCustomPrompt);
  const clearCustomPrompt = useCreatorCharacterStore((s) => s.clearCustomPrompt);
  const composedPrompt = useCreatorCharacterStore(selectComposedPrompt);

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
    <FacetPromptEditor
      config={characterSpecConfig}
      activeDimensionId={activeCategory}
      selections={facetSelections}
      composedPrompt={composedPrompt}
      onSetCustomPrompt={(dimId, prompt) =>
        setCustomPrompt(dimId as Parameters<typeof setCustomPrompt>[0], prompt)
      }
      onClearCustomPrompt={(dimId) =>
        clearCustomPrompt(dimId as Parameters<typeof clearCustomPrompt>[0])
      }
    />
  );
}
