/* eslint-disable @typescript-eslint/no-explicit-any */

declare module 'essentia.js/dist/essentia.js-core.es.js' {
  class Essentia {
    constructor(wasmModule: any, isDebug?: boolean);
    version: string;
    algorithmNames: string;

    arrayToVector(inputArray: Float32Array): any;
    vectorToArray(inputVector: any): Float32Array;
    audioBufferToMonoSignal(buffer: AudioBuffer): Float32Array;

    FrameGenerator(inputAudioData: Float32Array, frameSize?: number, hopSize?: number): any;
    Windowing(frame: any, normalized?: boolean, size?: number, type?: string, zeroPadding?: number, zeroPhase?: boolean): any;
    Spectrum(frame: any, size?: number): any;

    RMS(array: any): { rms: number };
    Flatness(array: any): { flatness: number };
    RollOff(spectrum: any, cutoff?: number, sampleRate?: number): { rollOff: number };
    ZeroCrossingRate(signal: any, threshold?: number): { zeroCrossingRate: number };
    SpectralCentroidTime(array: any, sampleRate?: number): { centroid: number };
    Centroid(array: any, range?: number): { centroid: number };
    MFCC(spectrum: any, dctType?: number, highFrequencyBound?: number, inputSize?: number, liftering?: number, logType?: string, lowFrequencyBound?: number, normalize?: string, numberBands?: number, numberCoefficients?: number, sampleRate?: number, silenceThreshold?: number, type?: string, warpingFormula?: string, weighting?: string): { bands: any; mfcc: any };
    PitchYin(signal: any, frameSize?: number, interpolate?: boolean, maxFrequency?: number, minFrequency?: number, sampleRate?: number, tolerance?: number): { pitch: number; pitchConfidence: number };

    PercivalBpmEstimator(signal: any, frameSize?: number, frameSizeOSS?: number, hopSize?: number, hopSizeOSS?: number, maxBPM?: number, minBPM?: number, sampleRate?: number): { bpm: number };
    KeyExtractor(audio: any, averageDetuningCorrection?: boolean, frameSize?: number, hopSize?: number, hpcpSize?: number, maxFrequency?: number, maximumSpectralPeaks?: number, minFrequency?: number, pcpThreshold?: number, profileType?: string, sampleRate?: number): { key: string; scale: string; strength: number };
    BeatTrackerDegara(signal: any, maxTempo?: number, minTempo?: number): { ticks: any };
    BeatTrackerMultiFeature(signal: any, maxTempo?: number, minTempo?: number): { ticks: any; confidence: number };

    shutdown(): void;
    delete(): void;
  }
  export default Essentia;
}

declare module 'essentia.js/dist/essentia-wasm.es.js' {
  function EssentiaWASM(): Promise<any>;
  export default EssentiaWASM;
}
