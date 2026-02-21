export type ClaudePromptDimension = 'theme' | 'scene' | 'character';

export interface ClaudePromptOption {
  id: string;
  label: string;
  description?: string;
  tags?: string[];
  emoji?: string;
  color?: string;
}

export interface ClaudePromptColumnConfig {
  id: ClaudePromptDimension;
  label: string;
  accentColor: 'cyan' | 'purple' | 'amber' | 'emerald' | 'rose';
  icon: string;
}

export const CLAUDE_PROMPT_COLUMNS: ClaudePromptColumnConfig[] = [
  {
    id: 'theme',
    label: 'Theme',
    accentColor: 'cyan',
    icon: '🎨',
  },
  {
    id: 'scene',
    label: 'Scene',
    accentColor: 'purple',
    icon: '🎬',
  },
  {
    id: 'character',
    label: 'Character',
    accentColor: 'amber',
    icon: '👤',
  },
];

export const CLAUDE_THEME_OPTIONS: ClaudePromptOption[] = [
  {
    id: 'hyper-realistic',
    label: 'Hyper-Realistic',
    description: 'Ultra-detailed, photorealistic rendering with natural lighting',
    tags: ['realistic', 'photo', 'detailed'],
    emoji: '📸',
    color: '#06b6d4',
  },
  {
    id: 'anime-style',
    label: 'Anime Style',
    description: 'Japanese animation aesthetic, vibrant colors, expressive features',
    tags: ['anime', 'manga', 'stylized'],
    emoji: '🎌',
    color: '#ec4899',
  },
  {
    id: 'oil-painting',
    label: 'Oil Painting',
    description: 'Classical painting style, visible brushstrokes, rich textures',
    tags: ['traditional', 'artistic', 'painterly'],
    emoji: '🖼️',
    color: '#f59e0b',
  },
  {
    id: 'pixel-art',
    label: 'Pixel Art',
    description: 'Retro 8-bit/16-bit style, limited color palette, blocky aesthetic',
    tags: ['retro', '8bit', 'gaming'],
    emoji: '🎮',
    color: '#8b5cf6',
  },
  {
    id: 'watercolor',
    label: 'Watercolor',
    description: 'Soft washes, flowing colors, dreamy transparent layers',
    tags: ['soft', 'flowing', 'artistic'],
    emoji: '🎨',
    color: '#10b981',
  },
  {
    id: 'minimalist',
    label: 'Minimalist',
    description: 'Clean lines, simple shapes, limited color palette, negative space',
    tags: ['simple', 'modern', 'clean'],
    emoji: '⚪',
    color: '#64748b',
  },
  {
    id: 'steampunk',
    label: 'Steampunk',
    description: 'Victorian era meets steam-powered technology, brass and gears',
    tags: ['vintage', 'mechanical', 'industrial'],
    emoji: '⚙️',
    color: '#92400e',
  },
  {
    id: 'neon-glow',
    label: 'Neon Glow',
    description: 'Vibrant glowing lights, dark backgrounds, electric atmosphere',
    tags: ['neon', 'bright', 'electric'],
    emoji: '💡',
    color: '#06b6d4',
  },
  {
    id: 'cosmic-ethereal',
    label: 'Cosmic Ethereal',
    description: 'Celestial phenomena, nebula colors, otherworldly atmosphere',
    tags: ['space', 'cosmic', 'mystical'],
    emoji: '✨',
    color: '#a855f7',
  },
  {
    id: 'noir-monochrome',
    label: 'Noir Monochrome',
    description: 'Black and white, high contrast, dramatic shadows',
    tags: ['noir', 'dramatic', 'vintage'],
    emoji: '🎭',
    color: '#475569',
  },
];

