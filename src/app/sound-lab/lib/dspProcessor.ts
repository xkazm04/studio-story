/**
 * DSP Processor — Singleton for spectral analysis, granular synthesis preview,
 * and offline rendering via Web Audio + Tone.js + Essentia.js.
 *
 * - `tone` is lazy-loaded (accesses `window` at module level, crashes SSR)
 * - `essentia.js` is lazy-loaded (WASM ~3-5MB, must be dynamic import)
 * - Offline rendering uses native Web Audio (Tone.js needs a live context)
 */

import type {
  SpectralFeatures,
  GranularParams,
  DSPFilterParams,
  DSPEffectChain,
} from '../types';

// ---------------------------------------------------------------------------
// Utility: distortion curve for WaveShaperNode
// ---------------------------------------------------------------------------
function makeDistortionCurve(amount: number): Float32Array {
  const samples = 44100;
  const curve = new Float32Array(samples);
  const k = amount * 100;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return curve;
}

// ---------------------------------------------------------------------------
// Utility: synthetic impulse response for ConvolverNode (offline reverb)
// ---------------------------------------------------------------------------
function generateImpulseResponse(
  ctx: BaseAudioContext,
  duration: number,
  decay: number,
): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * duration);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

// ---------------------------------------------------------------------------
// Utility: Hann window for grain envelopes
// ---------------------------------------------------------------------------
function hannWindow(length: number): Float32Array {
  const win = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    win[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (length - 1)));
  }
  return win;
}

// ---------------------------------------------------------------------------
// DSPProcessor class
// ---------------------------------------------------------------------------
class DSPProcessor {
  private toneModule: typeof import('tone') | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private essentiaInstance: any = null;

  // Active preview state for cleanup
  private activePreview: { stop: () => void } | null = null;

  /** Lazy-load Tone.js (client-only) */
  private async loadTone() {
    if (!this.toneModule) {
      this.toneModule = await import('tone');
    }
    return this.toneModule;
  }

  /** Lazy-load Essentia.js WASM + core */
  private async loadEssentia() {
    if (!this.essentiaInstance) {
      const [{ default: Essentia }, { default: EssentiaWASM }] = await Promise.all([
        import('essentia.js/dist/essentia.js-core.es.js'),
        import('essentia.js/dist/essentia-wasm.es.js'),
      ]);
      const wasmModule = await EssentiaWASM();
      this.essentiaInstance = new Essentia(wasmModule);
    }
    return this.essentiaInstance;
  }

  // -----------------------------------------------------------------------
  // 1. Spectral Analysis
  // -----------------------------------------------------------------------

