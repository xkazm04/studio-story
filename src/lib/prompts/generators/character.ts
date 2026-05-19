/**
 * Character prompt generators — wraps existing functions from
 * promptGenerators.ts and promptComposer.ts into registry-compatible form.
 */

import type { Appearance } from '@/app/types/Character';
import type { PromptGeneratorDef } from '../PromptRegistry';
import { promptRegistry } from '../PromptRegistry';

// ============================================================================
// Helpers (moved from promptGenerators.ts, kept as implementation detail)
// ============================================================================

function addIfExists(
  parts: string[],
  value: string | undefined,
  formatter?: (v: string) => string
): void {
  if (value) {
    parts.push(formatter ? formatter(value) : value.toLowerCase());
  }
}

// ============================================================================
// Input types
// ============================================================================

export interface CharacterAppearanceInput {
  appearance: Appearance;
}

export interface CharacterFullBodyInput extends CharacterAppearanceInput {
  archetype?: string;
  pose?: string;
  expression?: string;
  artStyle?: string;
}

export interface CharacterAvatarInput extends CharacterAppearanceInput {
  avatarStyle?: string;
  artStyle?: string;
}

// ============================================================================
// Generator: character.facial
// ============================================================================

export const characterFacialDef: PromptGeneratorDef<CharacterAppearanceInput> = {
  id: 'character.facial',
  entityType: 'character',
  description: 'Facial features prompt from character appearance',
  inputFields: [
    { path: 'appearance.face.shape' },
    { path: 'appearance.face.eyeColor' },
    { path: 'appearance.face.hairColor' },
    { path: 'appearance.face.hairStyle' },
    { path: 'appearance.face.facialHair', optional: true },
    { path: 'appearance.face.features', optional: true },
  ],
  dependencies: [],
  outputFormat: 'comma-separated',
  generate({ appearance }) {
    const parts: string[] = [];

    addIfExists(parts, appearance.face.shape, (v) => `${v.toLowerCase()} face`);
    addIfExists(parts, appearance.face.eyeColor, (v) => `${v.toLowerCase()} eyes`);

    if (appearance.face.hairColor && appearance.face.hairStyle) {
      parts.push(
        `${appearance.face.hairColor.toLowerCase()} ${appearance.face.hairStyle.toLowerCase()} hair`
      );
    } else {
      addIfExists(parts, appearance.face.hairColor, (v) => `${v.toLowerCase()} hair`);
      addIfExists(parts, appearance.face.hairStyle, (v) => `${v.toLowerCase()} hair`);
    }

    addIfExists(parts, appearance.face.facialHair);
    addIfExists(parts, appearance.face.features);

    return parts.join(', ');
  },
};

// ============================================================================
// Generator: character.clothing
// ============================================================================

export const characterClothingDef: PromptGeneratorDef<CharacterAppearanceInput> = {
  id: 'character.clothing',
  entityType: 'character',
  description: 'Clothing & style prompt from character appearance',
  inputFields: [
    { path: 'appearance.clothing.style' },
    { path: 'appearance.clothing.color', optional: true },
    { path: 'appearance.clothing.accessories', optional: true },
  ],
  dependencies: [],
  outputFormat: 'comma-separated',
  generate({ appearance }) {
    const parts: string[] = [];

    addIfExists(parts, appearance.clothing.style, (v) => `wearing ${v.toLowerCase()}`);
    addIfExists(parts, appearance.clothing.color, (v) => `in ${v.toLowerCase()}`);
    addIfExists(parts, appearance.clothing.accessories, (v) => `with ${v.toLowerCase()}`);

    return parts.join(' ');
  },
};

// ============================================================================
// Generator: character.full
// ============================================================================

export const characterFullDef: PromptGeneratorDef<CharacterAppearanceInput> = {
  id: 'character.full',
  entityType: 'character',
  description: 'Complete character appearance prompt combining facial + clothing',
  inputFields: [
    { path: 'appearance.gender' },
    { path: 'appearance.age' },
    { path: 'appearance.height', optional: true },
    { path: 'appearance.bodyType', optional: true },
    { path: 'appearance.skinColor', optional: true },
    { path: 'appearance.customFeatures', optional: true },
  ],
  dependencies: ['character.facial', 'character.clothing'],
  outputFormat: 'comma-separated',
  generate({ appearance }, deps) {
    const parts: string[] = [];

    addIfExists(parts, appearance.gender);
    addIfExists(parts, appearance.age);
    addIfExists(parts, appearance.height);
    addIfExists(parts, appearance.bodyType);
    addIfExists(parts, appearance.skinColor, (v) => `${v.toLowerCase()} skin`);

    const facialPrompt = deps['character.facial'];
    if (facialPrompt) parts.push(facialPrompt);

    const clothingPrompt = deps['character.clothing'];
    if (clothingPrompt) parts.push(clothingPrompt);

    addIfExists(parts, appearance.face.features, (v) => v);
    addIfExists(parts, appearance.customFeatures, (v) => v);

    return parts.join(', ');
  },
};

// ============================================================================
// Generator: character.fullBody
// ============================================================================

/** Archetype descriptions used for full-body illustration prompts */
const ARCHETYPE_DESCRIPTIONS: Record<string, string> = {
  knight: 'Armored warrior, honorable protector',
  wizard: 'Mystical spellcaster with arcane power',
  assassin: 'Stealthy shadow operative',
  ranger: 'Wilderness expert and skilled tracker',
  cleric: 'Divine healer with holy power',
  barbarian: 'Fierce tribal warrior',
  bard: 'Charismatic performer and storyteller',
  rogue: 'Cunning trickster and thief',
  noble: 'Aristocrat with refined bearing',
  merchant: 'Shrewd trader and negotiator',
  scholar: 'Learned academic and researcher',
  soldier: 'Disciplined military professional',
};

