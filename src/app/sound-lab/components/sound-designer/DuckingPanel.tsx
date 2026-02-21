'use client';

import { VolumeX, Volume2 } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type { DuckingConfig, AudioAssetType } from '../../types';

interface DuckingPanelProps {
  config: DuckingConfig;
  onChange: (config: DuckingConfig) => void;
  onApply: () => void;
  onClose: () => void;
}

const LANE_OPTIONS: { value: AudioAssetType; label: string }[] = [
  { value: 'voice', label: 'Voice' },
  { value: 'music', label: 'Music' },
  { value: 'sfx', label: 'SFX' },
  { value: 'ambience', label: 'Ambience' },
];

/** Convert linear 0-1 amount to approximate dB */
function toDB(amount: number): string {
  if (amount <= 0) return '-Inf';
  const db = 20 * Math.log10(amount);
  return `${Math.round(db)}dB`;
}

export default function DuckingPanel({ config, onChange, onApply, onClose }: DuckingPanelProps) {
  return (
    <div className="w-64 bg-slate-900 border border-slate-700/60 rounded-lg shadow-xl shadow-black/30 p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <VolumeX className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-slate-200">Auto-Duck</span>
        </div>
        <button
          onClick={onClose}
          className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          Close
        </button>
      </div>

      {/* Enable Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-400">Enabled</span>
        <button
          onClick={() => onChange({ ...config, enabled: !config.enabled })}
          className={cn(
            'w-8 h-4 rounded-full transition-all relative',
            config.enabled ? 'bg-orange-500' : 'bg-slate-700'
          )}
        >
          <div className={cn(
            'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all',
            config.enabled ? 'left-[18px]' : 'left-0.5'
          )} />
        </button>
      </div>

      {/* Source Lane */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-slate-500 w-14 shrink-0">Source</span>
        <select
          value={config.sourceLane}
          onChange={(e) => onChange({ ...config, sourceLane: e.target.value as AudioAssetType })}
          className="flex-1 h-5 bg-slate-800/60 border border-slate-700/40 rounded px-1.5 text-[11px] text-slate-300
            focus:outline-none focus:border-orange-500/40"
        >
          {LANE_OPTIONS.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      {/* Target Lane */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-slate-500 w-14 shrink-0">Target</span>
        <select
          value={config.targetLane}
          onChange={(e) => onChange({ ...config, targetLane: e.target.value as AudioAssetType })}
          className="flex-1 h-5 bg-slate-800/60 border border-slate-700/40 rounded px-1.5 text-[11px] text-slate-300
            focus:outline-none focus:border-orange-500/40"
        >
          {LANE_OPTIONS.filter((l) => l.value !== config.sourceLane).map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      {/* Amount (dB) */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-slate-500 w-14 shrink-0">Amount</span>
        <input
          type="range"
          min={5}
          max={100}
          step={5}
          value={Math.round(config.amount * 100)}
          onChange={(e) => onChange({ ...config, amount: Number(e.target.value) / 100 })}
          className="flex-1 h-1 bg-slate-800 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400"
        />
        <span className="text-[11px] text-amber-400 font-mono w-10 text-right">
          {toDB(config.amount)}
        </span>
      </div>

      {/* Attack */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-slate-500 w-14 shrink-0">Attack</span>
        <input
          type="range"
          min={50}
          max={500}
          step={10}
          value={Math.round(config.attack * 1000)}
          onChange={(e) => onChange({ ...config, attack: Number(e.target.value) / 1000 })}
          className="flex-1 h-1 bg-slate-800 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400"
        />
        <span className="text-[11px] text-slate-400 font-mono w-10 text-right">
          {Math.round(config.attack * 1000)}ms
        </span>
      </div>

      {/* Release */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-slate-500 w-14 shrink-0">Release</span>
        <input
          type="range"
          min={100}
          max={1000}
          step={10}
          value={Math.round(config.release * 1000)}
          onChange={(e) => onChange({ ...config, release: Number(e.target.value) / 1000 })}
          className="flex-1 h-1 bg-slate-800 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400"
        />
        <span className="text-[11px] text-slate-400 font-mono w-10 text-right">
          {Math.round(config.release * 1000)}ms
        </span>
      </div>

      {/* Apply Button */}
      <button
        onClick={onApply}
        disabled={!config.enabled}
        className={cn(
          'w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-all',
          config.enabled
            ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
        )}
      >
        <Volume2 className="w-3 h-3" />
        Apply Auto-Duck
      </button>
    </div>
  );
}
