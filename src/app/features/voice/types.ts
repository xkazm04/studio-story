/**
 * Voice Feature — Script & Narration Types
 *
 * Types for script editing, narration pipeline, takes system,
 * and voice performance settings. Used by both the standalone
 * sound-lab and V2 workspace panels.
 */

// ============ Voice Settings ============

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  speed: number;
}

// ============ Script Line & Takes ============

export interface ScriptLineTake {
  id: string;
  emotion: string;
  delivery: string;
  intensity: number;
  audioUrl: string;
  duration: number;
  waveformData: number[];
  rating?: number;      // 1-5 stars, user-assigned
}

export interface ScriptLine {
  id: string;
  character: string;
  voiceId: string;
  text: string;
  emotion: string;
  delivery: string;
  audioUrl?: string;
  duration?: number;
  status: 'pending' | 'generating' | 'done' | 'error';
  error?: string;
  takes?: ScriptLineTake[];
  selectedTakeIdx?: number;  // index into takes[], -1 or undefined = use original
}

// ============ Narration Pipeline ============

export interface VoiceNarrationClip {
  id: string;
  name: string;
  audioUrl: string;
  duration: number;
  waveformData: number[];
  startTime: number;
  character: string;
  emotion: string;
}

export interface VoiceNarrationResult {
  clips: VoiceNarrationClip[];
  totalDuration: number;
}