  /**
   * Analyze an AudioBuffer and return spectral features.
   * Uses Essentia.js WASM for frame-based features + whole-signal BPM/key/beat.
   */
  async analyzeSpectral(audioBuffer: AudioBuffer): Promise<SpectralFeatures> {
    const essentia = await this.loadEssentia();
    const sampleRate = audioBuffer.sampleRate;

    // Downmix to mono
    let channelData: Float32Array;
    if (audioBuffer.numberOfChannels >= 2) {
      channelData = essentia.audioBufferToMonoSignal(audioBuffer);
    } else {
      channelData = audioBuffer.getChannelData(0);
    }

    const signal = essentia.arrayToVector(channelData);

    // --- Frame-based features (averaged across frames) ---
    const frameSize = 2048;
    const hopSize = 1024;
    const frames = essentia.FrameGenerator(channelData, frameSize, hopSize);
    const frameCount = frames.size();
    const maxFrames = Math.min(frameCount, 32); // cap for performance

    let rmsSum = 0;
    let flatnessSum = 0;
    let zcrSum = 0;
    let energySum = 0;
    let rolloffSum = 0;
    let centroidSum = 0;
    const mfccSums = new Array(13).fill(0);
    let validFrames = 0;

    for (let i = 0; i < maxFrames; i++) {
      const frameIdx = Math.floor((i * frameCount) / maxFrames);
      const frame = frames.get(frameIdx);

      // RMS
      const rmsResult = essentia.RMS(frame);
      rmsSum += rmsResult.rms;

      // Flatness (on spectrum)
      const windowed = essentia.Windowing(frame, true, frameSize, 'hann', 0, true);
      const spectrum = essentia.Spectrum(windowed.frame, frameSize);

      const flatResult = essentia.Flatness(spectrum.spectrum);
      flatnessSum += flatResult.flatness;

      // RollOff (on spectrum)
      const rollResult = essentia.RollOff(spectrum.spectrum, 0.85, sampleRate);
      rolloffSum += rollResult.rollOff;

      // ZeroCrossingRate
      const zcrResult = essentia.ZeroCrossingRate(frame);
      zcrSum += zcrResult.zeroCrossingRate;

      // Energy (RMS squared * frame length)
      energySum += rmsResult.rms * rmsResult.rms;

      // SpectralCentroidTime
      const centroidResult = essentia.SpectralCentroidTime(frame, sampleRate);
      centroidSum += centroidResult.centroid;

      // MFCC (on spectrum)
      const mfccResult = essentia.MFCC(
        spectrum.spectrum,
        2,           // dctType
        11000,       // highFrequencyBound
        frameSize / 2 + 1, // inputSize
        0,           // liftering
        'dbamp',     // logType
        0,           // lowFrequencyBound
        'unit_sum',  // normalize
        40,          // numberBands
        13,          // numberCoefficients
        sampleRate,
      );
      const mfccVec = essentia.vectorToArray(mfccResult.mfcc);
      for (let c = 0; c < Math.min(13, mfccVec.length); c++) {
        mfccSums[c] += mfccVec[c];
      }

      validFrames++;
    }

    const n = Math.max(validFrames, 1);

    // --- Whole-signal features ---
    let bpm: number | undefined;
    let key: string | undefined;
    let scale: string | undefined;
    let keyStrength: number | undefined;
    let beats: number[] | undefined;

    try {
      const bpmResult = essentia.PercivalBpmEstimator(signal, 1024, 2048, 128, 128, 210, 50, sampleRate);
      bpm = bpmResult.bpm > 0 ? Math.round(bpmResult.bpm) : undefined;
    } catch { /* BPM detection may fail on very short clips */ }

    try {
      const keyResult = essentia.KeyExtractor(signal, true, 4096, 4096, 12, 3500, 60, 25, 0.2, 'bgate', sampleRate);
      key = keyResult.key;
      scale = keyResult.scale;
      keyStrength = keyResult.strength;
    } catch { /* Key detection may fail on noise/percussion */ }

    try {
      // Use faster BeatTrackerDegara for beat positions
      const beatResult = essentia.BeatTrackerDegara(signal);
      const ticksVec = essentia.vectorToArray(beatResult.ticks);
      if (ticksVec.length > 0) {
        beats = Array.from(ticksVec);
      }
    } catch { /* Beat tracking may fail on very short clips */ }

    // Clean up WASM vectors
    signal.delete();
    frames.delete();

    const spectral: SpectralFeatures = {
      rms: rmsSum / n,
      spectralCentroid: centroidSum / n,
      spectralFlatness: flatnessSum / n,
      spectralRolloff: rolloffSum / n,
      mfcc: mfccSums.map((s) => s / n),
      zcr: zcrSum / n,
      energy: energySum / n,
      description: '', // filled below
      bpm,
      key,
      scale,
      keyStrength,
      beats,
    };

    spectral.description = this.describeSpectral(spectral, sampleRate);
    return spectral;
  }

  /** Generate a human-readable description from spectral features. */
  private describeSpectral(f: SpectralFeatures, sampleRate: number): string {
    const parts: string[] = [];

    // Tonality vs noise
    if (f.spectralFlatness < 0.1) parts.push('Warm tonal source');
    else if (f.spectralFlatness < 0.4) parts.push('Partially tonal');
    else parts.push('Noisy/textural');

    // Brightness (centroid relative to nyquist)
    const nyquist = sampleRate / 2;
    const brightnessRatio = f.spectralCentroid / nyquist;
    if (brightnessRatio < 0.1) parts.push('very dark');
    else if (brightnessRatio < 0.25) parts.push('moderate brightness');
    else parts.push('bright/airy');

    // Level
    if (f.rms < 0.05) parts.push('low level');
    else if (f.rms > 0.3) parts.push('high energy');

    // Zero-crossing rate hints at percussive content
    if (f.zcr > 0.1) parts.push('high transient content');

    // Musical context from whole-signal analysis
    if (f.bpm) parts.push(`${f.bpm} BPM`);
    if (f.key && f.scale) parts.push(`${f.key} ${f.scale}`);

    return parts.join(', ');
  }

