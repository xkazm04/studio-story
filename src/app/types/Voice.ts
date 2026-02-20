/**
 * Voice Types
 *
 * Type definitions for voice management and TTS integration
 */

export interface Voice {
  id: string;
  voice_id: string; // External TTS provider voice ID (e.g., ElevenLabs)
  name: string;
  description?: string | null;
  project_id: string;
  character_id?: string | null;
  provider?: 'elevenlabs' | 'openai' | 'custom';
  language?: string;
  gender?: 'male' | 'female' | 'neutral';
  age_range?: string;
  audio_sample_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VoiceConfig {
  voice_id: string;
  stability: number; // 0-1, higher = more stable/consistent
  similarity_boost: number; // 0-1, higher = closer to original voice
  style: number; // 0-1, higher = more expressive
  speed: number; // Speaking rate, typically 0.5-2.0, 1.0 = normal
  use_speaker_boost?: boolean;
}

export interface VoiceInsert extends Omit<Voice, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VoiceUpdate extends Partial<Omit<Voice, 'id' | 'created_at' | 'updated_at'>> {}

export interface AudioSample {
  id: string;
  voice_id: string;
  file_path: string;
  file_name: string;
  duration?: number;
  size?: number;
  transcription?: string | null;
  created_at: string;
}

export interface AudioSampleInsert extends Omit<AudioSample, 'id' | 'created_at'> {
  id?: string;
  created_at?: string;
}

/**
 * Voice training data for creating new voices
 */
export interface VoiceTrainingData {
  name: string;
  description?: string;
  audio_files: File[];
  labels?: string[]; // Labels for each audio file
}

/**
 * YouTube audio extraction data
 */
export interface YouTubeAudioExtraction {
  url: string;
  start_time?: number;
  end_time?: number;
  video_title?: string;
}
