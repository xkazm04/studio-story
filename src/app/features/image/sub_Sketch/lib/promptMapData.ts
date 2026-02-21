export type PromptDimension = 'theme' | 'scene' | 'character';

export interface PromptOption {
  id: string;
  label: string;
  description?: string;
  tags?: string[];
}

export interface PromptColumnConfig {
  id: PromptDimension;
  label: string;
  accentColor: 'cyan' | 'purple' | 'amber';
}

export const PROMPT_COLUMNS: PromptColumnConfig[] = [
  {
    id: 'theme',
    label: 'Theme',
    accentColor: 'cyan',
  },
  {
    id: 'scene',
    label: 'Scene',
    accentColor: 'purple',
  },
  {
    id: 'character',
    label: 'Character',
    accentColor: 'amber',
  },
];

export const THEME_OPTIONS: PromptOption[] = [
  {
    id: 'epic-cinematic',
    label: 'Epic Cinematic',
    description: 'Wide-angle, dramatic lighting, filmic composition',
    tags: ['cinematic', 'dramatic', 'wide'],
  },
  {
    id: 'intimate-portrait',
    label: 'Intimate Portrait',
    description: 'Close-up, shallow depth of field, soft lighting',
    tags: ['portrait', 'soft', 'bokeh'],
  },
  {
    id: 'noir-mystery',
    label: 'Noir Mystery',
    description: 'High contrast, deep shadows, neon accents',
    tags: ['noir', 'neon', 'shadow'],
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    description: 'Neon-lit cityscape, futuristic technology, holographic displays',
    tags: ['urban', 'tech', 'neon'],
  },
  {
    id: 'fantasy-magic',
    label: 'Fantasy Magic',
    description: 'Magical realm, enchanted atmosphere, mystical glow',
    tags: ['magic', 'mythical', 'ethereal'],
  },
  {
    id: 'post-apocalyptic',
    label: 'Post-Apocalyptic',
    description: 'Desolate wasteland, ruined structures, dust and debris',
    tags: ['ruins', 'wasteland', 'gritty'],
  },
  {
    id: 'ethereal-dream',
    label: 'Ethereal Dream',
    description: 'Dreamlike atmosphere, soft glowing lights, floating particles',
    tags: ['dream', 'soft', 'surreal'],
  },
  {
    id: 'dark-gothic',
    label: 'Dark Gothic',
    description: 'Gothic architecture, dark shadows, ornate details',
    tags: ['dark', 'gothic', 'mysterious'],
  },
];

export const SCENE_OPTIONS: PromptOption[] = [
  {
    id: 'rainy-city-rooftop',
    label: 'Rainy City Rooftop',
    description: 'Neon cityscape at night, wet surfaces reflecting lights',
    tags: ['city', 'night', 'rain'],
  },
  {
    id: 'forest-clearing-dawn',
    label: 'Forest Clearing at Dawn',
    description: 'Soft fog, volumetric light rays, dew on leaves',
    tags: ['forest', 'dawn', 'fog'],
  },
  {
    id: 'spaceship-bridge',
    label: 'Spaceship Bridge',
    description: 'Holographic interfaces, stars outside panoramic window',
    tags: ['sci-fi', 'interior', 'stars'],
  },
  {
    id: 'throne-room',
    label: 'Grand Throne Room',
    description: 'Marble columns, ornate decorations, majestic atmosphere',
    tags: ['royal', 'grand', 'interior'],
  },
  {
    id: 'mountain-peak',
    label: 'Mountain Peak',
    description: 'Snow-capped summit, dramatic clouds, vast vista',
    tags: ['mountain', 'epic', 'nature'],
  },
  {
    id: 'underground-cavern',
    label: 'Crystal Cavern',
    description: 'Glowing crystals, stalactites, echoing depths',
    tags: ['cave', 'underground', 'mysterious'],
  },
  {
    id: 'marketplace',
    label: 'Bustling Marketplace',
    description: 'Colorful stalls, exotic goods, lively crowd',
    tags: ['market', 'trade', 'busy'],
  },
  {
    id: 'temple-ruins',
    label: 'Ancient Temple Ruins',
    description: 'Overgrown vegetation, crumbling pillars, mysterious aura',
    tags: ['ancient', 'ruins', 'historical'],
  },
  {
    id: 'lab-facility',
    label: 'High-tech Laboratory',
    description: 'Scientific equipment, glowing specimens, sterile environment',
    tags: ['science', 'tech', 'research'],
  },
  {
    id: 'workshop',
    label: 'Artisan Workshop',
    description: 'Tools scattered, works in progress, creative chaos',
    tags: ['craft', 'tools', 'creative'],
  },
];