export const CLAUDE_SCENE_OPTIONS: ClaudePromptOption[] = [
  {
    id: 'neon-cityscape',
    label: 'Neon Cityscape',
    description: 'Futuristic metropolis at night, holographic billboards, flying vehicles',
    tags: ['city', 'cyberpunk', 'urban'],
    emoji: '🌃',
    color: '#06b6d4',
  },
  {
    id: 'enchanted-forest',
    label: 'Enchanted Forest',
    description: 'Magical woodland, bioluminescent plants, mystical creatures',
    tags: ['forest', 'magical', 'nature'],
    emoji: '🌲',
    color: '#10b981',
  },
  {
    id: 'desert-oasis',
    label: 'Desert Oasis',
    description: 'Golden sand dunes, palm trees, shimmering water, ancient ruins',
    tags: ['desert', 'exotic', 'adventure'],
    emoji: '🏜️',
    color: '#f59e0b',
  },
  {
    id: 'floating-islands',
    label: 'Floating Islands',
    description: 'Sky islands connected by bridges, waterfalls cascading into clouds',
    tags: ['fantasy', 'aerial', 'majestic'],
    emoji: '☁️',
    color: '#60a5fa',
  },
  {
    id: 'underwater-city',
    label: 'Underwater City',
    description: 'Submerged civilization, bioluminescent coral, dome structures',
    tags: ['ocean', 'underwater', 'sci-fi'],
    emoji: '🌊',
    color: '#0ea5e9',
  },
  {
    id: 'crystal-palace',
    label: 'Crystal Palace',
    description: 'Translucent architecture, prism effects, rainbow light refraction',
    tags: ['elegant', 'magical', 'luxurious'],
    emoji: '💎',
    color: '#a855f7',
  },
  {
    id: 'volcanic-forge',
    label: 'Volcanic Forge',
    description: 'Lava flows, intense heat shimmer, molten metal, blacksmith workshop',
    tags: ['fire', 'industrial', 'intense'],
    emoji: '🔥',
    color: '#ef4444',
  },
  {
    id: 'frozen-tundra',
    label: 'Frozen Tundra',
    description: 'Ice crystals, aurora borealis, snow-covered landscape, arctic beauty',
    tags: ['cold', 'serene', 'winter'],
    emoji: '❄️',
    color: '#67e8f9',
  },
  {
    id: 'space-station',
    label: 'Space Station',
    description: 'Zero gravity environment, Earth view from windows, sleek corridors',
    tags: ['space', 'sci-fi', 'futuristic'],
    emoji: '🚀',
    color: '#1e293b',
  },
  {
    id: 'bamboo-garden',
    label: 'Bamboo Garden',
    description: 'Zen garden, stone paths, koi ponds, cherry blossoms, peaceful atmosphere',
    tags: ['zen', 'peaceful', 'nature'],
    emoji: '🎋',
    color: '#22c55e',
  },
  {
    id: 'steampunk-airship',
    label: 'Steampunk Airship',
    description: 'Victorian flying vessel, brass instruments, clouds below',
    tags: ['steampunk', 'adventure', 'mechanical'],
    emoji: '🎈',
    color: '#92400e',
  },
  {
    id: 'library-infinite',
    label: 'Infinite Library',
    description: 'Towering bookshelves reaching into darkness, floating books, warm candlelight',
    tags: ['knowledge', 'mysterious', 'cozy'],
    emoji: '📚',
    color: '#78350f',
  },
];