  // -----------------------------------------------------------------------
  // 2. Real-time Preview (Tone.js GrainPlayer)
  // -----------------------------------------------------------------------

  /**
   * Start a real-time preview of an audio file through the DSP effect chain.
   * Caller must ensure a user gesture has occurred before calling.
   */
  async startPreview(
    audioUrl: string,
    chain: DSPEffectChain,
    _destination?: AudioNode,
  ): Promise<{ stop: () => void; updateChain: (chain: DSPEffectChain) => void }> {
    // Stop any existing preview
    this.activePreview?.stop();

    const Tone = await this.loadTone();
    await Tone.start();

    const { granular } = chain;

    // Create grain player
    const player = new Tone.GrainPlayer({
      url: audioUrl,
      grainSize: granular.grainSize,
      overlap: granular.overlap,
      playbackRate: granular.playbackRate,
      reverse: granular.reverse,
      detune: granular.pitchShift * 100, // Tone uses cents
      loop: true,
    });

    // Build filter chain
    const filters = chain.filters.map(
      (f) => new Tone.BiquadFilter(f.frequency, f.type as BiquadFilterType),
    );
    // Apply Q and gain to each filter
    chain.filters.forEach((f, i) => {
      filters[i].Q.value = f.Q;
      if (f.type === 'highshelf' || f.type === 'lowshelf' || f.type === 'peaking') {
        filters[i].gain.value = f.gain;
      }
    });

    // Effects
    const distortion = new Tone.Distortion(chain.distortion);
    const reverb = new Tone.Reverb({ wet: chain.reverbMix, decay: 2 });
    const delay = new Tone.FeedbackDelay(chain.delayTime || 0.001, chain.delayFeedback);

    // Connect signal chain: player -> filters -> distortion -> reverb -> delay -> out
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodes: any[] = [...filters, distortion, reverb, delay, Tone.getDestination()];
    player.chain(...nodes);
    player.start();

    const stop = () => {
      try {
        player.stop();
        player.dispose();
        filters.forEach((f) => f.dispose());
        distortion.dispose();
        reverb.dispose();
        delay.dispose();
      } catch {
        // Nodes may already be disposed
      }
      if (this.activePreview?.stop === stop) {
        this.activePreview = null;
      }
    };

    const updateChain = (newChain: DSPEffectChain) => {
      // Update granular params in real-time
      player.grainSize = newChain.granular.grainSize;
      player.overlap = newChain.granular.overlap;
      player.playbackRate = newChain.granular.playbackRate;
      player.reverse = newChain.granular.reverse;
      player.detune = newChain.granular.pitchShift * 100;

      // Update effects
      distortion.distortion = newChain.distortion;
      reverb.wet.value = newChain.reverbMix;
      delay.delayTime.value = newChain.delayTime || 0.001;
      delay.feedback.value = newChain.delayFeedback;
    };

    this.activePreview = { stop };
    return { stop, updateChain };
  }

  // -----------------------------------------------------------------------
  // 3. Offline Rendering (native Web Audio — no Tone.js)
  // -----------------------------------------------------------------------

