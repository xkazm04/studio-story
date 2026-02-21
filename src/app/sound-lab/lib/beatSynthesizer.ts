/**
 * Beat Synthesizer — Pure Web Audio API
 *
 * Renders BeatPattern JSON into audible audio using synthesis.
 * Zero npm dependencies — matches the audioEngine.ts pattern.
 *
 * Supports:
 * - Offline rendering to AudioBuffer (for WAV export / timeline)
 * - Live preview with step cursor callback
 * - 10 instrument types with realistic synthesis recipes
 */

import type { BeatPattern, BeatTrack, BeatTrackSource, BeatSample, InstrumentType } from '../types';
import { encodeWAV } from './wavEncoder';
import type { SamplePlayer } from './samplePlayer';

// ============ Constants ============

const SAMPLE_RATE = 44100;
const CHANNELS = 2;

// Base frequencies for melodic instruments (C3 = 130.81 Hz)
const BASE_NOTE = 130.81;

function semitonesToRate(semitones: number): number {
  return Math.pow(2, semitones / 12);
}

// ============ Noise Buffer (shared) ============

let noiseBuffer: AudioBuffer | null = null;

function getNoiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) return noiseBuffer;
  const length = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buf;
  return buf;
}

// ============ Instrument Recipes ============

type InstrumentFn = (ctx: BaseAudioContext, time: number, velocity: number, dest: AudioNode, pitch?: number) => void;

function synthKick(ctx: BaseAudioContext, time: number, velocity: number, dest: AudioNode): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.15);
  gain.gain.setValueAtTime(velocity, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
  osc.connect(gain).connect(dest);
  osc.start(time);
  osc.stop(time + 0.3);
}

function synthSnare(ctx: BaseAudioContext, time: number, velocity: number, dest: AudioNode): void {
  // Noise part
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);
  const noiseGain = ctx.createGain();
  const hpf = ctx.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.value = 2000;
  noiseGain.gain.setValueAtTime(velocity * 0.7, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
  noise.connect(hpf).connect(noiseGain).connect(dest);
  noise.start(time);
  noise.stop(time + 0.15);

  // Tone part
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(200, time);
  oscGain.gain.setValueAtTime(velocity * 0.5, time);
  oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
  osc.connect(oscGain).connect(dest);
  osc.start(time);
  osc.stop(time + 0.08);
}

function synthHihat(ctx: BaseAudioContext, time: number, velocity: number, dest: AudioNode): void {
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);
  const gain = ctx.createGain();
  const bpf = ctx.createBiquadFilter();
  bpf.type = 'bandpass';
  bpf.frequency.value = 10000;
  bpf.Q.value = 1.5;
  gain.gain.setValueAtTime(velocity * 0.5, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
  noise.connect(bpf).connect(gain).connect(dest);
  noise.start(time);
  noise.stop(time + 0.08);
}

function synthClap(ctx: BaseAudioContext, time: number, velocity: number, dest: AudioNode): void {
  for (let i = 0; i < 3; i++) {
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);
    const gain = ctx.createGain();
    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 2500;
    const t = time + i * 0.015;
    gain.gain.setValueAtTime(velocity * 0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    noise.connect(bpf).connect(gain).connect(dest);
    noise.start(t);
    noise.stop(t + 0.06);
  }
}

function synthTom(ctx: BaseAudioContext, time: number, velocity: number, dest: AudioNode, pitch = 0): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const freq = 120 * semitonesToRate(pitch);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, time);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.5, time + 0.2);
  gain.gain.setValueAtTime(velocity * 0.8, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
  osc.connect(gain).connect(dest);
  osc.start(time);
  osc.stop(time + 0.3);
}

function synthCymbal(ctx: BaseAudioContext, time: number, velocity: number, dest: AudioNode): void {
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);
  const gain = ctx.createGain();
  const hpf = ctx.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.value = 6000;
  gain.gain.setValueAtTime(velocity * 0.4, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
  noise.connect(hpf).connect(gain).connect(dest);
  noise.start(time);
  noise.stop(time + 0.7);
}

