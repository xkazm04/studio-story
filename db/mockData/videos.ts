/**
 * Mock Video Generation Data
 * Generated videos, storyboards, frames, edit operations, and collections
 */

export interface GeneratedVideo {
  id: string;
  url: string;
  thumbnail_url?: string;
  prompt: string;
  project_id: string;
  generation_id?: string;
  provider: 'runway' | 'pika' | 'stable-video' | 'deforum' | 'local';
  model?: string;
  width: number;
  height: number;
  duration: number;
  fps: number;
  style?: string;
  motion_strength?: number;
  seed?: number;
  parent_video_id?: string;
  scene_id?: string;
  created_at: string;
  updated_at: string;
}

export interface VideoStoryboard {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  total_duration?: number;
  created_at: string;
  updated_at: string;
}

export interface StoryboardFrame {
  id: string;
  storyboard_id: string;
  order_index: number;
  prompt: string;
  duration: number;
  image_id?: string;
  video_id?: string;
  transition?: 'cut' | 'fade' | 'dissolve' | 'wipe' | 'zoom' | 'pan';
  notes?: string;
  created_at: string;
}

export interface VideoEditOperation {
  id: string;
  video_id: string;
  operation_type: 'trim' | 'merge' | 'speed_change' | 'style_transfer' | 'upscale' | 'interpolation';
  parameters?: Record<string, unknown>;
  result_url?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}

export interface VideoCollection {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  video_ids: string[];
  created_at: string;
  updated_at: string;
}

export const mockGeneratedVideos: GeneratedVideo[] = [
  // Character motion videos
  {
    id: 'gen-vid-1',
    url: '/generated/videos/aldric_oath_01.mp4',
    thumbnail_url: '/generated/videos/thumb_aldric_oath_01.jpg',
    prompt: 'Knight in silver armor kneeling, raising sword in oath, dramatic lighting, cinematic motion, slow camera pan',
    project_id: 'proj-1',
    generation_id: 'runway_gen_001',
    provider: 'runway',
    model: 'Gen-3 Alpha',
    width: 1280,
    height: 720,
    duration: 4,
    fps: 24,
    style: 'cinematic',
    motion_strength: 0.6,
    seed: 12345678,
    scene_id: 'scene-1',
    created_at: '2024-01-15T14:00:00Z',
    updated_at: '2024-01-15T14:00:00Z',
  },
  {
    id: 'gen-vid-2',
    url: '/generated/videos/lyra_shadows_01.mp4',
    thumbnail_url: '/generated/videos/thumb_lyra_shadows_01.jpg',
    prompt: 'Hooded rogue emerging from shadows, stealth movement, moonlit alley, noir atmosphere, fluid motion',
    project_id: 'proj-1',
    generation_id: 'runway_gen_002',
    provider: 'runway',
    model: 'Gen-3 Alpha',
    width: 1280,
    height: 720,
    duration: 5,
    fps: 24,
    style: 'noir',
    motion_strength: 0.5,
    seed: 23456789,
    scene_id: 'scene-2',
    created_at: '2024-01-15T15:00:00Z',
    updated_at: '2024-01-15T15:00:00Z',
  },
  // Scene establishing shots
  {
    id: 'gen-vid-3',
    url: '/generated/videos/citadel_flyover.mp4',
    thumbnail_url: '/generated/videos/thumb_citadel_flyover.jpg',
    prompt: 'Aerial drone shot of silver citadel, epic fantasy castle, clouds parting, morning light, sweeping camera motion',
    project_id: 'proj-1',
    generation_id: 'pika_gen_001',
    provider: 'pika',
    model: 'Pika 1.0',
    width: 1920,
    height: 1080,
    duration: 6,
    fps: 30,
    style: 'epic',
    motion_strength: 0.7,
    seed: 34567890,
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z',
  },
  {
    id: 'gen-vid-4',
    url: '/generated/videos/dragon_mountain_reveal.mp4',
    thumbnail_url: '/generated/videos/thumb_dragon_mountain_reveal.jpg',
    prompt: 'Volcanic mountain fortress reveal, dragons circling, lava glow, ominous red sky, slow dramatic zoom',
    project_id: 'proj-1',
    generation_id: 'stable_gen_001',
    provider: 'stable-video',
    model: 'SVD-XT',
    width: 1920,
    height: 1080,
    duration: 8,
    fps: 24,
    style: 'epic-dark',
    motion_strength: 0.4,
    seed: 45678901,
    created_at: '2024-01-16T11:00:00Z',
    updated_at: '2024-01-16T11:00:00Z',
  },
  // Battle sequence
  {
    id: 'gen-vid-5',
    url: '/generated/videos/battle_charge.mp4',
    thumbnail_url: '/generated/videos/thumb_battle_charge.jpg',
    prompt: 'Knights charging into battle, swords drawn, dramatic dust clouds, epic fantasy war scene, dynamic camera',
    project_id: 'proj-1',
    generation_id: 'runway_gen_003',
    provider: 'runway',
    model: 'Gen-3 Alpha Turbo',
    width: 1920,
    height: 1080,
    duration: 4,
    fps: 30,
    style: 'action',
    motion_strength: 0.9,
    seed: 56789012,
    scene_id: 'scene-6',
    created_at: '2024-01-17T10:00:00Z',
    updated_at: '2024-01-17T10:00:00Z',
  },
  {
    id: 'gen-vid-6',
    url: '/generated/videos/dragon_fire.mp4',
    thumbnail_url: '/generated/videos/thumb_dragon_fire.jpg',
    prompt: 'Dragon breathing fire across battlefield, dramatic flames, heroes taking cover, epic fantasy action',
    project_id: 'proj-1',
    generation_id: 'deforum_gen_001',
    provider: 'deforum',
    model: 'Deforum SD',
    width: 1280,
    height: 720,
    duration: 5,
    fps: 24,
    style: 'action-vfx',
    motion_strength: 0.85,
    seed: 67890123,
    scene_id: 'scene-6',
    created_at: '2024-01-17T11:00:00Z',
    updated_at: '2024-01-17T11:00:00Z',
  },
];

