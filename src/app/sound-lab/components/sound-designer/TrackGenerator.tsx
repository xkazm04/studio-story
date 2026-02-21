'use client';

import { useState, useCallback } from 'react';
import {
  Wand2, ChevronDown, Scissors, Brain, Music, Zap, Trees,
  Settings2, Loader2, AlertCircle, Volume2, Grid3X3,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type { MusicGenre, AudioAssetType, GeneratedAudioResult } from '../../types';

interface TrackGeneratorProps {
  onOpenStems: () => void;
  onToggleAI: () => void;
  showAIDropdown: boolean;
  onGenerated?: (result: GeneratedAudioResult) => void;
  onToggleBeats?: () => void;
  showBeatComposer?: boolean;
}

const MODES: { value: Exclude<AudioAssetType, 'voice'>; label: string; icon: typeof Music }[] = [
  { value: 'music', label: 'Music', icon: Music },
  { value: 'sfx', label: 'SFX', icon: Zap },
  { value: 'ambience', label: 'Ambience', icon: Trees },
];

const GENRES: { value: MusicGenre; label: string }[] = [
  { value: 'orchestral', label: 'Orchestral' },
  { value: 'electronic', label: 'Electronic' },
  { value: 'ambient', label: 'Ambient' },
  { value: 'rock', label: 'Rock' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'cinematic', label: 'Cinematic' },
];

const DURATIONS = [
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
  { value: 60, label: '1m' },
  { value: 120, label: '2m' },
  { value: 300, label: '5m' },
];

const INSTRUMENTS = ['Piano', 'Strings', 'Drums', 'Synth', 'Guitar', 'Choir', 'Brass', 'Flute'];

export default function TrackGenerator({ onOpenStems, onToggleAI, showAIDropdown, onGenerated, onToggleBeats, showBeatComposer }: TrackGeneratorProps) {
  const [mode, setMode] = useState<Exclude<AudioAssetType, 'voice'>>('music');
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState<MusicGenre>('cinematic');
  const [duration, setDuration] = useState(60);
  const [instruments, setInstruments] = useState<string[]>(['Strings', 'Drums']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ audioUrl: string; name: string } | null>(null);

  // Composition plan state
  const [compositionMode, setCompositionMode] = useState(false);
  const [positiveStyles, setPositiveStyles] = useState('');
  const [negativeStyles, setNegativeStyles] = useState('');
  const [sections, setSections] = useState<{ text: string; duration_ms: number }[]>([
    { text: '', duration_ms: 15000 },
  ]);

  // Dropdown states
  const [showGenreMenu, setShowGenreMenu] = useState(false);
  const [showDurationMenu, setShowDurationMenu] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);

  const toggleInstrument = useCallback((inst: string) => {
    setInstruments((prev) =>
      prev.includes(inst) ? prev.filter((i) => i !== inst) : [...prev, inst]
    );
  }, []);

  const handleGenerate = useCallback(async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) return;

    setIsGenerating(true);
    setGenerationError(null);
    setLastResult(null);

    try {
      // Build the full prompt with genre/instruments context for music mode
      let fullPrompt = trimmedPrompt;
      if (mode === 'music') {
        const instStr = instruments.length > 0 ? ` with ${instruments.join(', ')}` : '';
        fullPrompt = `${genre} ${trimmedPrompt}${instStr}`;
      } else if (mode === 'ambience') {
        fullPrompt = `ambient atmosphere: ${trimmedPrompt}`;
      }

      const endpoint = mode === 'music' ? '/api/ai/audio/music' : '/api/ai/audio/sfx';

      const body = mode === 'music'
        ? {
            prompt: fullPrompt,
            music_length_ms: duration * 1000,
            force_instrumental: true,
          }
        : {
            text: fullPrompt,
            duration_seconds: Math.min(duration, 30),
            prompt_influence: 0.3,
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      const resultName = trimmedPrompt.slice(0, 40) || `${genre} ${mode} track`;
      const resultDuration = data.duration || duration;

      setLastResult({ audioUrl: data.audioUrl, name: resultName });

      onGenerated?.({
        name: resultName,
        type: mode,
        audioUrl: data.audioUrl,
        duration: resultDuration,
      });
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, mode, duration, genre, instruments, onGenerated]);

  const handleGenerateComposition = useCallback(async () => {
    if (!positiveStyles.trim() || sections.length === 0) return;

    setIsGenerating(true);
    setGenerationError(null);
    setLastResult(null);

    try {
      const res = await fetch('/api/ai/audio/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'composition',
          positive_global_styles: positiveStyles.trim(),
          negative_global_styles: negativeStyles.trim() || undefined,
          sections: sections.filter((s) => s.text.trim()),
          force_instrumental: true,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Composition generation failed');

      const totalDurationMs = sections.reduce((sum, s) => sum + s.duration_ms, 0);
      const resultName = `Composition: ${positiveStyles.slice(0, 30)}`;

      setLastResult({ audioUrl: data.audioUrl, name: resultName });
      onGenerated?.({
        name: resultName,
        type: 'music',
        audioUrl: data.audioUrl,
        duration: data.duration || totalDurationMs / 1000,
      });
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Composition generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, [positiveStyles, negativeStyles, sections, onGenerated]);

  const ModeIcon = MODES.find((m) => m.value === mode)?.icon ?? Music;

  return (
    <div className="shrink-0 border-b border-slate-700/40 bg-slate-900/60">
      {/* Main Toolbar Row */}
      <div className="flex items-center gap-2 h-11 px-3">
        {/* Mode Selector */}
        <div className="relative">
          <button
            onClick={() => { setShowModeMenu(!showModeMenu); setShowGenreMenu(false); setShowDurationMenu(false); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-700/50
              bg-slate-800/40 text-xs text-slate-300 hover:border-slate-600 transition-colors"
          >
            <ModeIcon className="w-3.5 h-3.5 text-orange-400" />
            <span className="font-medium">{MODES.find((m) => m.value === mode)?.label}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>
          {showModeMenu && (
            <div className="absolute top-full left-0 mt-1 z-30 min-w-[120px] rounded-md border border-slate-700/50 bg-slate-900 shadow-xl shadow-black/30">
              {MODES.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.value}
                    onClick={() => { setMode(m.value); setShowModeMenu(false); }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors',
                      mode === m.value ? 'text-orange-400 bg-orange-500/10' : 'text-slate-300 hover:bg-slate-800/60'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Prompt Input */}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isGenerating && handleGenerate()}
            placeholder={
              mode === 'music' ? 'Epic orchestral battle theme with war drums...'
                : mode === 'sfx' ? 'Sword clashing on metal shield...'
                  : 'Dense rain forest with distant thunder...'
            }
            className="w-full px-3 py-1.5 bg-slate-950/60 border border-slate-700/40 rounded-md
              text-xs text-slate-200 placeholder:text-slate-500
              focus:outline-none focus:border-orange-500/40 transition-colors"
          />
        </div>

        {/* Genre Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowGenreMenu(!showGenreMenu); setShowModeMenu(false); setShowDurationMenu(false); }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-700/50
              bg-slate-800/40 text-xs text-slate-300 hover:border-slate-600 transition-colors"
          >
            <span>{genre.charAt(0).toUpperCase() + genre.slice(1)}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>
          {showGenreMenu && (
            <div className="absolute top-full right-0 mt-1 z-30 min-w-[120px] rounded-md border border-slate-700/50 bg-slate-900 shadow-xl shadow-black/30">
              {GENRES.map((g) => (
                <button
                  key={g.value}
                  onClick={() => { setGenre(g.value); setShowGenreMenu(false); }}
                  className={cn(
                    'w-full px-3 py-2 text-left text-xs transition-colors',
                    genre === g.value ? 'text-orange-400 bg-orange-500/10' : 'text-slate-300 hover:bg-slate-800/60'
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Duration Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowDurationMenu(!showDurationMenu); setShowModeMenu(false); setShowGenreMenu(false); }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-700/50
              bg-slate-800/40 text-xs font-mono text-slate-300 hover:border-slate-600 transition-colors"
          >
            <span>{DURATIONS.find((d) => d.value === duration)?.label}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>
          {showDurationMenu && (
            <div className="absolute top-full right-0 mt-1 z-30 min-w-[80px] rounded-md border border-slate-700/50 bg-slate-900 shadow-xl shadow-black/30">
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => { setDuration(d.value); setShowDurationMenu(false); }}
                  className={cn(
                    'w-full px-3 py-2 text-left text-xs font-mono transition-colors',
                    duration === d.value ? 'text-orange-400 bg-orange-500/10' : 'text-slate-300 hover:bg-slate-800/60'
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={cn(
            'flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-all',
            isGenerating
              ? 'bg-orange-600/40 text-orange-300 cursor-not-allowed'
              : 'bg-orange-600 text-white hover:bg-orange-500'
          )}
        >
          {isGenerating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Wand2 className="w-3.5 h-3.5" />
          )}
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>

        {/* Audio preview for last result */}
        {lastResult && (
          <button
            onClick={() => {
              const audio = new Audio(lastResult.audioUrl);
              audio.play();
            }}
            className="p-1.5 rounded-md text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 transition-colors"
            title={`Play: ${lastResult.name}`}
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Separator */}
        <div className="w-px h-5 bg-slate-700/50" />

        {/* Advanced Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            'p-1.5 rounded-md transition-colors',
            showAdvanced ? 'text-orange-400 bg-orange-500/10' : 'text-slate-400 hover:text-slate-200'
          )}
          title="Advanced options"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>

        {/* Stem Separator */}
        <button
          onClick={onOpenStems}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
          title="Stem Separator"
        >
          <Scissors className="w-3.5 h-3.5" />
        </button>

        {/* Beat Composer */}
        <button
          onClick={onToggleBeats}
          className={cn(
            'p-1.5 rounded-md transition-colors',
            showBeatComposer ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 hover:text-slate-200'
          )}
          title="Beat Composer"
        >
          <Grid3X3 className="w-3.5 h-3.5" />
        </button>

        {/* AI Director */}
        <button
          onClick={onToggleAI}
          className={cn(
            'p-1.5 rounded-md transition-colors',
            showAIDropdown ? 'text-orange-400 bg-orange-500/10' : 'text-slate-400 hover:text-slate-200'
          )}
          title="AI Director"
        >
          <Brain className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Error/Status Bar */}
      {generationError && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/5 border-t border-red-500/20">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span className="text-[11px] text-red-400 truncate">{generationError}</span>
          <button
            onClick={() => setGenerationError(null)}
            className="ml-auto text-[11px] text-slate-500 hover:text-slate-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Advanced Drawer */}
      {showAdvanced && (
        <div className="px-3 py-2.5 border-t border-slate-800/30 bg-slate-950/40 space-y-3">
          <div className="flex items-start gap-6">
            {/* Instruments */}
            <div>
              <span className="text-[11px] text-slate-400 font-medium mb-1.5 block">Instruments</span>
              <div className="flex flex-wrap gap-1">
                {INSTRUMENTS.map((inst) => (
                  <button
                    key={inst}
                    onClick={() => toggleInstrument(inst)}
                    className={cn(
                      'text-[11px] px-2 py-0.5 rounded-md font-medium transition-all',
                      instruments.includes(inst)
                        ? 'bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30'
                        : 'bg-slate-800/40 text-slate-400 hover:text-slate-200'
                    )}
                  >
                    {inst}
                  </button>
                ))}
              </div>
            </div>

            {/* Provider Badge + Composition Toggle */}
            <div className="ml-auto shrink-0 flex flex-col items-end gap-1.5">
              <div>
                <span className="text-[11px] text-slate-400 font-medium mb-1.5 block">Provider</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800/60 text-slate-300">
                  ElevenLabs
                </span>
              </div>
              {mode === 'music' && (
                <button
                  onClick={() => setCompositionMode(!compositionMode)}
                  className={cn(
                    'text-[11px] px-2 py-0.5 rounded-md font-medium transition-all',
                    compositionMode
                      ? 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30'
                      : 'bg-slate-800/40 text-slate-400 hover:text-slate-200'
                  )}
                >
                  Composition Plan
                </button>
              )}
            </div>
          </div>

          {/* Composition Plan Editor */}
          {compositionMode && mode === 'music' && (
            <div className="border-t border-slate-800/30 pt-2 space-y-2">
              <span className="text-[11px] text-violet-400 font-medium block">Composition Plan (Multi-Section)</span>

              {/* Global Styles */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <span className="text-[10px] text-slate-500 block mb-0.5">Positive Styles</span>
                  <input
                    type="text"
                    value={positiveStyles}
                    onChange={(e) => setPositiveStyles(e.target.value)}
                    placeholder="e.g., cinematic orchestral, emotional, sweeping strings"
                    className="w-full px-2 py-1 bg-slate-900/60 border border-slate-700/40 rounded text-[11px] text-slate-200
                      placeholder:text-slate-500 focus:outline-none focus:border-violet-500/40"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] text-slate-500 block mb-0.5">Negative Styles (optional)</span>
                  <input
                    type="text"
                    value={negativeStyles}
                    onChange={(e) => setNegativeStyles(e.target.value)}
                    placeholder="e.g., harsh, distorted, noisy"
                    className="w-full px-2 py-1 bg-slate-900/60 border border-slate-700/40 rounded text-[11px] text-slate-200
                      placeholder:text-slate-500 focus:outline-none focus:border-violet-500/40"
                  />
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 block">Sections</span>
                {sections.map((section, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 w-4 shrink-0">{i + 1}.</span>
                    <input
                      type="text"
                      value={section.text}
                      onChange={(e) => {
                        const updated = [...sections];
                        updated[i] = { ...updated[i]!, text: e.target.value };
                        setSections(updated);
                      }}
                      placeholder="Section description (intro, verse, chorus...)"
                      className="flex-1 px-2 py-1 bg-slate-900/60 border border-slate-700/40 rounded text-[11px] text-slate-200
                        placeholder:text-slate-500 focus:outline-none focus:border-violet-500/40"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={section.duration_ms / 1000}
                        onChange={(e) => {
                          const updated = [...sections];
                          updated[i] = { ...updated[i]!, duration_ms: Math.max(1, Number(e.target.value)) * 1000 };
                          setSections(updated);
                        }}
                        className="w-12 px-1 py-1 bg-slate-900/60 border border-slate-700/40 rounded text-[11px] text-slate-200
                          text-center font-mono focus:outline-none focus:border-violet-500/40"
                      />
                      <span className="text-[10px] text-slate-500">s</span>
                    </div>
                    {sections.length > 1 && (
                      <button
                        onClick={() => setSections(sections.filter((_, j) => j !== i))}
                        className="text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <span className="text-xs">&times;</span>
                      </button>
                    )}
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setSections([...sections, { text: '', duration_ms: 15000 }])}
                    className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    + Add Section
                  </button>
                  <div className="flex-1" />
                  <span className="text-[10px] text-slate-500 font-mono">
                    Total: {(sections.reduce((sum, s) => sum + s.duration_ms, 0) / 1000).toFixed(0)}s
                  </span>
                  <button
                    onClick={handleGenerateComposition}
                    disabled={isGenerating || !positiveStyles.trim()}
                    className={cn(
                      'flex items-center gap-1 px-3 py-1 rounded text-[11px] font-medium transition-all',
                      isGenerating
                        ? 'bg-violet-600/40 text-violet-300 cursor-not-allowed'
                        : 'bg-violet-600 text-white hover:bg-violet-500'
                    )}
                  >
                    {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                    Generate Composition
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
