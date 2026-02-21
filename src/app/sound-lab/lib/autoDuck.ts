/**
 * Auto-Duck Engine — compute gain automation from voice→music ducking
 *
 * Analyzes voice clip positions and generates automation points on music clips
 * to duck (lower volume) when voice is active.
 */

import type { TimelineClip, AutomationPoint, DuckingConfig } from '../types';

interface TimeRange {
  start: number;
  end: number;
}

/**
 * Merge overlapping/adjacent voice clip ranges into continuous regions.
 */
function mergeRanges(clips: TimelineClip[]): TimeRange[] {
  if (clips.length === 0) return [];

  const sorted = [...clips]
    .map((c) => ({ start: c.startTime, end: c.startTime + c.duration }))
    .sort((a, b) => a.start - b.start);

  const merged: TimeRange[] = [sorted[0]!];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]!;
    const last = merged[merged.length - 1]!;

    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}

/**
 * Compute ducking automation points for music clips based on voice activity.
 *
 * @returns Map of musicClipId → AutomationPoint[] to apply to each music clip
 */
export function computeDuckingAutomation(
  voiceClips: TimelineClip[],
  musicClips: TimelineClip[],
  config: DuckingConfig
): Map<string, AutomationPoint[]> {
  const result = new Map<string, AutomationPoint[]>();

  if (!config.enabled || voiceClips.length === 0) return result;

  // Build merged voice activity timeline
  const voiceRegions = mergeRanges(voiceClips);

  for (const music of musicClips) {
    const musicStart = music.startTime;
    const musicEnd = music.startTime + music.duration;
    const points: AutomationPoint[] = [];

    // Start at full gain
    points.push({ time: 0, value: 1.0 });

    for (const region of voiceRegions) {
      // Skip voice regions entirely outside this music clip
      if (region.end <= musicStart || region.start >= musicEnd) continue;

      // Compute times relative to clip start
      const duckStartAbs = Math.max(region.start - config.attack, musicStart);
      const duckEndAbs = Math.min(region.end + config.release, musicEnd);
      const voiceStartAbs = Math.max(region.start, musicStart);
      const voiceEndAbs = Math.min(region.end, musicEnd);

      const duckStartRel = duckStartAbs - musicStart;
      const voiceStartRel = voiceStartAbs - musicStart;
      const voiceEndRel = voiceEndAbs - musicStart;
      const duckEndRel = duckEndAbs - musicStart;

      // Ramp down (attack)
      if (duckStartRel < voiceStartRel) {
        points.push({ time: duckStartRel, value: 1.0 });
      }
      points.push({ time: voiceStartRel, value: config.amount });

      // Hold at ducked level
      points.push({ time: voiceEndRel, value: config.amount });

      // Ramp back up (release)
      points.push({ time: duckEndRel, value: 1.0 });
    }

    // End at full gain
    const lastTime = music.duration;
    const lastPoint = points[points.length - 1];
    if (lastPoint && lastPoint.time < lastTime) {
      points.push({ time: lastTime, value: 1.0 });
    }

    // Deduplicate and clean up points with same timestamp
    const cleaned = deduplicatePoints(points);

    if (cleaned.length > 2) {
      // Only add if there's actual ducking (more than just start/end at 1.0)
      result.set(music.id, cleaned);
    }
  }

  return result;
}

/**
 * Remove duplicate/overlapping points at same time,
 * keeping the last value for each timestamp.
 */
function deduplicatePoints(points: AutomationPoint[]): AutomationPoint[] {
  const sorted = [...points].sort((a, b) => a.time - b.time);
  const result: AutomationPoint[] = [];

  for (const p of sorted) {
    const last = result[result.length - 1];
    if (last && Math.abs(last.time - p.time) < 0.001) {
      // Same time — keep latest value
      last.value = p.value;
    } else {
      result.push({ ...p });
    }
  }

  return result;
}

/** Default ducking config */
export const DEFAULT_DUCKING_CONFIG: DuckingConfig = {
  enabled: false,
  amount: 0.25,   // -12dB
  attack: 0.2,
  release: 0.3,
  sourceLane: 'voice',
  targetLane: 'music',
};
