/**
 * Prompt Composer Utilities
 * Shared constants and utilities for character image/avatar generation
 */

import { Appearance } from '@/app/types/Character';

/**
 * Pose options for character generation
 */
export const POSE_OPTIONS = [
  { id: 'heroic', label: 'heroic', description: 'Standing in a heroic pose with confident stance' },
  { id: 'battle', label: 'battle_ready', description: 'In a battle-ready stance, alert and prepared' },
  { id: 'casual', label: 'casual', description: 'Relaxed with an approachable posture' },
  { id: 'sitting', label: 'sitting', description: 'Seated comfortably with relaxed demeanor' },
  { id: 'walking', label: 'walking', description: 'Mid-stride in a dynamic walking pose' },
  { id: 'action', label: 'action', description: 'Dynamic action pose with dramatic movement' },
  { id: 'mysterious', label: 'mysterious', description: 'Partially shrouded with enigmatic presence' },
  { id: 'regal', label: 'regal', description: 'Standing with noble, commanding presence' },
] as const;

/**
 * Expression options for character generation
 */
export const EXPRESSION_OPTIONS = [
  { id: 'determined', label: 'determined', description: 'Focused and resolute expression' },
  { id: 'serene', label: 'serene', description: 'Calm and peaceful expression' },
  { id: 'fierce', label: 'fierce', description: 'Intense and powerful gaze' },
  { id: 'cunning', label: 'cunning', description: 'Knowing smirk, clever appearance' },
  { id: 'noble', label: 'noble', description: 'Dignified and proud expression' },
  { id: 'haunted', label: 'haunted', description: 'Distant eyes with weight of past' },
  { id: 'joyful', label: 'joyful', description: 'Warm smile, genuine happiness' },
  { id: 'mysterious', label: 'mysterious', description: 'Inscrutable, unreadable expression' },
] as const;

/**
 * Archetype options for character generation
 */
export const ARCHETYPE_OPTIONS = [
  { id: 'knight', label: 'knight', description: 'Armored warrior, honorable protector' },
  { id: 'wizard', label: 'wizard', description: 'Mystical spellcaster with arcane power' },
  { id: 'assassin', label: 'assassin', description: 'Stealthy shadow operative' },
  { id: 'ranger', label: 'ranger', description: 'Wilderness expert and skilled tracker' },
  { id: 'cleric', label: 'cleric', description: 'Divine healer with holy power' },
  { id: 'barbarian', label: 'barbarian', description: 'Fierce tribal warrior' },
  { id: 'bard', label: 'bard', description: 'Charismatic performer and storyteller' },
  { id: 'rogue', label: 'rogue', description: 'Cunning trickster and thief' },
  { id: 'noble', label: 'noble', description: 'Aristocrat with refined bearing' },
  { id: 'merchant', label: 'merchant', description: 'Shrewd trader and negotiator' },
  { id: 'scholar', label: 'scholar', description: 'Learned academic and researcher' },
  { id: 'soldier', label: 'soldier', description: 'Disciplined military professional' },
] as const;

/**
 * Avatar style options
 */
export const AVATAR_STYLES = [
  { id: 'pixel', label: 'pixel_art', description: '16-bit retro gaming aesthetic' },
  { id: 'rpg', label: 'rpg_classic', description: 'Classic RPG character portrait' },
  { id: 'chibi', label: 'chibi', description: 'Super deformed, cute style' },
  { id: 'portrait', label: 'portrait', description: 'Realistic detailed portrait' },
  { id: 'cartoon', label: 'cartoon', description: 'Western comic book style' },
  { id: 'handdrawn', label: 'sketch', description: 'Hand-drawn pencil aesthetic' },
  { id: 'story', label: 'story_style', description: 'Match project art style' },
] as const;

/**
 * Image generation quality presets
 */
export const GENERATION_PRESETS = {
  sketch: {
    width: 512,
    height: 576,
    numImages: 4,
    quality: 'standard',
  },
  final: {
    width: 768,
    height: 1024,
    numImages: 1,
    quality: 'high',
  },
  avatar: {
    width: 512,
    height: 512,
    numImages: 4,
    quality: 'standard',
  },
} as const;

/**
 * Selection state for image generation
 */
