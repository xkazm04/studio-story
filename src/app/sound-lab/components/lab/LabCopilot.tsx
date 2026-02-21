'use client';

import { useState, useRef, useCallback, useMemo, type KeyboardEvent } from 'react';
import {
  Terminal, ChevronRight, ChevronDown, ChevronUp, Loader2,
  Piano, Waves, Code2,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useCLIFeature } from '@/app/hooks/useCLIFeature';
import { InlineTerminal } from '@/cli';
import type { LabPipeline, MidiExtractionResult, SpectralFeatures, InstrumentSwap, DSPEffectChain } from '../../types';
import { LAB_PIPELINE_STYLES } from '../../types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

const MODE_SKILLS: Record<LabPipeline, string> = {
  'midi-bridge': 'instrument-transform',
  'character-modify': 'dsp-controller',
};

interface LabCopilotProps {
  activePipeline: LabPipeline;
  midiContext: MidiExtractionResult | null;
  spectralContext: SpectralFeatures | null;
  onInstrumentSuggestions: (suggestions: InstrumentSwap[]) => void;
  onDSPChainResult: (chain: DSPEffectChain) => void;
  onPipelineChange: (pipeline: LabPipeline) => void;
}

function formatMidiContext(midi: MidiExtractionResult): string {
  const lines = [`${Math.round(midi.tempo)} BPM | ${midi.duration.toFixed(1)}s | ${midi.tracks.length} tracks`];
  for (const t of midi.tracks) {
    const pitches = t.notes.map(n => n.pitch);
    const lo = Math.min(...pitches);
    const hi = Math.max(...pitches);
    lines.push(`  ${t.name}: ${t.notes.length} notes, pitch ${lo}-${hi}, GM#${t.instrument}`);
  }
  return lines.join('\n');
}

function formatSpectralContext(f: SpectralFeatures): string {
  return [
    `RMS: ${f.rms.toFixed(3)} | Centroid: ${f.spectralCentroid.toFixed(0)}Hz`,
    `Flatness: ${f.spectralFlatness.toFixed(3)} | Rolloff: ${f.spectralRolloff.toFixed(0)}Hz`,
    `ZCR: ${f.zcr.toFixed(3)} | Energy: ${f.energy.toFixed(3)}`,
    f.description,
  ].join('\n');
}

export default function LabCopilot({
  activePipeline,
  midiContext,
  spectralContext,
  onInstrumentSuggestions,
  onDSPChainResult,
  onPipelineChange,
}: LabCopilotProps) {
  const [briefText, setBriefText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const cli = useCLIFeature({
    featureId: 'sound-lab-experiments',
    projectId: 'default',
    projectPath: '',
    defaultSkills: ['instrument-transform', 'dsp-controller'],
  });

  const activeSkill = MODE_SKILLS[activePipeline];
  const pipelineStyle = LAB_PIPELINE_STYLES[activePipeline];

  const contextText = useMemo(() => {
    if (activePipeline === 'midi-bridge' && midiContext) return formatMidiContext(midiContext);
    if (activePipeline === 'character-modify' && spectralContext) return formatSpectralContext(spectralContext);
    return 'No analysis data yet — load audio and run analysis first.';
  }, [activePipeline, midiContext, spectralContext]);

  const handleResult = useCallback((data: unknown) => {
    setIsProcessing(false);
    const obj = data as Record<string, unknown>;
    if (!obj) return;

    // instrument-transform result
    if (Array.isArray(obj.suggestions)) {
      onInstrumentSuggestions(obj.suggestions as InstrumentSwap[]);
      return;
    }

    // dsp-controller result
    if (obj.effectChain) {
      onDSPChainResult(obj.effectChain as DSPEffectChain);
      return;
    }
  }, [onInstrumentSuggestions, onDSPChainResult]);

  const handleSubmit = useCallback(() => {
    const text = briefText.trim();
    if (!text || isProcessing) return;

    setIsProcessing(true);
    setExpanded(true);

    if (USE_MOCK) {
      setTimeout(() => {
        if (activePipeline === 'midi-bridge') {
          const { getMockInstrumentSuggestions } = require('../../data/mockAudioData');
          const mock = getMockInstrumentSuggestions();
          onInstrumentSuggestions(mock.suggestions);
        } else {
          const { getMockDSPResult } = require('../../data/mockAudioData');
          const mock = getMockDSPResult();
          onDSPChainResult(mock.effectChain);
        }
        setIsProcessing(false);
      }, 1200);
      return;
    }

    let fullPrompt = text;
    if (activePipeline === 'midi-bridge' && midiContext) {
      fullPrompt = `MIDI Analysis:\n${formatMidiContext(midiContext)}\n\nRequest: ${text}`;
    } else if (activePipeline === 'character-modify' && spectralContext) {
      fullPrompt = `Spectral Analysis:\n${formatSpectralContext(spectralContext)}\n\nRequest: ${text}`;
    }

    const label = activePipeline === 'midi-bridge'
      ? `MIDI Transform: ${text.slice(0, 40)}`
      : `DSP Control: ${text.slice(0, 40)}`;

    cli.executePrompt(fullPrompt, label);
  }, [briefText, isProcessing, activePipeline, midiContext, spectralContext, cli, onInstrumentSuggestions, onDSPChainResult]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col">
      <div className="shrink-0 flex items-center gap-1.5 px-2 py-1.5">
        {/* Pipeline toggles */}
        <button
          onClick={() => onPipelineChange('midi-bridge')}
          className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all active:scale-95',
            activePipeline === 'midi-bridge'
              ? 'bg-cyan-500/15 text-cyan-400'
              : 'text-slate-500 hover:text-slate-300'
          )}
        >
          <Piano className="w-2.5 h-2.5" />MIDI
        </button>
        <button
          onClick={() => onPipelineChange('character-modify')}
          className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all active:scale-95',
            activePipeline === 'character-modify'
              ? 'bg-fuchsia-500/15 text-fuchsia-400'
              : 'text-slate-500 hover:text-slate-300'
          )}
        >
          <Waves className="w-2.5 h-2.5" />DSP
        </button>

        {/* Prompt input */}
        <div className={cn(
          'flex-1 flex items-center gap-1.5 bg-slate-950/80 border rounded-md px-2 py-1 transition-all',
          activePipeline === 'midi-bridge'
            ? 'border-cyan-500/20 focus-within:border-cyan-500/40'
            : 'border-fuchsia-500/20 focus-within:border-fuchsia-500/40'
        )}>
          <Terminal className="w-3 h-3 text-slate-500 shrink-0" />
          <textarea
            ref={textareaRef}
            value={briefText}
            onChange={(e) => setBriefText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activePipeline === 'midi-bridge'
                ? 'Describe instrument changes...'
                : 'Describe character transform...'
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
                : pipelineStyle.bgClass + ' ' + pipelineStyle.textClass + ' hover:opacity-80'
            )}
            title="Submit (Ctrl+Enter)"
          >
            {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        </div>

        {/* Context toggle */}
        <button
          onClick={() => setShowContext(!showContext)}
          className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
          title="Analysis Context"
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

      {/* Context display */}
      {showContext && (
        <div className="shrink-0 px-2 pb-1.5">
          <pre className="text-[9px] font-mono text-slate-400 bg-slate-950/60 rounded p-1.5 overflow-x-auto leading-relaxed whitespace-pre max-h-20 overflow-y-auto">
            {contextText}
          </pre>
        </div>
      )}

      {/* InlineTerminal */}
      {expanded && (
        <div className="overflow-hidden px-2 pb-1.5 bg-slate-950/40 rounded-b-md">
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