export const CHARACTER_OPTIONS: PromptOption[] = [
  {
    id: 'battle-scarred-hero',
    label: 'Battle-scarred Hero',
    description: 'Weathered armor, subtle scars, focused expression',
    tags: ['hero', 'armor', 'gritty'],
  },
  {
    id: 'cyberpunk-hacker',
    label: 'Cyberpunk Hacker',
    description: 'Neon tattoos, reflective visor, holographic keyboard',
    tags: ['cyberpunk', 'tech', 'neon'],
  },
  {
    id: 'mystic-storyteller',
    label: 'Mystic Storyteller',
    description: 'Flowing robes, floating runes, calm smile',
    tags: ['magic', 'sage', 'runes'],
  },
  {
    id: 'warrior',
    label: 'Warrior',
    description: 'Battle-worn, heavy armor, determined stance, wielding sword',
    tags: ['combat', 'strong', 'fighter'],
  },
  {
    id: 'mage',
    label: 'Arcane Mage',
    description: 'Flowing robes, glowing staff, arcane symbols swirling around',
    tags: ['magic', 'mystical', 'wise'],
  },
  {
    id: 'rogue',
    label: 'Stealthy Rogue',
    description: 'Dark leather outfit, twin daggers, shadowy presence',
    tags: ['stealth', 'agile', 'cunning'],
  },
  {
    id: 'scientist',
    label: 'Mad Scientist',
    description: 'Lab coat, safety goggles, holding experimental device',
    tags: ['smart', 'tech', 'research'],
  },
  {
    id: 'pilot',
    label: 'Ace Pilot',
    description: 'Flight suit, helmet under arm, confident stance',
    tags: ['tech', 'adventurer', 'skilled'],
  },
  {
    id: 'merchant',
    label: 'Charismatic Merchant',
    description: 'Elaborate clothing, jewelry, friendly demeanor',
    tags: ['social', 'wealthy', 'cunning'],
  },
  {
    id: 'shaman',
    label: 'Tribal Shaman',
    description: 'Ritual markings, nature-inspired attire, spiritual aura',
    tags: ['spiritual', 'nature', 'mystical'],
  },
  {
    id: 'engineer',
    label: 'Tech Engineer',
    description: 'Practical clothing, tool belt, mechanical augmentations',
    tags: ['tech', 'practical', 'builder'],
  },
  {
    id: 'noble',
    label: 'Elegant Noble',
    description: 'Luxurious garments, regal bearing, refined features',
    tags: ['elegant', 'wealthy', 'refined'],
  },
];

export const dimensionOptions: Record<PromptDimension, PromptOption[]> = {
  theme: THEME_OPTIONS,
  scene: SCENE_OPTIONS,
  character: CHARACTER_OPTIONS,
};

export function composePrompt(
  selections: Partial<Record<PromptDimension, PromptOption | undefined>>
): string {
  const parts: string[] = [];

  if (selections.theme) {
    parts.push(selections.theme.label);
  }

  if (selections.scene) {
    parts.push(selections.scene.description || selections.scene.label);
  }

  if (selections.character) {
    parts.push(selections.character.description || selections.character.label);
  }

  return parts.join(', ');
}
