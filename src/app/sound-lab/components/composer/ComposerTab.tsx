'use client';

import { useState, useCallback, useRef, useEffect, type KeyboardEvent } from 'react';
import {
  Music, Zap, Trees, Loader2, AlertCircle,
  Play, Pause, Send, X, Plus, Wand2,
  ChevronRight, RotateCcw, Terminal, Download,
  Scissors, HardDrive,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import WaveformVisualizer from '../shared/WaveformVisualizer';
import StemSeparator from '../sound-designer/StemSeparator';
import { extractWaveformFromUrl } from '../../lib/waveformExtractor';
import { MOCK_SCENES, getMockCompositionPlan, getMockPromptIdeas } from '../../data/mockAudioData';
import type { AudioAssetType, GeneratedAudioResult, CompositionPlan, PromptIdea } from '../../types';
import { useCLIFeature } from '@/app/hooks/useCLIFeature';
import { InlineTerminal } from '@/cli';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// ============ Types ============

type ComposerMode = 'music' | 'sfx' | 'ambience';

interface ComposerTabProps {
  onGenerated: (result: GeneratedAudioResult) => void;
}

interface GeneratedResult {
  id: string;
  name: string;
  type: AudioAssetType;
  audioUrl: string;
  duration: number;
  waveformData: number[];
}

const MODES: { value: ComposerMode; label: string; icon: typeof Music }[] = [
  { value: 'music', label: 'Music', icon: Music },
  { value: 'sfx', label: 'SFX', icon: Zap },
  { value: 'ambience', label: 'Ambience', icon: Trees },
];

const MODE_SKILLS: Record<ComposerMode, string> = {
  music: 'audio-composer',
  sfx: 'audio-prompt-ideas',
  ambience: 'audio-prompt-ideas',
};

// ============ Scene Chips ============

function SceneChips({ selectedId, onSelect, onClear }: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
      {MOCK_SCENES.map((scene) => (
        <button
          key={scene.id}
          onClick={() => onSelect(scene.id)}
          className={cn(
            'shrink-0 px-3 py-1 rounded-lg text-[10px] font-medium transition-all border',
            selectedId === scene.id
              ? 'bg-orange-500/12 text-orange-400 border-orange-500/25 shadow-[0_0_10px_rgba(249,115,22,0.1)]'
              : 'bg-slate-900/30 text-slate-400 border-slate-800/30 hover:border-slate-600/40 hover:text-slate-200 hover:bg-slate-800/30'
          )}
        >
          {scene.name.replace(/^The /, '')}
        </button>
      ))}
      {selectedId && (
        <button
          onClick={onClear}
          className="shrink-0 p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Clear selection"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ============ CLI Prompt Input ============

function CLIPromptInput({ value, onChange, onSubmit, isProcessing, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  isProcessing: boolean;
  placeholder: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div
      className="relative flex items-start gap-2 rounded-xl px-3.5 py-3 transition-all border"
      style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(2, 6, 23, 0.9) 100%)',
        borderColor: isProcessing ? 'rgba(249, 115, 22, 0.2)' : 'rgba(51, 65, 85, 0.3)',
        boxShadow: isProcessing ? '0 0 20px rgba(249, 115, 22, 0.05)' : 'none',
      }}
    >
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(249,115,22,1) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,1) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      <Terminal className="w-3.5 h-3.5 text-orange-500/40 mt-1 shrink-0 relative" />
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={2}
        disabled={isProcessing}
        className="flex-1 bg-transparent text-xs text-slate-200 placeholder:text-slate-600 font-mono leading-relaxed resize-none focus:outline-none disabled:opacity-50 relative"
      />
      <button
        onClick={onSubmit}
        disabled={isProcessing || !value.trim()}
        className={cn(
          'shrink-0 p-1.5 rounded-lg transition-all mt-0.5 relative',
          isProcessing || !value.trim()
            ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
            : 'bg-orange-600 text-white hover:bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.3)]'
        )}
        title="Submit (Ctrl+Enter)"
      >
        {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

// ============ Composition Plan Editor ============

function CompositionPlanEditor({ plan, onChange, onCompose, isComposing }: {
  plan: CompositionPlan;
  onChange: (plan: CompositionPlan) => void;
  onCompose: () => void;
  isComposing: boolean;
}) {
  const updateSection = (index: number, field: 'text' | 'duration_ms', value: string | number) => {
    const updated = [...plan.sections];
    updated[index] = { ...updated[index]!, [field]: value };
    onChange({ ...plan, sections: updated });
  };

  const addSection = () => {
    onChange({ ...plan, sections: [...plan.sections, { text: '', duration_ms: 15000 }] });
  };

  const removeSection = (index: number) => {
    if (plan.sections.length <= 1) return;
    onChange({ ...plan, sections: plan.sections.filter((_, i) => i !== index) });
  };

  const totalSeconds = plan.sections.reduce((sum, s) => sum + s.duration_ms, 0) / 1000;

  return (
    <div
      className="rounded-xl border border-violet-500/15 overflow-hidden relative"
      style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(2, 6, 23, 0.95) 100%)' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)' }}
      />
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-violet-500/10 relative">
        <div
          className="p-1 rounded-md border border-violet-500/25"
          style={{ background: 'rgba(139, 92, 246, 0.08)', boxShadow: '0 0 8px rgba(139, 92, 246, 0.1)' }}
        >
          <Music className="w-3 h-3 text-violet-400" />
        </div>
        <span className="text-[11px] font-semibold text-violet-300 tracking-wide">Composition Plan</span>
        {plan.summary && (
          <span className="text-[10px] text-slate-500 truncate flex-1 ml-1">{plan.summary}</span>
        )}
      </div>

      <div className="px-3 py-2.5 space-y-2.5">
        {/* Global Styles */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-violet-400/70 block mb-0.5">Positive Styles</label>
            <input
              type="text"
              value={plan.positive_global_styles}
              onChange={(e) => onChange({ ...plan, positive_global_styles: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-700/40 rounded-md text-[11px] text-slate-200
                placeholder:text-slate-500 focus:outline-none focus:border-violet-500/40"
              placeholder="cinematic orchestral, emotional"
            />
          </div>
          <div>
            <label className="text-[10px] text-violet-400/70 block mb-0.5">Avoid</label>
            <input
              type="text"
              value={plan.negative_global_styles}
              onChange={(e) => onChange({ ...plan, negative_global_styles: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-700/40 rounded-md text-[11px] text-slate-200
                placeholder:text-slate-500 focus:outline-none focus:border-violet-500/40"
              placeholder="harsh, distorted"
            />
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-1">
          {plan.sections.map((section, i) => (
            <div key={i} className="flex items-center gap-1.5 group">
              <span className="text-[10px] text-violet-400/50 w-4 text-right shrink-0 font-mono">{i + 1}.</span>
              <input
                type="text"
                value={section.text}
                onChange={(e) => updateSection(i, 'text', e.target.value)}
                placeholder="Describe this section..."
                className="flex-1 px-2.5 py-1 bg-slate-900/60 border border-slate-700/40 rounded text-[11px] text-slate-200
                  placeholder:text-slate-500 focus:outline-none focus:border-violet-500/40"
              />
              <div className="flex items-center gap-0.5 shrink-0">
                <input
                  type="number"
                  value={section.duration_ms / 1000}
                  onChange={(e) => updateSection(i, 'duration_ms', Math.max(1, Number(e.target.value)) * 1000)}
                  className="w-12 px-1.5 py-1 bg-slate-900/60 border border-slate-700/40 rounded text-[11px] text-slate-200
                    text-center font-mono focus:outline-none focus:border-violet-500/40"
                />
                <span className="text-[9px] text-slate-500">s</span>
              </div>
              {plan.sections.length > 1 && (
                <button
                  onClick={() => removeSection(i)}
                  className="p-0.5 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            onClick={addSection}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Section
          </button>
          <div className="flex-1" />
          <span className="text-[10px] text-slate-500 font-mono">{totalSeconds.toFixed(0)}s</span>
          <button
            onClick={onCompose}
            disabled={isComposing || !plan.positive_global_styles.trim()}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-semibold transition-all',
              isComposing || !plan.positive_global_styles.trim()
                ? 'bg-violet-600/20 text-violet-300/40 cursor-not-allowed'
                : 'bg-violet-600 text-white hover:bg-violet-500 shadow-[0_0_16px_rgba(139,92,246,0.3)]'
            )}
          >
            {isComposing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            Compose
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Prompt Ideas Panel (Compact) ============

function PromptIdeasPanel({ ideas, onUpdate, onGenerate, onGenerateAll, onSave, onPlay, playingId, savingId }: {
  ideas: PromptIdea[];
  onUpdate: (id: string, updates: Partial<PromptIdea>) => void;
  onGenerate: (id: string) => void;
  onGenerateAll: () => void;
  onSave: (idea: PromptIdea) => void;
  onPlay: (idea: PromptIdea) => void;
  playingId: string | null;
  savingId: string | null;
}) {
  const anyGenerating = ideas.some((i) => i.status === 'generating');
  const allDone = ideas.every((i) => i.status === 'done');
  const idleCount = ideas.filter((i) => i.status === 'idle').length;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div
          className="p-1 rounded-md border border-sky-500/25"
          style={{ background: 'rgba(14, 165, 233, 0.08)', boxShadow: '0 0 8px rgba(14, 165, 233, 0.1)' }}
        >
          <Zap className="w-3 h-3 text-sky-400" />
        </div>
        <span className="text-[11px] font-semibold text-sky-300 tracking-wide">Prompt Ideas</span>
        <span
          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400/80"
          style={{ textShadow: '0 0 8px rgba(14, 165, 233, 0.3)' }}
        >
          {ideas.length}
        </span>
        <div className="flex-1" />
        {idleCount > 1 && !allDone && (
          <button
            onClick={onGenerateAll}
            disabled={anyGenerating}
            className={cn(
              'flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-medium transition-all',
              anyGenerating
                ? 'bg-sky-600/15 text-sky-300/40 cursor-not-allowed'
                : 'bg-sky-600/80 text-white hover:bg-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.2)]'
            )}
          >
            <Wand2 className="w-3 h-3" /> Generate All
          </button>
        )}
      </div>

      {/* Compact Idea Cards */}
      {ideas.map((idea) => (
        <IdeaCard
          key={idea.id}
          idea={idea}
          onUpdate={(updates) => onUpdate(idea.id, updates)}
          onGenerate={() => onGenerate(idea.id)}
          onSave={() => onSave(idea)}
          onPlay={() => onPlay(idea)}
          isPlaying={playingId === idea.id}
          isSaving={savingId === idea.id}
          disabled={anyGenerating && idea.status !== 'generating'}
        />
      ))}
    </div>
  );
}

// ============ Compact IdeaCard ============

function IdeaCard({ idea, onUpdate, onGenerate, onSave, onPlay, isPlaying, isSaving, disabled }: {
  idea: PromptIdea;
  onUpdate: (updates: Partial<PromptIdea>) => void;
  onGenerate: () => void;
  onSave: () => void;
  onPlay: () => void;
  isPlaying: boolean;
  isSaving: boolean;
  disabled: boolean;
}) {
  const isDone = idea.status === 'done';
  const isGenerating = idea.status === 'generating';
  const isError = idea.status === 'error';

  return (
    <div
      className={cn(
        'rounded-lg border transition-all',
        isDone
          ? 'border-emerald-500/20'
          : isError
            ? 'border-red-500/20'
            : 'border-slate-800/30'
      )}
      style={{
        background: isDone
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(2, 6, 23, 0.5) 100%)'
          : isError
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.03) 0%, rgba(2, 6, 23, 0.5) 100%)'
            : 'linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(2, 6, 23, 0.7) 100%)',
      }}
    >
      {/* Row 1: Label | Duration | Description | Status | Generate */}
      <div className="flex items-center gap-1.5 px-2.5 py-2">
        <span className="text-[10px] font-semibold text-sky-400 shrink-0">{idea.label}</span>
        <span className="text-[10px] text-slate-500 font-mono shrink-0">{idea.duration_seconds}s</span>
        <span className="text-[11px] text-slate-400 truncate flex-1 min-w-0" title={idea.text}>
          {idea.text}
        </span>
        {isGenerating && <Loader2 className="w-3 h-3 text-sky-400 animate-spin shrink-0" />}
        {isError && (
          <span className="text-[9px] text-red-400 shrink-0 max-w-[80px] truncate" title={idea.error}>
            {idea.error}
          </span>
        )}
        {!isDone && (
          <button
            onClick={onGenerate}
            disabled={disabled || isGenerating}
            className={cn(
              'p-1 rounded transition-all shrink-0',
              disabled || isGenerating
                ? 'bg-sky-600/10 text-sky-300/30 cursor-not-allowed'
                : 'bg-sky-600/80 text-white hover:bg-sky-500'
            )}
            title={isError ? 'Retry' : 'Generate'}
          >
            {isError ? <RotateCcw className="w-3 h-3" /> : <Wand2 className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Row 2: Play | Waveform | Save (only when done with result) */}
      {isDone && idea.result && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 border-t border-slate-800/30">
          <button
            onClick={onPlay}
            className={cn(
              'p-1 rounded transition-colors shrink-0',
              isPlaying
                ? 'bg-orange-600 text-white'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'
            )}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>
          <div className="flex-1 min-w-0">
            <WaveformVisualizer data={idea.result.waveformData} height={16} barWidth={1.5} gap={0.5} />
          </div>
          <button
            onClick={onSave}
            disabled={isSaving}
            className={cn(
              'p-1 rounded transition-colors shrink-0',
              isSaving
                ? 'bg-emerald-600/20 text-emerald-300/50 cursor-not-allowed'
                : 'bg-emerald-600/80 text-white hover:bg-emerald-500'
            )}
            title="Save to library"
          >
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <HardDrive className="w-3 h-3" />}
          </button>
        </div>
      )}
    </div>
  );
}

// ============ Compact Result Row ============

function ResultRow({ result, isPlaying, isSaving, onPlay, onSend, onSave, onStem }: {
  result: GeneratedResult;
  isPlaying: boolean;
  isSaving: boolean;
  onPlay: () => void;
  onSend: () => void;
  onSave: () => void;
  onStem: () => void;
}) {
  const typeBg = result.type === 'music'
    ? 'bg-orange-500/12 text-orange-400 border-orange-500/20'
    : result.type === 'sfx'
      ? 'bg-sky-500/12 text-sky-400 border-sky-500/20'
      : 'bg-teal-500/12 text-teal-400 border-teal-500/20';

  const typeGlow = result.type === 'music'
    ? 'hover:shadow-[0_0_12px_rgba(249,115,22,0.08)]'
    : result.type === 'sfx'
      ? 'hover:shadow-[0_0_12px_rgba(14,165,233,0.08)]'
      : 'hover:shadow-[0_0_12px_rgba(20,184,166,0.08)]';

  return (
    <div className={cn(
      'flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-slate-800/30 transition-all group',
      typeGlow,
    )}
      style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.5) 0%, rgba(2, 6, 23, 0.6) 100%)' }}
    >
      <span className={cn('text-[9px] px-1.5 py-0.5 rounded-md font-medium shrink-0 border', typeBg)}>
        {result.type.toUpperCase()}
      </span>
      <span className="text-[11px] text-slate-300 truncate flex-1 min-w-0" title={result.name}>
        {result.name}
      </span>
      <span className="text-[10px] text-slate-500 font-mono shrink-0">{result.duration.toFixed(0)}s</span>
      <div className="w-16 shrink-0">
        <WaveformVisualizer data={result.waveformData} height={16} barWidth={1.5} gap={0.5} />
      </div>
      <button
        onClick={onPlay}
        className={cn(
          'p-1 rounded transition-colors shrink-0',
          isPlaying
            ? 'bg-orange-600 text-white'
            : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'
        )}
      >
        {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
      </button>
      <button
        onClick={onSend}
        className="p-1 rounded bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 transition-colors shrink-0"
        title="Send to Mixer"
      >
        <Send className="w-3 h-3" />
      </button>
      <button
        onClick={onSave}
        disabled={isSaving}
        className={cn(
          'p-1 rounded transition-colors shrink-0',
          isSaving
            ? 'bg-emerald-600/20 text-emerald-300/50 cursor-not-allowed'
            : 'bg-emerald-600/80 text-white hover:bg-emerald-500'
        )}
        title="Save to library"
      >
        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <HardDrive className="w-3 h-3" />}
      </button>
      <button
        onClick={onStem}
        className="p-1 rounded bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 transition-colors shrink-0"
        title="Extract stems"
      >
        <Scissors className="w-3 h-3" />
      </button>
    </div>
  );
}

// ============ Main Composer ============

export default function ComposerTab({ onGenerated }: ComposerTabProps) {
  // Core state
  const [mode, setMode] = useState<ComposerMode>('music');
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [briefText, setBriefText] = useState('');

  // Music mode
  const [compositionPlan, setCompositionPlan] = useState<CompositionPlan | null>(null);
  const [isComposing, setIsComposing] = useState(false);

  // SFX/Ambience mode
  const [promptIdeas, setPromptIdeas] = useState<PromptIdea[]>([]);

  // Shared
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Save + Stem state
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showStemModal, setShowStemModal] = useState(false);
  const [stemAudioUrl, setStemAudioUrl] = useState<string | undefined>();
  const [stemAudioName, setStemAudioName] = useState<string | undefined>();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevRunningRef = useRef(false);

  // CLI hook
  const cli = useCLIFeature({
    featureId: 'sound-lab-composer',
    projectId: 'default',
    projectPath: '',
    defaultSkills: ['audio-composer'],
  });

  // ============ Mode Switch ============

  useEffect(() => {
    cli.setSkills([MODE_SKILLS[mode]]);
    setCompositionPlan(null);
    setPromptIdeas([]);
    setError(null);
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ============ Submit Brief ============

  const handleSubmit = useCallback(() => {
    const text = briefText.trim();
    if (!text && !selectedSceneId) return;

    setIsProcessing(true);
    setError(null);
    setCompositionPlan(null);
    setPromptIdeas([]);

    const scene = selectedSceneId ? MOCK_SCENES.find((s) => s.id === selectedSceneId) : null;
    const sceneContext = scene
      ? `\nScene: ${scene.name}\nSetting: ${scene.setting}\nMood: ${scene.mood}\nCharacters: ${scene.characters.join(', ')}`
      : '';

    const fullBrief = text
      ? `${text}${sceneContext}`
      : `Create audio for this scene:${sceneContext}`;

    if (USE_MOCK) {
      setTimeout(() => {
        setIsProcessing(false);
        if (mode === 'music') {
          setCompositionPlan(getMockCompositionPlan(selectedSceneId));
        } else {
          setPromptIdeas(getMockPromptIdeas(mode, selectedSceneId));
        }
      }, 1200);
    } else {
      const modeLabel = mode === 'music' ? 'Composition Plan' : `${mode.toUpperCase()} Ideas`;
      cli.executePrompt(fullBrief, `${modeLabel}: ${text.slice(0, 40) || scene?.name || 'generate'}`);
    }
  }, [briefText, selectedSceneId, mode, cli]);

  // ============ Scene Chip Click ============

  const handleSceneSelect = useCallback((sceneId: string) => {
    setSelectedSceneId(sceneId);
    if (!briefText.trim()) {
      const scene = MOCK_SCENES.find((s) => s.id === sceneId);
      if (!scene) return;

      setIsProcessing(true);
      setError(null);
      setCompositionPlan(null);
      setPromptIdeas([]);

      if (USE_MOCK) {
        setTimeout(() => {
          setIsProcessing(false);
          if (mode === 'music') {
            setCompositionPlan(getMockCompositionPlan(sceneId));
          } else {
            setPromptIdeas(getMockPromptIdeas(mode, sceneId));
          }
        }, 1200);
      } else {
        const sceneContext = `Create audio for this scene:\nScene: ${scene.name}\nSetting: ${scene.setting}\nMood: ${scene.mood}\nCharacters: ${scene.characters.join(', ')}`;
        const modeLabel = mode === 'music' ? 'Composition Plan' : `${mode.toUpperCase()} Ideas`;
        cli.executePrompt(sceneContext, `${modeLabel}: ${scene.name}`);
      }
    }
  }, [briefText, mode, cli]);

  // ============ CLI Result Handler (real mode) ============

  const handleCLIResult = useCallback((data: unknown) => {
    setIsProcessing(false);
    if (!data || typeof data !== 'object') return;

    const obj = data as Record<string, unknown>;

    if (mode === 'music' && obj.sections) {
      setCompositionPlan(obj as unknown as CompositionPlan);
    } else if (obj.ideas && Array.isArray(obj.ideas)) {
      const ideas = (obj.ideas as Record<string, unknown>[]).map((idea, i) => ({
        id: `idea-${Date.now()}-${i}`,
        text: String(idea.text || ''),
        label: String(idea.label || `Idea ${i + 1}`),
        duration_seconds: Number(idea.duration_seconds) || 5,
        prompt_influence: Number(idea.prompt_influence) || 0.5,
        status: 'idle' as const,
      }));
      setPromptIdeas(ideas);
    }
  }, [mode]);

  // ============ CLI Completion Fallback (real mode) ============

  useEffect(() => {
    if (prevRunningRef.current && !cli.isRunning && isProcessing && !USE_MOCK) {
      setIsProcessing(false);
      if (mode === 'music') {
        setCompositionPlan(getMockCompositionPlan(selectedSceneId));
      } else {
        setPromptIdeas(getMockPromptIdeas(mode, selectedSceneId));
      }
    }
    prevRunningRef.current = cli.isRunning;
  }, [cli.isRunning, isProcessing, mode, selectedSceneId]);

  // ============ Compose (Music Mode) ============

  const handleCompose = useCallback(async () => {
    if (!compositionPlan) return;
    setIsComposing(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/audio/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'composition',
          positive_global_styles: compositionPlan.positive_global_styles.trim(),
          negative_global_styles: compositionPlan.negative_global_styles.trim() || undefined,
          sections: compositionPlan.sections.filter((s) => s.text.trim()),
          force_instrumental: true,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Composition failed');

      const totalDurationMs = compositionPlan.sections.reduce((sum, s) => sum + s.duration_ms, 0);
      const resultName = compositionPlan.summary || compositionPlan.positive_global_styles.slice(0, 50);

      let waveformData: number[];
      try {
        waveformData = await extractWaveformFromUrl(data.audioUrl, 64);
      } catch {
        waveformData = Array.from({ length: 64 }, () => Math.random() * 0.6 + 0.2);
      }

      const newResult: GeneratedResult = {
        id: `result-${Date.now()}`,
        name: resultName,
        type: 'music',
        audioUrl: data.audioUrl,
        duration: data.duration || totalDurationMs / 1000,
        waveformData,
      };

      setResults((prev) => [newResult, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Composition failed');
    } finally {
      setIsComposing(false);
    }
  }, [compositionPlan]);

  // ============ Generate Idea (SFX/Ambience) ============

  const updateIdea = useCallback((id: string, updates: Partial<PromptIdea>) => {
    setPromptIdeas((prev) => prev.map((idea) => idea.id === id ? { ...idea, ...updates } : idea));
  }, []);

  const handleGenerateIdea = useCallback(async (ideaId: string) => {
    const idea = promptIdeas.find((i) => i.id === ideaId);
    if (!idea) return;

    updateIdea(ideaId, { status: 'generating', error: undefined });

    try {
      const res = await fetch('/api/ai/audio/sfx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: idea.text,
          duration_seconds: idea.duration_seconds,
          prompt_influence: idea.prompt_influence,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Generation failed');

      let waveformData: number[];
      try {
        waveformData = await extractWaveformFromUrl(data.audioUrl, 48);
      } catch {
        waveformData = Array.from({ length: 48 }, () => Math.random() * 0.6 + 0.2);
      }

      updateIdea(ideaId, {
        status: 'done',
        result: { audioUrl: data.audioUrl, duration: data.duration || idea.duration_seconds, waveformData },
      });

      // Add to results gallery
      const newResult: GeneratedResult = {
        id: `result-${Date.now()}`,
        name: idea.label,
        type: mode,
        audioUrl: data.audioUrl,
        duration: data.duration || idea.duration_seconds,
        waveformData,
      };
      setResults((prev) => [newResult, ...prev]);
    } catch (err) {
      updateIdea(ideaId, { status: 'error', error: err instanceof Error ? err.message : 'Generation failed' });
    }
  }, [promptIdeas, updateIdea, mode]);

  const handleGenerateAll = useCallback(() => {
    const idle = promptIdeas.filter((i) => i.status === 'idle');
    idle.forEach((idea, i) => {
      setTimeout(() => handleGenerateIdea(idea.id), i * 500);
    });
  }, [promptIdeas, handleGenerateIdea]);

  // ============ Playback ============

  const handlePlay = useCallback((result: GeneratedResult) => {
    if (playingId === result.id) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(result.audioUrl);
    audio.onended = () => setPlayingId(null);
    audio.play();
    audioRef.current = audio;
    setPlayingId(result.id);
  }, [playingId]);

  const handlePlayIdea = useCallback((idea: PromptIdea) => {
    if (!idea.result?.audioUrl) return;

    if (playingId === idea.id) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(idea.result.audioUrl);
    audio.onended = () => setPlayingId(null);
    audio.play();
    audioRef.current = audio;
    setPlayingId(idea.id);
  }, [playingId]);

  // ============ Send to Mixer ============

  const handleSendToMixer = useCallback((result: GeneratedResult) => {
    onGenerated({
      name: result.name,
      type: result.type,
      audioUrl: result.audioUrl,
      duration: result.duration,
    });
  }, [onGenerated]);

  // ============ Save to Disk ============

  const handleSave = useCallback(async (audioUrl: string, name: string, type: AudioAssetType) => {
    const saveId = `save-${Date.now()}`;
    setSavingId(saveId);
    try {
      const res = await fetch('/api/ai/audio/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioUrl, name, type }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Save failed');
    } catch {
      setError('Failed to save audio file');
    } finally {
      setSavingId(null);
    }
  }, []);

  const handleSaveResult = useCallback((result: GeneratedResult) => {
    setSavingId(result.id);
    handleSave(result.audioUrl, result.name, result.type).finally(() => setSavingId(null));
  }, [handleSave]);

  const handleSaveIdea = useCallback((idea: PromptIdea) => {
    if (!idea.result?.audioUrl) return;
    setSavingId(idea.id);
    handleSave(idea.result.audioUrl, idea.label, mode).finally(() => setSavingId(null));
  }, [handleSave, mode]);

  // ============ Stem Separator ============

  const handleOpenStems = useCallback((audioUrl: string, name: string) => {
    setStemAudioUrl(audioUrl);
    setStemAudioName(name);
    setShowStemModal(true);
  }, []);

  const handleCloseStemModal = useCallback(() => {
    setShowStemModal(false);
    setStemAudioUrl(undefined);
    setStemAudioName(undefined);
  }, []);

  // ============ Placeholders ============

  const placeholders: Record<ComposerMode, string> = {
    music: 'Epic orchestral battle theme with rising tension and triumphant brass climax...',
    sfx: 'Sword clashing on metal shield with reverb in a stone hall...',
    ambience: 'Dense forest at night with distant thunder, frogs, gentle rainfall on leaves...',
  };

  const hasOutput = compositionPlan || promptIdeas.length > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Mode Tabs + Badge */}
      <div
        className="shrink-0 flex items-center gap-1.5 px-4 h-10 border-b border-orange-500/10"
        style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%)' }}
      >
        {MODES.map((m) => {
          const Icon = m.icon;
          const isActive = mode === m.value;
          return (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                isActive
                  ? 'bg-orange-500/12 text-orange-400 border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {m.label}
            </button>
          );
        })}
        <div className="flex-1" />
        <span
          className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-slate-800/40 text-slate-500 border border-slate-700/20 tracking-wider"
        >
          ELEVENLABS
        </span>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">

          {/* Scene Chips */}
          <SceneChips
            selectedId={selectedSceneId}
            onSelect={handleSceneSelect}
            onClear={() => setSelectedSceneId(null)}
          />

          {/* CLI Prompt Input */}
          <CLIPromptInput
            value={briefText}
            onChange={setBriefText}
            onSubmit={handleSubmit}
            isProcessing={isProcessing}
            placeholder={placeholders[mode]}
          />

          {/* InlineTerminal (real mode only) */}
          {!USE_MOCK && (
            <InlineTerminal
              {...cli.terminalProps}
              height={120}
              collapsible
              outputFormat="json"
              onResult={handleCLIResult}
              activeSkillId={MODE_SKILLS[mode]}
            />
          )}

          {/* Processing State (mock mode) */}
          {isProcessing && USE_MOCK && (
            <div className="flex items-center justify-center py-4">
              <div
                className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-orange-500/15"
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(2, 6, 23, 0.9) 100%)',
                  boxShadow: '0 0 20px rgba(249, 115, 22, 0.08)',
                }}
              >
                <Loader2 className="w-3.5 h-3.5 text-orange-400 animate-spin" />
                <span className="text-[11px] text-orange-400 font-mono">
                  {mode === 'music' ? 'Generating composition plan...' : 'Generating prompt ideas...'}
                </span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-red-500/20"
              style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.04) 0%, rgba(2, 6, 23, 0.6) 100%)' }}
            >
              <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span className="text-[11px] text-red-300 flex-1">{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-[10px] text-slate-500 hover:text-slate-300 px-1.5 py-0.5 rounded hover:bg-slate-800/40 transition-all"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Music: Composition Plan */}
          {mode === 'music' && compositionPlan && (
            <CompositionPlanEditor
              plan={compositionPlan}
              onChange={setCompositionPlan}
              onCompose={handleCompose}
              isComposing={isComposing}
            />
          )}

          {/* SFX/Ambience: Prompt Ideas */}
          {mode !== 'music' && promptIdeas.length > 0 && (
            <PromptIdeasPanel
              ideas={promptIdeas}
              onUpdate={updateIdea}
              onGenerate={handleGenerateIdea}
              onGenerateAll={handleGenerateAll}
              onSave={handleSaveIdea}
              onPlay={handlePlayIdea}
              playingId={playingId}
              savingId={savingId}
            />
          )}

          {/* Results Gallery */}
          {results.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="p-1 rounded border border-emerald-500/25"
                  style={{ background: 'rgba(16, 185, 129, 0.08)', boxShadow: '0 0 8px rgba(16, 185, 129, 0.1)' }}
                >
                  <Download className="w-3 h-3 text-emerald-400" />
                </div>
                <span className="text-[11px] font-semibold text-slate-300 tracking-wide">Results</span>
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400/80"
                  style={{ textShadow: '0 0 8px rgba(16, 185, 129, 0.3)' }}
                >
                  {results.length}
                </span>
              </div>
              <div className="space-y-1">
                {results.map((result) => (
                  <ResultRow
                    key={result.id}
                    result={result}
                    isPlaying={playingId === result.id}
                    isSaving={savingId === result.id}
                    onPlay={() => handlePlay(result)}
                    onSend={() => handleSendToMixer(result)}
                    onSave={() => handleSaveResult(result)}
                    onStem={() => handleOpenStems(result.audioUrl, result.name)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isProcessing && !hasOutput && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center relative">
              {/* Ambient glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(circle at 50% 40%, rgba(249, 115, 22, 0.04) 0%, transparent 60%)' }}
              />
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 border border-orange-500/15 relative"
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(249, 115, 22, 0.06) 100%)',
                  boxShadow: '0 0 20px rgba(249, 115, 22, 0.06)',
                }}
              >
                <Terminal className="w-6 h-6 text-orange-400/40" />
              </div>
              <span className="text-xs font-medium text-slate-400 mb-1.5">
                {mode === 'music' ? 'Compose Something' : 'Design Sounds'}
              </span>
              <span className="text-[11px] text-slate-600 max-w-[280px] leading-relaxed">
                Select a scene or describe what you want to create.
                {mode === 'music'
                  ? ' A composition plan will be generated for you to review and edit.'
                  : ' Prompt variations will be generated for you to pick from.'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stem Separator Modal */}
      {showStemModal && (
        <StemSeparator
          onClose={handleCloseStemModal}
          audioUrl={stemAudioUrl}
          audioName={stemAudioName}
        />
      )}
    </div>
  );
}
