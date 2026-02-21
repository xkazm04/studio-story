/**
 * Sketch Generation Types and Constants
 */

// Character limits for user input
export const MAX_PROMPT_LENGTH = 1500;
export const MIN_PROMPT_LENGTH = 100;

// Fixed sizing for widescreen scenes
export const SCENE_WIDTH = 1184;
export const SCENE_HEIGHT = 672;

export interface GeneratedImage {
  url: string;
  width: number;
  height: number;
  prompt?: string;
  generationId?: string;
  imageId?: string;
}

export type SketchMode = 'custom' | 'narrative';

/**
 * Mood options for image generation
 */
export interface MoodOption {
  id: string;
  label: string;
  icon: string;
  prompt: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  {
    id: 'dramatic',
    label: 'Dramatic',
    icon: '🎭',
    prompt: 'dramatic lighting, high contrast, cinematic shadows, intense atmosphere',
  },
  {
    id: 'serene',
    label: 'Serene',
    icon: '🌸',
    prompt: 'peaceful, calm, soft lighting, tranquil atmosphere, gentle mood',
  },
  {
    id: 'mysterious',
    label: 'Mysterious',
    icon: '🌙',
    prompt: 'mysterious fog, atmospheric haze, enigmatic shadows, ethereal lighting',
  },
  {
    id: 'action',
    label: 'Action',
    icon: '⚡',
    prompt: 'dynamic movement, motion blur, energetic composition, explosive energy',
  },
  {
    id: 'romantic',
    label: 'Romantic',
    icon: '💕',
    prompt: 'warm golden hour lighting, soft bokeh, romantic atmosphere, dreamy mood',
  },
  {
    id: 'dark',
    label: 'Dark',
    icon: '🖤',
    prompt: 'dark and moody, noir lighting, deep shadows, ominous atmosphere',
  },
  {
    id: 'whimsical',
    label: 'Whimsical',
    icon: '✨',
    prompt: 'magical sparkles, fantastical elements, playful composition, enchanted mood',
  },
  {
    id: 'epic',
    label: 'Epic',
    icon: '🏔️',
    prompt: 'grand scale, epic vista, majestic composition, awe-inspiring perspective',
  },
];