function synthBass(ctx: BaseAudioContext, time: number, velocity: number, dest: AudioNode, pitch = 0): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const lpf = ctx.createBiquadFilter();
  const freq = BASE_NOTE * semitonesToRate(pitch);
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, time);
  lpf.type = 'lowpass';
  lpf.frequency.setValueAtTime(400, time);
  lpf.frequency.exponentialRampToValueAtTime(150, time + 0.15);
  gain.gain.setValueAtTime(velocity * 0.7, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
  osc.connect(lpf).connect(gain).connect(dest);
  osc.start(time);
  osc.stop(time + 0.35);
}

function synthPad(ctx: BaseAudioContext, time: number, velocity: number, dest: AudioNode, pitch = 0): void {
  const gain = ctx.createGain();
  const lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.value = 800;
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(velocity * 0.3, time + 0.1);
  gain.gain.linearRampToValueAtTime(0, time + 0.5);
  lpf.connect(gain).connect(dest);

  const freq = BASE_NOTE * 2 * semitonesToRate(pitch);
  for (const detune of [-7, 0, 7]) {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc.detune.value = detune;
    osc.connect(lpf);
    osc.start(time);
    osc.stop(time + 0.55);
  }
}

function synthArp(ctx: BaseAudioContext, time: number, velocity: number, dest: AudioNode, pitch = 0): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const freq = BASE_NOTE * 4 * semitonesToRate(pitch);
  osc.type = 'square';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(velocity * 0.35, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
  osc.connect(gain).connect(dest);
  osc.start(time);
  osc.stop(time + 0.12);
}

