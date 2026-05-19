/**
 * React Query hooks for narration sessions and audio takes.
 *
 * Follows the same pattern as useBeats / useCharacters — thin wrappers
 * over apiFetch + useApiGet with mock-data support.
 */

import { apiFetch, useApiGet, USE_MOCK_DATA } from '../../utils/api';
import { useQuery } from '@tanstack/react-query';
import type {
  NarrationSession,
  NarrationSessionInsert,
  NarrationSessionUpdate,
  AudioTake,
  AudioTakeInsert,
  AudioTakeUpdate,
} from '../../types/NarrationSession';

const SESSIONS_URL = '/api/narration-sessions';
const TAKES_URL = '/api/audio-takes';

// ─── Mock data ──────────────────────────────────────────────

const MOCK_SESSIONS: NarrationSession[] = [];
const MOCK_TAKES: AudioTake[] = [];

// ─── Session hooks ──────────────────────────────────────────

export const narrationSessionApi = {
  useProjectSessions: (projectId: string | undefined, enabled = true) => {
    if (USE_MOCK_DATA) {
      return useQuery<NarrationSession[]>({
        queryKey: ['mock-narration-sessions', projectId],
        queryFn: async () =>
          MOCK_SESSIONS.filter((s) => s.project_id === projectId),
        enabled: enabled && !!projectId,
      });
    }
    const url = projectId ? `${SESSIONS_URL}?projectId=${projectId}` : '';
    return useApiGet<NarrationSession[]>(url, enabled && !!projectId);
  },

  useSceneSessions: (projectId: string | undefined, sceneId: string | undefined, enabled = true) => {
    if (USE_MOCK_DATA) {
      return useQuery<NarrationSession[]>({
        queryKey: ['mock-narration-sessions', projectId, sceneId],
        queryFn: async () =>
          MOCK_SESSIONS.filter((s) => s.project_id === projectId && s.scene_id === sceneId),
        enabled: enabled && !!projectId && !!sceneId,
      });
    }
    const url = projectId && sceneId
      ? `${SESSIONS_URL}?projectId=${projectId}&sceneId=${sceneId}`
      : '';
    return useApiGet<NarrationSession[]>(url, enabled && !!projectId && !!sceneId);
  },

  useSession: (id: string | undefined, enabled = true) => {
    if (USE_MOCK_DATA) {
      return useQuery<NarrationSession | null>({
        queryKey: ['mock-narration-session', id],
        queryFn: async () => MOCK_SESSIONS.find((s) => s.id === id) ?? null,
        enabled: enabled && !!id,
      });
    }
    const url = id ? `${SESSIONS_URL}/${id}` : '';
    return useApiGet<NarrationSession>(url, enabled && !!id);
  },

  createSession: async (data: NarrationSessionInsert): Promise<NarrationSession> => {
    if (USE_MOCK_DATA) {
      const session: NarrationSession = {
        id: `session-${Date.now()}`,
        project_id: data.project_id,
        scene_id: data.scene_id ?? null,
        name: data.name ?? 'Untitled Session',
        status: data.status ?? 'draft',
        voice_settings: data.voice_settings ?? {},
        script_lines: data.script_lines ?? [],
        placement: data.placement ?? null,
        total_duration: data.total_duration ?? 0,
        lines_total: data.lines_total ?? 0,
        lines_done: data.lines_done ?? 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      MOCK_SESSIONS.push(session);
      return session;
    }
    return apiFetch<NarrationSession>({ url: SESSIONS_URL, method: 'POST', body: data });
  },

  updateSession: async (id: string, data: NarrationSessionUpdate): Promise<NarrationSession> => {
    if (USE_MOCK_DATA) {
      const idx = MOCK_SESSIONS.findIndex((s) => s.id === id);
      if (idx >= 0) Object.assign(MOCK_SESSIONS[idx]!, data);
      return MOCK_SESSIONS[idx]!;
    }
    return apiFetch<NarrationSession>({ url: `${SESSIONS_URL}/${id}`, method: 'PUT', body: data });
  },

  deleteSession: async (id: string): Promise<void> => {
    if (USE_MOCK_DATA) {
      const idx = MOCK_SESSIONS.findIndex((s) => s.id === id);
      if (idx >= 0) MOCK_SESSIONS.splice(idx, 1);
      return;
    }
    await apiFetch<void>({ url: `${SESSIONS_URL}/${id}`, method: 'DELETE' });
  },
};

// ─── Audio Take hooks ───────────────────────────────────────

export const audioTakeApi = {
  useSessionTakes: (sessionId: string | undefined, enabled = true) => {
    if (USE_MOCK_DATA) {
      return useQuery<AudioTake[]>({
        queryKey: ['mock-audio-takes', sessionId],
        queryFn: async () =>
          MOCK_TAKES.filter((t) => t.session_id === sessionId),
        enabled: enabled && !!sessionId,
      });
    }
    const url = sessionId ? `${TAKES_URL}?sessionId=${sessionId}` : '';
    return useApiGet<AudioTake[]>(url, enabled && !!sessionId);
  },

  useLineTakes: (sessionId: string | undefined, lineId: string | undefined, enabled = true) => {
    if (USE_MOCK_DATA) {
      return useQuery<AudioTake[]>({
        queryKey: ['mock-audio-takes', sessionId, lineId],
        queryFn: async () =>
          MOCK_TAKES.filter((t) => t.session_id === sessionId && t.line_id === lineId),
        enabled: enabled && !!sessionId && !!lineId,
      });
    }
    const url = sessionId && lineId
      ? `${TAKES_URL}?sessionId=${sessionId}&lineId=${lineId}`
      : '';
    return useApiGet<AudioTake[]>(url, enabled && !!sessionId && !!lineId);
  },

  createTakes: async (takes: AudioTakeInsert | AudioTakeInsert[]): Promise<AudioTake[]> => {
    if (USE_MOCK_DATA) {
      const rows = Array.isArray(takes) ? takes : [takes];
      const created = rows.map((t) => ({
        id: `take-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        session_id: t.session_id,
        line_id: t.line_id,
        character: t.character,
        voice_id: t.voice_id,
        text: t.text,
        emotion: t.emotion ?? 'neutral',
        delivery: t.delivery ?? 'narration',
        intensity: t.intensity ?? 70,
        audio_url: t.audio_url,
        duration: t.duration,
        waveform_data: t.waveform_data ?? null,
        rating: t.rating ?? null,
        selected: t.selected ?? false,
        provider: t.provider ?? 'elevenlabs',
        cost_chars: t.cost_chars ?? t.text.length,
        created_at: new Date().toISOString(),
      }));
      MOCK_TAKES.push(...created);
      return created;
    }
    return apiFetch<AudioTake[]>({ url: TAKES_URL, method: 'POST', body: takes });
  },

  updateTake: async (id: string, data: AudioTakeUpdate): Promise<AudioTake> => {
    if (USE_MOCK_DATA) {
      const idx = MOCK_TAKES.findIndex((t) => t.id === id);
      if (idx >= 0) Object.assign(MOCK_TAKES[idx]!, data);
      return MOCK_TAKES[idx]!;
    }
    return apiFetch<AudioTake>({ url: `${TAKES_URL}/${id}`, method: 'PUT', body: data });
  },

  deleteTake: async (id: string): Promise<void> => {
    if (USE_MOCK_DATA) {
      const idx = MOCK_TAKES.findIndex((t) => t.id === id);
      if (idx >= 0) MOCK_TAKES.splice(idx, 1);
      return;
    }
    await apiFetch<void>({ url: `${TAKES_URL}/${id}`, method: 'DELETE' });
  },
};
