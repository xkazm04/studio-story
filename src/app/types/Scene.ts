export interface SceneMetadata {
  timeOfDay?: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night' | 'midnight';
  weather?: 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'foggy' | 'windy';
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  mood?: string;
  temperature?: 'freezing' | 'cold' | 'cool' | 'mild' | 'warm' | 'hot';
  lighting?: string;
  soundscape?: string;
  customNotes?: string;
}

export interface Scene {
  id: string;
  name: string;
  project_id: string;
  act_id: string;
  order: number;
  description?: string;
  script?: string;
  location?: string;
  created_at?: string;
  updated_at?: string;
  // Graph-related fields (from Hyper migration)
  content?: string;
  image_url?: string;
  image_prompt?: string;
  image_description?: string;
  audio_url?: string;
  message?: string;
  speaker?: string;
  speaker_type?: 'character' | 'narrator' | 'system';
  version?: number;
  metadata?: SceneMetadata;
}

export interface SceneCreateInput {
  name?: string;
  project_id: string;
  act_id: string;
  order?: number;
  description?: string;
  content?: string;
  image_url?: string;
  image_prompt?: string;
}

export interface SceneUpdateInput {
  name?: string;
  order?: number;
  description?: string;
  content?: string;
  script?: string;
  image_url?: string;
  image_prompt?: string;
  image_description?: string;
  audio_url?: string;
  message?: string;
  speaker?: string;
  speaker_type?: 'character' | 'narrator' | 'system';
  version?: number;
  metadata?: SceneMetadata;
}

