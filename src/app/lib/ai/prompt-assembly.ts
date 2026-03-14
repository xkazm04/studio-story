/**
 * Prompt Assembly Module for Scene Illustration Pipeline
 *
 * Combines art style, scene setting, characters, mood, and quality tags
 * into a single generation prompt. Also builds controlnet reference arrays
 * for Leonardo AI's character and style reference features.
 */

import type { ParsedSceneContext } from '@/lib/image/SceneParser';
import { truncatePromptForLeonardo } from './promptTruncation';

// ============================================================================
// Types
// ============================================================================

export interface PromptAssemblyInput {
  /** Parsed scene context from SceneParser */
  scene: ParsedSceneContext;
  /** Custom art style prompt from project settings (null if none) */
  artStylePrompt: string | null;
  /** Optional character appearance descriptions keyed by character ID */
  characterAppearances?: Map<string, { description: string }>;
}

export interface ControlnetRef {
  initImageId: string;
  initImageType: 'UPLOADED';
  preprocessorId: number;
  strengthType: 'Low' | 'Mid' | 'High' | 'Ultra' | 'Max';
}

export interface BuildControlnetsOptions {
  /** Leonardo image IDs for character reference images */
  characterRefIds?: Array<{ leonardoImageId: string }>;
  /** Leonardo image ID for style reference image */
  styleRefId?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Character Reference preprocessor ID in Leonardo */
const CHARACTER_REF_PREPROCESSOR_ID = 133;

/** Style Reference preprocessor ID in Leonardo */
const STYLE_REF_PREPROCESSOR_ID = 67;

/** Maximum characters in prompt text */
const MAX_CHARACTERS_IN_PROMPT = 3;

/** Maximum character reference controlnets */
const MAX_CHARACTER_REFS = 2;

/** Quality tags appended to every prompt */
const QUALITY_TAGS = ['masterpiece', 'best quality', 'highly detailed'];

// ============================================================================
// assembleIllustrationPrompt
// ============================================================================

/**
 * Assembles a complete illustration prompt from scene context.
 *
 * Prompt structure (in priority order):
 * 1. Art style (highest priority, appears first)
 * 2. Scene setting (location, time of day, weather)
 * 3. Characters (names with actions/emotions, max 3, foreground first)
 * 4. Mood atmosphere
 * 5. Quality tags
 *
 * Result is passed through truncatePromptForLeonardo() to stay under 1500 chars.
 */
export function assembleIllustrationPrompt(input: PromptAssemblyInput): string {
  const { scene, artStylePrompt, characterAppearances } = input;
  const parts: string[] = [];

  // 1. Art style (highest priority)
  if (artStylePrompt) {
    parts.push(artStylePrompt);
  }

  // 2. Scene setting
  const settingParts: string[] = [];
  if (scene.setting.location && scene.setting.location !== 'unspecified location') {
    settingParts.push(scene.setting.location);
  }
  if (scene.setting.timeOfDay && scene.setting.timeOfDay !== 'unknown') {
    settingParts.push(scene.setting.timeOfDay);
  }
  if (scene.setting.weather) {
    settingParts.push(scene.setting.weather);
  }
  if (scene.setting.lighting) {
    settingParts.push(scene.setting.lighting);
  }
  if (settingParts.length > 0) {
    parts.push(settingParts.join(', '));
  }

  // 3. Characters (max 3, prioritize foreground)
  const sortedCharacters = [...scene.characters].sort((a, b) => {
    const positionOrder = { foreground: 0, midground: 1, background: 2 };
    const aOrder = positionOrder[a.position || 'midground'] ?? 1;
    const bOrder = positionOrder[b.position || 'midground'] ?? 1;
    return aOrder - bOrder;
  });

  const visibleCharacters = sortedCharacters.slice(0, MAX_CHARACTERS_IN_PROMPT);

  for (const char of visibleCharacters) {
    const charParts: string[] = [char.name];

    // Add appearance description if available
    if (characterAppearances) {
      const appearance = characterAppearances.get(char.characterId);
      if (appearance?.description) {
        charParts.push(appearance.description);
      }
    }

    if (char.action) {
      charParts.push(char.action);
    }
    if (char.emotion) {
      charParts.push(`${char.emotion} expression`);
    }

    parts.push(charParts.join(' '));
  }

  // 4. Mood atmosphere
  if (scene.mood.primary && scene.mood.primary !== 'neutral') {
    parts.push(`${scene.mood.primary} atmosphere`);
  }
  if (scene.mood.emotionalTone) {
    parts.push(scene.mood.emotionalTone);
  }

  // 5. Quality tags
  parts.push(QUALITY_TAGS.join(', '));

  // Join and truncate
  const rawPrompt = parts.join(', ');
  return truncatePromptForLeonardo(rawPrompt);
}

// ============================================================================
// buildControlnets
// ============================================================================

/**
 * Builds a controlnet reference array for Leonardo generation.
 *
 * - Character Reference: preprocessorId 133, strengthType 'Mid'
 * - Style Reference: preprocessorId 67, strengthType 'High'
 * - Limits: max 2 character refs + 1 style ref
 */
export function buildControlnets(opts: BuildControlnetsOptions): ControlnetRef[] {
  const controlnets: ControlnetRef[] = [];

  // Character references (max 2)
  if (opts.characterRefIds && opts.characterRefIds.length > 0) {
    const limitedRefs = opts.characterRefIds.slice(0, MAX_CHARACTER_REFS);
    for (const ref of limitedRefs) {
      controlnets.push({
        initImageId: ref.leonardoImageId,
        initImageType: 'UPLOADED',
        preprocessorId: CHARACTER_REF_PREPROCESSOR_ID,
        strengthType: 'Mid',
      });
    }
  }

  // Style reference (max 1)
  if (opts.styleRefId) {
    controlnets.push({
      initImageId: opts.styleRefId,
      initImageType: 'UPLOADED',
      preprocessorId: STYLE_REF_PREPROCESSOR_ID,
      strengthType: 'High',
    });
  }

  return controlnets;
}
