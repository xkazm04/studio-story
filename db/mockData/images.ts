/**
 * Mock Image Generation Data
 * Generated images, edit operations, collections, and camera presets
 */

import { MOCK_USER_ID } from './constants';

export interface GeneratedImage {
  id: string;
  url: string;
  thumbnail_url?: string;
  prompt: string;
  negative_prompt?: string;
  project_id: string;
  generation_id?: string;
  provider: 'leonardo' | 'stability' | 'midjourney' | 'dalle' | 'local';
  model?: string;
  width: number;
  height: number;
  seed?: number;
  steps?: number;
  cfg_scale?: number;
  sampler?: string;
  style?: string;
  parent_image_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ImageEditOperation {
  id: string;
  image_id: string;
  operation_type: 'upscale' | 'inpaint' | 'outpaint' | 'remove_background' | 'style_transfer' | 'variation';
  parameters?: Record<string, unknown>;
  result_url?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}

export interface ImageCollection {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  image_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface CameraPreset {
  id: string;
  user_id: string;
  name: string;
  angles: string[];
  shot_types: string[];
  lighting: string[];
  composition: string[];
  prompt_template: string;
  created_at: string;
}

export const mockGeneratedImages: GeneratedImage[] = [
  // Character portraits
  {
    id: 'gen-img-1',
    url: '/generated/characters/aldric_portrait_01.png',
    thumbnail_url: '/generated/characters/thumb_aldric_portrait_01.png',
    prompt: 'Epic fantasy knight portrait, silver armor with blue cape, noble face, determined expression, golden lighting, highly detailed, digital painting',
    negative_prompt: 'blurry, low quality, deformed, text, watermark',
    project_id: 'proj-1',
    generation_id: 'leo_gen_001',
    provider: 'leonardo',
    model: 'Leonardo Diffusion XL',
    width: 1024,
    height: 1024,
    seed: 42857291,
    steps: 30,
    cfg_scale: 7.5,
    sampler: 'DPM++ 2M Karras',
    style: 'fantasy-portrait',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'gen-img-2',
    url: '/generated/characters/lyra_stealth_01.png',
    thumbnail_url: '/generated/characters/thumb_lyra_stealth_01.png',
    prompt: 'Female rogue assassin, dark hooded cloak, mysterious face half in shadow, green eyes glowing, moonlit background, dark fantasy style',
    negative_prompt: 'bright colors, cheerful, low quality',
    project_id: 'proj-1',
    generation_id: 'leo_gen_002',
    provider: 'leonardo',
    model: 'Leonardo Diffusion XL',
    width: 1024,
    height: 1024,
    seed: 18273645,
    steps: 35,
    cfg_scale: 8.0,
    sampler: 'Euler a',
    style: 'dark-fantasy',
    created_at: '2024-01-15T11:00:00Z',
    updated_at: '2024-01-15T11:00:00Z',
  },
  {
    id: 'gen-img-3',
    url: '/generated/characters/theron_dragon_01.png',
    thumbnail_url: '/generated/characters/thumb_theron_dragon_01.png',
    prompt: 'Dragon-touched warrior, scales on skin, fire in eyes, ancient armor with dragon motifs, volcanic background, epic fantasy',
    project_id: 'proj-1',
    generation_id: 'sd_gen_001',
    provider: 'stability',
    model: 'SDXL 1.0',
    width: 1024,
    height: 1024,
    seed: 91827364,
    steps: 40,
    cfg_scale: 7.0,
    sampler: 'DPM++ SDE',
    style: 'epic-fantasy',
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z',
  },
  // Scene images
  {
    id: 'gen-img-4',
    url: '/generated/scenes/silver_citadel_throne.png',
    thumbnail_url: '/generated/scenes/thumb_silver_citadel_throne.png',
    prompt: 'Grand throne room, silver and blue banners, knights kneeling, sunlight through stained glass, epic medieval fantasy, cinematic composition',
    project_id: 'proj-1',
    generation_id: 'mj_gen_001',
    provider: 'midjourney',
    model: 'v6',
    width: 1920,
    height: 1080,
    seed: 55443322,
    steps: 50,
    cfg_scale: 6.5,
    style: 'cinematic',
    created_at: '2024-01-15T12:00:00Z',
    updated_at: '2024-01-15T12:00:00Z',
  },
  {
    id: 'gen-img-5',
    url: '/generated/scenes/shadow_guild_entrance.png',
    thumbnail_url: '/generated/scenes/thumb_shadow_guild_entrance.png',
    prompt: 'Hidden entrance to underground guild, dark alley, flickering torchlight, mysterious symbols on walls, film noir meets fantasy',
    project_id: 'proj-1',
    generation_id: 'dalle_gen_001',
    provider: 'dalle',
    model: 'dall-e-3',
    width: 1792,
    height: 1024,
    style: 'noir-fantasy',
    created_at: '2024-01-15T13:00:00Z',
    updated_at: '2024-01-15T13:00:00Z',
  },
  {
    id: 'gen-img-6',
    url: '/generated/scenes/dragon_mountain_fortress.png',
    thumbnail_url: '/generated/scenes/thumb_dragon_mountain_fortress.png',
    prompt: 'Ancient fortress carved into volcanic mountain, dragons circling above, lava rivers below, ominous red sky, epic scale fantasy landscape',
    project_id: 'proj-1',
    generation_id: 'leo_gen_003',
    provider: 'leonardo',
    model: 'Leonardo Kino XL',
    width: 1920,
    height: 1080,
    seed: 77889900,
    steps: 45,
    cfg_scale: 8.5,
    sampler: 'DPM++ 2M Karras',
    style: 'epic-landscape',
    created_at: '2024-01-16T11:00:00Z',
    updated_at: '2024-01-16T11:00:00Z',
  },
  // Upscaled/variant images
  {
    id: 'gen-img-7',
    url: '/generated/characters/aldric_portrait_01_upscaled.png',
    thumbnail_url: '/generated/characters/thumb_aldric_portrait_01_upscaled.png',
    prompt: 'Epic fantasy knight portrait, silver armor with blue cape, noble face, determined expression, golden lighting, highly detailed, digital painting',
    project_id: 'proj-1',
    generation_id: 'leo_gen_004',
    provider: 'leonardo',
    model: 'Universal Upscaler',
    width: 2048,
    height: 2048,
    parent_image_id: 'gen-img-1',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 'gen-img-8',
    url: '/generated/characters/aldric_portrait_variant.png',
    thumbnail_url: '/generated/characters/thumb_aldric_portrait_variant.png',
    prompt: 'Epic fantasy knight portrait, silver armor with blue cape, noble face, determined expression, golden lighting, highly detailed, digital painting - battle damaged variant',
    project_id: 'proj-1',
    generation_id: 'leo_gen_005',
    provider: 'leonardo',
    model: 'Leonardo Diffusion XL',
    width: 1024,
    height: 1024,
    seed: 42857292,
    steps: 30,
    cfg_scale: 7.5,
    parent_image_id: 'gen-img-1',
    style: 'fantasy-portrait',
    created_at: '2024-01-15T10:45:00Z',
    updated_at: '2024-01-15T10:45:00Z',
  },
];

export const mockImageEditOperations: ImageEditOperation[] = [
  {
    id: 'edit-op-1',
    image_id: 'gen-img-1',
    operation_type: 'upscale',
    parameters: { scale: 2, model: 'universal' },
    result_url: '/generated/characters/aldric_portrait_01_upscaled.png',
    status: 'completed',
    created_at: '2024-01-15T10:20:00Z',
    completed_at: '2024-01-15T10:25:00Z',
  },
  {
    id: 'edit-op-2',
    image_id: 'gen-img-2',
    operation_type: 'remove_background',
    parameters: { threshold: 0.5 },
    result_url: '/generated/characters/lyra_stealth_01_nobg.png',
    status: 'completed',
    created_at: '2024-01-15T11:20:00Z',
    completed_at: '2024-01-15T11:22:00Z',
  },
  {
    id: 'edit-op-3',
    image_id: 'gen-img-1',
    operation_type: 'variation',
    parameters: { strength: 0.3, seed: 42857292 },
    result_url: '/generated/characters/aldric_portrait_variant.png',
    status: 'completed',
    created_at: '2024-01-15T10:40:00Z',
    completed_at: '2024-01-15T10:45:00Z',
  },
  {
    id: 'edit-op-4',
    image_id: 'gen-img-4',
    operation_type: 'inpaint',
    parameters: {
      mask_prompt: 'add a dragon flying through the window',
      strength: 0.7,
    },
    status: 'processing',
    created_at: '2024-01-15T12:30:00Z',
  },
  {
    id: 'edit-op-5',
    image_id: 'gen-img-6',
    operation_type: 'outpaint',
    parameters: {
      direction: 'left',
      pixels: 512,
      prompt: 'extend the volcanic landscape with more lava rivers',
    },
    status: 'pending',
    created_at: '2024-01-16T11:30:00Z',
  },
];

export const mockImageCollections: ImageCollection[] = [
  {
    id: 'collection-1',
    project_id: 'proj-1',
    name: 'Main Characters',
    description: 'Portrait collection of all main characters in the story',
    image_ids: ['gen-img-1', 'gen-img-2', 'gen-img-3', 'gen-img-7', 'gen-img-8'],
    created_at: '2024-01-15T14:00:00Z',
    updated_at: '2024-01-16T10:00:00Z',
  },
  {
    id: 'collection-2',
    project_id: 'proj-1',
    name: 'Key Locations',
    description: 'Important scenes and locations from the story',
    image_ids: ['gen-img-4', 'gen-img-5', 'gen-img-6'],
    created_at: '2024-01-15T14:30:00Z',
    updated_at: '2024-01-16T11:00:00Z',
  },
  {
    id: 'collection-3',
    project_id: 'proj-1',
    name: 'Aldric Character Sheet',
    description: 'All variations and views of Aldric',
    image_ids: ['gen-img-1', 'gen-img-7', 'gen-img-8'],
    created_at: '2024-01-15T15:00:00Z',
    updated_at: '2024-01-15T15:00:00Z',
  },
];

export const mockCameraPresets: CameraPreset[] = [
  {
    id: 'preset-1',
    user_id: MOCK_USER_ID,
    name: 'Epic Character Portrait',
    angles: ['front', 'three-quarter'],
    shot_types: ['close-up', 'medium'],
    lighting: ['dramatic', 'golden hour', 'rim light'],
    composition: ['rule of thirds', 'centered'],
    prompt_template: '{subject}, epic fantasy portrait, {angle} view, {shot_type} shot, {lighting} lighting, highly detailed, {composition} composition, professional photography',
    created_at: '2024-01-14T10:00:00Z',
  },
  {
    id: 'preset-2',
    user_id: MOCK_USER_ID,
    name: 'Cinematic Scene',
    angles: ['wide', 'establishing'],
    shot_types: ['wide', 'extreme wide'],
    lighting: ['cinematic', 'moody', 'volumetric'],
    composition: ['leading lines', 'depth'],
    prompt_template: '{subject}, cinematic {angle} shot, {lighting} lighting, epic fantasy scene, {shot_type}, {composition}, film grain, anamorphic lens',
    created_at: '2024-01-14T11:00:00Z',
  },
  {
    id: 'preset-3',
    user_id: MOCK_USER_ID,
    name: 'Action Pose',
    angles: ['dynamic', 'low angle', 'dutch angle'],
    shot_types: ['full body', 'action'],
    lighting: ['dramatic', 'harsh', 'backlit'],
    composition: ['dynamic', 'diagonal'],
    prompt_template: '{subject} in action pose, {angle}, {shot_type} shot, {lighting} lighting, motion blur, {composition} composition, epic fantasy battle',
    created_at: '2024-01-14T12:00:00Z',
  },
  {
    id: 'preset-4',
    user_id: MOCK_USER_ID,
    name: 'Dark/Noir',
    angles: ['side', 'shadowy'],
    shot_types: ['profile', 'silhouette'],
    lighting: ['noir', 'single source', 'shadows'],
    composition: ['negative space', 'chiaroscuro'],
    prompt_template: '{subject}, film noir style, {angle} angle, {shot_type}, {lighting} lighting, {composition}, dark fantasy, mysterious atmosphere',
    created_at: '2024-01-14T13:00:00Z',
  },
];
