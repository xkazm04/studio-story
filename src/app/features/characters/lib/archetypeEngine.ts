/**
 * Archetype Engine
 *
 * Intelligent archetype system with:
 * - Hierarchical inheritance (base -> genre -> specific)
 * - Override tracking (what's inherited vs. customized)
 * - Archetype blending with weighted influence
 * - Variation generation with controlled randomness
 * - Compatibility scoring for ensemble balance
 */

import { CharacterArchetype, ArchetypeCategory, ArchetypeGenre } from '@/app/types/Archetype';
import { Appearance, defaultAppearance } from '@/app/types/Character';

// ============================================================================
// Types
// ============================================================================

/**
 * Hierarchy levels for archetypes
 */
export type ArchetypeLevel = 'base' | 'genre' | 'specific' | 'custom';

/**
 * Extended archetype with hierarchy information
 */
export interface HierarchicalArchetype extends CharacterArchetype {
  level: ArchetypeLevel;
  parentId?: string;
  children?: string[];
  isCustom?: boolean;
  userId?: string;
  createdFromCharacterId?: string;
}

/**
 * Tracks which fields are inherited vs. overridden
 * Uses a bitmap-like structure for efficient storage
 */
export interface OverrideMask {
  // Top-level appearance fields
  gender: boolean;
  age: boolean;
  skinColor: boolean;
  bodyType: boolean;
  height: boolean;
  customFeatures: boolean;

  // Face fields
  face: {
    shape: boolean;
    eyeColor: boolean;
    hairColor: boolean;
    hairStyle: boolean;
    facialHair: boolean;
    features: boolean;
  };

  // Clothing fields
  clothing: {
    style: boolean;
    color: boolean;
    accessories: boolean;
  };

  // Story fields
  backstory: boolean;
  motivations: boolean;
  personality: boolean;

  // Prompts
  imagePrompt: boolean;
  storyPrompt: boolean;
}

/**
 * Character with archetype inheritance tracking
 */
export interface InheritedCharacter {
  // Base archetype chain
  archetypeChain: string[]; // Array of archetype IDs from base to specific

  // Current values (may be inherited or overridden)
  appearance: Appearance;
  backstory: string;
  motivations: string;
  personality: string;
  imagePrompt: string;
  storyPrompt: string;

  // Override tracking
  overrides: OverrideMask;

  // Blending info (if blended)
  blendSources?: BlendSource[];
}

/**
 * Source for blended archetypes
 */
export interface BlendSource {
  archetypeId: string;
  weight: number; // 0-1, all weights should sum to 1
}

/**
 * Result of archetype blending
 */
export interface BlendResult {
  appearance: Appearance;
  backstory: string;
  motivations: string;
  personality: string;
  imagePrompt: string;
  storyPrompt: string;
  tags: string[];
  blendSources: BlendSource[];
}

/**
 * Variation options for generating archetype variations
 */
export interface VariationOptions {
  randomSeed?: number;
  variationStrength: 'subtle' | 'moderate' | 'significant';
  preserveFields?: (keyof Appearance)[];
  allowGenderSwap?: boolean;
  allowAgeShift?: boolean;
}

/**
 * Compatibility score result
 */
export interface CompatibilityScore {
  score: number; // 0-100
  strengths: string[];
  concerns: string[];
  recommendations: string[];
}

// ============================================================================
// Default Override Mask (all inherited)
// ============================================================================

export function createDefaultOverrideMask(): OverrideMask {
  return {
    gender: false,
    age: false,
    skinColor: false,
    bodyType: false,
    height: false,
    customFeatures: false,
    face: {
      shape: false,
      eyeColor: false,
      hairColor: false,
      hairStyle: false,
      facialHair: false,
      features: false,
    },
    clothing: {
      style: false,
      color: false,
      accessories: false,
    },
    backstory: false,
    motivations: false,
    personality: false,
    imagePrompt: false,
    storyPrompt: false,
  };
}

// ============================================================================
// Base Archetypes (Root of hierarchy)
// ============================================================================

