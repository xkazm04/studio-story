/**
 * Prompt Composer Data
 * Predefined options for style, setting, and mood
 */

import { PromptOption, PromptColumn, PromptDimension, MAX_PROMPT_LENGTH } from './types';

export const STYLE_OPTIONS: PromptOption[] = [
  {
    id: 'cinematic',
    label: 'Cinematic',
    description: 'Hollywood movie quality visuals',
    tags: ['realistic', 'dramatic'],
    icon: '🎬',
    prompt: 'Cinematic shot, dramatic lighting, film grain, shallow depth of field, 35mm lens, professional color grading',
  },
  {
    id: 'anime',
    label: 'Anime',
    description: 'Japanese animation style',
    tags: ['stylized', 'colorful'],
    icon: '🎌',
    prompt: 'Anime style illustration, vibrant colors, clean lines, expressive characters, Studio Ghibli inspired',
  },
  {
    id: 'fantasy-art',
    label: 'Fantasy Art',
    description: 'Epic fantasy illustration',
    tags: ['fantasy', 'epic'],
    icon: '⚔️',
    prompt: 'Epic fantasy art, detailed illustration, magical atmosphere, rich colors, dramatic composition',
  },
  {
    id: 'noir',
    label: 'Noir',
    description: 'Dark detective aesthetic',
    tags: ['dark', 'moody'],
    icon: '🌑',
    prompt: 'Film noir style, high contrast black and white, dramatic shadows, venetian blinds lighting',
  },
  {
    id: 'watercolor',
    label: 'Watercolor',
    description: 'Soft painted aesthetic',
    tags: ['artistic', 'soft'],
    icon: '🎨',
    prompt: 'Watercolor painting style, soft edges, flowing colors, artistic brush strokes, dreamy atmosphere',
  },
  {
    id: 'pixel-art',
    label: 'Pixel Art',
    description: 'Retro game aesthetic',
    tags: ['retro', 'game'],
    icon: '👾',
    prompt: 'Pixel art style, 16-bit aesthetic, limited color palette, retro game graphics',
  },
  {
    id: 'comic',
    label: 'Comic Book',
    description: 'Bold graphic novel style',
    tags: ['stylized', 'bold'],
    icon: '💥',
    prompt: 'Comic book art style, bold outlines, halftone dots, dynamic composition, vibrant colors',
  },
  {
    id: 'photorealistic',
    label: 'Photorealistic',
    description: 'Ultra realistic renders',
    tags: ['realistic', 'detailed'],
    icon: '📷',
    prompt: 'Photorealistic render, ultra detailed, 8K resolution, ray tracing, natural lighting',
  },
];

export const SETTING_OPTIONS: PromptOption[] = [
  {
    id: 'forest',
    label: 'Enchanted Forest',
    description: 'Mystical woodland',
    tags: ['nature', 'fantasy'],
    icon: '🌲',
    prompt: 'Ancient enchanted forest, towering trees, dappled sunlight, mystical fog, glowing mushrooms',
  },
  {
    id: 'castle',
    label: 'Medieval Castle',
    description: 'Grand fortress',
    tags: ['medieval', 'architecture'],
    icon: '🏰',
    prompt: 'Grand medieval castle, stone walls, towering spires, banners, torchlit corridors',
  },
  {
    id: 'city-night',
    label: 'City at Night',
    description: 'Urban nightscape',
    tags: ['urban', 'modern'],
    icon: '🌃',
    prompt: 'Modern city at night, neon lights, rain-slicked streets, skyscrapers, atmospheric fog',
  },
  {
    id: 'space',
    label: 'Deep Space',
    description: 'Cosmic void',
    tags: ['scifi', 'cosmic'],
    icon: '🚀',
    prompt: 'Deep space vista, distant galaxies, nebulae, stars, cosmic scale, ethereal glow',
  },
  {
    id: 'tavern',
    label: 'Cozy Tavern',
    description: 'Warm inn interior',
    tags: ['interior', 'fantasy'],
    icon: '🍺',
    prompt: 'Cozy medieval tavern interior, wooden beams, fireplace, candlelight, warm atmosphere',
  },
  {
    id: 'underwater',
    label: 'Underwater',
    description: 'Ocean depths',
    tags: ['water', 'nature'],
    icon: '🌊',
    prompt: 'Underwater scene, coral reefs, bioluminescent creatures, light rays penetrating water',
  },
  {
    id: 'desert',
    label: 'Ancient Desert',
    description: 'Sandy ruins',
    tags: ['desert', 'ancient'],
    icon: '🏜️',
    prompt: 'Ancient desert landscape, sand dunes, ruins, oasis, golden hour lighting',
  },
  {
    id: 'mountains',
    label: 'Mountain Peak',
    description: 'Alpine heights',
    tags: ['nature', 'epic'],
    icon: '⛰️',
    prompt: 'Dramatic mountain peaks, snow-capped summits, alpine meadows, epic scale',
  },
];

