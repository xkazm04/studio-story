'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  X, Play, Square, Plus, Download, Loader2, ChevronDown,
  Grid3X3, Terminal, Sparkles, Trash2, Volume2, VolumeX,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useCLIFeature } from '@/app/hooks/useCLIFeature';
import { CompactTerminal } from '@/cli';
import { getBeatSynthesizer } from '../../lib/beatSynthesizer';
import { extractWaveformFromUrl } from '../../lib/waveformExtractor';
import { MOCK_BEAT_PATTERNS } from '../../data/mockAudioData';
import { INSTRUMENT_TYPE_STYLES } from '../../types';
import type { BeatPattern, BeatTrack, BeatStep, InstrumentType, GeneratedAudioResult } from '../../types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

interface BeatComposerProps {
  onClose: () => void;
  onGenerated?: (result: GeneratedAudioResult) => void;
}

const GENRES = ['electronic', 'hip-hop', 'rock', 'lo-fi', 'jazz', 'dnb', 'ambient', 'latin'];

const ALL_INSTRUMENTS: InstrumentType[] = ['kick', 'snare', 'hihat', 'clap', 'tom', 'cymbal', 'bass', 'pad', 'arp', 'perc'];

function emptyStep(): BeatStep {
  return { active: false, velocity: 0 };
}

function createEmptyPattern(): BeatPattern {
  return {
    name: 'New Pattern',
    bpm: 120,
    swing: 0,
    stepsPerBeat: 4,
    beats: 4,
    bars: 1,
    tracks: [
      { instrument: 'kick', steps: Array.from({ length: 16 }, emptyStep), volume: 0.9, muted: false },
      { instrument: 'snare', steps: Array.from({ length: 16 }, emptyStep), volume: 0.85, muted: false },
      { instrument: 'hihat', steps: Array.from({ length: 16 }, emptyStep), volume: 0.6, muted: false },
    ],
  };
}

function getTotalSteps(pattern: BeatPattern): number {
  return pattern.stepsPerBeat * pattern.beats * pattern.bars;
}