export const mockVideoStoryboards: VideoStoryboard[] = [
  {
    id: 'storyboard-1',
    project_id: 'proj-1',
    name: 'Act 1 Opening Sequence',
    description: 'Introduction to the world and main characters',
    total_duration: 120,
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T16:00:00Z',
  },
  {
    id: 'storyboard-2',
    project_id: 'proj-1',
    name: 'Knight Oath Ceremony',
    description: 'Aldric takes his oath to the Silver Order',
    total_duration: 60,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T14:00:00Z',
  },
  {
    id: 'storyboard-3',
    project_id: 'proj-1',
    name: 'Final Battle Sequence',
    description: 'Epic confrontation at the dragon fortress',
    total_duration: 180,
    created_at: '2024-01-17T09:00:00Z',
    updated_at: '2024-01-17T12:00:00Z',
  },
];

export const mockStoryboardFrames: StoryboardFrame[] = [
  // Act 1 Opening Sequence frames
  {
    id: 'frame-1',
    storyboard_id: 'storyboard-1',
    order_index: 1,
    prompt: 'Wide establishing shot of the fantasy realm, peaceful villages, distant mountains',
    duration: 8,
    image_id: undefined,
    video_id: undefined,
    transition: 'fade',
    notes: 'Opening narration begins here',
    created_at: '2024-01-15T09:15:00Z',
  },
  {
    id: 'frame-2',
    storyboard_id: 'storyboard-1',
    order_index: 2,
    prompt: 'Aerial approach to the Silver Citadel, morning light',
    duration: 6,
    image_id: undefined,
    video_id: 'gen-vid-3',
    transition: 'dissolve',
    notes: 'Music swells as citadel comes into view',
    created_at: '2024-01-15T09:20:00Z',
  },
  {
    id: 'frame-3',
    storyboard_id: 'storyboard-1',
    order_index: 3,
    prompt: 'Interior throne room, knights gathering',
    duration: 5,
    image_id: 'gen-img-4',
    video_id: undefined,
    transition: 'cut',
    notes: 'Transition to oath ceremony scene',
    created_at: '2024-01-15T09:25:00Z',
  },
  // Knight Oath Ceremony frames
  {
    id: 'frame-4',
    storyboard_id: 'storyboard-2',
    order_index: 1,
    prompt: 'Close-up of Aldric face, determined expression',
    duration: 3,
    image_id: 'gen-img-1',
    video_id: undefined,
    transition: 'cut',
    notes: 'First introduction to protagonist',
    created_at: '2024-01-15T10:15:00Z',
  },
  {
    id: 'frame-5',
    storyboard_id: 'storyboard-2',
    order_index: 2,
    prompt: 'Aldric kneeling before the Grand Master',
    duration: 4,
    video_id: 'gen-vid-1',
    transition: 'cut',
    notes: 'The oath begins',
    created_at: '2024-01-15T10:20:00Z',
  },
  {
    id: 'frame-6',
    storyboard_id: 'storyboard-2',
    order_index: 3,
    prompt: 'Sword raised in oath, dramatic lighting from above',
    duration: 5,
    transition: 'dissolve',
    notes: 'Key moment - sword catches light',
    created_at: '2024-01-15T10:25:00Z',
  },
  // Final Battle frames
  {
    id: 'frame-7',
    storyboard_id: 'storyboard-3',
    order_index: 1,
    prompt: 'Dragon fortress looming ahead, army approaching',
    duration: 6,
    video_id: 'gen-vid-4',
    transition: 'fade',
    notes: 'Tension building - calm before storm',
    created_at: '2024-01-17T09:15:00Z',
  },
  {
    id: 'frame-8',
    storyboard_id: 'storyboard-3',
    order_index: 2,
    prompt: 'Battle charge begins',
    duration: 4,
    video_id: 'gen-vid-5',
    transition: 'cut',
    notes: 'ACTION! Battle music kicks in',
    created_at: '2024-01-17T09:20:00Z',
  },
  {
    id: 'frame-9',
    storyboard_id: 'storyboard-3',
    order_index: 3,
    prompt: 'Dragon attacks with fire breath',
    duration: 5,
    video_id: 'gen-vid-6',
    transition: 'cut',
    notes: 'VFX heavy shot - dragon fire',
    created_at: '2024-01-17T09:25:00Z',
  },
  {
    id: 'frame-10',
    storyboard_id: 'storyboard-3',
    order_index: 4,
    prompt: 'Heroes taking defensive positions',
    duration: 3,
    transition: 'cut',
    notes: 'Quick cuts between characters',
    created_at: '2024-01-17T09:30:00Z',
  },
];