  /**
   * Render sourceBuffer through the DSP chain into a new AudioBuffer.
   * Uses OfflineAudioContext with manual granular synthesis scheduling.
   */
  async renderToBuffer(
    sourceBuffer: AudioBuffer,
    chain: DSPEffectChain,
  ): Promise<AudioBuffer> {
    const { granular } = chain;
    const sampleRate = sourceBuffer.sampleRate;
    const sourceDuration = sourceBuffer.duration;

    // Output duration scales inversely with playback rate
    const outputDuration = sourceDuration / Math.max(granular.playbackRate, 0.01);
    const outputLength = Math.ceil(outputDuration * sampleRate);

    const offlineCtx = new OfflineAudioContext(
      sourceBuffer.numberOfChannels,
      outputLength,
      sampleRate,
    );

    // Build processing chain: gains merge -> filters -> distortion -> reverb dry/wet -> delay -> dest
    let currentNode: AudioNode = offlineCtx.destination;

    // Delay node
    if (chain.delayTime > 0) {
      const delayNode = offlineCtx.createDelay(5);
      delayNode.delayTime.value = chain.delayTime;
      // Feedback via gain loop
      const feedbackGain = offlineCtx.createGain();
      feedbackGain.gain.value = Math.min(chain.delayFeedback, 0.95);
      // dry signal + delay feedback
      const merger = offlineCtx.createGain();
      merger.connect(currentNode);
      delayNode.connect(merger);
      delayNode.connect(feedbackGain);
      feedbackGain.connect(delayNode);
      currentNode = merger;
      // Also route delay input from current
      const delayInput = offlineCtx.createGain();
      delayInput.connect(delayNode);
      delayInput.connect(merger); // dry path
      currentNode = delayInput;
    }

    // Reverb (convolver with synthetic IR)
    if (chain.reverbMix > 0) {
      const ir = generateImpulseResponse(offlineCtx, 2, 3);
      const convolver = offlineCtx.createConvolver();
      convolver.buffer = ir;
      // Dry/wet mix
      const dryGain = offlineCtx.createGain();
      const wetGain = offlineCtx.createGain();
      const reverbMerge = offlineCtx.createGain();
      dryGain.gain.value = 1 - chain.reverbMix;
      wetGain.gain.value = chain.reverbMix;
      dryGain.connect(reverbMerge);
      convolver.connect(wetGain);
      wetGain.connect(reverbMerge);
      reverbMerge.connect(currentNode);
      // Split input to dry + convolver
      const reverbInput = offlineCtx.createGain();
      reverbInput.connect(dryGain);
      reverbInput.connect(convolver);
      currentNode = reverbInput;
    }

    // Distortion (WaveShaperNode)
    if (chain.distortion > 0) {
      const shaper = offlineCtx.createWaveShaper();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      shaper.curve = makeDistortionCurve(chain.distortion) as any;
      shaper.oversample = '4x';
      shaper.connect(currentNode);
      currentNode = shaper;
    }

    // Biquad filters (applied in order)
    for (let i = chain.filters.length - 1; i >= 0; i--) {
      const fp = chain.filters[i];
      const bq = offlineCtx.createBiquadFilter();
      bq.type = fp.type;
      bq.frequency.value = fp.frequency;
      bq.Q.value = fp.Q;
      bq.gain.value = fp.gain;
      bq.connect(currentNode);
      currentNode = bq;
    }

    // --- Granular synthesis: schedule grains manually ---
    const grainSizeSec = Math.max(granular.grainSize, 0.005);
    const grainSizeSamples = Math.floor(grainSizeSec * sampleRate);
    const hopSec = grainSizeSec / Math.max(granular.overlap, 0.1); // overlap controls hop
    const hannWin = hannWindow(grainSizeSamples);

    let outputTime = 0;
    let sourcePos = 0;
    const sourceLength = sourceBuffer.length;

    while (outputTime < outputDuration) {
      // Apply randomness to source position
      const randomOffset = granular.randomness * grainSizeSec * (Math.random() * 2 - 1);
      let readPos = sourcePos + randomOffset * sampleRate;

      // Handle reverse
      if (granular.reverse) {
        readPos = sourceLength - readPos - grainSizeSamples;
      }

      // Clamp read position
      readPos = Math.max(0, Math.min(readPos, sourceLength - grainSizeSamples));
      const readPosInt = Math.floor(readPos);
      const availableSamples = Math.min(grainSizeSamples, sourceLength - readPosInt);
      if (availableSamples <= 0) break;

      // Create grain buffer with Hann window envelope
      const grainBuffer = offlineCtx.createBuffer(
        sourceBuffer.numberOfChannels,
        availableSamples,
        sampleRate,
      );

      for (let ch = 0; ch < sourceBuffer.numberOfChannels; ch++) {
        const src = sourceBuffer.getChannelData(ch);
        const dst = grainBuffer.getChannelData(ch);
        for (let s = 0; s < availableSamples; s++) {
          const idx = granular.reverse
            ? readPosInt + availableSamples - 1 - s
            : readPosInt + s;
          dst[s] = (src[idx] || 0) * (hannWin[s] || 0);
        }
      }

      // Schedule grain
      const grainNode = offlineCtx.createBufferSource();
      grainNode.buffer = grainBuffer;
      // Pitch shift via detune (cents)
      grainNode.detune.value = granular.pitchShift * 100;
      grainNode.connect(currentNode);
      grainNode.start(outputTime);

      // Advance
      outputTime += hopSec;
      sourcePos += hopSec * granular.playbackRate * sampleRate;

      // Safety: stop if source is exhausted
      if (sourcePos >= sourceLength) break;
    }

    return offlineCtx.startRendering();
  }

