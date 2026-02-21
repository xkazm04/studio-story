/**
 * Art Style Service
 *
 * Handles art style management for stories including:
 * - Getting current art style for a story
 * - Updating art style settings
 * - Extracting art style from uploaded images
 */

import { ART_STYLES, getArtStyleById, getDefaultArtStyle } from '../artStyleData';
import { ArtStyle, ArtStyleConfig, ArtStyleDetails, ArtStyleSource } from '../types';

export interface ProjectArtStyleFields {
  artStyleId: string | null;
  customArtStylePrompt: string | null;
  artStyleSource: ArtStyleSource | null;
  extractedStyleImageUrl: string | null;
}

/**
 * Get the effective art style prompt for a project
 * This is the prompt that should be used for image generation
 */
export function getEffectiveArtStylePrompt(fields: ProjectArtStyleFields): string {
  // If using a custom or extracted style, use the custom prompt
  if (
    (fields.artStyleSource === 'custom' || fields.artStyleSource === 'extracted') &&
    fields.customArtStylePrompt
  ) {
    return fields.customArtStylePrompt;
  }

  // Otherwise use the preset style
  const style = getArtStyleById(fields.artStyleId || 'adventure_journal');
  return style?.stylePrompt || getDefaultArtStyle().stylePrompt;
}

/**
 * Get the art style configuration from project fields
 */
export function getArtStyleConfig(fields: ProjectArtStyleFields): ArtStyleConfig {
  return {
    styleId: fields.artStyleId,
    customPrompt: fields.customArtStylePrompt,
    source: fields.artStyleSource || 'preset',
    extractedImageUrl: fields.extractedStyleImageUrl,
  };
}

/**
 * Get display details for a project's art style (icon, label)
 */
export function getArtStyleDetails(fields: ProjectArtStyleFields): ArtStyleDetails {
  // For extracted/custom styles, show a generic indicator
  if (fields.artStyleSource === 'extracted') {
    return {
      icon: '🎨',
      label: 'Extracted Style',
      description: 'Style extracted from uploaded image',
    };
  }

  if (fields.artStyleSource === 'custom') {
    return {
      icon: '✏️',
      label: 'Custom Style',
      description: 'Custom art style prompt',
    };
  }

  // For preset styles, get details from the style definition
  const style = getArtStyleById(fields.artStyleId || 'adventure_journal');
  if (style) {
    return {
      icon: style.icon,
      label: style.label,
      description: style.description,
    };
  }

  // Fallback to default
  const defaultStyle = getDefaultArtStyle();
  return {
    icon: defaultStyle.icon,
    label: defaultStyle.label,
    description: defaultStyle.description,
  };
}

/**
 * Get all available preset art styles
 */
export function getPresetArtStyles(): ArtStyle[] {
  return ART_STYLES;
}

/**
 * Prompt template for extracting art style from an image
 */
export const ART_STYLE_EXTRACTION_PROMPT = `Analyze this image and extract its visual art style as a prompt that could be used to generate similar images.

Focus on:
1. **Rendering Technique**: How is the image rendered? (e.g., painted, sketched, digital, cel-shaded, crosshatched)
2. **Color Palette**: What colors dominate? Is it muted, vibrant, monochrome, warm, cool?
3. **Texture**: What textures are visible? (e.g., paper grain, brush strokes, smooth gradients)
4. **Lighting**: How is the scene lit? (e.g., dramatic shadows, soft ambient, rim lighting)
5. **Atmosphere/Mood**: What feeling does the style evoke?
6. **Line Work**: If present, describe the line quality (bold, delicate, sketchy, clean)

IMPORTANT: Your response MUST be in this exact format:
<STYLE_PROMPT>
Your art style description here (maximum 500 characters)
</STYLE_PROMPT>

The prompt should be generic enough to apply to any scene or subject, not specific to this particular image's content.
Keep it concise but descriptive - maximum 500 characters.`;

export const ART_STYLE_EXTRACTION_SYSTEM_PROMPT = `You are an expert art director and visual analyst. Your task is to analyze images and extract their visual art style as reusable prompts for AI image generation.

Guidelines:
- Focus on the HOW (technique, style) not the WHAT (subject, content)
- Write prompts that are abstract and applicable to any scene
- Use descriptive, evocative language that captures artistic essence
- Avoid references to specific people, characters, or objects in the image
- Structure the prompt to work well with image generation AI
- CRITICAL: Keep the prompt under 500 characters
- CRITICAL: Always wrap your response in <STYLE_PROMPT></STYLE_PROMPT> tags`;