export const BASE_ARCHETYPES: Partial<Record<ArchetypeCategory, Partial<CharacterArchetype>>> = {
  Hero: {
    personality: 'Brave, determined, selfless, grows through challenges',
    motivations: 'Protect others, overcome obstacles, discover true self',
    backstory: 'Called to adventure from humble origins',
  },
  Villain: {
    personality: 'Cunning, driven, complex motivations, believes in their cause',
    motivations: 'Power, revenge, twisted sense of justice, reshape the world',
    backstory: 'Transformed by tragedy or corruption into an antagonistic force',
  },
  Mentor: {
    personality: 'Wise, patient, experienced, carries burden of knowledge',
    motivations: 'Guide the next generation, preserve wisdom, prevent past mistakes',
    backstory: 'Earned wisdom through long life and hard lessons',
  },
  Sidekick: {
    personality: 'Loyal, supportive, often provides comic relief, brave in own way',
    motivations: 'Support the hero, prove self-worth, friendship',
    backstory: 'Bound to the hero through circumstance or choice',
  },
  Rogue: {
    personality: 'Independent, morally gray, resourceful, charming',
    motivations: 'Freedom, personal gain, reluctant heroism',
    backstory: 'Learned to survive by wit and skill in a harsh world',
  },
  Guardian: {
    personality: 'Protective, dutiful, stoic, self-sacrificing',
    motivations: 'Protect charge, fulfill oath, honor above all',
    backstory: 'Sworn to protect through sacred duty or personal choice',
  },
  Trickster: {
    personality: 'Clever, unpredictable, challenges norms, wise fool',
    motivations: 'Chaos, truth through humor, break conventions',
    backstory: 'Operates outside social norms to reveal deeper truths',
  },
  Innocent: {
    personality: 'Pure-hearted, optimistic, sees good in everyone',
    motivations: 'Spread kindness, maintain hope, heal others',
    backstory: 'Untainted by world\'s darkness, beacon of light',
  },
  Ruler: {
    personality: 'Authoritative, responsible, burdened by power',
    motivations: 'Maintain order, protect kingdom, leave legacy',
    backstory: 'Born or risen to power, carries weight of leadership',
  },
  Lover: {
    personality: 'Passionate, devoted, emotionally driven',
    motivations: 'Find or protect love, emotional connection',
    backstory: 'Defined by deep emotional bonds and relationships',
  },
  Explorer: {
    personality: 'Curious, adventurous, independent, restless',
    motivations: 'Discover new horizons, freedom, self-discovery',
    backstory: 'Driven by wanderlust and desire to see the unknown',
  },
  Sage: {
    personality: 'Intellectual, analytical, seeks truth',
    motivations: 'Understand the world, share knowledge, solve mysteries',
    backstory: 'Devoted life to pursuit of knowledge and understanding',
  },
};

// ============================================================================
// Genre Modifiers
// ============================================================================

export const GENRE_MODIFIERS: Record<ArchetypeGenre, Partial<{
  appearanceHints: Partial<Appearance>;
  styleKeywords: string[];
  thematicElements: string[];
}>> = {
  fantasy: {
    styleKeywords: ['magical', 'mystical', 'medieval', 'enchanted'],
    thematicElements: ['magic', 'prophecy', 'ancient powers', 'mythical creatures'],
  },
  'sci-fi': {
    styleKeywords: ['futuristic', 'cybernetic', 'technological', 'sleek'],
    thematicElements: ['technology', 'space', 'AI', 'future society'],
  },
  mystery: {
    styleKeywords: ['observant', 'sharp', 'professional', 'understated'],
    thematicElements: ['clues', 'deduction', 'secrets', 'investigation'],
  },
  romance: {
    styleKeywords: ['attractive', 'elegant', 'passionate', 'refined'],
    thematicElements: ['love', 'connection', 'emotional depth', 'relationships'],
  },
  horror: {
    styleKeywords: ['unsettling', 'dark', 'haunted', 'shadowy'],
    thematicElements: ['fear', 'survival', 'darkness', 'the unknown'],
  },
  western: {
    styleKeywords: ['rugged', 'weathered', 'frontier', 'dusty'],
    thematicElements: ['frontier justice', 'survival', 'lawlessness', 'honor'],
  },
  historical: {
    styleKeywords: ['period-accurate', 'traditional', 'formal', 'authentic'],
    thematicElements: ['historical events', 'social norms', 'tradition', 'honor'],
  },
  contemporary: {
    styleKeywords: ['modern', 'relatable', 'current', 'everyday'],
    thematicElements: ['modern life', 'current issues', 'technology', 'society'],
  },
  all: {
    styleKeywords: [],
    thematicElements: [],
  },
};

