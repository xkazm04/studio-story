'use client';

import { useState } from 'react';
import {
  Play, Square, Plus, ChevronDown, Send, HardDrive, Loader2, Trash2,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { INSTRUMENT_TYPE_STYLES } from '../../types';
import { MOCK_BEAT_PATTERNS } from '../../data/mockAudioData';
import type { BeatPattern, InstrumentType } from '../../types';

interface TransportBarProps {
  pattern: BeatPattern;
  isPlaying: boolean;
  currentStep: number;
  totalSteps: number;
  availableInstruments: InstrumentType[];
  isSaving: boolean;
  onPlayStop: () => void;
  onUpdateBPM: (bpm: number) => void;
  onUpdateSwing: (swing: number) => void;
  onUpdateBars: (bars: number) => void;
  onAddTrack: (instrument: InstrumentType) => void;
  onLoadPreset: (preset: BeatPattern) => void;
  onClear: () => void;
  onExport: () => void;
  onSave: () => void;
}

export default function TransportBar({
  pattern,
  isPlaying,
  currentStep,
  totalSteps,
  availableInstruments,
  isSaving,
  onPlayStop,
  onUpdateBPM,
  onUpdateSwing,
  onUpdateBars,
  onAddTrack,
  onLoadPreset,
  onClear,
  onExport,
  onSave,
}: TransportBarProps) {
  const [showPresets, setShowPresets] = useState(false);
  const [showAddTrack, setShowAddTrack] = useState(false);

  return (
    <div
      className="shrink-0 flex items-center gap-3 px-3 py-2 border-b border-orange-500/10 flex-wrap"
      style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%)' }}
    >
      {/* Play/Stop */}
      <button
        onClick={onPlayStop}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
          isPlaying
            ? 'bg-orange-600 text-white'
            : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'
        )}
        style={isPlaying ? { boxShadow: '0 0 14px rgba(249, 115, 22, 0.3)' } : undefined}
      >
        {isPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        {isPlaying ? 'Stop' : 'Play'}
      </button>

      {isPlaying && (
        <span
          className="text-[11px] text-amber-400 font-mono font-semibold"
          style={{ textShadow: '0 0 10px rgba(245, 158, 11, 0.4)' }}
        >
          {currentStep + 1}/{totalSteps}
        </span>
      )}

      <div className="w-px h-5 bg-slate-700/20" />

      {/* BPM */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-slate-500">BPM</span>
        <input
          type="number"
          value={pattern.bpm}
          onChange={(e) => onUpdateBPM(Number(e.target.value))}
          className="w-14 px-2 py-1 bg-slate-950/60 border border-slate-700/30 rounded-md text-xs text-slate-200
            text-center font-mono backdrop-blur-sm focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/10 transition-all"
        />
      </div>

      {/* Swing */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-slate-500">Swing</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(pattern.swing * 100)}
          onChange={(e) => onUpdateSwing(Number(e.target.value) / 100)}
          className="w-16 h-1 accent-amber-500"
        />
        <span className="text-[11px] text-slate-500 font-mono w-7">{Math.round(pattern.swing * 100)}%</span>
      </div>

      {/* Bars */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-slate-500">Bars</span>
        <select
          value={pattern.bars}
          onChange={(e) => onUpdateBars(Number(e.target.value))}
          className="px-2 py-1 bg-slate-950/60 border border-slate-700/30 rounded-md text-xs text-slate-200
            backdrop-blur-sm focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/10 transition-all"
        >
          {[1, 2, 4].map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      <div className="flex-1" />

      {/* Add Track */}
      <div className="relative">
        <button
          onClick={() => setShowAddTrack(!showAddTrack)}
          disabled={availableInstruments.length === 0}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-30"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
        {showAddTrack && (
          <div
            className="absolute bottom-full right-0 mb-1 z-20 min-w-[120px] rounded-lg border border-orange-500/15 backdrop-blur-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 16px rgba(245, 158, 11, 0.06)',
            }}
          >
            {availableInstruments.map((inst) => {
              const style = INSTRUMENT_TYPE_STYLES[inst];
              return (
                <button
                  key={inst}
                  onClick={() => { onAddTrack(inst); setShowAddTrack(false); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800/40 transition-colors"
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
          <div
            className="absolute bottom-full right-0 mb-1 z-20 min-w-[170px] rounded-lg border border-orange-500/15 backdrop-blur-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 16px rgba(245, 158, 11, 0.06)',
            }}
          >
            {MOCK_BEAT_PATTERNS.map((preset, i) => (
              <button
                key={i}
                onClick={() => { onLoadPreset(preset); setShowPresets(false); }}
                className="w-full px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-slate-800/40 transition-colors"
              >
                <span className="font-medium block">{preset.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">{preset.bpm} BPM / {preset.genre}</span>
              </button>
            ))}
            <div className="border-t border-slate-700/20" />
            <button
              onClick={() => { onClear(); setShowPresets(false); }}
              className="w-full flex items-center gap-1.5 px-3 py-1.5 text-left text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Empty Pattern
            </button>
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-slate-700/20" />

      {/* Save */}
      <button
        onClick={onSave}
        disabled={isSaving}
        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-orange-300 hover:bg-orange-500/10 px-1.5 py-1 rounded-md transition-all disabled:opacity-50"
        title="Save audio to disk"
      >
        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <HardDrive className="w-3 h-3" />}
        Save
      </button>

      {/* Export to Mixer */}
      <button
        onClick={onExport}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium
          bg-amber-600/80 hover:bg-amber-500 text-white transition-all"
        style={{ boxShadow: '0 0 12px rgba(245, 158, 11, 0.15)' }}
      >
        <Send className="w-3 h-3" /> Export
      </button>
    </div>
  );
}
