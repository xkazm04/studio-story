'use client';

import { useState, useCallback, useMemo } from 'react';
import { Waves, Play, Square, Loader2, Download, Send, Plus, Trash2, RotateCcw } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { DSPProcessor } from '../../lib/dspProcessor';
import type { SpectralFeatures, DSPEffectChain, DSPFilterParams, GranularParams } from '../../types';

const FILTER_TYPES: { value: BiquadFilterType; label: string }[] = [
  { value: 'lowpass', label: 'Lowpass' },
  { value: 'highpass', label: 'Highpass' },
  { value: 'bandpass', label: 'Bandpass' },
  { value: 'peaking', label: 'Peaking' },
  { value: 'lowshelf', label: 'LowShelf' },
  { value: 'highshelf', label: 'HighShelf' },
  { value: 'notch', label: 'Notch' },
];

const PRESETS = DSPProcessor.presetChains();

interface CharacterModifyPanelProps {
  spectralFeatures: SpectralFeatures | null;
  effectChain: DSPEffectChain;
  hasSource: boolean;
  hasOutput: boolean;
  isProcessing: boolean;
  isPreviewing: boolean;
  isRendering: boolean;
  onChainChange: (chain: DSPEffectChain) => void;
  onPreview: () => void;
  onStopPreview: () => void;
  onRender: () => void;
  onSendToMixer: () => void;
}