export const MOOD_OPTIONS: PromptOption[] = [
  {
    id: 'mysterious',
    label: 'Mysterious',
    description: 'Enigmatic atmosphere',
    tags: ['dark', 'intrigue'],
    icon: '🔮',
    prompt: 'Mysterious atmosphere, deep shadows, hidden secrets, atmospheric fog, muted colors',
  },
  {
    id: 'epic',
    label: 'Epic',
    description: 'Grand and heroic',
    tags: ['dramatic', 'heroic'],
    icon: '⚡',
    prompt: 'Epic heroic atmosphere, dramatic sky, golden light, triumphant mood, grand scale',
  },
  {
    id: 'peaceful',
    label: 'Peaceful',
    description: 'Calm serenity',
    tags: ['calm', 'soft'],
    icon: '🌸',
    prompt: 'Peaceful serene atmosphere, soft lighting, gentle colors, tranquil mood, harmony',
  },
  {
    id: 'tense',
    label: 'Tense',
    description: 'High stakes',
    tags: ['dramatic', 'dark'],
    icon: '⏰',
    prompt: 'Tense atmosphere, sharp contrasts, urgent mood, dramatic shadows, anticipation',
  },
  {
    id: 'romantic',
    label: 'Romantic',
    description: 'Love and passion',
    tags: ['warm', 'emotional'],
    icon: '💕',
    prompt: 'Romantic atmosphere, warm golden light, soft focus, intimate mood, rose tints',
  },
  {
    id: 'horror',
    label: 'Horror',
    description: 'Fear and dread',
    tags: ['dark', 'scary'],
    icon: '👻',
    prompt: 'Horror atmosphere, ominous shadows, cold colors, unsettling mood, lurking dread',
  },
  {
    id: 'whimsical',
    label: 'Whimsical',
    description: 'Playful fantasy',
    tags: ['light', 'fun'],
    icon: '✨',
    prompt: 'Whimsical atmosphere, bright colors, playful elements, magical sparkles, cheerful mood',
  },
  {
    id: 'melancholic',
    label: 'Melancholic',
    description: 'Bittersweet sorrow',
    tags: ['emotional', 'soft'],
    icon: '🌧️',
    prompt: 'Melancholic atmosphere, muted colors, soft rain, reflective mood, gentle sadness',
  },
];

export const PROMPT_COLUMNS: PromptColumn[] = [
  {
    id: 'style',
    label: 'Art Style',
    icon: '🎨',
    description: 'Choose the visual style',
    options: STYLE_OPTIONS,
  },
  {
    id: 'setting',
    label: 'Setting',
    icon: '🏞️',
    description: 'Choose the scene location',
    options: SETTING_OPTIONS,
  },
  {
    id: 'mood',
    label: 'Mood',
    icon: '✨',
    description: 'Choose the atmosphere',
    options: MOOD_OPTIONS,
  },
];

export const dimensionOptions: Record<PromptDimension, PromptOption[]> = {
  style: STYLE_OPTIONS,
  setting: SETTING_OPTIONS,
  mood: MOOD_OPTIONS,
};

/**
 * Compose the final prompt from selections
 */
export function composePrompt(
  selections: Partial<Record<PromptDimension, PromptOption | undefined>>
): string {
  const parts: string[] = [];

  if (selections.style) {
    parts.push(selections.style.prompt);
  }

  if (selections.setting) {
    parts.push(`\n\nScene: ${selections.setting.prompt}`);
  }

  if (selections.mood) {
    parts.push(`\n\nMood: ${selections.mood.prompt}`);
  }

  const result = parts.join('');

  if (result.length > MAX_PROMPT_LENGTH) {
    return result.substring(0, MAX_PROMPT_LENGTH - 3) + '...';
  }

  return result;
}

/**
 * Create a custom prompt option
 */
export function createCustomOption(dimension: PromptDimension, customPrompt: string): PromptOption {
  return {
    id: `custom-${dimension}`,
    label: 'Custom',
    description: 'Your custom prompt',
    tags: ['custom'],
    icon: '✏️',
    prompt: customPrompt,
    isCustom: true,
  };
}
