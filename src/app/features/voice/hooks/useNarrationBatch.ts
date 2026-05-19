/**
 * Narration Batch Hook — Sequential TTS generation for script lines
 *
 * V2-compatible version. Processes ScriptLines one at a time,
 * applies emotion/delivery modifiers, and computes auto-placement.
 * Supports multi-take generation (takesCount option) and progress tracking.
 *
 * Persistence: Creates a narration_session in Supabase at generation start
 * and saves each generated take to audio_takes, so work survives page refresh.
 */

import { useState, useRef, useCallback } from 'react';
import { applyModifiers } from '../lib/voiceModifiers';
import { extractData } from '@/app/utils/api';
import { narrationSessionApi, audioTakeApi } from '@/app/hooks/integration/useNarrationSessions';
import { useAudioProductionStore } from '@/app/store/slices/audioProductionSlice';
import type { VoiceSettings, ScriptLine, ScriptLineTake } from '../types';

interface AudioAssetLike {
  id: string;
  name: string;
  type: 'voice';
  duration: number;
  waveformData: number[];
  audioUrl?: string;
}

interface NarrationResultInternal {
  clips: Array<{ asset: AudioAssetLike; startTime: number }>;
  totalDuration: number;
}

export interface GenerateOptions {
  /** Number of takes to generate per line (default: 1) */
  takesCount?: number;
  /** Project ID for the TTS request */
  projectId?: string;
  /** Scene ID to associate with the narration session */
  sceneId?: string;
  /** Existing session ID to resume instead of creating new */
  sessionId?: string;
}

interface UseNarrationBatchReturn {
  lines: ScriptLine[];
  setLines: React.Dispatch<React.SetStateAction<ScriptLine[]>>;
  isGenerating: boolean;
  progress: { done: number; total: number; currentCharacter: string };
  generateAll: (baseSettings: VoiceSettings, options?: GenerateOptions) => Promise<void>;
  regenerateLine: (lineId: string, baseSettings: VoiceSettings) => Promise<void>;
  cancel: () => void;
  result: NarrationResultInternal | null;
  /** Active narration session ID (null if none created yet) */
  sessionId: string | null;
}

const GAP_SAME_CHARACTER = 0.5;
const GAP_CHAR_CHANGE = 1.5;