// ============================================================================
// Inheritance Engine
// ============================================================================

/**
 * Resolve the inheritance chain for an archetype
 */
export function resolveInheritanceChain(
  archetype: HierarchicalArchetype,
  archetypeMap: Map<string, HierarchicalArchetype>
): HierarchicalArchetype[] {
  const chain: HierarchicalArchetype[] = [archetype];
  let current = archetype;

  while (current.parentId) {
    const parent = archetypeMap.get(current.parentId);
    if (parent) {
      chain.unshift(parent);
      current = parent;
    } else {
      break;
    }
  }

  return chain;
}

/**
 * Apply inheritance chain to produce final values
 */
export function applyInheritance(
  chain: HierarchicalArchetype[],
  overrides: Partial<OverrideMask> = {}
): InheritedCharacter {
  const mask = { ...createDefaultOverrideMask(), ...overrides };

  // Start with defaults
  let appearance: Appearance = { ...defaultAppearance };
  let backstory = '';
  let motivations = '';
  let personality = '';
  let imagePrompt = '';
  let storyPrompt = '';

  // Apply each level in order
  for (const archetype of chain) {
    // Appearance - only apply if not overridden
    if (!mask.gender && archetype.appearance?.gender) {
      appearance.gender = archetype.appearance.gender;
    }
    if (!mask.age && archetype.appearance?.age) {
      appearance.age = archetype.appearance.age;
    }
    if (!mask.skinColor && archetype.appearance?.skinColor) {
      appearance.skinColor = archetype.appearance.skinColor;
    }
    if (!mask.bodyType && archetype.appearance?.bodyType) {
      appearance.bodyType = archetype.appearance.bodyType;
    }
    if (!mask.height && archetype.appearance?.height) {
      appearance.height = archetype.appearance.height;
    }
    if (!mask.customFeatures && archetype.appearance?.customFeatures) {
      appearance.customFeatures = archetype.appearance.customFeatures;
    }

    // Face
    if (archetype.appearance?.face) {
      if (!mask.face.shape && archetype.appearance.face.shape) {
        appearance.face.shape = archetype.appearance.face.shape;
      }
      if (!mask.face.eyeColor && archetype.appearance.face.eyeColor) {
        appearance.face.eyeColor = archetype.appearance.face.eyeColor;
      }
      if (!mask.face.hairColor && archetype.appearance.face.hairColor) {
        appearance.face.hairColor = archetype.appearance.face.hairColor;
      }
      if (!mask.face.hairStyle && archetype.appearance.face.hairStyle) {
        appearance.face.hairStyle = archetype.appearance.face.hairStyle;
      }
      if (!mask.face.facialHair && archetype.appearance.face.facialHair) {
        appearance.face.facialHair = archetype.appearance.face.facialHair;
      }
      if (!mask.face.features && archetype.appearance.face.features) {
        appearance.face.features = archetype.appearance.face.features;
      }
    }

    // Clothing
    if (archetype.appearance?.clothing) {
      if (!mask.clothing.style && archetype.appearance.clothing.style) {
        appearance.clothing.style = archetype.appearance.clothing.style;
      }
      if (!mask.clothing.color && archetype.appearance.clothing.color) {
        appearance.clothing.color = archetype.appearance.clothing.color;
      }
      if (!mask.clothing.accessories && archetype.appearance.clothing.accessories) {
        appearance.clothing.accessories = archetype.appearance.clothing.accessories;
      }
    }

    // Story elements
    if (!mask.backstory && archetype.backstory) {
      backstory = archetype.backstory;
    }
    if (!mask.motivations && archetype.motivations) {
      motivations = archetype.motivations;
    }
    if (!mask.personality && archetype.personality) {
      personality = archetype.personality;
    }
    if (!mask.imagePrompt && archetype.imagePrompt) {
      imagePrompt = archetype.imagePrompt;
    }
    if (!mask.storyPrompt && archetype.storyPrompt) {
      storyPrompt = archetype.storyPrompt;
    }
  }

  return {
    archetypeChain: chain.map(a => a.id),
    appearance,
    backstory,
    motivations,
    personality,
    imagePrompt,
    storyPrompt,
    overrides: mask,
  };
}

