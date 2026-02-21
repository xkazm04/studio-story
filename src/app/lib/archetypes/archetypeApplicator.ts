/**
 * Archetype Applicator
 * Utility functions for applying archetype data to character forms
 */

import { CharacterArchetype } from '@/app/types/Archetype';
import { Appearance } from '@/app/types/Character';
import { generateFullPrompt } from '@/app/features/characters/sub_CharacterCreator';

export interface ArchetypeApplicationResult {
  appearance: Appearance;
  imagePrompt: string;
  storyPrompt: string;
  characterType?: string;
  suggestedFactionRole?: string;
  backstory: string;
  personality: string;
  motivations: string;
}

/**
 * Apply a full archetype to character data
 */
export function applyArchetype(
  archetype: CharacterArchetype,
  options: {
    applyAppearance?: boolean;
    applyBackstory?: boolean;
    applyPrompts?: boolean;
    applyPersonality?: boolean;
  } = {
    applyAppearance: true,
    applyBackstory: true,
    applyPrompts: true,
    applyPersonality: true,
  }
): ArchetypeApplicationResult {
  const result: ArchetypeApplicationResult = {
    appearance: {} as Appearance,
    imagePrompt: '',
    storyPrompt: '',
    backstory: '',
    personality: '',
    motivations: '',
  };

  // Apply appearance
  if (options.applyAppearance) {
    result.appearance = { ...archetype.appearance };
  }

  // Apply backstory and personality
  if (options.applyBackstory) {
    result.backstory = archetype.backstory;
    result.motivations = archetype.motivations;
  }

  if (options.applyPersonality) {
    result.personality = archetype.personality;
  }

  // Apply prompts
  if (options.applyPrompts) {
    result.imagePrompt = archetype.imagePrompt;
    result.storyPrompt = archetype.storyPrompt;
  }

  // Apply character attributes
  result.characterType = archetype.characterType;
  result.suggestedFactionRole = archetype.suggestedFactionRole;

  return result;
}

/**
 * Merge archetype appearance with existing appearance
 * Allows partial application while preserving user customizations
 */
export function mergeArchetypeAppearance(
  currentAppearance: Appearance,
  archetypeAppearance: Appearance,
  fields?: (keyof Appearance)[]
): Appearance {
  if (!fields) {
    // Full merge
    return {
      ...currentAppearance,
      ...archetypeAppearance,
      face: {
        ...currentAppearance.face,
        ...archetypeAppearance.face,
      },
      clothing: {
        ...currentAppearance.clothing,
        ...archetypeAppearance.clothing,
      },
    };
  }

  // Selective merge
  const merged = { ...currentAppearance } as unknown as Record<string, unknown>;
  const currentRecord = currentAppearance as unknown as Record<string, unknown>;
  const archetypeRecord = archetypeAppearance as unknown as Record<string, unknown>;

  fields.forEach((field) => {
    if (field === 'face' || field === 'clothing') {
      merged[field] = {
        ...(currentRecord[field] as Record<string, unknown>),
        ...(archetypeRecord[field] as Record<string, unknown>),
      };
    } else {
      merged[field] = archetypeRecord[field];
    }
  });

  return merged as unknown as Appearance;
}

/**
 * Generate character name suggestion based on archetype
 */
export function suggestNameFromArchetype(archetype: CharacterArchetype): string[] {
  const suggestions: string[] = [];

  // Map archetype categories to name patterns
  const namePatterns: Record<string, string[]> = {
    Hero: ['Aldric', 'Elena', 'Marcus', 'Aria', 'Theron', 'Lyra'],
    Villain: ['Malachar', 'Morgana', 'Raven', 'Draven', 'Vex', 'Shade'],
    Mentor: ['Gandor', 'Sage', 'Meridian', 'Oracle', 'Thaddeus', 'Althea'],
    Trickster: ['Finn', 'Loki', 'Rogue', 'Sly', 'Whisper', 'Quinn'],
    Guardian: ['Ironheart', 'Bastion', 'Shield', 'Valor', 'Stone', 'Haven'],
    Sage: ['Wisdom', 'Scholar', 'Lexicon', 'Lorekeeper', 'Insight', 'Athena'],
    Innocent: ['Hope', 'Dawn', 'Purity', 'Light', 'Grace', 'Harmony'],
    Ruler: ['Rex', 'Regina', 'Crown', 'Monarch', 'Sovereign', 'Majesty'],
  };

  const categoryNames = namePatterns[archetype.category] || [];
  suggestions.push(...categoryNames);

  return suggestions.slice(0, 3);
}

