/**
 * Prompt Generation Modules
 * Generate prompts for specific sections of character appearance
 */

import { Appearance } from '@/app/types/Character';

/**
 * Helper to add a field to parts if it exists
 */
function addIfExists(parts: string[], value: string | undefined, formatter?: (v: string) => string): void {
  if (value) {
    parts.push(formatter ? formatter(value) : value.toLowerCase());
  }
}

/**
 * Generate prompt for Facial Features section
 */
export function generateFacialFeaturesPrompt(appearance: Appearance): string {
  const parts: string[] = [];

  addIfExists(parts, appearance.face.shape, (v) => `${v.toLowerCase()} face`);
  addIfExists(parts, appearance.face.eyeColor, (v) => `${v.toLowerCase()} eyes`);

  // Hair: combine color and style if both present
  if (appearance.face.hairColor && appearance.face.hairStyle) {
    parts.push(`${appearance.face.hairColor.toLowerCase()} ${appearance.face.hairStyle.toLowerCase()} hair`);
  } else {
    addIfExists(parts, appearance.face.hairColor, (v) => `${v.toLowerCase()} hair`);
    addIfExists(parts, appearance.face.hairStyle, (v) => `${v.toLowerCase()} hair`);
  }

  addIfExists(parts, appearance.face.facialHair);
  addIfExists(parts, appearance.face.features);

  return parts.join(', ');
}

/**
 * Generate prompt for Clothing & Style section
 */
export function generateClothingPrompt(appearance: Appearance): string {
  const parts: string[] = [];

  addIfExists(parts, appearance.clothing.style, (v) => `wearing ${v.toLowerCase()}`);
  addIfExists(parts, appearance.clothing.color, (v) => `in ${v.toLowerCase()}`);
  addIfExists(parts, appearance.clothing.accessories, (v) => `with ${v.toLowerCase()}`);

  return parts.join(' ');
}

/**
 * Generate complete AI Generation Prompt from all form inputs
 */
export function generateFullPrompt(appearance: Appearance): string {
  const parts: string[] = [];

  // Basic attributes
  addIfExists(parts, appearance.gender);
  addIfExists(parts, appearance.age);
  addIfExists(parts, appearance.height);
  addIfExists(parts, appearance.bodyType);
  addIfExists(parts, appearance.skinColor, (v) => `${v.toLowerCase()} skin`);

  // Facial features
  const facialPrompt = generateFacialFeaturesPrompt(appearance);
  if (facialPrompt) parts.push(facialPrompt);

  // Clothing
  const clothingPrompt = generateClothingPrompt(appearance);
  if (clothingPrompt) parts.push(clothingPrompt);

  // Special features (already validated to 1-10 words)
  addIfExists(parts, appearance.face.features, (v) => v);

  // Custom features
  addIfExists(parts, appearance.customFeatures, (v) => v);

  return parts.join(', ');
}