/**
 * Update override mask when user changes a field
 */
export function markFieldAsOverridden(
  mask: OverrideMask,
  field: string,
  subField?: string
): OverrideMask {
  const newMask = { ...mask };

  if (field === 'face' && subField) {
    newMask.face = { ...newMask.face, [subField]: true };
  } else if (field === 'clothing' && subField) {
    newMask.clothing = { ...newMask.clothing, [subField]: true };
  } else if (field in newMask) {
    (newMask as Record<string, unknown>)[field] = true;
  }

  return newMask;
}

/**
 * Reset a field to inherited value
 */
export function markFieldAsInherited(
  mask: OverrideMask,
  field: string,
  subField?: string
): OverrideMask {
  const newMask = { ...mask };

  if (field === 'face' && subField) {
    newMask.face = { ...newMask.face, [subField]: false };
  } else if (field === 'clothing' && subField) {
    newMask.clothing = { ...newMask.clothing, [subField]: false };
  } else if (field in newMask) {
    (newMask as Record<string, unknown>)[field] = false;
  }

  return newMask;
}

/**
 * Count how many fields are overridden
 */
export function countOverrides(mask: OverrideMask): number {
  let count = 0;

  // Top-level fields
  if (mask.gender) count++;
  if (mask.age) count++;
  if (mask.skinColor) count++;
  if (mask.bodyType) count++;
  if (mask.height) count++;
  if (mask.customFeatures) count++;
  if (mask.backstory) count++;
  if (mask.motivations) count++;
  if (mask.personality) count++;
  if (mask.imagePrompt) count++;
  if (mask.storyPrompt) count++;

  // Face fields
  Object.values(mask.face).forEach(v => { if (v) count++; });

  // Clothing fields
  Object.values(mask.clothing).forEach(v => { if (v) count++; });

  return count;
}

// ============================================================================
// Archetype Blending
// ============================================================================

/**
 * Blend multiple archetypes with weighted influence
 */
export function blendArchetypes(
  sources: { archetype: CharacterArchetype; weight: number }[]
): BlendResult {
  // Normalize weights
  const totalWeight = sources.reduce((sum, s) => sum + s.weight, 0);
  const normalizedSources = sources.map(s => ({
    ...s,
    weight: s.weight / totalWeight,
  }));

  // Find dominant archetype (highest weight)
  const dominant = normalizedSources.reduce((max, s) =>
    s.weight > max.weight ? s : max
  );

  // Blend appearance - use dominant with hints from others
  const blendedAppearance: Appearance = {
    ...dominant.archetype.appearance,
    face: { ...dominant.archetype.appearance.face },
    clothing: { ...dominant.archetype.appearance.clothing },
  };

  // Blend text fields by concatenation with weight indicators
  const backstoryParts = normalizedSources
    .filter(s => s.weight >= 0.2)
    .map(s => s.archetype.backstory);

  const motivationsParts = normalizedSources
    .filter(s => s.weight >= 0.2)
    .map(s => s.archetype.motivations);

  const personalityParts = normalizedSources
    .map(s => s.archetype.personality.split(', '))
    .flat();

  // Dedupe and limit personality traits
  const uniqueTraits = [...new Set(personalityParts)].slice(0, 8);

  // Blend prompts
  const imagePromptParts = normalizedSources
    .filter(s => s.weight >= 0.3)
    .map(s => {
      const keywords = s.archetype.imagePrompt.split(',').slice(0, 3);
      return keywords.join(',');
    });

  // Merge tags with weight consideration
  const tagCounts = new Map<string, number>();
  normalizedSources.forEach(s => {
    s.archetype.tags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + s.weight);
    });
  });

  const sortedTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag]) => tag);

  return {
    appearance: blendedAppearance,
    backstory: backstoryParts.join(' '),
    motivations: motivationsParts.join('; '),
    personality: uniqueTraits.join(', '),
    imagePrompt: imagePromptParts.join(', '),
    storyPrompt: `A complex character blending ${normalizedSources.map(s => s.archetype.name).join(' and ')}. ${dominant.archetype.storyPrompt}`,
    tags: sortedTags,
    blendSources: normalizedSources.map(s => ({
      archetypeId: s.archetype.id,
      weight: s.weight,
    })),
  };
}

/**
 * Suggest good blend combinations based on narrative archetypes
 */
