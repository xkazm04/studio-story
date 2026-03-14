/**
 * Narration Export Hook — Stitch selected takes into final MP3 for download.
 *
 * Uses audioStitcher from Plan 02 to concatenate audio segments with
 * appropriate silence gaps between character transitions.
 * Supports individual clip download, batch download, and full MP3 export.
 */

import { useState, useCallback } from 'react';
import { stitchAudioSegments, computeGaps } from '../lib/audioStitcher';
import type { VoiceNarrationResult, VoiceNarrationClip, ScriptLine } from '../types';

interface UseNarrationExportReturn {
  isExporting: boolean;
  downloadClip: (clip: VoiceNarrationClip, filename?: string) => Promise<void>;
  downloadAll: (result: VoiceNarrationResult) => Promise<void>;
  copyUrls: (result: VoiceNarrationResult) => Promise<void>;
  exportMp3: (lines: ScriptLine[], filename?: string) => Promise<string | null>;
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

  /**
   * Export all selected takes as a single stitched MP3 file.
   * Fetches audio buffers, computes gaps, stitches them, and triggers download.
   * Returns the blob URL on success, or null on failure.
   */
  const exportMp3 = useCallback(async (lines: ScriptLine[], filename?: string): Promise<string | null> => {
    setIsExporting(true);

    try {
      // Filter to only completed lines with audio
      const completedLines = lines.filter((l) => l.status === 'done');
      if (completedLines.length === 0) return null;

      // Fetch audio buffers for selected takes
      const audioBuffers: ArrayBuffer[] = [];
      for (const line of completedLines) {
        const selectedTake = (line.selectedTakeIdx != null && line.selectedTakeIdx >= 0 && line.takes)
          ? line.takes[line.selectedTakeIdx]
          : null;
        const audioUrl = selectedTake?.audioUrl ?? line.audioUrl;

        if (!audioUrl) continue;

        const res = await fetch(audioUrl);
        const buffer = await res.arrayBuffer();
        audioBuffers.push(buffer);
      }

      if (audioBuffers.length === 0) return null;

      // Compute silence gaps between segments
      const gaps = computeGaps(completedLines);

      // Build segments for stitcher
      const segments = audioBuffers.map((audioBuffer, i) => ({
        audioBuffer,
        gapAfterMs: gaps[i] ?? 0,
      }));

      // Stitch all segments with gaps
      const stitchedBuffer = stitchAudioSegments(segments);

      // Create blob and trigger download
      const blob = new Blob([stitchedBuffer], { type: 'audio/mpeg' });
      const outputFilename = filename ?? `narration-export-${Date.now()}.mp3`;
      downloadBlob(blob, outputFilename);

      return URL.createObjectURL(blob);
    } catch {
      return null;
    } finally {
      setIsExporting(false);
    }
  }, [downloadBlob]);

  return {
    isExporting,
    downloadClip,
    downloadAll,
    copyUrls,
    exportMp3,
  };
}
