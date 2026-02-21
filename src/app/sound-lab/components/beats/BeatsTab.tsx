'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Grid3X3 } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { getBeatSynthesizer } from '../../lib/beatSynthesizer';
import { getSamplePlayer } from '../../lib/samplePlayer';
import { MOCK_BEAT_PATTERNS } from '../../data/mockAudioData';
import { INSTRUMENT_TYPE_STYLES } from '../../types';
import type { BeatPattern, BeatStep, BeatTrack, BeatTrackSource, BeatSample, InstrumentType, GeneratedAudioResult } from '../../types';
import StepGrid from './StepGrid';
import TransportBar from './TransportBar';
import DrumPad from './DrumPad';
import InstrumentRack from './InstrumentRack';
import BeatsCopilot from './BeatsCopilot';
import SampleBrowser from './SampleBrowser';

const ALL_INSTRUMENTS: InstrumentType[] = ['kick', 'snare', 'hihat', 'clap', 'tom', 'cymbal', 'bass', 'pad', 'arp', 'perc'];

// QWERTY key → instrument mapping
const KEY_MAP: Record<string, InstrumentType> = {
  KeyQ: 'kick', KeyW: 'snare', KeyE: 'hihat', KeyR: 'clap', KeyT: 'tom',
  KeyY: 'cymbal', KeyA: 'bass', KeyS: 'pad', KeyD: 'arp', KeyF: 'perc',
};

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

// Parse compact step string to BeatStep[]
function parseStepString(str: string): BeatStep[] {
  return str.split('').map((ch) => ({
    active: ch !== '.',
    velocity: ch === 'X' ? 1.0 : ch === 'x' ? 0.7 : ch === 'o' ? 0.4 : 0,
    ...(ch === 'X' ? { accent: true } : {}),
  }));
}

interface BeatsTabProps {
  onGenerated: (result: GeneratedAudioResult) => void;
}

