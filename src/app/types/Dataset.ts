/**
 * Dataset Types
 *
 * Type definitions for managing datasets (image, audio, character extractions)
 */

export interface Dataset {
  id: string;
  project_id: string;
  name: string;
  description?: string | null;
  type: 'image' | 'audio' | 'character' | 'mixed';
  created_at: string;
  updated_at: string;
}

export interface DatasetInsert extends Omit<Dataset, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DatasetUpdate extends Partial<Omit<Dataset, 'id' | 'created_at' | 'updated_at'>> {}

// =====================================================
// IMAGE DATASETS
// =====================================================

export interface DatasetImage {
  id: string;
  dataset_id: string;
  image_url: string;
  internal_id?: string; // Reference to generated image ID
  thumbnail_url?: string | null;
  tags?: string[];
  description?: string | null;
  prompt?: string | null;
  width?: number;
  height?: number;
  created_at: string;
}

export interface DatasetImageInsert extends Omit<DatasetImage, 'id' | 'created_at'> {
  id?: string;
  created_at?: string;
}

// =====================================================
// AUDIO TRANSCRIPTION
// =====================================================

export interface AudioTranscription {
  id: string;
  audio_file_url: string;
  filename: string;
  transcription_text: string;
  language?: string;
  confidence?: number;
  engine: 'whisper' | 'elevenlabs' | 'assembly' | 'other';
  duration?: number;
  word_count?: number;
  segments?: TranscriptionSegment[];
  created_at: string;
}

export interface TranscriptionSegment {
  text: string;
  start: number; // Timestamp in seconds
  end: number;
  speaker_id?: string;
  confidence?: number;
}

export interface AudioTranscriptionInsert extends Omit<AudioTranscription, 'id' | 'created_at'> {
  id?: string;
  created_at?: string;
}

// =====================================================
// CHARACTER EXTRACTION
// =====================================================

export interface CharacterExtraction {
  id: string;
  audio_transcription_id?: string;
  personality_analysis: string;
  traits?: string[];
  speaking_style?: string;
  emotional_range?: string;
  extracted_quotes?: string[];
  confidence_score?: number;
  created_at: string;
}

export interface CharacterExtractionInsert extends Omit<CharacterExtraction, 'id' | 'created_at'> {
  id?: string;
  created_at?: string;
}

// =====================================================
// YOUTUBE AUDIO EXTRACTION
// =====================================================

export interface YouTubeExtraction {
  id: string;
  youtube_url: string;
  video_title?: string;
  video_duration?: number;
  sample_length: number; // Length of each sample in minutes
  samples_generated: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface YouTubeExtractionInsert extends Omit<YouTubeExtraction, 'id' | 'created_at' | 'completed_at'> {
  id?: string;
  created_at?: string;
}

export interface YouTubeSample {
  id: string;
  extraction_id: string;
  sample_number: number;
  audio_url: string;
  start_time: number;
  end_time: number;
  duration: number;
  file_size?: number;
  created_at: string;
}

// =====================================================
// REQUEST/RESPONSE TYPES
// =====================================================

export interface TranscriptionRequest {
  audioFiles: File[];
  engine?: 'whisper' | 'elevenlabs';
  model?: string;
  language?: string;
}

export interface TranscriptionResponse {
  individual_results: {
    filename: string;
    transcription: {
      text: string;
      language_probability?: number;
      words?: Array<{
        text?: string;
        word?: string;
        start?: number;
        end?: number;
        type?: string;
      }>;
      segments?: TranscriptionSegment[];
    };
  }[];
  combined_text?: string;
  engine: string;
}

export interface WhisperTranscriptionResponse {
  filename: string;
  text: string;
  segments?: Array<{
    text: string;
    start: number;
    end: number;
  }>;
  transcription?: {
    text: string;
    words?: Array<{
      text: string;
      start: number;
      end: number;
    }>;
  };
}

export interface PersonalityExtractionRequest {
  transcriptionText: string;
  additionalContext?: string;
}

export interface PersonalityExtractionResponse {
  personality: string;
  traits: string[];
  speaking_style: string;
  emotional_range: string;
  extracted_quotes: string[];
  confidence_score: number;
}
