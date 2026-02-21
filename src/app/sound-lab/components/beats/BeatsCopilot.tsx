'use client';

import { useState, useRef, useCallback, useMemo, type KeyboardEvent } from 'react';
import {
  Terminal, ChevronRight, ChevronDown, ChevronUp, Loader2,
  Sparkles, Sliders, Code2,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useCLIFeature } from '@/app/hooks/useCLIFeature';
import { InlineTerminal } from '@/cli';
import { patternToText } from '../../lib/beatSynthesizer';
import { MOCK_BEAT_PATTERNS, getMockBeatModification } from '../../data/mockAudioData';
import type { BeatPattern, BeatSample } from '../../types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

type CopilotMode = 'generate' | 'modify';

interface BeatsCopilotProps {
  pattern: BeatPattern;
  sampleBank: Map<string, BeatSample>;
  onPatternReplace: (pattern: BeatPattern) => void;
  onPatternModify: (changes: Record<string, unknown>) => void;
}

const MODE_SKILLS: Record<CopilotMode, string> = {
  generate: 'beat-composer',
  modify: 'beat-modifier',
};

export default function BeatsCopilot({
  pattern,
  sampleBank,
  onPatternReplace,
  onPatternModify,
}: BeatsCopilotProps) {
  const [copilotMode, setCopilotMode] = useState<CopilotMode>('generate');
  const [briefText, setBriefText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // CLI feature hook
  const cli = useCLIFeature({
    featureId: 'sound-lab-beats',
    projectId: 'default',
    projectPath: '',
    defaultSkills: ['beat-composer', 'beat-modifier'],
  });

  // Active skill for InlineTerminal badge
  const activeSkill = MODE_SKILLS[copilotMode];

  // Pattern context text
  const contextText = useMemo(
    () => patternToText(pattern, sampleBank),
    [pattern, sampleBank]
  );

  // ============ Result Handler ============

  const handleResult = useCallback((data: unknown) => {
    setIsProcessing(false);

    const obj = data as Record<string, unknown>;
    if (!obj) return;

    // Full pattern from beat-composer (has .tracks array at top level)
    if (Array.isArray(obj.tracks) && obj.bpm) {
      onPatternReplace(obj as unknown as BeatPattern);
      return;
    }

    // Modification result (has .action + .changes)
    if (obj.action && obj.changes) {
      onPatternModify(obj.changes as Record<string, unknown>);
      return;
    }

    // Fallback: if action is full_replace, treat changes as full pattern
    if (obj.action === 'full_replace') {
      const changes = obj.changes as Record<string, unknown>;
      if (changes && Array.isArray(changes.tracks)) {
        onPatternReplace(changes as unknown as BeatPattern);
      }
    }
  }, [onPatternReplace, onPatternModify]);

  // ============ Submit ============

  const handleSubmit = useCallback(() => {
    const text = briefText.trim();
    if (!text || isProcessing) return;

    setIsProcessing(true);
    setExpanded(true); // Auto-expand terminal on submit

    // Mock mode
    if (USE_MOCK) {
      setTimeout(() => {
        if (copilotMode === 'generate') {
          const preset = MOCK_BEAT_PATTERNS[Math.floor(Math.random() * MOCK_BEAT_PATTERNS.length)];
          if (preset) onPatternReplace({ ...preset });
        } else {
          const mockMod = getMockBeatModification();
          onPatternModify(mockMod.changes);
        }
        setIsProcessing(false);
      }, 1200);
      return;
    }

    // Build prompt with context for modify mode
    let fullPrompt = text;
    if (copilotMode === 'modify') {
      fullPrompt = `Current pattern:\n${contextText}\n\nRequest: ${text}`;
    }

    const label = copilotMode === 'generate'
      ? `Beat Composer: ${text.slice(0, 40)}`
      : `Beat Modifier: ${text.slice(0, 40)}`;

    cli.executePrompt(fullPrompt, label);
  }, [briefText, isProcessing, copilotMode, contextText, cli, onPatternReplace, onPatternModify]);

  // ============ Keyboard ============

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col">
      {/* Compact top bar: mode switch + prompt input in one row */}
      <div className="shrink-0 flex items-center gap-1.5 px-2 py-1.5">
        {/* Mode toggles */}
        <button
          onClick={() => setCopilotMode('generate')}
          className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all',
            copilotMode === 'generate'
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20 shadow-[0_0_6px_rgba(245,158,11,0.1)]'
              : 'text-slate-500 hover:text-slate-300 border border-transparent'
          )}
        >
          <Sparkles className="w-2.5 h-2.5" />Gen
        </button>
        <button
          onClick={() => setCopilotMode('modify')}
          className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all',
            copilotMode === 'modify'
              ? 'bg-violet-500/15 text-violet-400 border border-violet-500/20 shadow-[0_0_6px_rgba(139,92,246,0.1)]'
              : 'text-slate-500 hover:text-slate-300 border border-transparent'
          )}
        >
          <Sliders className="w-2.5 h-2.5" />Mod
        </button>

        {/* Prompt input */}
        <div className="flex-1 flex items-center gap-1.5 bg-slate-950/60 border border-slate-700/30 rounded-md px-2 py-1 backdrop-blur-sm focus-within:border-amber-500/40 focus-within:ring-1 focus-within:ring-amber-500/10 transition-all">
          <Terminal className="w-3 h-3 text-slate-500 shrink-0" />
          <textarea
            ref={textareaRef}
            value={briefText}
            onChange={(e) => setBriefText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              copilotMode === 'generate'
                ? 'Describe a beat pattern...'
                : 'How to modify the pattern...'
            }
            rows={1}
            disabled={isProcessing}
            className="flex-1 bg-transparent text-[11px] text-slate-200 placeholder:text-slate-600 font-mono leading-tight resize-none focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={isProcessing || !briefText.trim()}
            className={cn(
              'shrink-0 p-1 rounded transition-all',
              isProcessing || !briefText.trim()
                ? 'text-slate-600 cursor-not-allowed'
                : 'bg-amber-600 text-white hover:bg-amber-500'
            )}
            style={!isProcessing && briefText.trim() ? { boxShadow: '0 0 8px rgba(245, 158, 11, 0.2)' } : undefined}
            title="Submit (Ctrl+Enter)"
          >
            {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        </div>

        {/* Context toggle */}
        <button
          onClick={() => setShowContext(!showContext)}
          className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
          title="Pattern Context"
        >
          <Code2 className="w-3 h-3" />
        </button>

        {/* Expand/collapse terminal */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
          title={expanded ? 'Collapse terminal' : 'Expand terminal'}
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>
      </div>

      {/* Pattern Context (collapsible) */}
      {showContext && (
        <div className="shrink-0 px-2 pb-1.5">
          <pre
            className="text-[9px] font-mono text-slate-400 rounded p-1.5 overflow-x-auto leading-relaxed whitespace-pre max-h-20 overflow-y-auto border border-slate-800/30"
            style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(2, 6, 23, 0.8) 100%)' }}
          >
            {contextText}
          </pre>
        </div>
      )}

      {/* InlineTerminal (expandable) */}
      {expanded && (
        <div className="overflow-hidden px-2 pb-1.5 relative">
          <div
            className="absolute top-0 left-2 right-2 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.15), transparent)' }}
          />
          <InlineTerminal
            {...cli.terminalProps}
            height="120px"
            collapsible
            onResult={handleResult}
            outputFormat="json"
            activeSkillId={activeSkill}
          />
        </div>
      )}
    </div>
  );
}