export default function BeatComposer({ onClose, onGenerated }: BeatComposerProps) {
  const [pattern, setPattern] = useState<BeatPattern>(() => MOCK_BEAT_PATTERNS[0] ?? createEmptyPattern());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [genPrompt, setGenPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const stopRef = useRef<{ stop: () => void } | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // CLI feature hook
  const cli = useCLIFeature({
    featureId: 'sound-lab-beats',
    projectId: 'default',
    projectPath: '',
    defaultSkills: ['beat-composer'],
  });

  // Watch CLI completion
  const prevRunningRef = useRef(false);
  useEffect(() => {
    if (prevRunningRef.current && !cli.isRunning && !USE_MOCK) {
      // CLI finished — fall back to mock/preset (structured JSON parsing is a future enhancement)
      setIsGenerating(false);
      const preset = MOCK_BEAT_PATTERNS[Math.floor(Math.random() * MOCK_BEAT_PATTERNS.length)];
      if (preset) setPattern({ ...preset });
    }
    prevRunningRef.current = cli.isRunning;
  }, [cli.isRunning]);

  const totalSteps = useMemo(() => getTotalSteps(pattern), [pattern]);

  // ============ Step Grid Interaction ============

  const toggleStep = useCallback((trackIdx: number, stepIdx: number, shiftKey: boolean) => {
    setPattern((prev) => {
      const tracks = [...prev.tracks];
      const track = { ...tracks[trackIdx]! };
      const steps = [...track.steps];
      const step = steps[stepIdx]!;

      if (shiftKey && step.active) {
        // Toggle accent
        steps[stepIdx] = { ...step, accent: !step.accent, velocity: step.accent ? 0.7 : 1.0 };
      } else {
        // Toggle active
        steps[stepIdx] = step.active
          ? { active: false, velocity: 0 }
          : { active: true, velocity: 0.7 };
      }

      track.steps = steps;
      tracks[trackIdx] = track;
      return { ...prev, tracks };
    });
  }, []);

  const toggleTrackMute = useCallback((trackIdx: number) => {
    setPattern((prev) => {
      const tracks = [...prev.tracks];
      tracks[trackIdx] = { ...tracks[trackIdx]!, muted: !tracks[trackIdx]!.muted };
      return { ...prev, tracks };
    });
  }, []);

  const removeTrack = useCallback((trackIdx: number) => {
    setPattern((prev) => ({
      ...prev,
      tracks: prev.tracks.filter((_, i) => i !== trackIdx),
    }));
  }, []);

  const addTrack = useCallback((instrument: InstrumentType) => {
    setPattern((prev) => ({
      ...prev,
      tracks: [
        ...prev.tracks,
        {
          instrument,
          steps: Array.from({ length: getTotalSteps(prev) }, emptyStep),
          volume: 0.7,
          muted: false,
        },
      ],
    }));
    setShowAddTrack(false);
  }, []);

  // ============ Live Preview ============

  const handlePlayStop = useCallback(() => {
    if (isPlaying) {
      stopRef.current?.stop();
      stopRef.current = null;
      setIsPlaying(false);
      setCurrentStep(-1);
      return;
    }

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const synth = getBeatSynthesizer();
    const handle = synth.startLivePreview(ctx, pattern, ctx.destination, (step) => {
      setCurrentStep(step);
    });
    stopRef.current = handle;
    setIsPlaying(true);

    // Auto-stop after pattern duration
    const duration = (pattern.beats * pattern.bars * 60) / pattern.bpm;
    setTimeout(() => {
      handle.stop();
      setIsPlaying(false);
      setCurrentStep(-1);
    }, duration * 1000 + 100);
  }, [isPlaying, pattern]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRef.current?.stop();
    };
  }, []);

  // ============ AI Generation ============

  const handleAIGenerate = useCallback(async () => {
    const prompt = genPrompt.trim() || `${pattern.genre || 'electronic'} beat pattern`;
    setIsGenerating(true);
    setError(null);

    if (USE_MOCK) {
      // Mock: pick a random preset after short delay
      setTimeout(() => {
        const preset = MOCK_BEAT_PATTERNS[Math.floor(Math.random() * MOCK_BEAT_PATTERNS.length)];
        if (preset) setPattern({ ...preset });
        setIsGenerating(false);
      }, 1200);
      return;
    }

    try {
      const res = await fetch('/api/ai/audio/beat-pattern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          genre: pattern.genre,
          bpm: pattern.bpm,
          bars: pattern.bars,
        }),
      });

      const data = await res.json();
      if (data.success && data.pattern) {
        setPattern(data.pattern);
      } else {
        setError(data.error || 'Generation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, [genPrompt, pattern.genre, pattern.bpm, pattern.bars]);

  const handleCLIGenerate = useCallback(() => {
    const prompt = genPrompt.trim() || `Create a ${pattern.genre || 'electronic'} beat pattern at ${pattern.bpm} BPM`;
    setIsGenerating(true);
    setShowTerminal(true);
    cli.executePrompt(prompt, `Beat Composer: ${pattern.genre || 'custom'}`);
  }, [cli, genPrompt, pattern.genre, pattern.bpm]);

  // ============ Export to Library ============

  const handleExport = useCallback(async () => {
    if (!onGenerated) return;
    setError(null);

    try {
      const synth = getBeatSynthesizer();
      const buffer = await synth.renderToBuffer(pattern);
      const audioUrl = synth.bufferToDataUrl(buffer);
      const duration = (pattern.beats * pattern.bars * 60) / pattern.bpm;

      onGenerated({
        name: pattern.name || 'Beat Pattern',
        type: 'music',
        audioUrl,
        duration,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  }, [pattern, onGenerated]);

  // ============ Controls ============

  const updateBPM = useCallback((val: number) => {
    setPattern((prev) => ({ ...prev, bpm: Math.max(30, Math.min(300, val)) }));
  }, []);

  const updateSwing = useCallback((val: number) => {
    setPattern((prev) => ({ ...prev, swing: Math.max(0, Math.min(1, val)) }));
  }, []);

  const loadPreset = useCallback((preset: BeatPattern) => {
    setPattern({ ...preset });
    setShowPresets(false);
  }, []);

  // Find instruments not yet in the pattern
  const availableInstruments = useMemo(
    () => ALL_INSTRUMENTS.filter((inst) => !pattern.tracks.some((t) => t.instrument === inst)),
    [pattern.tracks]
  );

  return (
    <div className="shrink-0 border-b border-slate-700/40 bg-slate-950/50">
      {/* Header */}
      <div className="flex items-center gap-2 h-9 px-3 bg-slate-900/40 border-b border-slate-800/30">
        <Grid3X3 className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-semibold text-slate-200">Beat Composer</span>
        {pattern.genre && (
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">{pattern.genre}</span>
        )}
        {pattern.reasoning && (
          <span className="text-[11px] text-slate-500 truncate max-w-64 ml-1" title={pattern.reasoning}>
            {pattern.reasoning}
          </span>
        )}

        <div className="flex-1" />

        {/* AI Prompt Input */}
        <input
          type="text"
          value={genPrompt}
          onChange={(e) => setGenPrompt(e.target.value)}
          placeholder="Describe a beat..."
          className="w-48 px-2 py-1 bg-slate-950/60 border border-slate-700/40 rounded text-[11px] text-slate-300
            placeholder:text-slate-500 focus:outline-none focus:border-amber-500/40 transition-colors"
        />

        {/* CLI Generate */}
        <button
          onClick={handleCLIGenerate}
          disabled={isGenerating}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors',
            isGenerating ? 'text-slate-500 cursor-not-allowed' : 'text-slate-300 hover:text-amber-400 hover:bg-amber-500/10'
          )}
          title="Generate with CLI (shows reasoning)"
        >
          <Terminal className="w-3 h-3" />
          CLI
        </button>

        {/* Direct AI Generate */}
        <button
          onClick={handleAIGenerate}
          disabled={isGenerating}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors',
            isGenerating ? 'text-slate-500 cursor-not-allowed' : 'text-amber-400 hover:bg-amber-500/10'
          )}
          title="Generate instantly (no terminal)"
        >
          {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          AI Gen
        </button>

        <button onClick={onClose} className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Controls Row */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-slate-800/20">
        {/* BPM */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-slate-400">BPM</span>
          <input
            type="number"
            value={pattern.bpm}
            onChange={(e) => updateBPM(Number(e.target.value))}
            className="w-12 px-1.5 py-0.5 bg-slate-900/60 border border-slate-700/40 rounded text-[11px] text-slate-200
              text-center font-mono focus:outline-none focus:border-amber-500/40"
          />
        </div>

        {/* Swing */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-slate-400">Swing</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(pattern.swing * 100)}
            onChange={(e) => updateSwing(Number(e.target.value) / 100)}
            className="w-16 h-1 accent-amber-500"
          />
          <span className="text-[11px] text-slate-500 font-mono w-6">{Math.round(pattern.swing * 100)}%</span>
        </div>

        {/* Bars */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-slate-400">Bars</span>
          <select
            value={pattern.bars}
            onChange={(e) => {
              const newBars = Number(e.target.value);
              setPattern((prev) => {
                const newTotalSteps = prev.stepsPerBeat * prev.beats * newBars;
                return {
                  ...prev,
                  bars: newBars,
                  tracks: prev.tracks.map((t) => ({
                    ...t,
                    steps: Array.from({ length: newTotalSteps }, (_, i) => t.steps[i] ?? emptyStep()),
                  })),
                };
              });
            }}
            className="px-1.5 py-0.5 bg-slate-900/60 border border-slate-700/40 rounded text-[11px] text-slate-200
              focus:outline-none focus:border-amber-500/40"
          >
            {[1, 2, 4].map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div className="w-px h-4 bg-slate-700/40" />

        {/* Play/Stop */}
        <button
          onClick={handlePlayStop}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors',
            isPlaying
              ? 'bg-orange-600 text-white'
              : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'
          )}
        >
          {isPlaying ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          {isPlaying ? 'Stop' : 'Play'}
        </button>

        {isPlaying && (
          <span className="text-[11px] text-slate-400 font-mono">
            Step {currentStep + 1}/{totalSteps}
          </span>
        )}

        <div className="flex-1" />

        {/* Add Track */}
        <div className="relative">
          <button
            onClick={() => setShowAddTrack(!showAddTrack)}
            disabled={availableInstruments.length === 0}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-30"
          >
            <Plus className="w-3 h-3" /> Track
          </button>
          {showAddTrack && (
            <div className="absolute bottom-full right-0 mb-1 z-20 min-w-[120px] rounded-md border border-slate-700/50 bg-slate-900 shadow-xl shadow-black/30">
              {availableInstruments.map((inst) => {
                const style = INSTRUMENT_TYPE_STYLES[inst];
                return (
                  <button
                    key={inst}
                    onClick={() => addTrack(inst)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800/60 transition-colors"
                  >
                    <span className={cn('w-2 h-2 rounded-sm', style.bgClass)} />
                    {style.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Presets */}
        <div className="relative">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
          >
            Presets <ChevronDown className="w-3 h-3" />
          </button>
          {showPresets && (
            <div className="absolute bottom-full right-0 mb-1 z-20 min-w-[160px] rounded-md border border-slate-700/50 bg-slate-900 shadow-xl shadow-black/30">
              {MOCK_BEAT_PATTERNS.map((preset, i) => (
                <button
                  key={i}
                  onClick={() => loadPreset(preset)}
                  className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800/60 transition-colors"
                >
                  <span className="font-medium block">{preset.name}</span>
                  <span className="text-[11px] text-slate-500">{preset.bpm} BPM / {preset.genre}</span>
                </button>
              ))}
              <div className="border-t border-slate-700/40" />
              <button
                onClick={() => { setPattern(createEmptyPattern()); setShowPresets(false); }}
                className="w-full px-3 py-2 text-left text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
              >
                Empty Pattern
              </button>
            </div>
          )}
        </div>

        {/* Export */}
        <button
          onClick={handleExport}
          disabled={!onGenerated}
          className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium
            bg-amber-600/80 hover:bg-amber-500 text-white transition-colors disabled:opacity-40"
        >
          <Download className="w-3 h-3" /> Export
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 py-1 bg-red-500/5 border-b border-red-500/20">
          <span className="text-[11px] text-red-400">{error}</span>
        </div>
      )}

      {/* Step Grid */}
      <div className="px-3 py-2 overflow-x-auto">
        {/* Beat markers */}
        <div className="flex items-center mb-1">
          <div className="w-20 shrink-0" />
          {Array.from({ length: totalSteps }, (_, i) => {
            const isBeatStart = i % pattern.stepsPerBeat === 0;
            const beatNum = Math.floor(i / pattern.stepsPerBeat) + 1;
            return (
              <div
                key={i}
                className={cn(
                  'w-6 h-4 flex items-center justify-center shrink-0',
                  currentStep === i && 'bg-amber-500/20 rounded'
                )}
              >
                {isBeatStart ? (
                  <span className="text-[10px] text-slate-400 font-mono">{beatNum}</span>
                ) : (
                  <span className="text-[10px] text-slate-600">.</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Tracks */}
        {pattern.tracks.map((track, trackIdx) => {
          const style = INSTRUMENT_TYPE_STYLES[track.instrument];
          return (
            <div key={`${track.instrument}-${trackIdx}`} className="flex items-center mb-0.5 group/track">
              {/* Track label + controls */}
              <div className="w-20 shrink-0 flex items-center gap-1 pr-2">
                <button
                  onClick={() => toggleTrackMute(trackIdx)}
                  className={cn(
                    'w-4 h-4 rounded flex items-center justify-center transition-colors',
                    track.muted ? 'text-red-400' : 'text-slate-500 hover:text-slate-300'
                  )}
                  title={track.muted ? 'Unmute' : 'Mute'}
                >
                  {track.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                </button>
                <span className={cn('text-[11px] font-medium truncate', style.textClass)}>
                  {style.label}
                </span>
                <button
                  onClick={() => removeTrack(trackIdx)}
                  className="ml-auto opacity-0 group-hover/track:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                  title="Remove track"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {/* Steps */}
              {track.steps.map((step, stepIdx) => {
                const isBeatBoundary = stepIdx % pattern.stepsPerBeat === 0 && stepIdx > 0;
                return (
                  <button
                    key={stepIdx}
                    onClick={(e) => toggleStep(trackIdx, stepIdx, e.shiftKey)}
                    className={cn(
                      'w-6 h-6 shrink-0 rounded-sm border transition-all',
                      isBeatBoundary && 'ml-px',
                      currentStep === stepIdx && 'ring-1 ring-amber-400/50',
                      step.active
                        ? cn(
                            style.bgClass,
                            'border-transparent',
                            step.accent && 'ring-1 ring-white/30',
                            track.muted && 'opacity-30'
                          )
                        : 'border-slate-800/40 hover:border-slate-700/60 bg-slate-900/30'
                    )}
                    title={step.active ? `v:${step.velocity.toFixed(1)}${step.accent ? ' (accent)' : ''}` : 'Click to add'}
                  >
                    {step.active && (
                      <div
                        className={cn('w-full h-full rounded-sm', style.bgClass)}
                        style={{ opacity: 0.3 + step.velocity * 0.7 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* CLI Terminal */}
      {showTerminal && !USE_MOCK && (cli.isRunning || isGenerating) && (
        <div className="border-t border-slate-800/30 max-h-28 overflow-hidden">
          <CompactTerminal {...cli.terminalProps} />
        </div>
      )}
    </div>
  );
}
