'use client';

import { useState, useCallback, useRef } from 'react';
import { FlaskConical } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { extractWaveform } from '../../lib/waveformExtractor';
import { getMockMidiExtraction, getMockSpectralFeatures } from '../../data/mockAudioData';
import type {
  LabPipeline,
  VelocityCurve,
  MidiExtractionResult,
  InstrumentSwap,
  SpectralFeatures,
  DSPEffectChain,
  GeneratedAudioResult,
} from '../../types';
import { LAB_PIPELINE_STYLES } from '../../types';

import AudioInputPanel from './AudioInputPanel';
import MidiBridgePanel from './MidiBridgePanel';
import CharacterModifyPanel from './CharacterModifyPanel';
import OutputPreview from './OutputPreview';
import LabCopilot from './LabCopilot';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

interface LabTabProps {
  onGenerated: (result: GeneratedAudioResult) => void;
}

export default function LabTab({ onGenerated }: LabTabProps) {
  // ── Pipeline State ──
  const [activePipeline, setActivePipeline] = useState<LabPipeline>('midi-bridge');

  // ── Source Audio ──
  const [sourceAudioUrl, setSourceAudioUrl] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState<string | null>(null);
  const [sourceDuration, setSourceDuration] = useState(0);
  const [sourceWaveform, setSourceWaveform] = useState<number[]>([]);
  const sourceBufferRef = useRef<AudioBuffer | null>(null);

  // ── MIDI Bridge State ──
  const [midiExtraction, setMidiExtraction] = useState<MidiExtractionResult | null>(null);
  const [instrumentSwaps, setInstrumentSwaps] = useState<InstrumentSwap[]>([]);
  const [globalTransposition, setGlobalTransposition] = useState(0);
  const [globalVelocityCurve, setGlobalVelocityCurve] = useState<VelocityCurve>('linear');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isMidiPlaying, setIsMidiPlaying] = useState(false);
  const [isMidiRendering, setIsMidiRendering] = useState(false);

  // ── Character Modify State ──
  const [spectralFeatures, setSpectralFeatures] = useState<SpectralFeatures | null>(null);
  const [effectChain, setEffectChain] = useState<DSPEffectChain>({
    granular: { grainSize: 0.1, overlap: 0.5, pitchShift: 0, playbackRate: 1, randomness: 0, reverse: false },
    filters: [],
    distortion: 0,
    reverbMix: 0,
    delayTime: 0,
    delayFeedback: 0,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isDspRendering, setIsDspRendering] = useState(false);
  const previewRef = useRef<{ stop: () => void; updateChain: (c: DSPEffectChain) => void } | null>(null);

  // ── Output State ──
  const [outputWaveform, setOutputWaveform] = useState<number[]>([]);
  const [outputAudioUrl, setOutputAudioUrl] = useState<string | null>(null);
  const [outputDuration, setOutputDuration] = useState(0);

  // ── Mock audio playback ref ──
  const mockAudioRef = useRef<HTMLAudioElement | null>(null);

  // ────────────────────────────────────────────────────────────
  // Source Audio Loading
  // ────────────────────────────────────────────────────────────

  const handleLoadAudio = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    setSourceAudioUrl(url);
    setSourceName(file.name);

    // Reset state
    setMidiExtraction(null);
    setInstrumentSwaps([]);
    setSpectralFeatures(null);
    setOutputWaveform([]);
    setOutputAudioUrl(null);

    // Decode to AudioBuffer
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new AudioContext();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    sourceBufferRef.current = audioBuffer;
    setSourceDuration(audioBuffer.duration);

    // Extract waveform for visualization
    const waveform = extractWaveform(audioBuffer, 64);
    setSourceWaveform(waveform);

    // Always run spectral analysis — BPM/key are valuable for both pipelines
    runSpectralAnalysis(audioBuffer);

    audioCtx.close();
  }, []);

  const handleClearSource = useCallback(() => {
    if (sourceAudioUrl) URL.revokeObjectURL(sourceAudioUrl);
    setSourceAudioUrl(null);
    setSourceName(null);
    setSourceDuration(0);
    setSourceWaveform([]);
    sourceBufferRef.current = null;
    setMidiExtraction(null);
    setInstrumentSwaps([]);
    setSpectralFeatures(null);
    setOutputWaveform([]);
    setOutputAudioUrl(null);
    previewRef.current?.stop();
    previewRef.current = null;
    mockAudioRef.current?.pause();
    mockAudioRef.current = null;
    setIsPreviewing(false);
  }, [sourceAudioUrl]);

  // ────────────────────────────────────────────────────────────
  // Pipeline switching
  // ────────────────────────────────────────────────────────────

  const handlePipelineChange = useCallback((pipeline: LabPipeline) => {
    setActivePipeline(pipeline);

    // Auto-analyze when switching pipelines with loaded audio (if not already analyzed)
    if (sourceBufferRef.current && !spectralFeatures) {
      runSpectralAnalysis(sourceBufferRef.current);
    }
  }, [spectralFeatures]);

  // ────────────────────────────────────────────────────────────
  // MIDI Bridge Pipeline
  // ────────────────────────────────────────────────────────────

  const handleExtractMidi = useCallback(async () => {
    if (!sourceBufferRef.current) return;
    setIsExtracting(true);

    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 1500));
      setMidiExtraction(getMockMidiExtraction());
      setIsExtracting(false);
      return;
    }

    try {
      const { getMidiProcessor } = await import('../../lib/midiProcessor');
      const processor = getMidiProcessor();
      const result = await processor.extractMidi(sourceBufferRef.current);
      setMidiExtraction(result);
    } catch (err) {
      console.error('MIDI extraction failed:', err);
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const handleMidiPlay = useCallback(async () => {
    if (!midiExtraction || isMidiPlaying) return;
    setIsMidiPlaying(true);

    if (USE_MOCK) {
      // Play source audio as stand-in for resynthesized MIDI
      if (sourceAudioUrl) {
        const audio = new Audio(sourceAudioUrl);
        audio.onended = () => setIsMidiPlaying(false);
        audio.play();
        mockAudioRef.current = audio;
      } else {
        setTimeout(() => setIsMidiPlaying(false), 3000);
      }
      return;
    }

    try {
      const audioCtx = new AudioContext();
      const { getMidiProcessor } = await import('../../lib/midiProcessor');
      const processor = getMidiProcessor();
      const result = await processor.resynthesize(
        audioCtx, midiExtraction, instrumentSwaps, globalTransposition, globalVelocityCurve
      );

      setTimeout(() => {
        result.stop();
        setIsMidiPlaying(false);
      }, midiExtraction.duration * 1000);
    } catch (err) {
      console.error('MIDI playback failed:', err);
      setIsMidiPlaying(false);
    }
  }, [midiExtraction, isMidiPlaying, instrumentSwaps, globalTransposition, globalVelocityCurve, sourceAudioUrl]);

  const handleMidiStop = useCallback(() => {
    mockAudioRef.current?.pause();
    mockAudioRef.current = null;
    setIsMidiPlaying(false);
  }, []);

  const handleMidiRender = useCallback(async () => {
    if (!midiExtraction) return;
    setIsMidiRendering(true);

    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 2000));
      setOutputWaveform(Array.from({ length: 64 }, () => Math.random() * 0.8 + 0.1));
      setOutputDuration(midiExtraction.duration);
      setOutputAudioUrl(sourceAudioUrl);
      setIsMidiRendering(false);
      return;
    }

    try {
      const { getMidiProcessor } = await import('../../lib/midiProcessor');
      const processor = getMidiProcessor();
      const rendered = await processor.renderToBuffer(
        midiExtraction, instrumentSwaps, globalTransposition, globalVelocityCurve
      );

      const waveform = extractWaveform(rendered, 64);
      setOutputWaveform(waveform);
      setOutputDuration(rendered.duration);

      const { encodeWAV } = await import('../../lib/wavEncoder');
      const wavBuffer = encodeWAV(rendered);
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      setOutputAudioUrl(url);
    } catch (err) {
      console.error('MIDI render failed:', err);
    } finally {
      setIsMidiRendering(false);
    }
  }, [midiExtraction, instrumentSwaps, globalTransposition, globalVelocityCurve, sourceAudioUrl]);

  const handleMidiSendToMixer = useCallback(() => {
    if (!outputAudioUrl) return;
    onGenerated({
      name: `MIDI Resynth ${new Date().toLocaleTimeString()}`,
      type: 'music',
      audioUrl: outputAudioUrl,
      duration: outputDuration,
    });
  }, [outputAudioUrl, outputDuration, onGenerated]);

  // ────────────────────────────────────────────────────────────
  // Character Modify Pipeline
  // ────────────────────────────────────────────────────────────

  const runSpectralAnalysis = useCallback(async (buffer: AudioBuffer) => {
    setIsAnalyzing(true);

    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 800));
      setSpectralFeatures(getMockSpectralFeatures());
      setIsAnalyzing(false);
      return;
    }

    try {
      const { getDSPProcessor } = await import('../../lib/dspProcessor');
      const processor = getDSPProcessor();
      const features = await processor.analyzeSpectral(buffer);
      setSpectralFeatures(features);
    } catch (err) {
      console.error('Spectral analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleDspPreview = useCallback(async () => {
    if (!sourceAudioUrl) return;

    if (USE_MOCK) {
      // Play source audio as stand-in for DSP-processed preview
      const audio = new Audio(sourceAudioUrl);
      audio.onended = () => setIsPreviewing(false);
      audio.play();
      mockAudioRef.current = audio;
      setIsPreviewing(true);
      return;
    }

    try {
      const { getDSPProcessor } = await import('../../lib/dspProcessor');
      const processor = getDSPProcessor();
      const preview = await processor.startPreview(sourceAudioUrl, effectChain);
      previewRef.current = preview;
      setIsPreviewing(true);
    } catch (err) {
      console.error('DSP preview failed:', err);
    }
  }, [sourceAudioUrl, effectChain]);

  const handleDspStopPreview = useCallback(() => {
    previewRef.current?.stop();
    previewRef.current = null;
    mockAudioRef.current?.pause();
    mockAudioRef.current = null;
    setIsPreviewing(false);
  }, []);

  const handleChainChange = useCallback((chain: DSPEffectChain) => {
    setEffectChain(chain);
    if (previewRef.current) {
      previewRef.current.updateChain(chain);
    }
  }, []);

  const handleDspRender = useCallback(async () => {
    if (!sourceBufferRef.current) return;
    setIsDspRendering(true);

    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 2000));
      setOutputWaveform(Array.from({ length: 64 }, () => Math.random() * 0.8 + 0.1));
      setOutputDuration(sourceDuration);
      setOutputAudioUrl(sourceAudioUrl);
      setIsDspRendering(false);
      return;
    }

    try {
      const { getDSPProcessor } = await import('../../lib/dspProcessor');
      const processor = getDSPProcessor();
      const rendered = await processor.renderToBuffer(sourceBufferRef.current, effectChain);

      const waveform = extractWaveform(rendered, 64);
      setOutputWaveform(waveform);
      setOutputDuration(rendered.duration);

      const { encodeWAV } = await import('../../lib/wavEncoder');
      const wavBuffer = encodeWAV(rendered);
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      setOutputAudioUrl(url);
    } catch (err) {
      console.error('DSP render failed:', err);
    } finally {
      setIsDspRendering(false);
    }
  }, [effectChain, sourceDuration, sourceAudioUrl]);

  const handleDspSendToMixer = useCallback(() => {
    if (!outputAudioUrl) return;
    onGenerated({
      name: `DSP Transform ${new Date().toLocaleTimeString()}`,
      type: 'music',
      audioUrl: outputAudioUrl,
      duration: outputDuration,
    });
  }, [outputAudioUrl, outputDuration, onGenerated]);

  // ── Copilot callbacks ──
  const handleInstrumentSuggestions = useCallback((suggestions: InstrumentSwap[]) => {
    setInstrumentSwaps(suggestions);
  }, []);

  const handleDSPChainResult = useCallback((chain: DSPEffectChain) => {
    handleChainChange(chain);
  }, [handleChainChange]);

  // ── Derived state ──
  const hasSource = !!sourceAudioUrl;
  const hasOutput = !!outputAudioUrl;
  const pipelineColor = activePipeline === 'midi-bridge'
    ? { rgb: '34, 211, 238', hex: '#22d3ee' }
    : { rgb: '217, 70, 239', hex: '#d946ef' };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header — Gradient with ambient glow */}
      <div
        className="shrink-0 flex items-center gap-3 h-10 px-4 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%)',
          borderBottom: `1px solid rgba(${pipelineColor.rgb}, 0.1)`,
        }}
      >
        {/* Ambient glow */}
        <div
          className="absolute -top-8 -left-8 w-24 h-24 pointer-events-none"
          style={{ background: `radial-gradient(circle, rgba(${pipelineColor.rgb}, 0.06) 0%, transparent 70%)` }}
        />

        {/* Icon badge with glow */}
        <div className="relative">
          <div
            className="p-1.5 rounded-lg border"
            style={{
              borderColor: `rgba(${pipelineColor.rgb}, 0.25)`,
              background: `rgba(${pipelineColor.rgb}, 0.08)`,
              boxShadow: `0 0 12px rgba(${pipelineColor.rgb}, 0.1)`,
            }}
          >
            <FlaskConical className="w-3.5 h-3.5" style={{ color: pipelineColor.hex }} />
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-200 tracking-tight relative">Lab</span>

        {/* Pipeline Toggle */}
        <div className="flex items-center gap-1 ml-3 relative">
          <button
            onClick={() => handlePipelineChange('midi-bridge')}
            className={cn(
              'px-2.5 py-1 rounded-md text-[11px] font-medium transition-all active:scale-95',
              activePipeline === 'midi-bridge'
                ? 'bg-cyan-500/15 text-cyan-400'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            MIDI Bridge
          </button>
          <button
            onClick={() => handlePipelineChange('character-modify')}
            className={cn(
              'px-2.5 py-1 rounded-md text-[11px] font-medium transition-all active:scale-95',
              activePipeline === 'character-modify'
                ? 'bg-fuchsia-500/15 text-fuchsia-400'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            Character Modify
          </button>
        </div>

        {/* Pipeline description */}
        <span className="text-[10px] text-slate-500 ml-auto relative">
          {LAB_PIPELINE_STYLES[activePipeline].description}
        </span>
      </div>

      {/* 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Audio Input */}
        <div className="w-56 shrink-0 border-r border-slate-800/30 overflow-y-auto">
          <AudioInputPanel
            activePipeline={activePipeline}
            sourceAudioUrl={sourceAudioUrl}
            sourceName={sourceName}
            sourceDuration={sourceDuration}
            waveformData={sourceWaveform}
            spectralFeatures={spectralFeatures}
            isAnalyzing={isAnalyzing}
            onLoadAudio={handleLoadAudio}
            onClear={handleClearSource}
          />
        </div>

        {/* Center: Pipeline-Specific Panel */}
        <div className="flex-1 overflow-y-auto">
          {activePipeline === 'midi-bridge' ? (
            <MidiBridgePanel
              extraction={midiExtraction}
              swaps={instrumentSwaps}
              globalTransposition={globalTransposition}
              globalVelocityCurve={globalVelocityCurve}
              isExtracting={isExtracting}
              isPlaying={isMidiPlaying}
              isRendering={isMidiRendering}
              hasOutput={hasOutput}
              onExtract={handleExtractMidi}
              onSwapChange={setInstrumentSwaps}
              onTranspositionChange={setGlobalTransposition}
              onVelocityCurveChange={setGlobalVelocityCurve}
              onPlay={handleMidiPlay}
              onStop={handleMidiStop}
              onRender={handleMidiRender}
              onSendToMixer={handleMidiSendToMixer}
            />
          ) : (
            <CharacterModifyPanel
              spectralFeatures={spectralFeatures}
              effectChain={effectChain}
              isProcessing={isAnalyzing}
              isPreviewing={isPreviewing}
              isRendering={isDspRendering}
              hasSource={hasSource}
              hasOutput={hasOutput}
              onChainChange={handleChainChange}
              onPreview={handleDspPreview}
              onStopPreview={handleDspStopPreview}
              onRender={handleDspRender}
              onSendToMixer={handleDspSendToMixer}
            />
          )}
        </div>

        {/* Right: Output Preview */}
        <div className="w-60 shrink-0 border-l border-slate-800/30 overflow-y-auto">
          <OutputPreview
            sourceWaveform={sourceWaveform}
            outputWaveform={outputWaveform}
            outputAudioUrl={outputAudioUrl}
            sourceAudioUrl={sourceAudioUrl}
            outputDuration={outputDuration}
            onGenerated={onGenerated}
          />
        </div>
      </div>

      {/* Bottom: Lab Copilot */}
      <div className="shrink-0 border-t border-slate-800/30 bg-slate-900/40">
        <LabCopilot
          activePipeline={activePipeline}
          midiContext={midiExtraction}
          spectralContext={spectralFeatures}
          onInstrumentSuggestions={handleInstrumentSuggestions}
          onDSPChainResult={handleDSPChainResult}
          onPipelineChange={handlePipelineChange}
        />
      </div>
    </div>
  );
}
