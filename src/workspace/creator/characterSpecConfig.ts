/**
 * Character appearance spec config — adapts existing creator constants
 * into the generic FacetedSpecBuilder format.
 */

import type { FacetedSpecConfig } from '@/lib/faceted-spec/types';
import { CATEGORIES, CATEGORY_GROUPS, PROMPT_ORDER } from './constants/categories';
import { CATEGORY_OPTIONS } from './constants/options';
import type { CategoryId } from './types';

type CharacterGroup = 'face' | 'features' | 'body' | 'environment';

export const characterSpecConfig: FacetedSpecConfig<CharacterGroup> = {
  name: 'Character Appearance',
  promptPrefix: 'A character portrait of',
  dimensions: CATEGORIES.map((cat) => ({
    id: cat.id,
    label: cat.label,
    icon: cat.icon,
    promptTemplate: cat.promptTemplate,
    group: cat.group,
  })),
  groups: CATEGORY_GROUPS.map((g) => ({
    id: g.id,
    label: g.label,
    icon: g.icon,
  })),
  options: Object.fromEntries(
    Object.entries(CATEGORY_OPTIONS).map(([key, opts]) => [
      key,
      opts.map((o) => ({
        id: o.id,
        name: o.name,
        preview: o.preview,
        description: o.description,
        promptValue: o.promptValue,
        metadata: o.metadata,
      })),
    ])
  ),
  compositionOrder: PROMPT_ORDER as string[],
  separator: ', ',
  suffix: '.',
  maxCustomChars: 1000,
};

/** All valid dimension IDs for the character spec */
export const CHARACTER_DIMENSION_IDS = CATEGORIES.map((c) => c.id);

/** Type guard: check if a string is a valid character dimension ID */
export function isCharacterDimensionId(id: string): id is CategoryId {
  return CHARACTER_DIMENSION_IDS.includes(id as CategoryId);
}
