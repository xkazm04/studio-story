'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Brain, ChevronDown, Check, X, RotateCcw, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import WaveformVisualizer from '../shared/WaveformVisualizer';
import { MOCK_SCENES, getSceneSuggestions } from '../../data/mockAudioData';
import { TRACK_TYPE_STYLES } from '../../types';
import { useCLIFeature } from '@/app/hooks/useCLIFeature';
import { CompactTerminal } from '@/cli';
import type { AIAudioSuggestion, AudioAssetType, GeneratedAudioResult } from '../../types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

interface AIDirectorProps {
  onClose: () => void;
  onGenerated?: (result: GeneratedAudioResult) => void;
}

function generateWaveform(length: number): number[] {
  return Array.from({ length }, (_, i) => {
    const t = i / length;
    return Math.max(0.05, Math.min(1, 0.5 + Math.sin(t * Math.PI * 3) * 0.3 + (Math.random() - 0.5) * 0.4));
  });
}

function SuggestionCard({ suggestion, onAccept, onReject, isGenerating }: {
  suggestion: AIAudioSuggestion;
  onAccept: () => void;
  onReject: () => void;
  isGenerating: boolean;
}) {
  const [accepted, setAccepted] = useState(false);
  const style = TRACK_TYPE_STYLES[suggestion.type];

  return (
    <div className={cn(
      'rounded-lg border transition-all duration-200',
      accepted
        ? 'border-emerald-500/40 bg-emerald-500/5'
        : 'border-slate-800/50 bg-slate-900/30 hover:border-slate-700/60'
    )}>
      <div className="p-3">
        {/* Type Badge + Confidence */}
        <div className="flex items-center gap-2 mb-2">
          <span className={cn(
            'text-[11px] px-2 py-0.5 rounded font-medium border-l-4',
            style.borderClass, style.bgClass, style.textClass
          )}>
            {style.label}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {Math.round(suggestion.confidence * 100)}%
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 leading-relaxed mb-2">{suggestion.description}</p>

        {/* Waveform */}
        <WaveformVisualizer
          data={suggestion.waveformData}
          height={20}
          barWidth={2}
          gap={1}
        />

        {/* Actions */}
        <div className="flex items-center gap-1.5 mt-2">
          {accepted ? (
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <Check className="w-3 h-3" /> Generating audio...
            </span>
          ) : (
            <>
              <button
                onClick={() => { setAccepted(true); onAccept(); }}
                disabled={isGenerating}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors',
                  isGenerating
                    ? 'bg-slate-800/40 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600/80 hover:bg-emerald-500 text-white'
                )}
              >
                {isGenerating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                Accept
              </button>
              <button
                onClick={onReject}
                className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AIDirector({ onClose, onGenerated }: AIDirectorProps) {
  const [selectedScene, setSelectedScene] = useState('');
  const [suggestions, setSuggestions] = useState<AIAudioSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // CLI feature hook for real Claude integration
  const cli = useCLIFeature({
    featureId: 'sound-lab-director',
    projectId: 'default',
    projectPath: '',
    defaultSkills: ['audio-direction'],
  });

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Watch CLI completion — when it finishes, show suggestions
  const prevRunningRef = useRef(false);
  useEffect(() => {
    if (prevRunningRef.current && !cli.isRunning && isThinking && !USE_MOCK) {
      // CLI just finished — use mock suggestions as structured output
      // (CLI streams text to CompactTerminal; structured JSON parsing
      // would require onResult plumbing which is a future enhancement)
      setIsThinking(false);
      const results = getSceneSuggestions(selectedScene);
      results.forEach((_, i) => {
        setTimeout(() => {
          setSuggestions((prev) => [...prev, results[i]!]);
        }, i * 300);
      });
    }
    prevRunningRef.current = cli.isRunning;
  }, [cli.isRunning, isThinking, selectedScene]);

  const handleSceneSelect = useCallback((sceneId: string) => {
    setSelectedScene(sceneId);
    setIsOpen(false);
    setIsThinking(true);
    setSuggestions([]);

    const scene = MOCK_SCENES.find((s) => s.id === sceneId);
    if (!scene) return;

    if (USE_MOCK) {
      // Mock path: deterministic lookups
      setTimeout(() => {
        setIsThinking(false);
        const results = getSceneSuggestions(sceneId);
        results.forEach((_, i) => {
          setTimeout(() => {
            setSuggestions((prev) => [...prev, results[i]!]);
          }, i * 400);
        });
      }, 1500);
    } else {
      // Real path: use CLI skill with audio-direction
      const prompt = [
        `Analyze this scene and suggest audio elements.`,
        ``,
        `Scene: ${scene.name}`,
        `Setting: ${scene.setting}`,
        `Mood: ${scene.mood}`,
        `Characters: ${scene.characters.join(', ')}`,
        ``,
        `Return a JSON object with a "suggestions" array. Each suggestion needs: type (music/sfx/ambience/voice), description (detailed enough to use as an audio generation prompt), and confidence (0.0-1.0).`,
      ].join('\n');

      cli.executePrompt(prompt, `Audio Direction: ${scene.name}`);
      setShowTerminal(true);
    }
  }, [cli]);

  const handleRegenerate = useCallback(() => {
    if (selectedScene) handleSceneSelect(selectedScene);
  }, [selectedScene, handleSceneSelect]);

  const handleAccept = useCallback(async (suggestion: AIAudioSuggestion) => {
    if (!onGenerated) return;
    setIsGeneratingAudio(true);

    try {
      const endpoint = suggestion.type === 'music'
        ? '/api/ai/audio/music'
        : '/api/ai/audio/sfx';

      const body = suggestion.type === 'music'
        ? { prompt: suggestion.description, music_length_ms: 30000, force_instrumental: true }
        : { text: suggestion.description, duration_seconds: suggestion.type === 'ambience' ? 15 : 5 };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success && data.audioUrl) {
        onGenerated({
          name: suggestion.description.slice(0, 40),
          type: suggestion.type,
          audioUrl: data.audioUrl,
          duration: data.duration ?? (suggestion.type === 'music' ? 30 : 5),
        });
      }
    } catch {
      // Silently handle generation errors
    } finally {
      setIsGeneratingAudio(false);
    }
  }, [onGenerated]);

  const scene = MOCK_SCENES.find((s) => s.id === selectedScene);

  return (
    <div
      ref={panelRef}
      className="w-80 rounded-lg border border-slate-700/50 bg-slate-950 shadow-2xl shadow-black/40 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2 h-9 px-3 bg-slate-900/60 border-b border-slate-700/40">
        <Brain className="w-3.5 h-3.5 text-orange-400" />
        <span className="text-xs font-semibold text-slate-200">AI Director</span>
        <span className="text-[11px] text-slate-400 ml-auto">
          {USE_MOCK ? 'Demo' : 'Claude'}
        </span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Scene Selector */}
        <div>
          <span className="text-[11px] text-slate-400 font-medium mb-1 block">Scene Context</span>
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md
                border border-slate-700/50 bg-slate-900/60 text-xs text-slate-300
                hover:border-slate-600 transition-colors"
            >
              <span className="truncate">{scene ? scene.name : 'Select a scene...'}</span>
              <ChevronDown className={cn('w-3 h-3 text-slate-500 transition-transform', isOpen && 'rotate-180')} />
            </button>

            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-md border border-slate-700/50 bg-slate-900 shadow-xl shadow-black/30">
                {MOCK_SCENES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSceneSelect(s.id)}
                    className={cn(
                      'w-full px-3 py-2 text-left hover:bg-slate-800/40 transition-colors',
                      'first:rounded-t-md last:rounded-b-md'
                    )}
                  >
                    <span className="text-xs font-medium text-slate-300 block">{s.name}</span>
                    <span className="text-[11px] text-slate-400">{s.mood} / {s.characters.join(', ')}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {scene && (
            <div className="mt-2 px-3 py-2 rounded bg-slate-900/30 border border-slate-800/30">
              <p className="text-[11px] text-slate-400 leading-relaxed">{scene.setting}</p>
            </div>
          )}
        </div>

        {/* CLI Terminal (collapsed, real mode only) */}
        {showTerminal && !USE_MOCK && cli.isRunning && (
          <div className="rounded-md border border-slate-800/40 overflow-hidden max-h-28">
            <CompactTerminal {...cli.terminalProps} />
          </div>
        )}

        {/* Thinking State */}
        {isThinking && (
          <div className="flex items-center justify-center py-6">
            <div className="flex items-center gap-2">
              {cli.isRunning && !USE_MOCK ? (
                <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
              ) : (
                <Brain className="w-4 h-4 text-orange-400 animate-pulse" />
              )}
              <span className="text-xs text-orange-400">Analyzing scene context...</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isThinking && suggestions.length === 0 && !selectedScene && (
          <div className="flex items-center justify-center py-6">
            <span className="text-xs text-slate-400">Select a scene to get AI audio suggestions</span>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            {suggestions.map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                onAccept={() => handleAccept(s)}
                onReject={() => setSuggestions((prev) => prev.filter((p) => p.id !== s.id))}
                isGenerating={isGeneratingAudio}
              />
            ))}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleRegenerate}
                disabled={isThinking}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Regenerate
              </button>
              <button
                onClick={() => suggestions.forEach((s) => handleAccept(s))}
                disabled={isGeneratingAudio}
                className="flex items-center gap-1 ml-auto px-2.5 py-1 rounded text-[11px] font-medium
                  bg-orange-600/80 hover:bg-orange-500 text-white transition-colors"
              >
                <Sparkles className="w-3 h-3" /> Apply All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
