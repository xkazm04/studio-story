/**
 * Claude Prompt Map V2 - Theme Options
 * Visual style options for the prompt builder
 */

import { ClaudePromptOptionV2 } from './promptMapV2Types';

export const THEME_OPTIONS_V2: ClaudePromptOptionV2[] = [
  {
    id: 'cinematic-realism',
    label: 'Cinematic Realism',
    description: 'Film-quality photorealistic rendering with dramatic lighting and composition',
    tags: ['realistic', 'cinematic', 'dramatic'],
    keywords: ['photorealistic', '8k', 'cinematic lighting', 'film grain', 'depth of field'],
    visual: {
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      icon: '🎬',
      color: '#667eea',
      particles: ['✨', '💫', '⭐'],
      mood: 85,
      energy: 70,
    },
  },
  {
    id: 'anime-vibrant',
    label: 'Anime Vibrant',
    description: 'High-energy Japanese animation style with bold colors and dynamic angles',
    tags: ['anime', 'colorful', 'dynamic'],
    keywords: ['anime style', 'vibrant colors', 'cel shading', 'dynamic composition'],
    visual: {
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      icon: '🎌',
      color: '#f093fb',
      particles: ['🌸', '⚡', '💥'],
      mood: 95,
      energy: 90,
    },
  },
  {
    id: 'oil-masterpiece',
    label: 'Oil Painting Masterpiece',
    description: 'Classical oil painting with rich textures and timeless elegance',
    tags: ['classical', 'artistic', 'elegant'],
    keywords: ['oil painting', 'brushstrokes', 'canvas texture', 'classical art'],
    visual: {
      gradient: 'linear-gradient(135deg, #d4a574 0%, #8b6914 100%)',
      icon: '🖼️',
      color: '#d4a574',
      particles: ['🎨', '✨', '🌟'],
      mood: 60,
      energy: 40,
    },
  },
  {
    id: 'neon-cyberpunk',
    label: 'Neon Cyberpunk',
    description: 'High-tech dystopian future with neon lights and digital chaos',
    tags: ['cyberpunk', 'neon', 'futuristic'],
    keywords: ['neon lights', 'cyberpunk', 'holographic', 'digital glitch', 'rain-slicked streets'],
    visual: {
      gradient: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 50%, #ff00ff 100%)',
      icon: '🌃',
      color: '#00f2fe',
      particles: ['⚡', '💠', '🔷'],
      mood: 75,
      energy: 95,
    },
  },
  {
    id: 'watercolor-dream',
    label: 'Watercolor Dream',
    description: 'Soft, flowing watercolor with ethereal transparency and delicate washes',
    tags: ['soft', 'artistic', 'dreamy'],
    keywords: ['watercolor', 'soft edges', 'transparent washes', 'flowing colors'],
    visual: {
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      icon: '💧',
      color: '#a8edea',
      particles: ['💧', '🌊', '✨'],
      mood: 45,
      energy: 30,
    },
  },
  {
    id: 'pixel-retro',
    label: 'Pixel Art Retro',
    description: '16-bit nostalgia with chunky pixels and limited palette charm',
    tags: ['retro', 'pixel', 'gaming'],
    keywords: ['pixel art', '16-bit', 'retro gaming', 'limited palette', 'dithering'],
    visual: {
      gradient: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 50%, #ffe66d 100%)',
      icon: '🎮',
      color: '#ff6b6b',
      particles: ['▪️', '◾', '🟦'],
      mood: 70,
      energy: 80,
    },
  },
  {
    id: 'ethereal-glow',
    label: 'Ethereal Glow',
    description: 'Otherworldly luminescence with soft light blooms and mystical auras',
    tags: ['mystical', 'glowing', 'ethereal'],
    keywords: ['ethereal lighting', 'soft glow', 'light bloom', 'mystical atmosphere'],
    visual: {
      gradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
      icon: '✨',
      color: '#e0c3fc',
      particles: ['✨', '🌟', '💫'],
      mood: 55,
      energy: 50,
    },
  },
  {
    id: 'ink-noir',
    label: 'Ink Noir',
    description: 'Stark black and white contrast with bold ink strokes and shadows',
    tags: ['noir', 'dramatic', 'monochrome'],
    keywords: ['black and white', 'high contrast', 'ink drawing', 'dramatic shadows'],
    visual: {
      gradient: 'linear-gradient(135deg, #434343 0%, #000000 100%)',
      icon: '🖋️',
      color: '#434343',
      particles: ['⚫', '⬛', '🔲'],
      mood: 40,
      energy: 60,
    },
  },
];