  // -----------------------------------------------------------------------
  // 4. Static: Default Chain
  // -----------------------------------------------------------------------

  static defaultChain(): DSPEffectChain {
    return {
      granular: {
        grainSize: 0.1,
        overlap: 0.5,
        pitchShift: 0,
        playbackRate: 1,
        randomness: 0,
        reverse: false,
      },
      filters: [],
      distortion: 0,
      reverbMix: 0,
      delayTime: 0,
      delayFeedback: 0,
    };
  }

  // -----------------------------------------------------------------------
  // 5. Static: Preset Chains
  // -----------------------------------------------------------------------

  static presetChains(): Record<string, { label: string; chain: DSPEffectChain }> {
    return {
      darker: {
        label: 'Darker',
        chain: {
          granular: { grainSize: 0.1, overlap: 0.5, pitchShift: -3, playbackRate: 1, randomness: 0, reverse: false },
          filters: [{ type: 'lowpass', frequency: 2000, Q: 0.7, gain: 0 }],
          distortion: 0,
          reverbMix: 0.2,
          delayTime: 0,
          delayFeedback: 0,
        },
      },
      brighter: {
        label: 'Brighter',
        chain: {
          granular: { grainSize: 0.1, overlap: 0.5, pitchShift: 2, playbackRate: 1.1, randomness: 0, reverse: false },
          filters: [{ type: 'highshelf', frequency: 4000, Q: 1, gain: 6 }],
          distortion: 0,
          reverbMix: 0,
          delayTime: 0,
          delayFeedback: 0,
        },
      },
      underwater: {
        label: 'Underwater',
        chain: {
          granular: { grainSize: 0.1, overlap: 0.5, pitchShift: 0, playbackRate: 0.7, randomness: 0.1, reverse: false },
          filters: [{ type: 'lowpass', frequency: 800, Q: 2, gain: 0 }],
          distortion: 0,
          reverbMix: 0.6,
          delayTime: 0,
          delayFeedback: 0,
        },
      },
      glitchy: {
        label: 'Glitchy',
        chain: {
          granular: { grainSize: 0.02, overlap: 0.5, pitchShift: 5, playbackRate: 1, randomness: 0.8, reverse: false },
          filters: [],
          distortion: 0.3,
          reverbMix: 0,
          delayTime: 0,
          delayFeedback: 0,
        },
      },
      ethereal: {
        label: 'Ethereal',
        chain: {
          granular: { grainSize: 0.3, overlap: 1.5, pitchShift: 0, playbackRate: 1, randomness: 0, reverse: false },
          filters: [],
          distortion: 0,
          reverbMix: 0.5,
          delayTime: 0.4,
          delayFeedback: 0.3,
        },
      },
    };
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

let instance: DSPProcessor | null = null;

export function getDSPProcessor(): DSPProcessor {
  if (!instance) {
    instance = new DSPProcessor();
  }
  return instance;
}

export { DSPProcessor };