export function suggestBlendCombinations(
  archetype: CharacterArchetype
): { archetypeId: string; rationale: string }[] {
  const suggestions: { archetypeId: string; rationale: string }[] = [];

  // Classic combinations based on archetype theory
  const combinations: Record<ArchetypeCategory, { category: ArchetypeCategory; rationale: string }[]> = {
    Hero: [
      { category: 'Rogue', rationale: 'Creates an antihero with moral complexity' },
      { category: 'Innocent', rationale: 'Adds purity and idealism to heroic journey' },
      { category: 'Explorer', rationale: 'Creates an adventurer-hero seeking new horizons' },
    ],
    Villain: [
      { category: 'Ruler', rationale: 'Creates a tyrannical figure of authority' },
      { category: 'Sage', rationale: 'Creates an intellectual mastermind' },
      { category: 'Lover', rationale: 'Creates a villain driven by obsessive passion' },
    ],
    Mentor: [
      { category: 'Sage', rationale: 'Enhances wisdom and knowledge aspects' },
      { category: 'Guardian', rationale: 'Creates a protective teacher figure' },
      { category: 'Trickster', rationale: 'Creates an unconventional wise fool mentor' },
    ],
    Sidekick: [
      { category: 'Trickster', rationale: 'Creates comic relief with hidden wisdom' },
      { category: 'Guardian', rationale: 'Creates a loyal protector companion' },
      { category: 'Innocent', rationale: 'Enhances pure-hearted loyalty' },
    ],
    Rogue: [
      { category: 'Hero', rationale: 'Creates a redeemable antihero' },
      { category: 'Trickster', rationale: 'Enhances cunning and wit' },
      { category: 'Lover', rationale: 'Creates a charming romantic rogue' },
    ],
    Guardian: [
      { category: 'Hero', rationale: 'Creates a protective champion' },
      { category: 'Mentor', rationale: 'Creates a teaching protector' },
      { category: 'Ruler', rationale: 'Creates a royal guard or knight' },
    ],
    Trickster: [
      { category: 'Sage', rationale: 'Creates a wise fool archetype' },
      { category: 'Rogue', rationale: 'Enhances cunning and mischief' },
      { category: 'Innocent', rationale: 'Creates childlike wonder with cleverness' },
    ],
    Innocent: [
      { category: 'Hero', rationale: 'Creates a pure-hearted protagonist' },
      { category: 'Sage', rationale: 'Creates innocent wisdom' },
      { category: 'Lover', rationale: 'Creates romantic idealism' },
    ],
    Ruler: [
      { category: 'Sage', rationale: 'Creates a philosopher king/queen' },
      { category: 'Guardian', rationale: 'Creates a protective sovereign' },
      { category: 'Villain', rationale: 'Creates a tragic tyrant' },
    ],
    Lover: [
      { category: 'Hero', rationale: 'Creates a romantic protagonist' },
      { category: 'Rogue', rationale: 'Creates passionate rebellion' },
      { category: 'Innocent', rationale: 'Creates pure romantic devotion' },
    ],
    Explorer: [
      { category: 'Sage', rationale: 'Creates a seeker of hidden knowledge' },
      { category: 'Rogue', rationale: 'Creates a treasure hunter type' },
      { category: 'Hero', rationale: 'Creates an adventuring champion' },
    ],
    Sage: [
      { category: 'Mentor', rationale: 'Enhances teaching and guidance' },
      { category: 'Ruler', rationale: 'Creates wise leadership' },
      { category: 'Explorer', rationale: 'Creates knowledge seeker' },
    ],
  };

  const compatibleCategories = combinations[archetype.category] || [];

  return compatibleCategories.map(c => ({
    archetypeId: c.category.toLowerCase(),
    rationale: c.rationale,
  }));
}

// ============================================================================
// Variation Generator
// ============================================================================

// Seeded random number generator for reproducible variations
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

/**
 * Generate variations of an archetype with controlled randomness
 */