export function useNarrationBatch(): UseNarrationBatchReturn {
  const [lines, setLines] = useState<ScriptLine[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, currentCharacter: '' });
  const [result, setResult] = useState<NarrationResultInternal | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const store = useAudioProductionStore;

  const generateLine = async (
    line: ScriptLine,
    baseSettings: VoiceSettings,
    signal: AbortSignal,
    projectId?: string,
  ): Promise<{ audioUrl: string; duration: number }> => {
    const adjusted = applyModifiers(baseSettings, line.emotion, line.delivery, 70);

    const body: Record<string, unknown> = {
      text: line.text,
      voice_id: line.voiceId,
      voice_settings: adjusted,
    };
    if (projectId) body.project_id = projectId;

    const res = await fetch('/api/ai/audio/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });

    const data = extractData<{ success?: boolean; error?: string; audioUrl: string; duration?: number }>(await res.json());
    if (!data.success) {
      throw new Error(data.error || 'TTS generation failed');
    }

    return { audioUrl: data.audioUrl, duration: data.duration ?? estimateDuration(line.text) };
  };

  const computePlacement = useCallback((lines: ScriptLine[]): NarrationResultInternal => {
    let currentTime = 0;
    let prevCharacter = '';
    const clips: NarrationResultInternal['clips'] = [];

    for (const line of lines) {
      if (line.status !== 'done') continue;

      const selectedTake = (line.selectedTakeIdx != null && line.selectedTakeIdx >= 0 && line.takes)
        ? line.takes[line.selectedTakeIdx]
        : null;
      const audioUrl = selectedTake?.audioUrl ?? line.audioUrl;
      const duration = selectedTake?.duration ?? line.duration;
      const waveformData = selectedTake?.waveformData ?? generateSimpleWaveform(32);

      if (!audioUrl || !duration) continue;

      if (clips.length > 0) {
        currentTime += line.character !== prevCharacter ? GAP_CHAR_CHANGE : GAP_SAME_CHARACTER;
      }

      const asset: AudioAssetLike = {
        id: `narr-${line.id}`,
        name: `${line.character}: "${line.text.slice(0, 30)}..."`,
        type: 'voice',
        duration,
        waveformData,
        audioUrl,
      };

      clips.push({ asset, startTime: currentTime });
      currentTime += duration;
      prevCharacter = line.character;
    }

    return { clips, totalDuration: currentTime };
  }, []);

  const generateAll = useCallback(async (baseSettings: VoiceSettings, options?: GenerateOptions) => {
    const controller = new AbortController();
    abortRef.current = controller;
    setIsGenerating(true);

    const takesCount = options?.takesCount ?? 1;
    const total = lines.length;
    setProgress({ done: 0, total, currentCharacter: '' });

    setLines((prev) => prev.map((l) => ({ ...l, status: 'pending' as const, error: undefined })));

    // ── Persistence: create or resume a session ──
    let sid = options?.sessionId ?? null;
    if (!sid && options?.projectId) {
      try {
        const session = await narrationSessionApi.createSession({
          project_id: options.projectId,
          scene_id: options.sceneId ?? null,
          name: options.sceneId ? `Scene narration` : 'Ad-hoc narration',
          status: 'generating',
          voice_settings: baseSettings as unknown as Record<string, unknown>,
          script_lines: lines.map((l) => ({
            id: l.id, character: l.character, voiceId: l.voiceId,
            text: l.text, emotion: l.emotion, delivery: l.delivery, status: 'pending' as const,
          })),
          lines_total: total,
          lines_done: 0,
        });
        sid = session.id;
        setSessionId(sid);
        store.getState().setActiveSession(sid, options.projectId, options.sceneId);
        store.getState().setGenerationProgress(true, 0);
      } catch {
        // Persistence is best-effort — don't block generation
      }
    }

    let done = 0;

    for (let i = 0; i < lines.length; i++) {
      if (controller.signal.aborted) break;

      const line = lines[i]!;

      setProgress((prev) => ({ ...prev, currentCharacter: line.character }));
      setLines((prev) => prev.map((l, idx) =>
        idx === i ? { ...l, status: 'generating' as const } : l
      ));

      try {
        if (takesCount > 1) {
          // Generate multiple takes per line
          const takes: ScriptLineTake[] = [];

          for (let t = 0; t < takesCount; t++) {
            if (controller.signal.aborted) break;
            const { audioUrl, duration } = await generateLine(line, baseSettings, controller.signal, options?.projectId);
            takes.push({
              id: `${line.id}-take-${t + 1}`,
              emotion: line.emotion,
              delivery: line.delivery,
              intensity: 70,
              audioUrl,
              duration,
              waveformData: generateSimpleWaveform(32),
            });
          }

          // ── Persist takes to Supabase ──
          if (sid && takes.length > 0) {
            try {
              await audioTakeApi.createTakes(takes.map((tk, t) => ({
                session_id: sid!,
                line_id: line.id,
                character: line.character,
                voice_id: line.voiceId,
                text: line.text,
                emotion: tk.emotion,
                delivery: tk.delivery,
                intensity: tk.intensity,
                audio_url: tk.audioUrl,
                duration: tk.duration,
                waveform_data: tk.waveformData,
                selected: t === 0,
                cost_chars: line.text.length,
              })));
            } catch { /* best-effort */ }
          }

          const firstTake = takes[0];
          setLines((prev) => prev.map((l, idx) =>
            idx === i ? {
              ...l,
              status: 'done' as const,
              takes,
              selectedTakeIdx: 0,
              audioUrl: firstTake?.audioUrl,
              duration: firstTake?.duration,
            } : l
          ));
        } else {
          // Single take (default)
          const { audioUrl, duration } = await generateLine(line, baseSettings, controller.signal, options?.projectId);

          // ── Persist single take ──
          if (sid) {
            try {
              await audioTakeApi.createTakes({
                session_id: sid,
                line_id: line.id,
                character: line.character,
                voice_id: line.voiceId,
                text: line.text,
                emotion: line.emotion,
                delivery: line.delivery,
                intensity: 70,
                audio_url: audioUrl,
                duration,
                selected: true,
                cost_chars: line.text.length,
              });
            } catch { /* best-effort */ }
          }

          setLines((prev) => prev.map((l, idx) =>
            idx === i ? { ...l, status: 'done' as const, audioUrl, duration } : l
          ));
        }

        done++;
        setProgress({ done, total, currentCharacter: line.character });

        // ── Update session progress ──
        if (sid) {
          store.getState().setGenerationProgress(true, i);
          narrationSessionApi.updateSession(sid, { lines_done: done }).catch(() => {});
        }
      } catch (err) {
        if (controller.signal.aborted) break;

        setLines((prev) => prev.map((l, idx) =>
          idx === i ? {
            ...l,
            status: 'error' as const,
            error: err instanceof Error ? err.message : 'Failed',
          } : l
        ));
      }
    }

    setIsGenerating(false);

    setLines((prev) => {
      const placement = computePlacement(prev);
      setResult(placement);

      // ── Finalize session ──
      if (sid) {
        const doneCount = prev.filter((l) => l.status === 'done').length;
        const finalStatus = doneCount === prev.length ? 'complete' : 'partial';
        narrationSessionApi.updateSession(sid, {
          status: finalStatus,
          lines_done: doneCount,
          total_duration: placement.totalDuration,
          script_lines: prev.map((l) => ({
            id: l.id, character: l.character, voiceId: l.voiceId,
            text: l.text, emotion: l.emotion, delivery: l.delivery,
            status: l.status, audioUrl: l.audioUrl, duration: l.duration,
          })),
        }).catch(() => {});
        store.getState().setGenerationProgress(false, -1);
      }

      return prev;
    });
  }, [lines, computePlacement, store]);

  const regenerateLine = useCallback(async (lineId: string, baseSettings: VoiceSettings) => {
    const line = lines.find((l) => l.id === lineId);
    if (!line) return;

    setLines((prev) => prev.map((l) =>
      l.id === lineId ? { ...l, status: 'generating' as const, error: undefined } : l
    ));

    try {
      const controller = new AbortController();
      const { audioUrl, duration } = await generateLine(line, baseSettings, controller.signal);

      setLines((prev) => {
        const updated = prev.map((l) =>
          l.id === lineId ? { ...l, status: 'done' as const, audioUrl, duration } : l
        );
        const placement = computePlacement(updated);
        setResult(placement);
        return updated;
      });
    } catch (err) {
      setLines((prev) => prev.map((l) =>
        l.id === lineId ? {
          ...l,
          status: 'error' as const,
          error: err instanceof Error ? err.message : 'Failed',
        } : l
      ));
    }
  }, [lines, computePlacement]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsGenerating(false);
  }, []);

  return {
    lines,
    setLines,
    isGenerating,
    progress,
    generateAll,
    regenerateLine,
    cancel,
    result,
    sessionId,
  };
}

function estimateDuration(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.max(1, words * 0.4);
}

function generateSimpleWaveform(length: number): number[] {
  return Array.from({ length }, (_, i) => {
    const t = i / length;
    return Math.max(0.1, Math.min(1, 0.5 + Math.sin(t * Math.PI * 3) * 0.3 + (Math.random() - 0.5) * 0.3));
  });
}
