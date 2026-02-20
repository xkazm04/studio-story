/**
 * Video Generation Types
 *
 * Type definitions for video generation, storyboarding, and animation
 */

export interface GeneratedVideo {
  id: string;
  url: string;
  thumbnail_url?: string;
  prompt: string;
  project_id: string;
  generation_id?: string; // External provider generation ID
  provider: 'runway' | 'pika' | 'stable-video' | 'deforum' | 'local';
  model?: string;
  width: number;
  height: number;
  duration: number; // in seconds
  fps: number;
  style?: string;
  motion_strength?: number; // 0-1
  seed?: number;
  parent_video_id?: string | null; // For variants/edits
  scene_id?: string | null; // Link to scene
  created_at: string;
  updated_at: string;
}

export interface GeneratedVideoInsert extends Omit<GeneratedVideo, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GeneratedVideoUpdate extends Partial<Omit<GeneratedVideo, 'id' | 'created_at' | 'updated_at'>> {}

// =====================================================
// VIDEO GENERATION REQUEST
// =====================================================

export interface VideoGenerationRequest {
  prompt: string;
  width?: number;
  height?: number;
  duration?: number; // seconds
  fps?: number;
  style?: string;
  motion_strength?: number; // 0-1
  seed?: number;
  model?: string;
  init_image?: string; // Starting frame (image-to-video)
  end_image?: string; // Ending frame (interpolation)
}

export interface VideoGenerationResponse {
  video_id: string;
  url: string;
  thumbnail_url?: string;
  generation_id: string;
  duration: number;
}

// =====================================================
// IMAGE TO VIDEO
// =====================================================

export interface ImageToVideoRequest {
  image_id: string;
  prompt: string;
  duration?: number;
  motion_strength?: number;
  style?: string;
}

// =====================================================
// VIDEO STORYBOARD
// =====================================================

export interface VideoStoryboard {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  frames: StoryboardFrame[];
  total_duration: number;
  created_at: string;
  updated_at: string;
}

export interface StoryboardFrame {
  id: string;
  storyboard_id: string;
  order: number;
  prompt: string;
  duration: number; // seconds
  image_id?: string; // Optional reference image
  video_id?: string; // Generated video for this frame
  transition?: TransitionType;
  notes?: string;
}

export type TransitionType = 'cut' | 'fade' | 'dissolve' | 'wipe' | 'zoom' | 'pan';

// =====================================================
// VIDEO EDITING
// =====================================================

export interface VideoEditOperation {
  id: string;
  video_id: string;
  operation_type: 'trim' | 'merge' | 'speed_change' | 'style_transfer' | 'upscale' | 'interpolation';
  parameters: Record<string, any>;
  result_url?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}

// =====================================================
// SCENE TO VIDEO
// =====================================================

export interface SceneToVideoRequest {
  scene_id: string;
  generate_from: 'script' | 'description' | 'storyboard';
  style?: string;
  duration_per_shot?: number;
  include_dialogue?: boolean;
}

export interface SceneToVideoResponse {
  storyboard_id: string;
  frames: StoryboardFrame[];
  estimated_duration: number;
}

// =====================================================
// VIDEO PRESETS
// =====================================================

export interface VideoPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  motion_strength: number;
  style?: string;
}

export const VIDEO_RESOLUTIONS = [
  { name: '480p', width: 854, height: 480 },
  { name: '720p', width: 1280, height: 720 },
  { name: '1080p', width: 1920, height: 1080 },
  { name: 'Square', width: 1024, height: 1024 },
  { name: 'Portrait', width: 1080, height: 1920 },
] as const;

export const VIDEO_FPS_OPTIONS = [
  { name: '24 fps (Cinematic)', value: 24 },
  { name: '30 fps (Standard)', value: 30 },
  { name: '60 fps (Smooth)', value: 60 },
] as const;

export const VIDEO_DURATIONS = [
  { name: '2 seconds', value: 2 },
  { name: '4 seconds', value: 4 },
  { name: '6 seconds', value: 6 },
  { name: '8 seconds', value: 8 },
  { name: '10 seconds', value: 10 },
] as const;

export const VIDEO_STYLES = [
  { name: 'Realistic', prompt: 'photorealistic, high detail' },
  { name: 'Cinematic', prompt: 'cinematic, film grain, color graded' },
  { name: 'Anime', prompt: 'anime style, hand drawn' },
  { name: '3D Animation', prompt: '3D animated, pixar style' },
  { name: 'Stop Motion', prompt: 'stop motion, claymation' },
  { name: 'Watercolor', prompt: 'watercolor painting, artistic' },
] as const;

// =====================================================
// MOTION PRESETS
// =====================================================

export const MOTION_PRESETS = [
  { name: 'Static', description: 'Minimal motion', strength: 0.1 },
  { name: 'Subtle', description: 'Gentle movement', strength: 0.3 },
  { name: 'Moderate', description: 'Balanced motion', strength: 0.5 },
  { name: 'Dynamic', description: 'Active movement', strength: 0.7 },
  { name: 'Intense', description: 'High energy', strength: 0.9 },
] as const;

// =====================================================
// VIDEO COLLECTION
// =====================================================

export interface VideoCollection {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  video_ids: string[];
  created_at: string;
  updated_at: string;
}
