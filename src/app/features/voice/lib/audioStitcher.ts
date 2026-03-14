/**
 * Audio Stitcher — MP3 segment concatenation with silence gaps
 *
 * Concatenates MP3 audio buffers with configurable silence gaps
 * between segments. Used by the narration export pipeline.
 */

import type { ScriptLine } from '../types';

// ── Constants ────────────────────────────────────────────────────────────────

/** Silence gap (ms) between lines spoken by the same character */
export const GAP_SAME_CHARACTER = 500;

/** Silence gap (ms) between lines spoken by different characters */
export const GAP_CHAR_CHANGE = 1500;

// ── Gap Computation ──────────────────────────────────────────────────────────

/**
 * Compute the silence gap (in ms) after each script line.
 *
 * - Same character on next line: GAP_SAME_CHARACTER (500ms)
 * - Different character on next line: GAP_CHAR_CHANGE (1500ms)
 * - Last line: 0ms
 */
export function computeGaps(lines: ScriptLine[]): number[] {
  return lines.map((line, i) => {
    if (i === lines.length - 1) return 0;
    const nextLine = lines[i + 1];
    return nextLine.character === line.character
      ? GAP_SAME_CHARACTER
      : GAP_CHAR_CHANGE;
  });
}

// ── Audio Stitching ──────────────────────────────────────────────────────────

interface AudioSegment {
  audioBuffer: ArrayBuffer;
  gapAfterMs: number;
}

/**
 * Generate a silence buffer of the given duration.
 *
 * For MP3 at 128kbps / 44100Hz, each second of audio is approximately
 * 16KB (128000 bits/s / 8 = 16000 bytes/s). We use zero-filled buffers
 * as silence padding between MP3 segments.
 */
function generateSilence(durationMs: number): ArrayBuffer {
  const bytesPerSecond = 16384; // ~128kbps MP3
  const bytes = Math.round((durationMs / 1000) * bytesPerSecond);
  return new ArrayBuffer(bytes);
}

/**
 * Concatenate MP3 audio segments with silence gaps between them.
 *
 * Each segment includes the audio buffer and a gap duration (ms) to
 * insert after it. The last segment's gap is typically 0.
 *
 * Returns a single ArrayBuffer containing all segments and silence.
 */
export function stitchAudioSegments(segments: AudioSegment[]): ArrayBuffer {
  if (segments.length === 0) return new ArrayBuffer(0);

  // Calculate total size
  let totalSize = 0;
  const parts: ArrayBuffer[] = [];

  for (const segment of segments) {
    parts.push(segment.audioBuffer);
    totalSize += segment.audioBuffer.byteLength;

    if (segment.gapAfterMs > 0) {
      const silence = generateSilence(segment.gapAfterMs);
      parts.push(silence);
      totalSize += silence.byteLength;
    }
  }

  // Concatenate all parts into a single buffer
  const result = new ArrayBuffer(totalSize);
  const view = new Uint8Array(result);
  let offset = 0;

  for (const part of parts) {
    view.set(new Uint8Array(part), offset);
    offset += part.byteLength;
  }

  return result;
}
