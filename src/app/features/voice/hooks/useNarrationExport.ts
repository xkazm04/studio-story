/**
 * Narration Export Hook — Download narration audio from V2 panels.
 *
 * Provides export options independent of the standalone DAW:
 * - Download individual clips as WAV files
 * - Download all clips as a ZIP archive
 * - Copy audio URLs for manual import
 */

import { useState, useCallback } from 'react';
import type { VoiceNarrationResult, VoiceNarrationClip } from '../types';

interface UseNarrationExportReturn {
  isExporting: boolean;
  downloadClip: (clip: VoiceNarrationClip, filename?: string) => Promise<void>;
  downloadAll: (result: VoiceNarrationResult) => Promise<void>;
  copyUrls: (result: VoiceNarrationResult) => Promise<void>;
}

export function useNarrationExport(): UseNarrationExportReturn {
  const [isExporting, setIsExporting] = useState(false);

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const downloadClip = useCallback(async (clip: VoiceNarrationClip, filename?: string) => {
    setIsExporting(true);
    try {
      const res = await fetch(clip.audioUrl);
      const blob = await res.blob();
      const name = filename ?? `${clip.character}-${clip.emotion}-${clip.id}.wav`;
      downloadBlob(blob, name);
    } finally {
      setIsExporting(false);
    }
  }, [downloadBlob]);

  const downloadAll = useCallback(async (result: VoiceNarrationResult) => {
    if (!result.clips.length) return;
    setIsExporting(true);

    try {
      // Download clips sequentially to avoid overwhelming the browser
      for (let i = 0; i < result.clips.length; i++) {
        const clip = result.clips[i]!;
        const paddedIndex = String(i + 1).padStart(2, '0');
        const safeName = clip.character.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `${paddedIndex}_${safeName}_${clip.emotion}.wav`;
        const res = await fetch(clip.audioUrl);
        const blob = await res.blob();
        downloadBlob(blob, filename);

        // Brief pause between downloads to let browser process
        if (i < result.clips.length - 1) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }
    } finally {
      setIsExporting(false);
    }
  }, [downloadBlob]);

  const copyUrls = useCallback(async (result: VoiceNarrationResult) => {
    const urls = result.clips
      .map((clip, i) => `${i + 1}. ${clip.character} (${clip.emotion}): ${clip.audioUrl}`)
      .join('\n');

    await navigator.clipboard.writeText(urls);
  }, []);

  return {
    isExporting,
    downloadClip,
    downloadAll,
    copyUrls,
  };
}
