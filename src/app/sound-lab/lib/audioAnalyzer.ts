/**
 * Audio Analyzer — Essentia.js Spectral Analysis
 *
 * Converts any audio (URL or base64) into an AudioDescriptor that Claude
 * can reason about. Uses Essentia.js WASM for accurate spectral analysis.
 *
 * Pipeline: decode → Essentia brightness → flatness → attack → sustain → pitch → description
 */

import type { AudioDescriptor } from '../types';

const ANALYSIS_SAMPLE_RATE = 44100;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let essentiaInstance: any = null;

async function loadEssentia() {
  if (!essentiaInstance) {
    const [{ default: Essentia }, { default: EssentiaWASM }] = await Promise.all([
      import('essentia.js/dist/essentia.js-core.es.js'),
      import('essentia.js/dist/essentia-wasm.es.js'),
    ]);
    const wasmModule = await EssentiaWASM();
    essentiaInstance = new Essentia(wasmModule);
  }
  return essentiaInstance;
}

// ============ Fetch + Decode ============

async function decodeAudio(audioUrl: string): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(1, ANALYSIS_SAMPLE_RATE, ANALYSIS_SAMPLE_RATE);

  let arrayBuffer: ArrayBuffer;

  if (audioUrl.startsWith('data:')) {
    const match = audioUrl.match(/^data:[^;]+;base64,(.+)$/);
    if (!match) throw new Error('Invalid base64 data URL');
    const binary = atob(match[1]!);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    arrayBuffer = bytes.buffer;
  } else {
    const res = await fetch(audioUrl);
    arrayBuffer = await res.arrayBuffer();
  }

  return ctx.decodeAudioData(arrayBuffer);
}

// ============ Attack — Transient Detection (manual, no Essentia equivalent) ============

function computeAttack(data: Float32Array, sampleRate: number): number {
  let peakIdx = 0;
  let peakVal = 0;
  const searchLimit = Math.min(data.length, Math.floor(sampleRate * 0.5));

  for (let i = 0; i < searchLimit; i++) {
    const val = Math.abs(data[i]!);
    if (val > peakVal) {
      peakVal = val;
      peakIdx = i;
    }
  }

  if (peakVal < 0.01) return 0.5;

  const threshold = peakVal * 0.1;
  let startIdx = 0;
  for (let i = 0; i < peakIdx; i++) {
    if (Math.abs(data[i]!) > threshold) {
      startIdx = i;
      break;
    }
  }

  const attackTimeMs = ((peakIdx - startIdx) / sampleRate) * 1000;
  if (attackTimeMs <= 5) return 1.0;
  if (attackTimeMs >= 200) return 0.0;
  return 1.0 - (attackTimeMs - 5) / 195;
}

// ============ Sustain — Tail Energy Ratio (manual, simple enough) ============

function computeSustain(data: Float32Array): number {
  const half = Math.floor(data.length / 2);
  if (half === 0) return 0;

  let rmsFirst = 0;
  let rmsSecond = 0;

  for (let i = 0; i < half; i++) {
    rmsFirst += data[i]! * data[i]!;
  }
  for (let i = half; i < data.length; i++) {
    rmsSecond += data[i]! * data[i]!;
  }

  rmsFirst = Math.sqrt(rmsFirst / half);
  rmsSecond = Math.sqrt(rmsSecond / (data.length - half));

  if (rmsFirst < 0.001) return 0;
  return Math.min(1, Math.max(0, rmsSecond / rmsFirst));
}

// ============ Description Generator ============

function generateDescription(
  brightness: number,
  noisiness: number,
  attack: number,
  sustain: number,
  pitchHz: number | null,
  durationSec: number
): string {
  const parts: string[] = [];

  if (brightness > 0.8) parts.push('very bright');
  else if (brightness > 0.6) parts.push('bright');
  else if (brightness > 0.4) parts.push('neutral');
  else if (brightness > 0.2) parts.push('dark');
  else parts.push('very dark');

  if (attack > 0.7 && sustain < 0.3) parts.push('percussive hit');
  else if (sustain > 0.6) parts.push('sustained tone');
  else if (noisiness > 0.5) parts.push('noisy texture');
  else parts.push('textured sound');

  if (attack > 0.8) parts.push('sharp attack');
  else if (attack < 0.3) parts.push('slow attack');

  if (durationSec < 0.1) parts.push('very short');
  else if (durationSec < 0.5) parts.push('short');
  else if (durationSec < 2) parts.push('medium');
  else parts.push('long');

  if (pitchHz !== null) {
    parts.push(`pitched ~${Math.round(pitchHz)}Hz`);
  } else if (noisiness > 0.5) {
    parts.push('unpitched/noise');
  }

  return parts.join(', ');
}

// ============ Public API ============

export async function analyzeAudio(audioUrl: string): Promise<AudioDescriptor> {
  const essentia = await loadEssentia();
  const buffer = await decodeAudio(audioUrl);
  const data = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const durationSec = buffer.duration;

  const signal = essentia.arrayToVector(data);

  // Brightness via SpectralCentroidTime (normalized to 0-1)
  const centroidResult = essentia.SpectralCentroidTime(signal, sampleRate);
  const nyquist = sampleRate / 2;
  const brightness = Math.min(1, Math.max(0, Math.log2(centroidResult.centroid + 1) / Math.log2(nyquist + 1)));

  // Noisiness via Flatness on spectrum of first frame
  const frameSize = 2048;
  const frameSlice = data.length >= frameSize ? data.slice(0, frameSize) : data;
  const frameVec = essentia.arrayToVector(frameSlice);
  const windowed = essentia.Windowing(frameVec, true, frameSize, 'hann', 0, true);
  const spectrum = essentia.Spectrum(windowed.frame, frameSize);
  const flatResult = essentia.Flatness(spectrum.spectrum);
  const noisiness = Math.min(1, Math.max(0, flatResult.flatness));

  // Attack and sustain (manual — simple enough, no Essentia equivalent)
  const attack = computeAttack(data, sampleRate);
  const sustain = computeSustain(data);

  // Pitch via PitchYin (much more accurate than manual autocorrelation)
  let pitchHz: number | null = null;
  try {
    const pitchFrame = data.length >= frameSize ? data.slice(0, frameSize) : data;
    const pitchVec = essentia.arrayToVector(pitchFrame);
    const pitchResult = essentia.PitchYin(pitchVec, frameSize, true, 22050, 20, sampleRate, 0.15);
    if (pitchResult.pitchConfidence > 0.5 && pitchResult.pitch > 20) {
      pitchHz = pitchResult.pitch;
    }
    pitchVec.delete();
  } catch { /* may fail on very short signals */ }

  // Cleanup WASM vectors
  signal.delete();
  frameVec.delete();

  return {
    brightness,
    noisiness,
    attack,
    sustain,
    pitchHz,
    description: generateDescription(brightness, noisiness, attack, sustain, pitchHz, durationSec),
  };
}