export default function CharacterModifyPanel({
  spectralFeatures,
  effectChain,
  hasSource,
  hasOutput,
  isProcessing,
  isPreviewing,
  isRendering,
  onChainChange,
  onPreview,
  onStopPreview,
  onRender,
  onSendToMixer,
}: CharacterModifyPanelProps) {
  const { granular, filters, distortion, reverbMix, delayTime, delayFeedback } = effectChain;

  const updateGranular = useCallback((field: keyof GranularParams, value: number | boolean) => {
    onChainChange({
      ...effectChain,
      granular: { ...effectChain.granular, [field]: value },
    });
  }, [effectChain, onChainChange]);

  const updateFilter = useCallback((index: number, field: keyof DSPFilterParams, value: string | number) => {
    const newFilters = [...effectChain.filters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    onChainChange({ ...effectChain, filters: newFilters });
  }, [effectChain, onChainChange]);

  const addFilter = useCallback(() => {
    if (effectChain.filters.length >= 3) return;
    const newFilter: DSPFilterParams = { type: 'lowpass', frequency: 1000, Q: 1, gain: 0 };
    onChainChange({ ...effectChain, filters: [...effectChain.filters, newFilter] });
  }, [effectChain, onChainChange]);

  const removeFilter = useCallback((index: number) => {
    onChainChange({
      ...effectChain,
      filters: effectChain.filters.filter((_, i) => i !== index),
    });
  }, [effectChain, onChainChange]);

  const applyPreset = useCallback((key: string) => {
    const preset = PRESETS[key];
    if (preset) onChainChange(preset.chain);
  }, [onChainChange]);

  const resetChain = useCallback(() => {
    onChainChange(DSPProcessor.defaultChain());
  }, [onChainChange]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-4 py-2.5 border-b border-slate-800/30">
        <div className="flex items-center gap-2">
          <Waves className="w-3.5 h-3.5 text-fuchsia-400" />
          <span className="text-[12px] font-semibold text-slate-200">Character Modify</span>
          {spectralFeatures && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-fuchsia-500/10 text-fuchsia-400">
              {spectralFeatures.description.split(',')[0]}
            </span>
          )}
          <button
            onClick={resetChain}
            className="ml-auto text-slate-500 hover:text-slate-300 active:scale-95 transition-all"
            title="Reset to defaults"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Preset Buttons */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            Presets
          </span>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-fuchsia-500/8 text-fuchsia-300 hover:bg-fuchsia-500/15 hover:shadow-sm hover:shadow-fuchsia-500/10 active:scale-95 transition-all border border-fuchsia-500/10"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Granular Controls */}
        <div className="rounded-lg border border-slate-800/40 bg-slate-900/30 p-3 space-y-2">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            Granular Synthesis
          </span>

          <SliderRow
            label="Grain Size"
            value={granular.grainSize}
            min={0.01}
            max={0.5}
            step={0.01}
            suffix="s"
            onChange={(v) => updateGranular('grainSize', v)}
          />
          <SliderRow
            label="Overlap"
            value={granular.overlap}
            min={0.1}
            max={2.0}
            step={0.1}
            onChange={(v) => updateGranular('overlap', v)}
          />
          <SliderRow
            label="Pitch Shift"
            value={granular.pitchShift}
            min={-24}
            max={24}
            step={1}
            suffix="st"
            signed
            onChange={(v) => updateGranular('pitchShift', v)}
          />
          <SliderRow
            label="Speed"
            value={granular.playbackRate}
            min={0.25}
            max={4.0}
            step={0.05}
            suffix="x"
            onChange={(v) => updateGranular('playbackRate', v)}
          />
          <SliderRow
            label="Randomness"
            value={granular.randomness}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => updateGranular('randomness', v)}
          />

          {/* Reverse toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 w-20 shrink-0">Reverse</span>
            <button
              onClick={() => updateGranular('reverse', !granular.reverse)}
              className={cn(
                'px-2.5 py-0.5 rounded text-[10px] font-medium active:scale-95 transition-all',
                granular.reverse
                  ? 'bg-fuchsia-500/15 text-fuchsia-400'
                  : 'bg-slate-800/40 text-slate-500'
              )}
            >
              {granular.reverse ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Filter Chain */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Filters ({filters.length}/3)
            </span>
            {filters.length < 3 && (
              <button
                onClick={addFilter}
                className="text-slate-500 hover:text-fuchsia-400 active:scale-95 transition-all"
                title="Add filter"
              >
                <Plus className="w-3 h-3" />
              </button>
            )}
          </div>

          {filters.map((filter, fi) => (
            <div key={fi} className="bg-slate-900/40 rounded-md p-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <select
                  value={filter.type}
                  onChange={(e) => updateFilter(fi, 'type', e.target.value)}
                  className="flex-1 px-2 py-0.5 bg-slate-950/60 border border-slate-700/40 rounded text-[10px] text-slate-200 focus:outline-none focus:border-fuchsia-500/40"
                >
                  {FILTER_TYPES.map((ft) => (
                    <option key={ft.value} value={ft.value}>{ft.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => removeFilter(fi)}
                  className="text-slate-500 hover:text-red-400 active:scale-95 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <SliderRow
                label="Freq"
                value={filter.frequency}
                min={20}
                max={20000}
                step={10}
                suffix="Hz"
                onChange={(v) => updateFilter(fi, 'frequency', v)}
              />
              <SliderRow
                label="Q"
                value={filter.Q}
                min={0.1}
                max={20}
                step={0.1}
                onChange={(v) => updateFilter(fi, 'Q', v)}
              />
              {(filter.type === 'peaking' || filter.type === 'lowshelf' || filter.type === 'highshelf') && (
                <SliderRow
                  label="Gain"
                  value={filter.gain}
                  min={-24}
                  max={24}
                  step={0.5}
                  suffix="dB"
                  signed
                  onChange={(v) => updateFilter(fi, 'gain', v)}
                />
              )}
            </div>
          ))}
        </div>

        {/* Effects */}
        <div className="rounded-lg border border-slate-800/40 bg-slate-900/30 p-3 space-y-2">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            Effects
          </span>
          <SliderRow
            label="Distortion"
            value={distortion}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => onChainChange({ ...effectChain, distortion: v })}
          />
          <SliderRow
            label="Reverb"
            value={reverbMix}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => onChainChange({ ...effectChain, reverbMix: v })}
          />
          <SliderRow
            label="Delay Time"
            value={delayTime}
            min={0}
            max={1}
            step={0.01}
            suffix="s"
            onChange={(v) => onChainChange({ ...effectChain, delayTime: v })}
          />
          <SliderRow
            label="Delay FB"
            value={delayFeedback}
            min={0}
            max={0.95}
            step={0.05}
            onChange={(v) => onChainChange({ ...effectChain, delayFeedback: v })}
          />
        </div>

        {/* Action Row */}
        <div className="flex items-center gap-2 border-t border-slate-800/20 pt-3">
          <button
            onClick={isPreviewing ? onStopPreview : onPreview}
            disabled={!hasSource || isProcessing}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed',
              isPreviewing
                ? 'bg-red-500/15 text-red-400'
                : 'bg-fuchsia-500/15 text-fuchsia-400 hover:bg-fuchsia-500/25'
            )}
          >
            {isPreviewing ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isPreviewing ? 'Stop' : 'Preview'}
          </button>
          <button
            onClick={onRender}
            disabled={isRendering || !hasSource}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed',
              isRendering
                ? 'bg-slate-800/40 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
            )}
          >
            {isRendering ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            {isRendering ? 'Rendering...' : 'Render'}
          </button>
          <button
            onClick={onSendToMixer}
            disabled={!hasOutput}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed ml-auto',
              'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
            )}
          >
            <Send className="w-3 h-3" />
            Mixer
          </button>
        </div>
      </div>
    </div>
  );
}

/* -- Slider sub-component -- */

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  suffix,
  signed,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  signed?: boolean;
  onChange: (v: number) => void;
}) {
  const display = signed && value > 0
    ? `+${step >= 1 ? value : step >= 0.1 ? value.toFixed(1) : value.toFixed(2)}`
    : step >= 1 ? String(value) : step >= 0.1 ? value.toFixed(1) : value.toFixed(2);

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-400 w-20 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-fuchsia-500 h-1"
      />
      <span className="text-[10px] font-mono text-slate-300 w-14 text-right shrink-0">
        {display}{suffix || ''}
      </span>
    </div>
  );
}
