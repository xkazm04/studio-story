/**
 * Character Archetype Types
 * Pre-filled character templates with appearance, backstory, and AI prompts
 */

import { Appearance } from './Character';

export interface CharacterArchetype {
  id: string;
  name: string;
  category: ArchetypeCategory;
  description: string;

  // Backstory
  backstory: string;
  motivations: string;
  personality: string;

  // Character attributes
  characterType?: string;
  suggestedFactionRole?: string;

  // Appearance data
  appearance: Appearance;

  // AI Prompts
  imagePrompt: string;
  storyPrompt: string;

  // Metadata
  tags: string[];
  genre: ArchetypeGenre[];
  popularity?: number;
}

export type ArchetypeCategory =
  | 'Hero'
  | 'Villain'
  | 'Mentor'
  | 'Sidekick'
  | 'Rogue'
  | 'Guardian'
  | 'Trickster'
  | 'Innocent'
  | 'Ruler'
  | 'Lover'
  | 'Explorer'
  | 'Sage';

export type ArchetypeGenre =
  | 'fantasy'
  | 'sci-fi'
  | 'mystery'
  | 'romance'
  | 'horror'
  | 'western'
  | 'historical'
  | 'contemporary'
  | 'all';

export interface ArchetypeFilter {
  category?: ArchetypeCategory;
  genre?: ArchetypeGenre;
  searchTerm?: string;
}

export interface ArchetypeApplication {
  archetype: CharacterArchetype;
  applyAppearance: boolean;
  applyBackstory: boolean;
  applyPrompts: boolean;
  applyPersonality: boolean;
}