export function generateVariations(
  archetype: CharacterArchetype,
  count: number = 5,
  options: VariationOptions = { variationStrength: 'moderate' }
): CharacterArchetype[] {
  const variations: CharacterArchetype[] = [];
  const random = seededRandom(options.randomSeed || Date.now());

  // Variation pools
  const skinColorVariations = [
    'Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Bronze', 'Brown', 'Dark brown', 'Deep brown',
    'Pale', 'Rosy', 'Golden', 'Copper', 'Ebony',
  ];

  const eyeColorVariations = [
    'Blue', 'Brown', 'Green', 'Hazel', 'Gray', 'Amber', 'Black',
    'Bright blue', 'Deep brown', 'Emerald green', 'Steel gray', 'Golden amber',
  ];

  const hairColorVariations = [
    'Black', 'Brown', 'Blonde', 'Red', 'Auburn', 'Gray', 'White',
    'Dark brown', 'Light brown', 'Sandy blonde', 'Platinum', 'Copper',
  ];

  const bodyTypeVariations = [
    'Slim', 'Athletic', 'Muscular', 'Average', 'Stocky', 'Lean',
    'Petite', 'Tall and lean', 'Broad-shouldered', 'Graceful',
  ];

  const ageVariations: Array<'Young' | 'Adult' | 'Middle-aged'> = ['Young', 'Adult', 'Middle-aged'];

  // Variation strength affects how many fields change
  const variationFactors = {
    subtle: 0.2,
    moderate: 0.5,
    significant: 0.8,
  };

  const factor = variationFactors[options.variationStrength];

  for (let i = 0; i < count; i++) {
    const variation: CharacterArchetype = {
      ...archetype,
      id: `${archetype.id}-var-${i + 1}`,
      name: `${archetype.name} (Variation ${i + 1})`,
      appearance: {
        ...archetype.appearance,
        face: { ...archetype.appearance.face },
        clothing: { ...archetype.appearance.clothing },
      },
    };

    // Apply random variations based on strength
    if (random() < factor && !options.preserveFields?.includes('skinColor')) {
      variation.appearance.skinColor = skinColorVariations[Math.floor(random() * skinColorVariations.length)];
    }

    if (random() < factor && !options.preserveFields?.includes('bodyType')) {
      variation.appearance.bodyType = bodyTypeVariations[Math.floor(random() * bodyTypeVariations.length)];
    }

    if (random() < factor * 0.8) {
      variation.appearance.face.eyeColor = eyeColorVariations[Math.floor(random() * eyeColorVariations.length)];
    }

    if (random() < factor * 0.8) {
      variation.appearance.face.hairColor = hairColorVariations[Math.floor(random() * hairColorVariations.length)];
    }

    if (random() < factor * 0.3 && options.allowAgeShift) {
      variation.appearance.age = ageVariations[Math.floor(random() * ageVariations.length)];
    }

    if (random() < factor * 0.2 && options.allowGenderSwap) {
      variation.appearance.gender = variation.appearance.gender === 'Male' ? 'Female' : 'Male';
    }

    // Update image prompt to reflect changes
    variation.imagePrompt = generateVariationPrompt(variation);

    variations.push(variation);
  }

  return variations;
}

/**
 * Generate an updated image prompt for a variation
 */
function generateVariationPrompt(archetype: CharacterArchetype): string {
  const { appearance } = archetype;
  const parts: string[] = [];

  parts.push(`${appearance.age} ${appearance.gender.toLowerCase()}`);
  parts.push(`with ${appearance.face.hairColor.toLowerCase()} ${appearance.face.hairStyle.toLowerCase()}`);
  parts.push(`and ${appearance.face.eyeColor.toLowerCase()} eyes`);
  parts.push(appearance.bodyType.toLowerCase());
  parts.push(`wearing ${appearance.clothing.style.toLowerCase()}`);

  if (appearance.customFeatures) {
    parts.push(appearance.customFeatures);
  }

  return parts.join(', ') + ', detailed character art, high quality';
}

// ============================================================================
// Compatibility Scoring
// ============================================================================

/**
 * Calculate compatibility between an archetype and existing cast
 */