/**
 * Generate enhanced story prompt that incorporates archetype into narrative context
 */
export function generateNarrativePrompt(
  archetype: CharacterArchetype,
  context: {
    projectName?: string;
    genre?: string;
    actName?: string;
    sceneName?: string;
  }
): string {
  let prompt = archetype.storyPrompt;

  if (context.projectName) {
    prompt += `\n\nThis character exists within the story "${context.projectName}".`;
  }

  if (context.actName) {
    prompt += ` They play a key role in the act titled "${context.actName}".`;
  }

  if (context.sceneName) {
    prompt += ` Their actions are central to the scene "${context.sceneName}".`;
  }

  prompt += `\n\nCharacter Archetype: ${archetype.category} - ${archetype.name}`;
  prompt += `\nCore Motivation: ${archetype.motivations}`;
  prompt += `\nPersonality: ${archetype.personality}`;

  return prompt;
}

/**
 * Create a customization summary showing what was applied from archetype
 */
export function createArchetypeSummary(archetype: CharacterArchetype): string {
  return `Applied archetype: ${archetype.name} (${archetype.category})

Description: ${archetype.description}

Appearance: ${archetype.appearance.gender}, ${archetype.appearance.age}, ${archetype.appearance.face.hairColor} hair, ${archetype.appearance.face.eyeColor} eyes

Backstory: ${archetype.backstory}

Personality: ${archetype.personality}

Motivations: ${archetype.motivations}`;
}

/**
 * Validate archetype compatibility with project genre
 */
export function isArchetypeCompatible(
  archetype: CharacterArchetype,
  projectGenre?: string
): boolean {
  if (!projectGenre) return true;
  if (archetype.genre.includes('all')) return true;
  return archetype.genre.includes(projectGenre as any);
}

/**
 * Get recommended archetypes for a given context
 */
export function getRecommendedArchetypes(
  context: {
    genre?: string;
    existingCharacterTypes?: string[];
    projectTheme?: string;
  },
  limit: number = 5
): CharacterArchetype[] {
  const { ARCHETYPE_LIBRARY } = require('./archetypeLibrary');

  let archetypes = [...ARCHETYPE_LIBRARY];

  // Filter by genre
  if (context.genre) {
    archetypes = archetypes.filter((a: CharacterArchetype) =>
      a.genre.includes(context.genre as any) || a.genre.includes('all')
    );
  }

  // Prioritize archetypes that complement existing characters
  if (context.existingCharacterTypes && context.existingCharacterTypes.length > 0) {
    const hasHero = context.existingCharacterTypes.includes('Protagonist');
    const hasVillain = context.existingCharacterTypes.includes('Antagonist');

    if (hasHero && !hasVillain) {
      // Prioritize villains and antagonists
      archetypes.sort((a, b) => {
        const aIsVillain = a.category === 'Villain' ? 1 : 0;
        const bIsVillain = b.category === 'Villain' ? 1 : 0;
        return bIsVillain - aIsVillain;
      });
    } else if (hasVillain && !hasHero) {
      // Prioritize heroes
      archetypes.sort((a, b) => {
        const aIsHero = a.category === 'Hero' ? 1 : 0;
        const bIsHero = b.category === 'Hero' ? 1 : 0;
        return bIsHero - aIsHero;
      });
    }
  }

  // Sort by popularity
  archetypes.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

  return archetypes.slice(0, limit);
}