export interface GenerationSelections {
  archetype?: string;
  pose?: string;
  expression?: string;
}

/**
 * Compose a basic prompt from appearance data (client-side fallback)
 */
export function composeBasicPrompt(
  appearance: Appearance,
  selections: GenerationSelections,
  artStyle?: string
): string {
  const parts: string[] = [];

  // Art style first
  if (artStyle) {
    parts.push(artStyle);
  }

  // Full-body directive
  parts.push('Full-body character illustration,');

  // Archetype
  const archetypeOption = ARCHETYPE_OPTIONS.find(a => a.id === selections.archetype);
  if (archetypeOption) {
    parts.push(archetypeOption.description + ',');
  }

  // Character basics
  const basicDetails = [
    appearance.age,
    appearance.gender,
    appearance.skinColor ? `${appearance.skinColor} skin` : '',
    appearance.bodyType,
    appearance.height,
  ].filter(Boolean).join(' ');
  if (basicDetails) {
    parts.push(basicDetails + ',');
  }

  // Facial features
  const face = appearance.face;
  if (face) {
    const faceDetails = [
      face.hairColor && face.hairStyle ? `${face.hairColor} ${face.hairStyle} hair` : '',
      face.eyeColor ? `${face.eyeColor} eyes` : '',
      face.features || '',
    ].filter(Boolean).join(', ');
    if (faceDetails) {
      parts.push(faceDetails + ',');
    }
  }

  // Clothing
  const clothing = appearance.clothing;
  if (clothing) {
    const clothingDetails = [
      clothing.style || '',
      clothing.color ? `in ${clothing.color}` : '',
      clothing.accessories || '',
    ].filter(Boolean).join(' ');
    if (clothingDetails) {
      parts.push(`wearing ${clothingDetails},`);
    }
  }

  // Pose
  const poseOption = POSE_OPTIONS.find(p => p.id === selections.pose);
  if (poseOption) {
    parts.push(poseOption.description + ',');
  }

  // Expression
  const expressionOption = EXPRESSION_OPTIONS.find(e => e.id === selections.expression);
  if (expressionOption) {
    parts.push(expressionOption.description + ',');
  }

  // Custom features
  if (appearance.customFeatures) {
    parts.push(appearance.customFeatures + ',');
  }

  // Quality suffix
  parts.push('highly detailed, professional illustration quality');

  return parts.join(' ').replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();
}

/**
 * Compose a basic avatar prompt (client-side fallback)
 */
export function composeBasicAvatarPrompt(
  appearance: Appearance,
  style: string,
  artStyle?: string
): string {
  const parts: string[] = [];
  const styleOption = AVATAR_STYLES.find(s => s.id === style);

  // Art style first
  if (artStyle) {
    parts.push(artStyle);
  }

  // Style
  if (styleOption) {
    parts.push(styleOption.description + ',');
  }

  // Portrait directive
  parts.push('Character portrait,');

  // Face details
  const face = appearance.face;
  if (face) {
    const faceDetails = [
      face.hairColor && face.hairStyle ? `${face.hairColor} ${face.hairStyle} hair` : '',
      face.eyeColor ? `${face.eyeColor} eyes` : '',
      face.shape ? `${face.shape} face` : '',
      face.features || '',
    ].filter(Boolean).join(', ');
    if (faceDetails) {
      parts.push(faceDetails + ',');
    }
  }

  // Character basics (limited for avatar)
  const basicDetails = [
    appearance.age,
    appearance.gender,
    appearance.skinColor ? `${appearance.skinColor} skin` : '',
  ].filter(Boolean).join(' ');
  if (basicDetails) {
    parts.push(basicDetails + ',');
  }

  // Quality suffix
  parts.push('high quality, detailed portrait');

  return parts.join(' ').replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();
}

/**
 * Type exports
 */
export type PoseOption = typeof POSE_OPTIONS[number];
export type ExpressionOption = typeof EXPRESSION_OPTIONS[number];
export type ArchetypeOption = typeof ARCHETYPE_OPTIONS[number];
export type AvatarStyleOption = typeof AVATAR_STYLES[number];
export type GenerationPreset = keyof typeof GENERATION_PRESETS;
