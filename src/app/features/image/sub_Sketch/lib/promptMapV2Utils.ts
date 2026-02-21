/**
 * Claude Prompt Map V2 - Utility Functions
 * Helper functions for prompt composition and calculations
 */

import { ClaudePromptDimension, ClaudePromptOptionV2 } from './promptMapV2Types';
import { THEME_OPTIONS_V2 } from './promptMapV2Themes';
import { SCENE_OPTIONS_V2 } from './promptMapV2Scenes';
import { CHARACTER_OPTIONS_V2 } from './promptMapV2Characters';

/**
 * Map of dimension to options for easy lookup
 */
export const dimensionOptionsV2: Record<ClaudePromptDimension, ClaudePromptOptionV2[]> = {
  theme: THEME_OPTIONS_V2,
  scene: SCENE_OPTIONS_V2,
  character: CHARACTER_OPTIONS_V2,
};

/**
 * Compose a prompt from selected options
 */
export function composePromptV2(
  selections: Partial<Record<ClaudePromptDimension, ClaudePromptOptionV2 | undefined>>,
  useKeywords: boolean = true
): string {
  const parts: string[] = [];

  if (selections.theme) {
    if (useKeywords) {
      parts.push(...selections.theme.keywords);
    } else {
      parts.push(selections.theme.description);
    }
  }

  if (selections.scene) {
    parts.push(selections.scene.description);
  }

  if (selections.character) {
    parts.push(selections.character.description);
  }

  return parts.join(', ');
}

/**
 * Get an option by ID from a specific dimension
 */
export function getOptionById(
  dimension: ClaudePromptDimension,
  id: string
): ClaudePromptOptionV2 | undefined {
  return dimensionOptionsV2[dimension].find(opt => opt.id === id);
}

/**
 * Calculate mood/energy averages from selections
 */
export function calculateVibes(
  selections: Partial<Record<ClaudePromptDimension, ClaudePromptOptionV2 | undefined>>
): { mood: number; energy: number } {
  const values = Object.values(selections).filter(Boolean) as ClaudePromptOptionV2[];
  if (values.length === 0) return { mood: 50, energy: 50 };

  const mood = values.reduce((sum, opt) => sum + (opt.visual.mood || 50), 0) / values.length;
  const energy = values.reduce((sum, opt) => sum + (opt.visual.energy || 50), 0) / values.length;

  return { mood: Math.round(mood), energy: Math.round(energy) };
}
