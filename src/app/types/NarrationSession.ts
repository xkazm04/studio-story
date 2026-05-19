/**
 * Narration Session & Audio Take Types
 *
 * Persistence types for TTS audio production. Mirrors the narration_sessions
 * and audio_takes Supabase tables so generated audio survives page refreshes.
 */

export type NarrationSessionStatus = 'draft' | 'generating' | 'partial' | 'complete' | 'exported';

export interface NarrationSession {
  id: string;
  project_id: string;
  scene_id?: string | null;
  name: string;
  status: NarrationSessionStatus;
  voice_settings: Record<string, unknown>;
  script_lines: ScriptLineSnapshot[];
  placement?: NarrationPlacement | null;
  total_duration: number;
  lines_total: number;
  lines_done: number;
  created_at: string;
  updated_at: string;
}

/** Minimal snapshot of a ScriptLine saved alongside the session */
export interface ScriptLineSnapshot {
  id: string;
  character: string;
  voiceId: string;
  text: string;
  emotion: string;
  delivery: string;
  status: 'pending' | 'generating' | 'done' | 'error';
  audioUrl?: string;
  duration?: number;
  selectedTakeId?: string;
  error?: string;
}

export interface NarrationPlacement {
  clips: Array<{
    lineId: string;
    startTime: number;
    duration: number;
    audioUrl: string;
  }>;
  totalDuration: number;
}

export interface NarrationSessionInsert {
  project_id: string;
  scene_id?: string | null;
  name?: string;
  status?: NarrationSessionStatus;
  voice_settings?: Record<string, unknown>;
  script_lines?: ScriptLineSnapshot[];
  placement?: NarrationPlacement | null;
  total_duration?: number;
  lines_total?: number;
  lines_done?: number;
}

export interface NarrationSessionUpdate extends Partial<Omit<NarrationSession, 'id' | 'created_at'>> {}

// ─── Audio Takes ────────────────────────────────────────────

export interface AudioTake {
  id: string;
  session_id: string;
  line_id: string;
  character: string;
  voice_id: string;
  text: string;
  emotion: string;
  delivery: string;
  intensity: number;
  audio_url: string;
  duration: number;
  waveform_data?: number[] | null;
  rating?: number | null;
  selected: boolean;
  provider: string;
  cost_chars: number;
  created_at: string;
}

export interface AudioTakeInsert {
  session_id: string;
  line_id: string;
  character: string;
  voice_id: string;
  text: string;
  emotion?: string;
  delivery?: string;
  intensity?: number;
  audio_url: string;
  duration: number;
  waveform_data?: number[] | null;
  rating?: number | null;
  selected?: boolean;
  provider?: string;
  cost_chars?: number;
}

export interface AudioTakeUpdate {
  rating?: number | null;
  selected?: boolean;
}