export function calculateCompatibility(
  candidate: CharacterArchetype,
  existingCast: CharacterArchetype[]
): CompatibilityScore {
  const score: CompatibilityScore = {
    score: 100,
    strengths: [],
    concerns: [],
    recommendations: [],
  };

  if (existingCast.length === 0) {
    score.strengths.push('First character - no compatibility concerns');
    return score;
  }

  // Check for duplicate archetypes
  const duplicates = existingCast.filter(c => c.category === candidate.category);
  if (duplicates.length > 0) {
    score.score -= 15 * duplicates.length;
    score.concerns.push(`Already have ${duplicates.length} ${candidate.category} character(s)`);
    score.recommendations.push('Consider a different archetype category for variety');
  }

  // Check for narrative balance
  const categories = new Set(existingCast.map(c => c.category));

  // Check for hero/villain balance
  const hasHero = categories.has('Hero');
  const hasVillain = categories.has('Villain');

  if (candidate.category === 'Villain' && !hasHero) {
    score.score -= 10;
    score.concerns.push('Adding villain without a hero');
    score.recommendations.push('Consider adding a hero archetype first');
  }

  if (candidate.category === 'Mentor' && !hasHero) {
    score.score -= 5;
    score.concerns.push('Mentor works best with a hero to guide');
  }

  // Check for complementary dynamics
  const complementary: Record<ArchetypeCategory, ArchetypeCategory[]> = {
    Hero: ['Mentor', 'Sidekick', 'Villain', 'Guardian'],
    Villain: ['Hero', 'Minion' as ArchetypeCategory, 'Ruler'],
    Mentor: ['Hero', 'Innocent', 'Sage'],
    Sidekick: ['Hero', 'Trickster'],
    Rogue: ['Hero', 'Villain', 'Guardian'],
    Guardian: ['Hero', 'Ruler', 'Innocent'],
    Trickster: ['Hero', 'Sidekick', 'Sage'],
    Innocent: ['Hero', 'Mentor', 'Guardian'],
    Ruler: ['Guardian', 'Advisor' as ArchetypeCategory, 'Villain'],
    Lover: ['Hero', 'Rogue', 'Innocent'],
    Explorer: ['Sage', 'Rogue', 'Hero'],
    Sage: ['Hero', 'Mentor', 'Explorer'],
  };

  const candidateComplements = complementary[candidate.category] || [];
  const hasComplement = candidateComplements.some(c => categories.has(c));

  if (hasComplement) {
    score.score += 10;
    score.strengths.push(`Complements existing ${candidateComplements.filter(c => categories.has(c)).join(', ')}`);
  }

  // Check for visual diversity
  const existingGenders = new Set(existingCast.map(c => c.appearance.gender));
  if (!existingGenders.has(candidate.appearance.gender) && existingGenders.size > 0) {
    score.score += 5;
    score.strengths.push('Adds gender diversity to cast');
  }

  const existingAges = new Set(existingCast.map(c => c.appearance.age));
  if (!existingAges.has(candidate.appearance.age) && existingAges.size > 0) {
    score.score += 5;
    score.strengths.push('Adds age diversity to cast');
  }

  // Cap score at 100
  score.score = Math.min(100, Math.max(0, score.score));

  return score;
}

/**
 * Get archetypes sorted by compatibility score
 */
export function rankByCompatibility(
  candidates: CharacterArchetype[],
  existingCast: CharacterArchetype[]
): Array<{ archetype: CharacterArchetype; compatibility: CompatibilityScore }> {
  return candidates
    .map(archetype => ({
      archetype,
      compatibility: calculateCompatibility(archetype, existingCast),
    }))
    .sort((a, b) => b.compatibility.score - a.compatibility.score);
}

// ============================================================================
// Custom Archetype Creation
// ============================================================================

export interface CreateCustomArchetypeInput {
  name: string;
  basedOnId?: string;
  category: ArchetypeCategory;
  appearance: Appearance;
  backstory: string;
  motivations: string;
  personality: string;
  tags: string[];
  genres: ArchetypeGenre[];
}

/**
 * Create a custom archetype from character data
 */
export function createCustomArchetype(
  input: CreateCustomArchetypeInput,
  userId: string,
  characterId?: string
): HierarchicalArchetype {
  const id = `custom-${userId}-${Date.now()}`;

  return {
    id,
    name: input.name,
    category: input.category,
    description: `Custom archetype: ${input.name}`,
    backstory: input.backstory,
    motivations: input.motivations,
    personality: input.personality,
    appearance: input.appearance,
    imagePrompt: generateVariationPrompt({ appearance: input.appearance } as CharacterArchetype),
    storyPrompt: `A ${input.category.toLowerCase()} character: ${input.backstory}`,
    tags: input.tags,
    genre: input.genres,
    level: 'custom',
    parentId: input.basedOnId,
    isCustom: true,
    userId,
    createdFromCharacterId: characterId,
  };
}