function synthPerc(ctx: BaseAudioContext, time: number, velocity: number, dest: AudioNode): void {
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(velocity * 0.3, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
  noise.connect(noiseGain).connect(dest);
  noise.start(time);
  noise.stop(time + 0.06);

  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 300 + Math.random() * 500;
  oscGain.gain.setValueAtTime(velocity * 0.4, time);
  oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
  osc.connect(oscGain).connect(dest);
  osc.start(time);
  osc.stop(time + 0.07);
}

const INSTRUMENT_FN: Record<InstrumentType, InstrumentFn> = {
  kick: synthKick,
  snare: synthSnare,
  hihat: synthHihat,
  clap: synthClap,
  tom: synthTom,
  cymbal: synthCymbal,
  bass: synthBass,
  pad: synthPad,
  arp: synthArp,
  perc: synthPerc,
};

// ============ Helpers ============

function getPatternDuration(pattern: BeatPattern): number {
  const beatsPerBar = pattern.beats;
  const totalBeats = beatsPerBar * pattern.bars;
  return (totalBeats / pattern.bpm) * 60;
}

function getStepTime(pattern: BeatPattern, stepIndex: number): number {
  const secondsPerBeat = 60 / pattern.bpm;
  const secondsPerStep = secondsPerBeat / pattern.stepsPerBeat;
  // Apply swing (shift even-numbered 16ths forward)
  const isSwung = pattern.swing > 0 && stepIndex % 2 === 1;
  const swingOffset = isSwung ? secondsPerStep * pattern.swing * 0.5 : 0;
  return stepIndex * secondsPerStep + swingOffset;
}

function scheduleTrack(
  ctx: BaseAudioContext,
  track: BeatTrack & { source?: BeatTrackSource },
  pattern: BeatPattern,
  dest: AudioNode,
  offsetTime: number,
  samplePlayer?: SamplePlayer
): void {
  if (track.muted) return;

  const trackGain = ctx.createGain();
  trackGain.gain.value = track.volume;
  trackGain.connect(dest);

  // Sample mode
  if (track.source?.mode === 'sample' && track.source.sampleId && samplePlayer) {
    for (let i = 0; i < track.steps.length; i++) {
      const step = track.steps[i];
      if (!step || !step.active) continue;
      const time = offsetTime + getStepTime(pattern, i);
      samplePlayer.playSample(ctx, track.source.sampleId, time, step.velocity, trackGain);
    }
    return;
  }

  // Synth mode
  const fn = INSTRUMENT_FN[track.instrument];
  for (let i = 0; i < track.steps.length; i++) {
    const step = track.steps[i];
    if (!step || !step.active) continue;
    const time = offsetTime + getStepTime(pattern, i);
    fn(ctx, time, step.velocity, trackGain, track.pitch);
  }
}

// ============ Public API ============

export class BeatSynthesizer {
  /**
   * Render a BeatPattern to an AudioBuffer using OfflineAudioContext.
   */
  async renderToBuffer(pattern: BeatPattern, samplePlayer?: SamplePlayer): Promise<AudioBuffer> {
    const duration = getPatternDuration(pattern);
    const length = Math.ceil(duration * SAMPLE_RATE) + SAMPLE_RATE; // +1s for tails
    const ctx = new OfflineAudioContext(CHANNELS, length, SAMPLE_RATE);

    for (const track of pattern.tracks) {
      scheduleTrack(ctx, track, pattern, ctx.destination, 0, samplePlayer);
    }

    return ctx.startRendering();
  }

  /**
   * Convert an AudioBuffer to a base64 WAV data URL.
   */
  bufferToDataUrl(buffer: AudioBuffer): string {
    const wavData = encodeWAV(buffer);
    const bytes = new Uint8Array(wavData);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    return `data:audio/wav;base64,${btoa(binary)}`;
  }

  /**
   * Start live playback with step cursor callback.
   * Returns a handle to stop playback.
   */
  startLivePreview(
    ctx: AudioContext,
    pattern: BeatPattern,
    destination: AudioNode,
    onStep?: (stepIndex: number) => void,
    samplePlayer?: SamplePlayer
  ): { stop: () => void } {
    let stopped = false;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const totalSteps = pattern.stepsPerBeat * pattern.beats * pattern.bars;
    const secondsPerBeat = 60 / pattern.bpm;
    const secondsPerStep = secondsPerBeat / pattern.stepsPerBeat;

    // Schedule all tracks
    const startTime = ctx.currentTime + 0.05;
    for (const track of pattern.tracks) {
      scheduleTrack(ctx, track, pattern, destination, startTime, samplePlayer);
    }

    // Step cursor updates
    if (onStep) {
      let currentStep = 0;
      const tick = () => {
        if (stopped || currentStep >= totalSteps) return;
        onStep(currentStep);
        currentStep++;
        timerId = setTimeout(tick, secondsPerStep * 1000);
      };
      // Start after the scheduling offset
      timerId = setTimeout(tick, 50);
    }

    return {
      stop: () => {
        stopped = true;
        if (timerId) clearTimeout(timerId);
      },
    };
  }
}

// ============ Pattern Serialization ============

/** Serialize pattern to compact text for CLI context */
export function patternToText(
  pattern: BeatPattern,
  samples?: Map<string, BeatSample>
): string {
  const header = `${pattern.bpm}bpm ${pattern.beats}/${pattern.stepsPerBeat} ${pattern.bars}bar${pattern.bars > 1 ? 's' : ''} swing:${Math.round(pattern.swing * 100)}%`;
  const trackLines = pattern.tracks.map((t) => {
    const stepStr = t.steps.map((s) =>
      !s.active ? '.' : s.accent ? 'X' : s.velocity > 0.6 ? 'x' : 'o'
    ).join('');
    const src = (t as BeatTrack & { source?: BeatTrackSource }).source;
    const sampleInfo = src?.mode === 'sample' && src.sampleId && samples?.get(src.sampleId)
      ? ` [sample: ${samples.get(src.sampleId)!.descriptor?.description || 'unknown'}]`
      : '';
    return `${t.instrument}${sampleInfo}: ${stepStr}${t.muted ? ' (muted)' : ''}`;
  }).join('\n');
  return `${header}\n${trackLines}`;
}

/** Singleton instance */
let instance: BeatSynthesizer | null = null;
export function getBeatSynthesizer(): BeatSynthesizer {
  if (!instance) instance = new BeatSynthesizer();
  return instance;
}