export default function BeatsTab({ onGenerated }: BeatsTabProps) {
  // Pattern state
  const [pattern, setPattern] = useState<BeatPattern>(() => MOCK_BEAT_PATTERNS[0] ?? createEmptyPattern());
  const [sampleBank, setSampleBank] = useState<Map<string, BeatSample>>(new Map());

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [recording, setRecording] = useState(false);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Refs
  const stopRef = useRef<{ stop: () => void } | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const currentStepRef = useRef(-1);
  const lastRecordedStepRef = useRef<Map<InstrumentType, number>>(new Map());
  const previewAudioRef = useRef<{ source: AudioBufferSourceNode } | null>(null);

  const totalSteps = useMemo(() => getTotalSteps(pattern), [pattern]);

  useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);

  const availableInstruments = useMemo(
    () => ALL_INSTRUMENTS.filter((inst) => !pattern.tracks.some((t) => t.instrument === inst)),
    [pattern.tracks]
  );

  // ============ Keyboard Recording ============

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      const instrument = KEY_MAP[e.code];
      if (!instrument) return;
      e.preventDefault();
      setPressedKeys((prev) => new Set(prev).add(e.code));

      // Play sound
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const synth = getBeatSynthesizer();
      const singleHitPattern: BeatPattern = {
        name: 'hit', bpm: 120, swing: 0, stepsPerBeat: 1, beats: 1, bars: 1,
        tracks: [{ instrument, steps: [{ active: true, velocity: 0.8 }], volume: 0.8, muted: false }],
      };
      synth.startLivePreview(ctx, singleHitPattern, ctx.destination);

      // Record
      if (recording && isPlaying && currentStepRef.current >= 0) {
        const step = currentStepRef.current;
        if (lastRecordedStepRef.current.get(instrument) === step) return;
        lastRecordedStepRef.current.set(instrument, step);

        setPattern((prev) => {
          let trackIdx = prev.tracks.findIndex((t) => t.instrument === instrument);
          const tracks = [...prev.tracks];
          if (trackIdx === -1) {
            tracks.push({ instrument, steps: Array.from({ length: getTotalSteps(prev) }, emptyStep), volume: 0.7, muted: false });
            trackIdx = tracks.length - 1;
          }
          const track = { ...tracks[trackIdx]! };
          const steps = [...track.steps];
          steps[step] = { active: true, velocity: 0.8 };
          track.steps = steps;
          tracks[trackIdx] = track;
          return { ...prev, tracks };
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (KEY_MAP[e.code]) {
        setPressedKeys((prev) => { const next = new Set(prev); next.delete(e.code); return next; });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [recording, isPlaying]);

  // ============ Step Grid Interaction ============

  const toggleStep = useCallback((trackIdx: number, stepIdx: number, shiftKey: boolean) => {
    setPattern((prev) => {
      const tracks = [...prev.tracks];
      const track = { ...tracks[trackIdx]! };
      const steps = [...track.steps];
      const step = steps[stepIdx]!;
      if (shiftKey && step.active) {
        steps[stepIdx] = { ...step, accent: !step.accent, velocity: step.accent ? 0.7 : 1.0 };
      } else {
        steps[stepIdx] = step.active ? { active: false, velocity: 0 } : { active: true, velocity: 0.7 };
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
    setPattern((prev) => ({ ...prev, tracks: prev.tracks.filter((_, i) => i !== trackIdx) }));
  }, []);

  const addTrack = useCallback((instrument: InstrumentType) => {
    setPattern((prev) => ({
      ...prev,
      tracks: [...prev.tracks, { instrument, steps: Array.from({ length: getTotalSteps(prev) }, emptyStep), volume: 0.7, muted: false }],
    }));
  }, []);

  // ============ Source Toggle ============

  const toggleSource = useCallback((trackIdx: number) => {
    setPattern((prev) => {
      const tracks = [...prev.tracks];
      const track = tracks[trackIdx] as BeatTrack & { source?: BeatTrackSource };
      const currentMode = track.source?.mode ?? 'synth';
      const newMode = currentMode === 'synth' ? 'sample' : 'synth';
      tracks[trackIdx] = { ...track, source: { mode: newMode, sampleId: track.source?.sampleId } } as BeatTrack;
      return { ...prev, tracks };
    });
  }, []);

  // ============ Sample Loading (File) ============

  const handleLoadSample = useCallback(async (instrument: InstrumentType, file: File) => {
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const sampleId = `sample-${instrument}-${Date.now()}`;
      const player = getSamplePlayer();
      const sample = await player.loadSample(sampleId, file.name.replace(/\.[^.]+$/, ''), dataUrl);

      setSampleBank((prev) => {
        const next = new Map(prev);
        next.set(sampleId, sample);
        return next;
      });

      // Auto-assign to track if exists, auto-switch to sample mode
      setPattern((prev) => {
        const trackIdx = prev.tracks.findIndex((t) => t.instrument === instrument);
        if (trackIdx < 0) return prev;
        const tracks = [...prev.tracks];
        tracks[trackIdx] = { ...tracks[trackIdx]!, source: { mode: 'sample', sampleId } } as BeatTrack;
        return { ...prev, tracks };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sample');
    }
  }, []);

  // ============ Sample Loading (URL — from SampleBrowser drag) ============

  const handleLoadSampleFromUrl = useCallback(async (instrument: InstrumentType, url: string, name: string) => {
    try {
      const sampleId = `sample-${instrument}-${Date.now()}`;
      const player = getSamplePlayer();
      const sample = await player.loadSample(sampleId, name, url);

      setSampleBank((prev) => {
        const next = new Map(prev);
        next.set(sampleId, sample);
        return next;
      });

      // Auto-assign + switch to sample mode, auto-add track if needed
      setPattern((prev) => {
        let trackIdx = prev.tracks.findIndex((t) => t.instrument === instrument);
        if (trackIdx < 0) {
          const newTracks = [...prev.tracks, {
            instrument,
            steps: Array.from({ length: getTotalSteps(prev) }, emptyStep),
            volume: 0.7,
            muted: false,
            source: { mode: 'sample' as const, sampleId },
          }];
          return { ...prev, tracks: newTracks };
        }
        const tracks = [...prev.tracks];
        tracks[trackIdx] = { ...tracks[trackIdx]!, source: { mode: 'sample', sampleId } } as BeatTrack;
        return { ...prev, tracks };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sample from URL');
    }
  }, []);

  const handleRemoveSample = useCallback((instrument: InstrumentType) => {
    setPattern((prev) => {
      const trackIdx = prev.tracks.findIndex((t) => t.instrument === instrument);
      if (trackIdx < 0) return prev;
      const track = prev.tracks[trackIdx] as BeatTrack & { source?: BeatTrackSource };
      const sampleId = track.source?.sampleId;
      if (sampleId) {
        getSamplePlayer().removeSample(sampleId);
        setSampleBank((bank) => { const next = new Map(bank); next.delete(sampleId); return next; });
      }
      const tracks = [...prev.tracks];
      tracks[trackIdx] = { ...tracks[trackIdx]!, source: { mode: 'synth' } } as BeatTrack;
      return { ...prev, tracks };
    });
  }, []);

  // ============ Sample Preview (from SampleBrowser) ============

  const handlePreviewSample = useCallback((url: string) => {
    try { previewAudioRef.current?.source.stop(); } catch { /* already stopped */ }

    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    fetch(url)
      .then((r) => r.arrayBuffer())
      .then((buf) => ctx.decodeAudioData(buf))
      .then((decoded) => {
        const source = ctx.createBufferSource();
        source.buffer = decoded;
        source.connect(ctx.destination);
        source.start();
        previewAudioRef.current = { source };
      })
      .catch(() => { /* silent fail for preview */ });
  }, []);

  // ============ Playback ============

  const handlePlayStop = useCallback(() => {
    if (isPlaying) {
      stopRef.current?.stop();
      stopRef.current = null;
      setIsPlaying(false);
      setCurrentStep(-1);
      lastRecordedStepRef.current.clear();
      return;
    }

    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const synth = getBeatSynthesizer();
    const player = getSamplePlayer();
    const handle = synth.startLivePreview(ctx, pattern, ctx.destination, (step) => setCurrentStep(step), player);
    stopRef.current = handle;
    setIsPlaying(true);

    const duration = (pattern.beats * pattern.bars * 60) / pattern.bpm;
    setTimeout(() => {
      handle.stop();
      setIsPlaying(false);
      setCurrentStep(-1);
      lastRecordedStepRef.current.clear();
    }, duration * 1000 + 100);
  }, [isPlaying, pattern]);

  useEffect(() => () => { stopRef.current?.stop(); }, []);

  // ============ Export & Save ============

  const handleExport = useCallback(async () => {
    setError(null);
    try {
      const synth = getBeatSynthesizer();
      const player = getSamplePlayer();
      const buffer = await synth.renderToBuffer(pattern, player);
      const audioUrl = synth.bufferToDataUrl(buffer);
      const duration = (pattern.beats * pattern.bars * 60) / pattern.bpm;
      onGenerated({ name: pattern.name || 'Beat Pattern', type: 'music', audioUrl, duration });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  }, [pattern, onGenerated]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      const synth = getBeatSynthesizer();
      const player = getSamplePlayer();
      const buffer = await synth.renderToBuffer(pattern, player);
      const audioUrl = synth.bufferToDataUrl(buffer);
      await fetch('/api/ai/audio/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioUrl, name: pattern.name || 'Beat Pattern', type: 'music' }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  }, [pattern]);

  // ============ Transport Controls ============

  const updateBPM = useCallback((val: number) => {
    setPattern((prev) => ({ ...prev, bpm: Math.max(30, Math.min(300, val)) }));
  }, []);

  const updateSwing = useCallback((val: number) => {
    setPattern((prev) => ({ ...prev, swing: Math.max(0, Math.min(1, val)) }));
  }, []);

  const updateBars = useCallback((newBars: number) => {
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
  }, []);

  const loadPreset = useCallback((preset: BeatPattern) => {
    setPattern({ ...preset });
  }, []);

  const clearPattern = useCallback(() => {
    setPattern(createEmptyPattern());
  }, []);

  // ============ CLI Pattern Handlers ============

  const replacePattern = useCallback((newPattern: BeatPattern) => {
    const totalSteps = (newPattern.stepsPerBeat ?? 4) * (newPattern.beats ?? 4) * (newPattern.bars ?? 1);
    setPattern({
      ...newPattern,
      stepsPerBeat: newPattern.stepsPerBeat ?? 4,
      beats: newPattern.beats ?? 4,
      bars: newPattern.bars ?? 1,
      bpm: newPattern.bpm ?? 120,
      swing: newPattern.swing ?? 0,
      tracks: (newPattern.tracks || []).map((t) => ({
        ...t,
        volume: t.volume ?? 0.7,
        muted: t.muted ?? false,
        steps: Array.isArray(t.steps)
          ? typeof t.steps[0] === 'string'
            ? parseStepString((t.steps as unknown as string[])[0] || '')
            : Array.from({ length: totalSteps }, (_, i) => (t.steps[i] as BeatStep) ?? emptyStep())
          : Array.from({ length: totalSteps }, emptyStep),
      })),
    });
  }, []);

  const modifyPattern = useCallback((changes: Record<string, unknown>) => {
    setPattern((prev) => {
      let updated = { ...prev };

      if (typeof changes.bpm === 'number') updated.bpm = changes.bpm;
      if (typeof changes.swing === 'number') updated.swing = changes.swing;
      if (typeof changes.bars === 'number') {
        const newBars = changes.bars as number;
        const newTotalSteps = prev.stepsPerBeat * prev.beats * newBars;
        updated = {
          ...updated,
          bars: newBars,
          tracks: updated.tracks.map((t) => ({
            ...t,
            steps: Array.from({ length: newTotalSteps }, (_, i) => t.steps[i] ?? emptyStep()),
          })),
        };
      }

      if (Array.isArray(changes.tracks)) {
        const trackChanges = changes.tracks as Array<{ instrument: string; steps?: string; volume?: number; muted?: boolean }>;
        const tracks = [...updated.tracks];

        for (const change of trackChanges) {
          const idx = tracks.findIndex((t) => t.instrument === change.instrument);
          if (idx >= 0 && change.steps) {
            const newSteps = parseStepString(change.steps);
            tracks[idx] = {
              ...tracks[idx]!,
              steps: newSteps,
              ...(change.volume !== undefined ? { volume: change.volume } : {}),
              ...(change.muted !== undefined ? { muted: change.muted } : {}),
            };
          } else if (idx < 0 && change.steps) {
            tracks.push({
              instrument: change.instrument as InstrumentType,
              steps: parseStepString(change.steps),
              volume: change.volume ?? 0.7,
              muted: change.muted ?? false,
            });
          }
        }

        updated.tracks = tracks;
      }

      return updated;
    });
  }, []);

  // ============ Render ============

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div
        className="shrink-0 flex items-center gap-3 h-10 px-4 border-b border-orange-500/10 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%)' }}
      >
        {/* Ambient glow */}
        <div
          className="absolute -top-8 -left-8 w-24 h-24 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.06) 0%, transparent 70%)' }}
        />
        <div className="flex items-center gap-2 relative">
          <div
            className="p-1.5 rounded-lg border border-amber-500/25"
            style={{ background: 'rgba(245, 158, 11, 0.08)', boxShadow: '0 0 12px rgba(245, 158, 11, 0.1)' }}
          >
            <Grid3X3 className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-xs font-semibold text-slate-200 tracking-wide">Beat Composer</span>
        </div>
        {pattern.genre && (
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400/80 border border-amber-500/15"
            style={{ textShadow: '0 0 8px rgba(245, 158, 11, 0.3)' }}
          >
            {pattern.genre}
          </span>
        )}
        {pattern.reasoning && (
          <span className="text-[11px] text-slate-500 truncate max-w-80" title={pattern.reasoning}>
            {pattern.reasoning}
          </span>
        )}
      </div>

      {/* 3-Column Layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Compact Instrument Rack */}
        <div className="w-48 shrink-0 border-r border-orange-500/10 overflow-y-auto">
          <InstrumentRack
            pattern={pattern}
            sampleBank={sampleBank}
            onAddTrack={addTrack}
            onRemoveTrack={removeTrack}
            onToggleSource={toggleSource}
            onLoadSample={handleLoadSample}
            onLoadSampleFromUrl={handleLoadSampleFromUrl}
            onRemoveSample={handleRemoveSample}
          />
        </div>

        {/* Center: Grid + Pad + Bottom Copilot */}
        <div className="flex-1 flex flex-col min-w-0">
          <TransportBar
            pattern={pattern}
            isPlaying={isPlaying}
            currentStep={currentStep}
            totalSteps={totalSteps}
            availableInstruments={availableInstruments}
            isSaving={isSaving}
            onPlayStop={handlePlayStop}
            onUpdateBPM={updateBPM}
            onUpdateSwing={updateSwing}
            onUpdateBars={updateBars}
            onAddTrack={addTrack}
            onLoadPreset={loadPreset}
            onClear={clearPattern}
            onExport={handleExport}
            onSave={handleSave}
          />

          {/* Error */}
          {error && (
            <div
              className="shrink-0 flex items-center gap-2 px-3 py-1.5 border-b border-red-500/20"
              style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.04) 0%, rgba(2, 6, 23, 0.6) 100%)' }}
            >
              <span className="text-[11px] text-red-400">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-[10px] text-slate-500 hover:text-slate-300 px-1.5 py-0.5 rounded hover:bg-slate-800/40 transition-all">Dismiss</button>
            </div>
          )}

          {/* Grid + Pad (scrollable) */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            <StepGrid
              pattern={pattern}
              currentStep={currentStep}
              sampleBank={sampleBank}
              onToggleStep={toggleStep}
              onToggleMute={toggleTrackMute}
              onRemoveTrack={removeTrack}
            />
            <DrumPad
              pattern={pattern}
              pressedKeys={pressedKeys}
              recording={recording}
              onToggleRecording={() => setRecording(!recording)}
            />
          </div>

          {/* Bottom: Copilot strip */}
          <div className="shrink-0 border-t border-orange-500/10">
            <BeatsCopilot
              pattern={pattern}
              sampleBank={sampleBank}
              onPatternReplace={replacePattern}
              onPatternModify={modifyPattern}
            />
          </div>
        </div>

        {/* Right: Sample Browser */}
        <div className="w-60 shrink-0 border-l border-orange-500/10">
          <SampleBrowser onPreviewSample={handlePreviewSample} />
        </div>
      </div>
    </div>
  );
}
