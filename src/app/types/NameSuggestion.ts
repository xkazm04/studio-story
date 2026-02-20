/** Entity types that support name suggestions */
export type EntityType = 'character' | 'scene' | 'beat' | 'faction' | 'location';

/** A single AI-generated name suggestion */
export interface NameSuggestion {
  name: string;
  description: string;
  reasoning?: string;
}