const POSE_DESCRIPTIONS: Record<string, string> = {
  heroic: 'Standing in a heroic pose with confident stance',
  battle: 'In a battle-ready stance, alert and prepared',
  casual: 'Relaxed with an approachable posture',
  sitting: 'Seated comfortably with relaxed demeanor',
  walking: 'Mid-stride in a dynamic walking pose',
  action: 'Dynamic action pose with dramatic movement',
  mysterious: 'Partially shrouded with enigmatic presence',
  regal: 'Standing with noble, commanding presence',
};

const EXPRESSION_DESCRIPTIONS: Record<string, string> = {
  determined: 'Focused and resolute expression',
  serene: 'Calm and peaceful expression',
  fierce: 'Intense and powerful gaze',
  cunning: 'Knowing smirk, clever appearance',
  noble: 'Dignified and proud expression',
  haunted: 'Distant eyes with weight of past',
  joyful: 'Warm smile, genuine happiness',
  mysterious: 'Inscrutable, unreadable expression',
};

export const characterFullBodyDef: PromptGeneratorDef<CharacterFullBodyInput> = {
  id: 'character.fullBody',
  entityType: 'character',
  description: 'Full-body character illustration prompt with archetype, pose, expression',
  inputFields: [
    { path: 'appearance', optional: false },
    { path: 'archetype', optional: true },
    { path: 'pose', optional: true },
    { path: 'expression', optional: true },
    { path: 'artStyle', optional: true },
  ],
  dependencies: ['character.facial', 'character.clothing'],
  outputFormat: 'comma-separated',
  generate(input, deps) {
    const { appearance, archetype, pose, expression, artStyle } = input;
    const parts: string[] = [];

    if (artStyle) parts.push(artStyle);
    parts.push('Full-body character illustration,');

    if (archetype && ARCHETYPE_DESCRIPTIONS[archetype]) {
      parts.push(ARCHETYPE_DESCRIPTIONS[archetype] + ',');
    }

    const basicDetails = [
      appearance.age,
      appearance.gender,
      appearance.skinColor ? `${appearance.skinColor} skin` : '',
      appearance.bodyType,
      appearance.height,
    ].filter(Boolean).join(' ');
    if (basicDetails) parts.push(basicDetails + ',');

    const facialPrompt = deps['character.facial'];
    if (facialPrompt) parts.push(facialPrompt + ',');

    const clothingPrompt = deps['character.clothing'];
    if (clothingPrompt) parts.push(`wearing ${clothingPrompt},`);

    if (pose && POSE_DESCRIPTIONS[pose]) {
      parts.push(POSE_DESCRIPTIONS[pose] + ',');
    }
    if (expression && EXPRESSION_DESCRIPTIONS[expression]) {
      parts.push(EXPRESSION_DESCRIPTIONS[expression] + ',');
    }

    if (appearance.customFeatures) parts.push(appearance.customFeatures + ',');
    parts.push('highly detailed, professional illustration quality');

    return parts.join(' ').replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();
  },
};

// ============================================================================
// Generator: character.avatar
// ============================================================================

const AVATAR_STYLE_DESCRIPTIONS: Record<string, string> = {
  pixel: '16-bit retro gaming aesthetic',
  rpg: 'Classic RPG character portrait',
  chibi: 'Super deformed, cute style',
  portrait: 'Realistic detailed portrait',
  cartoon: 'Western comic book style',
  handdrawn: 'Hand-drawn pencil aesthetic',
  story: 'Match project art style',
};

export const characterAvatarDef: PromptGeneratorDef<CharacterAvatarInput> = {
  id: 'character.avatar',
  entityType: 'character',
  description: 'Character avatar/portrait prompt',
  inputFields: [
    { path: 'appearance', optional: false },
    { path: 'avatarStyle', optional: true },
    { path: 'artStyle', optional: true },
  ],
  dependencies: ['character.facial'],
  outputFormat: 'comma-separated',
  generate(input, deps) {
    const { appearance, avatarStyle, artStyle } = input;
    const parts: string[] = [];

    if (artStyle) parts.push(artStyle);
    if (avatarStyle && AVATAR_STYLE_DESCRIPTIONS[avatarStyle]) {
      parts.push(AVATAR_STYLE_DESCRIPTIONS[avatarStyle] + ',');
    }
    parts.push('Character portrait,');

    const facialPrompt = deps['character.facial'];
    if (facialPrompt) parts.push(facialPrompt + ',');

    const basicDetails = [
      appearance.age,
      appearance.gender,
      appearance.skinColor ? `${appearance.skinColor} skin` : '',
    ].filter(Boolean).join(' ');
    if (basicDetails) parts.push(basicDetails + ',');

    parts.push('high quality, detailed portrait');

    return parts.join(' ').replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();
  },
};

// ============================================================================
// Registration
// ============================================================================

export function registerCharacterGenerators(): void {
  promptRegistry.register(characterFacialDef);
  promptRegistry.register(characterClothingDef);
  promptRegistry.register(characterFullDef);
  promptRegistry.register(characterFullBodyDef);
  promptRegistry.register(characterAvatarDef);
}