/**
 * Extract archetype patterns from an existing character
 */
export function extractArchetypeFromCharacter(
  character: {
    name: string;
    appearance: Appearance;
    backstory?: string;
    motivations?: string;
    personality?: string;
    type?: string;
  }
): Partial<CreateCustomArchetypeInput> {
  // Infer category from character type
  let inferredCategory: ArchetypeCategory = 'Hero';
  if (character.type) {
    const typeToCategory: Record<string, ArchetypeCategory> = {
      Protagonist: 'Hero',
      Antagonist: 'Villain',
      Supporting: 'Sidekick',
      Other: 'Rogue',
    };
    inferredCategory = typeToCategory[character.type] || 'Hero';
  }

  // Extract tags from personality
  const tags: string[] = [];
  if (character.personality) {
    const traits = character.personality.split(',').map(t => t.trim().toLowerCase());
    tags.push(...traits.slice(0, 4));
  }

  return {
    name: `${character.name} Archetype`,
    category: inferredCategory,
    appearance: character.appearance,
    backstory: character.backstory || '',
    motivations: character.motivations || '',
    personality: character.personality || '',
    tags,
    genres: ['all'],
  };
}

// ============================================================================
// Serialization for Storage
// ============================================================================

/**
 * Serialize override mask to a compact string for database storage
 */
export function serializeOverrideMask(mask: OverrideMask): string {
  const bits: number[] = [];

  // Top-level (11 bits)
  bits.push(mask.gender ? 1 : 0);
  bits.push(mask.age ? 1 : 0);
  bits.push(mask.skinColor ? 1 : 0);
  bits.push(mask.bodyType ? 1 : 0);
  bits.push(mask.height ? 1 : 0);
  bits.push(mask.customFeatures ? 1 : 0);
  bits.push(mask.backstory ? 1 : 0);
  bits.push(mask.motivations ? 1 : 0);
  bits.push(mask.personality ? 1 : 0);
  bits.push(mask.imagePrompt ? 1 : 0);
  bits.push(mask.storyPrompt ? 1 : 0);

  // Face (6 bits)
  bits.push(mask.face.shape ? 1 : 0);
  bits.push(mask.face.eyeColor ? 1 : 0);
  bits.push(mask.face.hairColor ? 1 : 0);
  bits.push(mask.face.hairStyle ? 1 : 0);
  bits.push(mask.face.facialHair ? 1 : 0);
  bits.push(mask.face.features ? 1 : 0);

  // Clothing (3 bits)
  bits.push(mask.clothing.style ? 1 : 0);
  bits.push(mask.clothing.color ? 1 : 0);
  bits.push(mask.clothing.accessories ? 1 : 0);

  // Convert to base64-like string
  let value = 0;
  bits.forEach((bit, i) => {
    value |= (bit << i);
  });

  return value.toString(36);
}

/**
 * Deserialize override mask from compact string
 */
export function deserializeOverrideMask(serialized: string): OverrideMask {
  const value = parseInt(serialized, 36);
  const mask = createDefaultOverrideMask();

  // Top-level
  mask.gender = !!(value & (1 << 0));
  mask.age = !!(value & (1 << 1));
  mask.skinColor = !!(value & (1 << 2));
  mask.bodyType = !!(value & (1 << 3));
  mask.height = !!(value & (1 << 4));
  mask.customFeatures = !!(value & (1 << 5));
  mask.backstory = !!(value & (1 << 6));
  mask.motivations = !!(value & (1 << 7));
  mask.personality = !!(value & (1 << 8));
  mask.imagePrompt = !!(value & (1 << 9));
  mask.storyPrompt = !!(value & (1 << 10));

  // Face
  mask.face.shape = !!(value & (1 << 11));
  mask.face.eyeColor = !!(value & (1 << 12));
  mask.face.hairColor = !!(value & (1 << 13));
  mask.face.hairStyle = !!(value & (1 << 14));
  mask.face.facialHair = !!(value & (1 << 15));
  mask.face.features = !!(value & (1 << 16));

  // Clothing
  mask.clothing.style = !!(value & (1 << 17));
  mask.clothing.color = !!(value & (1 << 18));
  mask.clothing.accessories = !!(value & (1 << 19));

  return mask;
}
