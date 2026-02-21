/**
 * Take Generator Hook — Multi-take TTS generation with progress
 *
 * V2-compatible version. Generates takes with different emotions
 * for A/B comparison in the takes gallery.
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { applyModifiers } from '../lib/voiceModifiers';
import { extractWaveformFromUrl } from '@/app/sound-lab/lib/waveformExtractor';
import type { VoiceSettings, ScriptLine, ScriptLineTake } from '../types';

interface TakeGenerationConfig {
  emotions: string[];
  delivery: string;
  intensity: number;
}

interface UseTakeGeneratorReturn {
  isGenerating: boolean;
  progress: { done: number; total: number };
  generateTakes: (
    line: ScriptLine,
    voiceSettings: VoiceSettings,
    config: TakeGenerationConfig
  ) => Promise<ScriptLineTake[]>;
  cancel: () => void;
}

export function useTakeGenerator(): UseTakeGeneratorReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const abortRef = useRef<AbortController | null>(null);

  const generateTakes = useCallback(async (
    line: ScriptLine,
    voiceSettings: VoiceSettings,
    config: TakeGenerationConfig
  ): Promise<ScriptLineTake[]> => {
    const controller = new AbortController();
    abortRef.current = controller;
    setIsGenerating(true);
    setProgress({ done: 0, total: config.emotions.length });

    const takes: ScriptLineTake[] = [];

    for (let i = 0; i < config.emotions.length; i++) {
      if (controller.signal.aborted) break;

      const emotion = config.emotions[i]!;
      const adjusted = applyModifiers(
        voiceSettings,
        emotion,
        config.delivery,
        config.intensity
      );

      try {
        const res = await fetch('/api/ai/audio/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: line.text,
            voice_id: line.voiceId,
            voice_settings: adjusted,
          }),
          signal: controller.signal,
        });

        const data = await res.json();
        if (!data.success) {
          setProgress({ done: i + 1, total: config.emotions.length });
          continue;
        }

        const audioUrl: string = data.audioUrl;
        const duration: number = data.duration ?? estimateDuration(line.text);

        // Extract real waveform from audio
        const waveformData = await extractWaveformFromUrl(audioUrl, 32);

        takes.push({
          id: `take-${Date.now()}-${i}`,
          emotion,
          delivery: config.delivery,
          intensity: config.intensity,
          audioUrl,
          duration,
          waveformData,
        });
      } catch (err) {
        if (controller.signal.aborted) break;
        // Skip failed takes silently
      }

      setProgress({ done: i + 1, total: config.emotions.length });
    }

    setIsGenerating(false);
    return takes;
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsGenerating(false);
  }, []);

  return {
    isGenerating,
    progress,
    generateTakes,
    cancel,
  };
}

function estimateDuration(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.max(1, words * 0.4);
}
