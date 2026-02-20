/**
 * Image Generation Types
 *
 * Type definitions for image generation, editing, and management
 */

export interface GeneratedImage {
  id: string;
  url: string;
  thumbnail_url?: string;
  prompt: string;
  negative_prompt?: string;
  project_id: string;
  generation_id?: string; // External provider generation ID
  provider: 'leonardo' | 'stability' | 'midjourney' | 'dalle' | 'local';
  model?: string;
  width: number;
  height: number;
  seed?: number;
  steps?: number;
  cfg_scale?: number;
  sampler?: string;
  style?: string;
  parent_image_id?: string | null; // For variants/edits
  created_at: string;
  updated_at: string;
}

export interface GeneratedImageInsert extends Omit<GeneratedImage, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GeneratedImageUpdate extends Partial<Omit<GeneratedImage, 'id' | 'created_at' | 'updated_at'>> {}

// =====================================================
// IMAGE GENERATION REQUEST
// =====================================================

export interface ImageGenerationRequest {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  num_images?: number;
  steps?: number;
  cfg_scale?: number;
  seed?: number;
  sampler?: string;
  style?: string;
  model?: string;
}

export interface ImageGenerationResponse {
  images: Array<{
    id: string;
    url: string;
    seed?: number;
  }>;
  generation_id: string;
}

// =====================================================
// PROMPT COMPONENTS
// =====================================================

export interface PromptComponents {
  artstyle: string;
  scenery: string;
  actors: string;
  actions: string;
  camera: string;
}

export interface CameraSetup {
  angles: string[];
  shotTypes: string[];
  lighting: string[];
  composition: string[];
}

// =====================================================
// IMAGE EDITING
// =====================================================

export interface ImageEditOperation {
  id: string;
  image_id: string;
  operation_type: 'upscale' | 'inpaint' | 'outpaint' | 'remove_background' | 'style_transfer' | 'variation';
  parameters: Record<string, any>;
  result_url?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}

export interface ImageEditRequest {
  image_id: string;
  operation: 'upscale' | 'inpaint' | 'outpaint' | 'remove_background' | 'style_transfer' | 'variation';
  parameters?: Record<string, any>;
}

// =====================================================
// IMAGE VARIANTS & HISTORY
// =====================================================

export interface ImageVariant {
  id: string;
  parent_image_id: string;
  url: string;
  variation_type: 'strong' | 'subtle' | 'creative' | 'precise';
  generation_id?: string;
  created_at: string;
}

export interface ImageHistory {
  image_id: string;
  variants: ImageVariant[];
  operations: ImageEditOperation[];
}

// =====================================================
// SKETCH TO IMAGE
// =====================================================

export interface SketchToImageRequest {
  sketch_data: string; // Base64 encoded image
  prompt: string;
  strength?: number; // How much to follow the sketch (0-1)
  style?: string;
}

export interface SketchToImageResponse {
  images: Array<{
    id: string;
    url: string;
  }>;
  generation_id: string;
}

// =====================================================
// IMAGE COLLECTIONS
// =====================================================

export interface ImageCollection {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  image_ids: string[];
  created_at: string;
  updated_at: string;
}

// =====================================================
// CAMERA PRESETS
// =====================================================

export interface CameraPreset {
  id: string;
  name: string;
  angles: string[];
  shot_types: string[];
  lighting: string[];
  composition: string[];
  prompt_template: string;
}

export const CAMERA_ANGLES = [
  { name: 'Eye Level', prompt: 'eye level angle' },
  { name: 'High Angle', prompt: 'high angle, looking down' },
  { name: 'Low Angle', prompt: 'low angle, looking up' },
  { name: 'Bird\'s Eye', prompt: 'bird\'s eye view, top-down' },
  { name: 'Worm\'s Eye', prompt: 'worm\'s eye view, extreme low angle' },
  { name: 'Dutch Angle', prompt: 'dutch angle, tilted' },
] as const;

export const SHOT_TYPES = [
  { name: 'Close-up', prompt: 'close-up shot' },
  { name: 'Medium Shot', prompt: 'medium shot' },
  { name: 'Wide Shot', prompt: 'wide shot, establishing shot' },
  { name: 'Extreme Close-up', prompt: 'extreme close-up, macro' },
  { name: 'Full Shot', prompt: 'full body shot' },
  { name: 'Over Shoulder', prompt: 'over the shoulder shot' },
] as const;

export const LIGHTING = [
  { name: 'Natural Light', prompt: 'natural lighting, daylight' },
  { name: 'Golden Hour', prompt: 'golden hour, warm sunset lighting' },
  { name: 'Blue Hour', prompt: 'blue hour, twilight' },
  { name: 'Studio', prompt: 'studio lighting, professional' },
  { name: 'Dramatic', prompt: 'dramatic lighting, high contrast' },
  { name: 'Soft Light', prompt: 'soft diffused lighting' },
  { name: 'Backlit', prompt: 'backlit, silhouette' },
  { name: 'Neon', prompt: 'neon lighting, cyberpunk' },
] as const;

export const COMPOSITION = [
  { name: 'Rule of Thirds', prompt: 'rule of thirds composition' },
  { name: 'Centered', prompt: 'centered composition, symmetrical' },
  { name: 'Leading Lines', prompt: 'leading lines, perspective' },
  { name: 'Frame in Frame', prompt: 'frame within frame' },
  { name: 'Golden Ratio', prompt: 'golden ratio composition' },
  { name: 'Negative Space', prompt: 'negative space, minimalist' },
] as const;
