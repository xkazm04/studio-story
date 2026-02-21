/**
 * Claude Prompt Map V2 - Presets
 * Pre-configured prompt combinations
 */

import { PromptPreset } from './promptMapV2Types';

export const PROMPT_PRESETS: PromptPreset[] = [
  {
    id: 'cyberpunk-night',
    name: 'Cyberpunk Night',
    description: 'Classic neon-soaked cyberpunk scene',
    emoji: '🌃',
    selections: {
      theme: 'neon-cyberpunk',
      scene: 'neon-rain-city',
      character: 'cyber-samurai',
    },
  },
  {
    id: 'fantasy-epic',
    name: 'Fantasy Epic',
    description: 'Majestic fantasy adventure',
    emoji: '⚔️',
    selections: {
      theme: 'cinematic-realism',
      scene: 'floating-sky-temple',
      character: 'phoenix-guardian',
    },
  },
  {
    id: 'mystical-forest',
    name: 'Mystical Forest',
    description: 'Enchanted woodland magic',
    emoji: '🌲',
    selections: {
      theme: 'ethereal-glow',
      scene: 'bioluminescent-forest',
      character: 'nature-druid',
    },
  },
  {
    id: 'cosmic-journey',
    name: 'Cosmic Journey',
    description: 'Space exploration and wonder',
    emoji: '🌌',
    selections: {
      theme: 'cinematic-realism',
      scene: 'cosmic-void',
      character: 'astral-mage',
    },
  },
  {
    id: 'steampunk-adventure',
    name: 'Steampunk Adventure',
    description: 'Victorian-era mechanical marvels',
    emoji: '⚙️',
    selections: {
      theme: 'oil-masterpiece',
      scene: 'steampunk-workshop',
      character: 'clockwork-inventor',
    },
  },
];
