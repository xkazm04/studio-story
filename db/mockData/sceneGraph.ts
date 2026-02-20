/**
 * Mock Scene Graph Data (Scene Choices for branching narratives)
 * Migrated from Hyper's Choice concept
 */

import { SceneChoice } from '@/app/types/SceneChoice';
import { Scene } from '@/app/types/Scene';

/**
 * Extended mock scenes with graph-related content
 */
export const mockGraphScenes: Scene[] = [
  {
    id: 'graph-scene-1',
    name: 'The Crossroads',
    project_id: 'proj-1',
    act_id: 'act-1',
    order: 1,
    description: 'You stand at a crossroads in the ancient forest.',
    content: 'The morning mist parts before you as you reach the crossroads. Three paths stretch into the unknown - one leads to the mountain fortress, another to the shadowy woods, and the third to the riverside village.',
    image_url: '/images/crossroads.jpg',
    image_prompt: 'A mystical crossroads in an ancient forest with three diverging paths, morning mist, fantasy style',
    version: 1,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'graph-scene-2',
    name: 'Mountain Fortress',
    project_id: 'proj-1',
    act_id: 'act-1',
    order: 2,
    description: 'The towering fortress looms above.',
    content: 'After a steep climb, the fortress gates stand before you. Guards patrol the walls, their armor gleaming in the afternoon sun.',
    image_url: '/images/fortress.jpg',
    image_prompt: 'A towering medieval fortress on a mountain peak, guards on walls, dramatic lighting',
    version: 1,
    created_at: '2024-01-15T11:00:00Z',
  },
  {
    id: 'graph-scene-3',
    name: 'Shadow Woods',
    project_id: 'proj-1',
    act_id: 'act-1',
    order: 3,
    description: 'Darkness envelops the twisted trees.',
    content: 'The canopy thickens overhead, blocking out the sun. Strange whispers echo between the gnarled trunks. Something watches from the shadows.',
    image_url: '/images/shadow-woods.jpg',
    image_prompt: 'Dark twisted forest with ominous shadows, mysterious atmosphere, fantasy horror',
    version: 1,
    created_at: '2024-01-15T12:00:00Z',
  },
  {
    id: 'graph-scene-4',
    name: 'Riverside Village',
    project_id: 'proj-1',
    act_id: 'act-1',
    order: 4,
    description: 'A peaceful village by the river.',
    content: 'Smoke rises from cottage chimneys. Children play by the waterside while merchants call out their wares in the village square.',
    image_url: '/images/village.jpg',
    image_prompt: 'Peaceful medieval village by a river, cottages, village square, warm afternoon light',
    version: 1,
    created_at: '2024-01-15T13:00:00Z',
  },
  {
    id: 'graph-scene-5',
    name: 'The Hidden Chamber',
    project_id: 'proj-1',
    act_id: 'act-2',
    order: 1,
    description: 'A secret room within the fortress.',
    content: 'Behind the tapestry, you discover a hidden chamber filled with ancient maps and forgotten relics. A glowing artifact catches your eye.',
    speaker: 'Narrator',
    speaker_type: 'narrator',
    version: 1,
    created_at: '2024-01-16T10:00:00Z',
  },
  {
    id: 'graph-scene-6',
    name: 'Forest Guardian',
    project_id: 'proj-1',
    act_id: 'act-2',
    order: 2,
    description: 'Meeting the ancient protector.',
    content: 'A towering figure of bark and moss steps from the shadows. "Why do you trespass in my domain, mortal?"',
    message: 'Why do you trespass in my domain, mortal?',
    speaker: 'Forest Guardian',
    speaker_type: 'character',
    version: 1,
    created_at: '2024-01-16T11:00:00Z',
  },
];

/**
 * Mock scene choices for branching narrative
 */
export const mockSceneChoices: SceneChoice[] = [
  // From Crossroads (scene-1)
  {
    id: 'choice-1',
    scene_id: 'graph-scene-1',
    target_scene_id: 'graph-scene-2',
    label: 'Climb to the Mountain Fortress',
    order_index: 0,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'choice-2',
    scene_id: 'graph-scene-1',
    target_scene_id: 'graph-scene-3',
    label: 'Enter the Shadow Woods',
    order_index: 1,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'choice-3',
    scene_id: 'graph-scene-1',
    target_scene_id: 'graph-scene-4',
    label: 'Visit the Riverside Village',
    order_index: 2,
    created_at: '2024-01-15T10:00:00Z',
  },
  // From Mountain Fortress (scene-2)
  {
    id: 'choice-4',
    scene_id: 'graph-scene-2',
    target_scene_id: 'graph-scene-5',
    label: 'Search for hidden passages',
    order_index: 0,
    created_at: '2024-01-15T11:00:00Z',
  },
  {
    id: 'choice-5',
    scene_id: 'graph-scene-2',
    target_scene_id: 'graph-scene-1',
    label: 'Return to the crossroads',
    order_index: 1,
    created_at: '2024-01-15T11:00:00Z',
  },
  // From Shadow Woods (scene-3)
  {
    id: 'choice-6',
    scene_id: 'graph-scene-3',
    target_scene_id: 'graph-scene-6',
    label: 'Follow the whispers',
    order_index: 0,
    created_at: '2024-01-15T12:00:00Z',
  },
  {
    id: 'choice-7',
    scene_id: 'graph-scene-3',
    target_scene_id: 'graph-scene-1',
    label: 'Flee back to safety',
    order_index: 1,
    created_at: '2024-01-15T12:00:00Z',
  },
  // From Village (scene-4) - dead end example
  {
    id: 'choice-8',
    scene_id: 'graph-scene-4',
    target_scene_id: 'graph-scene-1',
    label: 'Return to the crossroads',
    order_index: 0,
    created_at: '2024-01-15T13:00:00Z',
  },
];

/**
 * Project first scene mapping
 */
export const mockProjectFirstScenes: Record<string, string> = {
  'proj-1': 'graph-scene-1',
};
