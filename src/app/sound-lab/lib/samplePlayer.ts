/**
 * Sample Player — Load, Decode & Play Audio Samples
 *
 * Manages a bank of audio samples for the beat sequencer.
 * Loads audio files, decodes them, runs analysis, and plays via Web Audio.
 * Singleton pattern matching getBeatSynthesizer().
 */

import type { BeatSample } from '../types';
import { analyzeAudio } from './audioAnalyzer';

const WAVEFORM_POINTS = 40;

// ============ Waveform Extraction ============

function extractWaveform(buffer: AudioBuffer, points: number): number[] {
  const data = buffer.getChannelData(0);
  const step = Math.floor(data.length / points);
  const waveform: number[] = [];

  for (let i = 0; i < points; i++) {
    let sum = 0;
    const start = i * step;
    const end = Math.min(start + step, data.length);
    for (let j = start; j < end; j++) {
      sum += Math.abs(data[j]!);
    }
    waveform.push(sum / (end - start));
  }

  // Normalize to 0-1
  const max = Math.max(...waveform, 0.001);
  return waveform.map((v) => v / max);
}

// ============ URL → ArrayBuffer ============

async function fetchArrayBuffer(audioUrl: string): Promise<ArrayBuffer> {
  if (audioUrl.startsWith('data:')) {
    const match = audioUrl.match(/^data:[^;]+;base64,(.+)$/);
    if (!match) throw new Error('Invalid base64 data URL');
    const binary = atob(match[1]!);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  const res = await fetch(audioUrl);
  return res.arrayBuffer();
}

// ============ Sample Player ============

export class SamplePlayer {
  private samples = new Map<string, BeatSample>();
  private buffers = new Map<string, AudioBuffer>();

  /**
   * Load a sample from URL, decode it, analyze it, and store it.
   */
  async loadSample(id: string, name: string, audioUrl: string): Promise<BeatSample> {
    // Decode audio
    const arrayBuffer = await fetchArrayBuffer(audioUrl);
    const ctx = new OfflineAudioContext(1, 44100, 44100);
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    // Analyze
    const descriptor = await analyzeAudio(audioUrl);

    // Extract waveform
    const waveformData = extractWaveform(audioBuffer, WAVEFORM_POINTS);

    const sample: BeatSample = { id, name, audioUrl, descriptor, waveformData };
    this.samples.set(id, sample);
    this.buffers.set(id, audioBuffer);

    return sample;
  }

  /**
   * Play a loaded sample through Web Audio.
   */
  playSample(
    ctx: BaseAudioContext,
    sampleId: string,
    time: number,
    velocity: number,
    dest: AudioNode
  ): void {
    const buffer = this.buffers.get(sampleId);
    if (!buffer) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(velocity, time);

    source.connect(gain).connect(dest);
    source.start(time);
  }

  getSamples(): Map<string, BeatSample> {
    return this.samples;
  }

  getSample(id: string): BeatSample | undefined {
    return this.samples.get(id);
  }

  hasSample(id: string): boolean {
    return this.buffers.has(id);
  }

  removeSample(id: string): void {
    this.samples.delete(id);
    this.buffers.delete(id);
  }
}

/** Singleton instance */
let instance: SamplePlayer | null = null;
export function getSamplePlayer(): SamplePlayer {
  if (!instance) instance = new SamplePlayer();
  return instance;
}
