/**
 * useVoiceCloning — Audio upload and YouTube URL -> ElevenLabs clone orchestration
 *
 * Supports two cloning paths:
 * 1. Direct audio upload: upload file to Supabase Storage, then clone via ElevenLabs
 * 2. YouTube URL: extract audio via /api/datasets/audio/extract, then clone via ElevenLabs
 */

import { useState, useCallback } from 'react';
import { extractData } from '@/app/utils/api';

export type VoiceCloningStatus = 'idle' | 'uploading' | 'extracting' | 'cloning' | 'done' | 'error';

interface UseVoiceCloningReturn {
  cloneFromAudio: (audioFile: File, voiceName: string) => Promise<string | null>;
  cloneFromYouTube: (youtubeUrl: string, voiceName: string, projectId?: string) => Promise<string | null>;
  status: VoiceCloningStatus;
  error: string | null;
}

export function useVoiceCloning(): UseVoiceCloningReturn {
  const [status, setStatus] = useState<VoiceCloningStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const cloneFromAudio = useCallback(async (audioFile: File, voiceName: string): Promise<string | null> => {
    setStatus('uploading');
    setError(null);

    try {
      // Upload audio file to Supabase Storage via API
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('bucket', 'voice-samples');

      const uploadRes = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = extractData<{ url?: string; error?: string }>(await uploadRes.json());
      if (!uploadData.url) {
        throw new Error(uploadData.error || 'Failed to upload audio file');
      }

      // Clone voice via ElevenLabs
      setStatus('cloning');
      const cloneRes = await fetch('/api/ai/audio/clone-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: voiceName,
          audioUrl: uploadData.url,
        }),
      });

      const cloneData = extractData<{ voice_id?: string; error?: string }>(await cloneRes.json());
      if (!cloneData.voice_id) {
        throw new Error(cloneData.error || 'Failed to clone voice');
      }

      setStatus('done');
      return cloneData.voice_id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Voice cloning failed';
      setError(message);
      setStatus('error');
      return null;
    }
  }, []);

  const cloneFromYouTube = useCallback(async (
    youtubeUrl: string,
    voiceName: string,
    projectId?: string,
  ): Promise<string | null> => {
    setStatus('extracting');
    setError(null);

    try {
      // Extract audio from YouTube via cobalt API
      const extractRes = await fetch('/api/datasets/audio/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: youtubeUrl,
          sampleLength: 1,
          projectId: projectId || undefined,
        }),
      });

      const extractResult = extractData<{ samples?: Array<{ url: string }>; error?: string }>(await extractRes.json());
      if (!extractResult.samples || extractResult.samples.length === 0) {
        throw new Error(extractResult.error || 'Failed to extract audio from YouTube');
      }

      const sampleUrl = extractResult.samples[0].url;

      // Clone voice via ElevenLabs
      setStatus('cloning');
      const cloneRes = await fetch('/api/ai/audio/clone-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: voiceName,
          audioUrl: sampleUrl,
        }),
      });

      const cloneData = extractData<{ voice_id?: string; error?: string }>(await cloneRes.json());
      if (!cloneData.voice_id) {
        throw new Error(cloneData.error || 'Failed to clone voice');
      }

      setStatus('done');
      return cloneData.voice_id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Voice cloning failed';
      setError(message);
      setStatus('error');
      return null;
    }
  }, []);

  return {
    cloneFromAudio,
    cloneFromYouTube,
    status,
    error,
  };
}
