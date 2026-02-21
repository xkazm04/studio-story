/**
 * Narration Batch Hook — Sequential TTS generation for script lines
 *
 * V2-compatible version. Processes ScriptLines one at a time,
 * applies emotion/delivery modifiers, and computes auto-placement.
 */

import { useState, useRef, useCallback } from 'react';
import { applyModifiers } from '../lib/voiceModifiers';
import type { VoiceSettings, ScriptLine } from '../types';

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

interface UseNarrationBatchReturn {
  lines: ScriptLine[];
  setLines: React.Dispatch<React.SetStateAction<ScriptLine[]>>;
  isGenerating: boolean;
  progress: { done: number; total: number };
  generateAll: (baseSettings: VoiceSettings) => Promise<void>;
  regenerateLine: (lineId: string, baseSettings: VoiceSettings) => Promise<void>;
  cancel: () => void;
  result: NarrationResultInternal | null;
}

const GAP_SAME_CHARACTER = 0.5;
const GAP_CHAR_CHANGE = 1.5;

export function useNarrationBatch(): UseNarrationBatchReturn {
  const [lines, setLines] = useState<ScriptLine[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<NarrationResultInternal | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generateLine = async (
    line: ScriptLine,
    baseSettings: VoiceSettings,
    signal: AbortSignal,
  ): Promise<{ audioUrl: string; duration: number }> => {
    const adjusted = applyModifiers(baseSettings, line.emotion, line.delivery, 70);

    const res = await fetch('/api/ai/audio/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: line.text,
        voice_id: line.voiceId,
        voice_settings: adjusted,
      }),
      signal,
    });

    const data = await res.json();
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

  const generateAll = useCallback(async (baseSettings: VoiceSettings) => {
    const controller = new AbortController();
    abortRef.current = controller;
    setIsGenerating(true);

    const total = lines.filter((l) => l.status !== 'done').length || lines.length;
    setProgress({ done: 0, total });

    setLines((prev) => prev.map((l) => ({ ...l, status: 'pending' as const, error: undefined })));

    let done = 0;

    for (let i = 0; i < lines.length; i++) {
      if (controller.signal.aborted) break;

      const line = lines[i]!;

      setLines((prev) => prev.map((l, idx) =>
        idx === i ? { ...l, status: 'generating' as const } : l
      ));

      try {
        const { audioUrl, duration } = await generateLine(line, baseSettings, controller.signal);

        setLines((prev) => prev.map((l, idx) =>
          idx === i ? { ...l, status: 'done' as const, audioUrl, duration } : l
        ));

        done++;
        setProgress({ done, total });
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
      return prev;
    });
  }, [lines, computePlacement]);

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