export const mockVideoEditOperations: VideoEditOperation[] = [
  {
    id: 'vid-edit-1',
    video_id: 'gen-vid-1',
    operation_type: 'upscale',
    parameters: { target_resolution: '4K', model: 'topaz' },
    result_url: '/generated/videos/aldric_oath_01_4k.mp4',
    status: 'completed',
    created_at: '2024-01-15T14:30:00Z',
    completed_at: '2024-01-15T14:45:00Z',
  },
  {
    id: 'vid-edit-2',
    video_id: 'gen-vid-3',
    operation_type: 'speed_change',
    parameters: { speed: 0.5 },
    result_url: '/generated/videos/citadel_flyover_slow.mp4',
    status: 'completed',
    created_at: '2024-01-16T10:30:00Z',
    completed_at: '2024-01-16T10:35:00Z',
  },
  {
    id: 'vid-edit-3',
    video_id: 'gen-vid-5',
    operation_type: 'interpolation',
    parameters: { target_fps: 60, model: 'rife' },
    result_url: '/generated/videos/battle_charge_60fps.mp4',
    status: 'completed',
    created_at: '2024-01-17T10:30:00Z',
    completed_at: '2024-01-17T10:50:00Z',
  },
  {
    id: 'vid-edit-4',
    video_id: 'gen-vid-4',
    operation_type: 'style_transfer',
    parameters: { style: 'oil-painting', strength: 0.3 },
    status: 'processing',
    created_at: '2024-01-16T12:00:00Z',
  },
  {
    id: 'vid-edit-5',
    video_id: 'gen-vid-6',
    operation_type: 'trim',
    parameters: { start: 1.0, end: 4.0 },
    status: 'pending',
    created_at: '2024-01-17T11:30:00Z',
  },
];

export const mockVideoCollections: VideoCollection[] = [
  {
    id: 'vid-collection-1',
    project_id: 'proj-1',
    name: 'Character Motion Tests',
    description: 'Character movement and action test clips',
    video_ids: ['gen-vid-1', 'gen-vid-2'],
    created_at: '2024-01-15T16:00:00Z',
    updated_at: '2024-01-15T16:00:00Z',
  },
  {
    id: 'vid-collection-2',
    project_id: 'proj-1',
    name: 'Establishing Shots',
    description: 'Location and environment establishing shots',
    video_ids: ['gen-vid-3', 'gen-vid-4'],
    created_at: '2024-01-16T12:00:00Z',
    updated_at: '2024-01-16T12:00:00Z',
  },
  {
    id: 'vid-collection-3',
    project_id: 'proj-1',
    name: 'Battle Sequence - Raw',
    description: 'Unedited battle sequence clips for final edit',
    video_ids: ['gen-vid-5', 'gen-vid-6'],
    created_at: '2024-01-17T12:00:00Z',
    updated_at: '2024-01-17T12:00:00Z',
  },
];
