/**
 * Category definitions for character customization
 * Each category is a prompt unit in the final composition
 */

import type { Category, CategoryId } from '../types';

export const CATEGORIES: Category[] = [
  // Face group
  {
    id: 'hair',
    label: 'Hair',
    icon: 'Scissors',
    promptTemplate: 'with {value} hair',
    group: 'face',
  },
  {
    id: 'eyes',
    label: 'Eyes',
    icon: 'Eye',
    promptTemplate: '{value} eyes',
    group: 'face',
  },
  {
    id: 'nose',
    label: 'Nose',
    icon: 'CircleDot',
    promptTemplate: 'a {value} nose',
    group: 'face',
  },
  {
    id: 'mouth',
    label: 'Mouth',
    icon: 'Smile',
    promptTemplate: '{value} lips',
    group: 'face',
  },
  {
    id: 'expression',
    label: 'Expression',
    icon: 'Sparkles',
    promptTemplate: '{value} expression',
    group: 'face',
  },

  // Features group
  {
    id: 'makeup',
    label: 'Makeup',
    icon: 'Palette',
    promptTemplate: 'wearing {value} makeup',
    group: 'features',
  },
  {
    id: 'markings',
    label: 'Markings',
    icon: 'Flame',
    promptTemplate: 'with {value}',
    group: 'features',
  },
  {
    id: 'accessories',
    label: 'Accessories',
    icon: 'Crown',
    promptTemplate: 'wearing {value}',
    group: 'features',
  },
  {
    id: 'facialHair',
    label: 'Facial Hair',
    icon: 'User',
    promptTemplate: 'with {value}',
    group: 'features',
  },

  // Body group
  {
    id: 'skinTone',
    label: 'Skin Tone',
    icon: 'Droplet',
    promptTemplate: '{value} skin tone',
    group: 'body',
  },
  {
    id: 'age',
    label: 'Age',
    icon: 'Clock',
    promptTemplate: '{value}',
    group: 'body',
  },
  {
    id: 'bodyType',
    label: 'Body Type',
    icon: 'User',
    promptTemplate: '{value} build',
    group: 'body',
  },

  // Environment group
  {
    id: 'lighting',
    label: 'Lighting',
    icon: 'Sun',
    promptTemplate: '{value} lighting',
    group: 'environment',
  },
  {
    id: 'background',
    label: 'Background',
    icon: 'Image',
    promptTemplate: '{value} background',
    group: 'environment',
  },
];

export const CATEGORY_GROUPS = [
  { id: 'face', label: 'Face', icon: 'User' },
  { id: 'features', label: 'Features', icon: 'Sparkles' },
  { id: 'body', label: 'Body', icon: 'Users' },
  { id: 'environment', label: 'Environment', icon: 'Image' },
] as const;

export const getCategoryById = (id: CategoryId): Category | undefined =>
  CATEGORIES.find((c) => c.id === id);

export const getCategoriesByGroup = (group: Category['group']): Category[] =>
  CATEGORIES.filter((c) => c.group === group);

// Order for prompt composition
export const PROMPT_ORDER: CategoryId[] = [
  'age',
  'bodyType',
  'skinTone',
  'hair',
  'eyes',
  'nose',
  'mouth',
  'expression',
  'facialHair',
  'makeup',
  'markings',
  'accessories',
  'lighting',
  'background',
];
