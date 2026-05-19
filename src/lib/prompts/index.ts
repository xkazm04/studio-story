/**
 * Centralized Prompt Registry
 *
 * Single entry point for all prompt generation in the application.
 * Import { promptRegistry } and call promptRegistry.generate(id, input).
 *
 * Registered generators:
 *   character.facial    — facial features from Appearance
 *   character.clothing  — clothing & style from Appearance
 *   character.full      — complete appearance (depends on facial + clothing)
 *   character.fullBody  — full-body illustration with archetype/pose/expression
 *   character.avatar    — avatar/portrait prompt
 *   outfit.clothing     — outfit wardrobe description
 *   randomizer.character — Ollama prompt for random character generation
 */

import { promptRegistry } from './PromptRegistry';
import { registerCharacterGenerators } from './generators/character';
import { registerOutfitGenerators } from './generators/outfit';
import { registerRandomizerGenerators } from './generators/randomizer';

// Self-registering: generators are registered on first import
registerCharacterGenerators();
registerOutfitGenerators();
registerRandomizerGenerators();

// ============================================================================
// Re-exports
// ============================================================================

export { promptRegistry } from './PromptRegistry';
export type {
  PromptEntityType,
  PromptInputField,
  PromptOutputFormat,
  PromptGeneratorDef,
  PromptGenerationResult,
} from './PromptRegistry';

export type {
  CharacterAppearanceInput,
  CharacterFullBodyInput,
  CharacterAvatarInput,
  OutfitPromptInput,
  RandomizerPromptInput,
} from './generators';

// ============================================================================
// Convenience wrappers — drop-in replacements for the old scattered functions
// ============================================================================

import type { Appearance } from '@/app/types/Character';

/** Drop-in replacement for generateFacialFeaturesPrompt from promptGenerators.ts */
export function generateFacialFeaturesPrompt(appearance: Appearance): string {
  return promptRegistry.generate('character.facial', { appearance }).text;
}

/** Drop-in replacement for generateClothingPrompt from promptGenerators.ts */
export function generateClothingPrompt(appearance: Appearance): string {
  return promptRegistry.generate('character.clothing', { appearance }).text;
}

/** Drop-in replacement for generateFullPrompt from promptGenerators.ts */
export function generateFullPrompt(appearance: Appearance): string {
  return promptRegistry.generate('character.full', { appearance }).text;
}

/** Drop-in replacement for generateOutfitPrompt from useCharacterOutfits.ts */
export function generateOutfitPrompt(
  outfit: { clothing: unknown },
  accessories?: Array<{ name: string; material?: string; current_state: string }>
): string {
  return promptRegistry.generate('outfit.clothing', { outfit, accessories }).text;
}

/** Drop-in replacement for buildRandomizerPrompt from randomizer.ts */
export function buildRandomizerPrompt(options?: {
  genre?: string;
  projectContext?: { title?: string; description?: string; genre?: string };
}): string {
  return promptRegistry.generate('randomizer.character', options ?? {}).text;
}
