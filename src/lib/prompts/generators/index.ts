/**
 * Generator registration — imports all generator modules and registers them.
 */

export { registerCharacterGenerators } from './character';
export { registerOutfitGenerators } from './outfit';
export { registerRandomizerGenerators } from './randomizer';

export type { CharacterAppearanceInput, CharacterFullBodyInput, CharacterAvatarInput } from './character';
export type { OutfitPromptInput } from './outfit';
export type { RandomizerPromptInput } from './randomizer';