export const CLAUDE_CHARACTER_OPTIONS: ClaudePromptOption[] = [
  {
    id: 'cyber-samurai',
    label: 'Cyber Samurai',
    description: 'Katana with neon edge, traditional armor with tech enhancements, stoic expression',
    tags: ['warrior', 'cyberpunk', 'honor'],
    emoji: '⚔️',
    color: '#06b6d4',
  },
  {
    id: 'nature-druid',
    label: 'Nature Druid',
    description: 'Living vines as clothing, staff with growing branches, animal companion',
    tags: ['nature', 'magic', 'peaceful'],
    emoji: '🌿',
    color: '#10b981',
  },
  {
    id: 'cosmic-mage',
    label: 'Cosmic Mage',
    description: 'Robes resembling nebula, stars orbiting around, eyes glowing with cosmic energy',
    tags: ['magic', 'powerful', 'cosmic'],
    emoji: '🌌',
    color: '#a855f7',
  },
  {
    id: 'stealth-operative',
    label: 'Stealth Operative',
    description: 'High-tech suit with active camouflage, tactical gear, focused demeanor',
    tags: ['stealth', 'tech', 'tactical'],
    emoji: '🕵️',
    color: '#475569',
  },
  {
    id: 'fire-dancer',
    label: 'Fire Dancer',
    description: 'Flowing crimson attire, flames dancing from hands, passionate expression',
    tags: ['performer', 'elemental', 'graceful'],
    emoji: '🔥',
    color: '#ef4444',
  },
  {
    id: 'ice-queen',
    label: 'Ice Queen',
    description: 'Crystalline crown, frosted gown, cold elegance, commanding presence',
    tags: ['royal', 'elemental', 'powerful'],
    emoji: '👑',
    color: '#67e8f9',
  },
  {
    id: 'robot-companion',
    label: 'Robot Companion',
    description: 'Friendly design, LED expressions, helpful posture, polished metal',
    tags: ['robot', 'friendly', 'tech'],
    emoji: '🤖',
    color: '#94a3b8',
  },
  {
    id: 'mystic-oracle',
    label: 'Mystic Oracle',
    description: 'Third eye glowing, tarot cards floating, mysterious aura, wise expression',
    tags: ['mystical', 'wise', 'prophetic'],
    emoji: '🔮',
    color: '#8b5cf6',
  },
  {
    id: 'sky-pirate',
    label: 'Sky Pirate',
    description: 'Aviator goggles, wind-blown coat, grappling hook, adventurous grin',
    tags: ['adventurer', 'daring', 'freedom'],
    emoji: '🏴‍☠️',
    color: '#0284c7',
  },
  {
    id: 'alchemist',
    label: 'Alchemist',
    description: 'Potion bottles on belt, glowing ingredients, curious expression, stained gloves',
    tags: ['scientist', 'magic', 'experimental'],
    emoji: '⚗️',
    color: '#059669',
  },
  {
    id: 'shadow-assassin',
    label: 'Shadow Assassin',
    description: 'Dark hood concealing face, twin daggers, smoke trailing from movement',
    tags: ['stealth', 'deadly', 'mysterious'],
    emoji: '🗡️',
    color: '#1e293b',
  },
  {
    id: 'bard-musician',
    label: 'Bard Musician',
    description: 'Ornate lute, colorful clothing, charismatic smile, musical notes visible in air',
    tags: ['performer', 'charismatic', 'artistic'],
    emoji: '🎵',
    color: '#f59e0b',
  },
  {
    id: 'clockwork-inventor',
    label: 'Clockwork Inventor',
    description: 'Brass goggles, mechanical limbs, blueprint tattoos, tools everywhere',
    tags: ['inventor', 'steampunk', 'creative'],
    emoji: '⚙️',
    color: '#92400e',
  },
  {
    id: 'phoenix-guardian',
    label: 'Phoenix Guardian',
    description: 'Wings made of flame, armor with feather motifs, eyes burning with determination',
    tags: ['guardian', 'mythical', 'powerful'],
    emoji: '🦅',
    color: '#dc2626',
  },
];

export const claudeDimensionOptions: Record<ClaudePromptDimension, ClaudePromptOption[]> = {
  theme: CLAUDE_THEME_OPTIONS,
  scene: CLAUDE_SCENE_OPTIONS,
  character: CLAUDE_CHARACTER_OPTIONS,
};

export function composeClaudePrompt(
  selections: Partial<Record<ClaudePromptDimension, ClaudePromptOption | undefined>>
): string {
  const parts: string[] = [];

  if (selections.theme) {
    parts.push(`Style: ${selections.theme.description || selections.theme.label}`);
  }

  if (selections.scene) {
    parts.push(`Setting: ${selections.scene.description || selections.scene.label}`);
  }

  if (selections.character) {
    parts.push(`Subject: ${selections.character.description || selections.character.label}`);
  }

  return parts.join(' | ');
}

// Get all unique tags across all dimensions
export function getAllTags(): string[] {
  const allOptions = [
    ...CLAUDE_THEME_OPTIONS,
    ...CLAUDE_SCENE_OPTIONS,
    ...CLAUDE_CHARACTER_OPTIONS,
  ];

  const tagSet = new Set<string>();
  allOptions.forEach(option => {
    option.tags?.forEach(tag => tagSet.add(tag));
  });

  return Array.from(tagSet).sort();
}
