/**
 * Web Audio API Engine for Timeline Playback
 *
 * Pure Web Audio API — no npm dependencies.
 * Handles buffer caching, per-lane gain nodes, per-clip gain with fades,
 * AnalyserNodes for metering, and precise scheduling.
 */

import type { AudioAssetType, TimelineClip } from '../types';

interface ScheduledClip {
  source: AudioBufferSourceNode;
  clipGain: GainNode;
  clipId: string;
}

const LANE_ORDER: AudioAssetType[] = ['voice', 'music', 'sfx', 'ambience'];

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private laneGains: Map<AudioAssetType, GainNode> = new Map();
  private laneAnalysers: Map<AudioAssetType, AnalyserNode> = new Map();
  private masterAnalyser: AnalyserNode | null = null;
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private scheduledSources: ScheduledClip[] = [];
  private startTime = 0;   // AudioContext.currentTime when play() was called
  private startOffset = 0; // Playhead offset at time of play()
  private _isPlaying = false;

  /** Initialize AudioContext and gain nodes (must be called from user gesture) */
  init(): void {
    if (this.ctx) return;

    this.ctx = new AudioContext();

    // Master analyser → destination
    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 256;
    this.masterAnalyser.smoothingTimeConstant = 0.8;
    this.masterAnalyser.connect(this.ctx.destination);

    // Master gain → master analyser
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.masterAnalyser);

    // Per-lane: laneGain → laneAnalyser → masterGain
    for (const lane of LANE_ORDER) {
      const analyser = this.ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyser.connect(this.masterGain);

      const gain = this.ctx.createGain();
      gain.connect(analyser);

      this.laneGains.set(lane, gain);
      this.laneAnalysers.set(lane, analyser);
    }
  }

  /** Decode and cache an audio buffer from a URL (base64 data URL or HTTP) */
  async loadClip(id: string, audioUrl: string): Promise<AudioBuffer | null> {
    if (this.bufferCache.has(id)) {
      return this.bufferCache.get(id)!;
    }

    if (!this.ctx) this.init();
    const ctx = this.ctx!;

    try {
      let arrayBuffer: ArrayBuffer;

      if (audioUrl.startsWith('data:')) {
        // Base64 data URL
        const base64 = audioUrl.split(',')[1];
        if (!base64) return null;
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        arrayBuffer = bytes.buffer;
      } else {
        // HTTP URL
        const response = await fetch(audioUrl);
        arrayBuffer = await response.arrayBuffer();
      }

      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      this.bufferCache.set(id, audioBuffer);
      return audioBuffer;
    } catch {
      return null;
    }
  }

  /**
   * Schedule and play all clips from the given playhead position.
   * Clips that start before playheadPos will be offset into their buffer.
   * Per-clip gain and fade-in/fade-out are applied.
   */
  async play(
    clips: TimelineClip[],
    playheadPos: number,
    laneMutes: Map<AudioAssetType, boolean>
  ): Promise<void> {
    if (!this.ctx) this.init();
    const ctx = this.ctx!;

    // Resume if suspended (autoplay policy)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Stop any currently playing sources
    this.stopSources();

    // Apply lane mutes
    for (const [lane, muted] of laneMutes) {
      this.setLaneMute(lane, muted);
    }

    this.startTime = ctx.currentTime;
    this.startOffset = playheadPos;
    this._isPlaying = true;

    // Pre-load and schedule all clips
    for (const clip of clips) {
      if (!clip.audioUrl) continue;

      const buffer = await this.loadClip(clip.assetId, clip.audioUrl);
      if (!buffer) continue;

      const laneGain = this.laneGains.get(clip.lane);
      if (!laneGain) continue;

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // Per-clip gain node with fade support
      const clipGain = ctx.createGain();
      const baseGain = clip.gain ?? 1.0;
      clipGain.gain.setValueAtTime(baseGain, ctx.currentTime);
      source.connect(clipGain);
      clipGain.connect(laneGain);

      // Calculate when to start and what offset into the buffer
      const clipEnd = clip.startTime + clip.duration;

      // Skip clips that are entirely before the playhead
      if (clipEnd <= playheadPos) continue;

      const fadeIn = clip.fadeIn ?? 0;
      const fadeOut = clip.fadeOut ?? 0;

      if (clip.startTime >= playheadPos) {
        // Clip starts after playhead — schedule in future
        const delay = clip.startTime - playheadPos;
        const startWhen = ctx.currentTime + delay;
        const endWhen = startWhen + clip.duration;

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
            if (when >= ctx.currentTime) {
              clipGain.gain.linearRampToValueAtTime(
                point.value * baseGain,
                when
              );
            }
          }
        }

        source.start(startWhen, 0, clip.duration);
      } else {
        // Clip is partially played — start from offset
        const offset = playheadPos - clip.startTime;
        const remaining = clip.duration - offset;
        const endWhen = ctx.currentTime + remaining;

        // Fade-in: only if playhead is still within the fade-in range
        if (fadeIn > 0 && offset < fadeIn) {
          const fadeProgress = offset / fadeIn;
          clipGain.gain.setValueAtTime(baseGain * fadeProgress, ctx.currentTime);
          clipGain.gain.linearRampToValueAtTime(baseGain, ctx.currentTime + (fadeIn - offset));
        }

        // Fade-out
        if (fadeOut > 0) {
          const fadeOutStart = clip.duration - fadeOut;
          if (offset < fadeOutStart) {
            clipGain.gain.setValueAtTime(baseGain, ctx.currentTime + (fadeOutStart - offset));
            clipGain.gain.linearRampToValueAtTime(0, endWhen);
          } else {
            const fadeProgress = (offset - fadeOutStart) / fadeOut;
            clipGain.gain.setValueAtTime(baseGain * (1 - fadeProgress), ctx.currentTime);
            clipGain.gain.linearRampToValueAtTime(0, endWhen);
          }
        }

        // Apply automation points (e.g. ducking) — skip points before offset
        if (clip.automation?.length) {
          for (const point of clip.automation) {
            if (point.time <= offset) continue;
            const when = ctx.currentTime + (point.time - offset);
            clipGain.gain.linearRampToValueAtTime(
              point.value * baseGain,
              when
            );
          }
          // Set initial automation value for current position
          const prevPoint = [...(clip.automation)].reverse().find((p) => p.time <= offset);
          if (prevPoint) {
            clipGain.gain.setValueAtTime(prevPoint.value * baseGain, ctx.currentTime);
          }
        }

        source.start(ctx.currentTime, offset, remaining);
      }

      this.scheduledSources.push({ source, clipGain, clipId: clip.id });
    }
  }

  /** Stop all currently playing sources */
  stop(): void {
    this._isPlaying = false;
    this.stopSources();
  }

  private stopSources(): void {
    for (const { source, clipGain } of this.scheduledSources) {
      try {
        source.stop();
        source.disconnect();
        clipGain.disconnect();
      } catch {
        // Already stopped
      }
    }
    this.scheduledSources = [];
  }

  /** Get the current real-time playhead position in seconds */
  getCurrentTime(): number {
    if (!this.ctx) return this.startOffset;
    return this.startOffset + (this.ctx.currentTime - this.startTime);
  }

  /** Whether audio is currently playing */
  get isPlaying(): boolean {
    return this._isPlaying;
  }

  /** Mute or unmute a lane */
  setLaneMute(lane: AudioAssetType, muted: boolean): void {
    const gain = this.laneGains.get(lane);
    if (gain) {
      gain.gain.value = muted ? 0 : 1;
    }
  }

  /** Set master volume (0-1) */
  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /** Get peak level (0-1) for a lane from its AnalyserNode */
  getLanePeakLevel(lane: AudioAssetType): number {
    const analyser = this.laneAnalysers.get(lane);
    if (!analyser) return 0;
    return this.getPeakFromAnalyser(analyser);
  }

  /** Get peak level (0-1) for master output */
  getMasterPeakLevel(): number {
    if (!this.masterAnalyser) return 0;
    return this.getPeakFromAnalyser(this.masterAnalyser);
  }

  /** Get frequency data for spectrum display */
  getMasterFrequencyData(): Uint8Array {
    if (!this.masterAnalyser) return new Uint8Array(0);
    const data = new Uint8Array(this.masterAnalyser.frequencyBinCount);
    this.masterAnalyser.getByteFrequencyData(data);
    return data;
  }

  private getPeakFromAnalyser(analyser: AnalyserNode): number {
    const data = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(data);
    let peak = 0;
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]!);
      if (abs > peak) peak = abs;
    }
    return Math.min(1, peak);
  }

  /** Get the underlying AudioContext (for OfflineAudioContext reuse) */
  getContext(): AudioContext | null {
    return this.ctx;
  }

  /** Get cached buffer by id */
  getBuffer(id: string): AudioBuffer | undefined {
    return this.bufferCache.get(id);
  }

  /** Clean up all resources */
  dispose(): void {
    this._isPlaying = false;
    this.stopSources();
    this.bufferCache.clear();
    this.laneGains.clear();
    this.laneAnalysers.clear();
    this.masterAnalyser = null;
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.masterGain = null;
  }
}
