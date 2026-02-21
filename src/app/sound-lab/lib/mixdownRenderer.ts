/**
 * Mixdown Renderer — OfflineAudioContext-based timeline rendering
 *
 * Renders the entire timeline to a single AudioBuffer for WAV export.
 * Reuses the AudioEngine's buffer cache for efficiency.
 */

import type { AudioAssetType, TimelineClip } from '../types';
import type { AudioEngine } from './audioEngine';

interface LaneGroup {
  type: AudioAssetType;
  collapsed: boolean;
  muted: boolean;
  clips: TimelineClip[];
}

export interface MixdownOptions {
  groups: LaneGroup[];
  totalDuration: number;
  sampleRate?: number;                // default 44100
  channels?: number;                  // default 2 (stereo)
  soloLanes?: Set<AudioAssetType>;   // Only render these lanes (empty/undefined = all non-muted)
  onProgress?: (pct: number) => void;
}

const LANE_ORDER: AudioAssetType[] = ['voice', 'music', 'sfx', 'ambience'];

/**
 * Render the timeline to an AudioBuffer using OfflineAudioContext.
 * The audioEngine parameter provides the decoded buffer cache.
 */
export async function renderMixdown(
  audioEngine: AudioEngine,
  options: MixdownOptions
): Promise<AudioBuffer> {
  const {
    groups,
    totalDuration,
    sampleRate = 44100,
    channels = 2,
    soloLanes,
    onProgress,
  } = options;

  const totalSamples = Math.ceil(totalDuration * sampleRate);
  const offlineCtx = new OfflineAudioContext(channels, totalSamples, sampleRate);

  // Master gain
  const masterGain = offlineCtx.createGain();
  masterGain.connect(offlineCtx.destination);

  // Per-lane gain nodes
  const laneGains = new Map<AudioAssetType, GainNode>();
  for (const lane of LANE_ORDER) {
    const gain = offlineCtx.createGain();
    gain.connect(masterGain);
    laneGains.set(lane, gain);
  }

  // Apply mute/solo logic
  for (const group of groups) {
    const laneGain = laneGains.get(group.type);
    if (!laneGain) continue;

    let muted = group.muted;
    if (soloLanes && soloLanes.size > 0) {
      muted = !soloLanes.has(group.type);
    }
    laneGain.gain.value = muted ? 0 : 1;
  }

  // Collect all clips to schedule
  const allClips: TimelineClip[] = [];
  for (const group of groups) {
    for (const clip of group.clips) {
      if (clip.audioUrl) {
        allClips.push(clip);
      }
    }
  }

  let scheduled = 0;

  // Schedule clips
  for (const clip of allClips) {
    if (!clip.audioUrl) continue;

    // Try to get from engine cache, otherwise decode fresh
    let buffer = audioEngine.getBuffer(clip.assetId);
    if (!buffer) {
      // Load into engine cache (will use the live AudioContext to decode)
      buffer = await audioEngine.loadClip(clip.assetId, clip.audioUrl) ?? undefined;
    }
    if (!buffer) continue;

    const laneGain = laneGains.get(clip.lane);
    if (!laneGain) continue;

    // Re-decode for offline context (different context = different buffers needed)
    // Copy the raw channel data into a new buffer for the offline context
    const offlineBuffer = offlineCtx.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      offlineBuffer.copyToChannel(buffer.getChannelData(ch), ch);
    }

    const source = offlineCtx.createBufferSource();
    source.buffer = offlineBuffer;

    // Per-clip gain with fades
    const clipGain = offlineCtx.createGain();
    const baseGain = clip.gain ?? 1.0;
    clipGain.gain.setValueAtTime(baseGain, 0);
    source.connect(clipGain);
    clipGain.connect(laneGain);

    const fadeIn = clip.fadeIn ?? 0;
    const fadeOut = clip.fadeOut ?? 0;
    const startWhen = clip.startTime;
    const endWhen = clip.startTime + clip.duration;

    // Apply fades
    if (fadeIn > 0) {
      clipGain.gain.setValueAtTime(0, startWhen);
      clipGain.gain.linearRampToValueAtTime(baseGain, startWhen + fadeIn);
    }
    if (fadeOut > 0) {
      clipGain.gain.setValueAtTime(baseGain, endWhen - fadeOut);
      clipGain.gain.linearRampToValueAtTime(0, endWhen);
    }

    // Apply automation points (e.g. ducking)
    if (clip.automation?.length) {
      for (const point of clip.automation) {
        const when = startWhen + point.time;
        clipGain.gain.linearRampToValueAtTime(
          point.value * baseGain,
          when
        );
      }
    }

    source.start(startWhen, 0, clip.duration);

    scheduled++;
    onProgress?.(Math.round((scheduled / allClips.length) * 50)); // 0-50% for scheduling
  }

  onProgress?.(50);

  // Render
  const renderedBuffer = await offlineCtx.startRendering();

  onProgress?.(100);

  return renderedBuffer;
}
