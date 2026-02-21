'use client';

import { useState, useCallback } from 'react';
import { Music, Play, Square, Loader2, Download, Send } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import PianoRoll from './PianoRoll';
import { GM_INSTRUMENTS, GM_FAMILIES } from '../../types';
import type { MidiExtractionResult, InstrumentSwap, VelocityCurve } from '../../types';

interface MidiBridgePanelProps {
  extraction: MidiExtractionResult | null;
  swaps: InstrumentSwap[];
  globalTransposition: number;
  globalVelocityCurve: VelocityCurve;
  hasOutput: boolean;
  isExtracting: boolean;
  isPlaying: boolean;
  isRendering: boolean;
  onExtract: () => void;
  onSwapChange: (swaps: InstrumentSwap[]) => void;
  onTranspositionChange: (val: number) => void;
  onVelocityCurveChange: (val: VelocityCurve) => void;
  onPlay: () => void;
  onStop: () => void;
  onRender: () => void;
  onSendToMixer: () => void;
}

const VELOCITY_CURVES: { value: VelocityCurve; label: string }[] = [
  { value: 'linear', label: 'Linear' },
  { value: 'soft', label: 'Soft' },
  { value: 'hard', label: 'Hard' },
  { value: 'compressed', label: 'Compressed' },
];

export default function MidiBridgePanel({
  extraction,
  swaps,
  globalTransposition,
  globalVelocityCurve,
  hasOutput,
  isExtracting,
  isPlaying,
  isRendering,
  onExtract,
  onSwapChange,
  onTranspositionChange,
  onVelocityCurveChange,
  onPlay,
  onStop,
  onRender,
  onSendToMixer,
}: MidiBridgePanelProps) {

  const updateSwap = useCallback((trackIndex: number, field: keyof InstrumentSwap, value: number | string) => {
    const existing = swaps.find(s => s.trackIndex === trackIndex);
    const track = extraction?.tracks[trackIndex];
    if (!track) return;

    const updated = existing
      ? { ...existing, [field]: value }
      : {
          trackIndex,
          originalInstrument: track.instrument,
          newInstrument: field === 'newInstrument' ? value as number : track.instrument,
          newInstrumentName: field === 'newInstrument' ? (GM_INSTRUMENTS[value as number] ?? 'Unknown') : GM_INSTRUMENTS[track.instrument] ?? 'Unknown',
        };

    if (field === 'newInstrument') {
      updated.newInstrumentName = GM_INSTRUMENTS[value as number] ?? 'Unknown';
    }

    const newSwaps = swaps.filter(s => s.trackIndex !== trackIndex);
    newSwaps.push(updated as InstrumentSwap);
    onSwapChange(newSwaps);
  }, [swaps, extraction, onSwapChange]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-4 py-2.5 border-b border-slate-800/30">
        <div className="flex items-center gap-2">
          <Music className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[12px] font-semibold text-slate-200">MIDI Bridge</span>
          {extraction && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
              {extraction.tracks.length} tracks | {Math.round(extraction.tempo)} BPM
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Step 1: Extract */}
        {!extraction && (
          <div className="flex flex-col items-center gap-3 py-6">
            <button
              onClick={onExtract}
              disabled={isExtracting}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed',
                isExtracting
                  ? 'bg-slate-800/40 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 border border-cyan-500/20'
              )}
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting MIDI...
                </>
              ) : (
                <>
                  <Music className="w-4 h-4" />
                  Extract MIDI from Audio
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-500 text-center max-w-xs">
              Uses machine learning to detect notes, chords, and rhythm from the audio file.
              First run may take a few seconds to load the model.
            </p>
          </div>
        )}

        {/* Step 2: Piano Roll + Controls */}
        {extraction && (
          <>
            {/* Piano Roll */}
            <div className="rounded-lg border border-slate-800/40 bg-slate-900/30 p-3">
              <PianoRoll extraction={extraction} height={140} />
            </div>

            {/* Track instrument controls */}
            <div className="rounded-lg border border-slate-800/40 bg-slate-900/30 p-3 space-y-2">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Instrument Assignment
              </span>
              {extraction.tracks.map((track, ti) => {
                const swap = swaps.find(s => s.trackIndex === ti);
                const currentProgram = swap ? swap.newInstrument : track.instrument;
                const currentFamily = GM_FAMILIES.find(
                  f => currentProgram >= f.range[0] && currentProgram <= f.range[1]
                );

                return (
                  <div key={ti} className="bg-slate-900/40 rounded-md p-2 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-300">{track.name}</span>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-slate-800/60 text-slate-400">
                        {track.notes.length} notes
                      </span>
                      <span className="text-[9px] text-slate-500 ml-auto">
                        GM#{currentProgram}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Family dropdown */}
                      <select
                        value={currentFamily?.family ?? 'piano'}
                        onChange={(e) => {
                          const fam = GM_FAMILIES.find(f => f.family === e.target.value);
                          if (fam) updateSwap(ti, 'newInstrument', fam.range[0]);
                        }}
                        className="flex-1 px-2 py-1 bg-slate-950/60 border border-slate-700/40 rounded text-[10px] text-slate-200 focus:outline-none focus:border-cyan-500/40"
                      >
                        {GM_FAMILIES.map(f => (
                          <option key={f.family} value={f.family}>{f.label}</option>
                        ))}
                      </select>
                      {/* Instrument within family */}
                      <select
                        value={currentProgram}
                        onChange={(e) => updateSwap(ti, 'newInstrument', parseInt(e.target.value))}
                        className="flex-1 px-2 py-1 bg-slate-950/60 border border-slate-700/40 rounded text-[10px] text-slate-200 focus:outline-none focus:border-cyan-500/40"
                      >
                        {currentFamily && Array.from({ length: currentFamily.range[1] - currentFamily.range[0] + 1 }, (_, i) => {
                          const prog = currentFamily.range[0] + i;
                          return (
                            <option key={prog} value={prog}>{GM_INSTRUMENTS[prog]}</option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Global controls */}
            <div className="rounded-lg border border-slate-800/40 bg-slate-900/30 p-3 space-y-2">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Global Controls
              </span>
              {/* Transposition */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 w-20 shrink-0">Transpose</span>
                <input
                  type="range"
                  min={-24}
                  max={24}
                  value={globalTransposition}
                  onChange={(e) => onTranspositionChange(parseInt(e.target.value))}
                  className="flex-1 accent-cyan-500"
                />
                <span className="text-[10px] font-mono text-slate-300 w-8 text-right">
                  {globalTransposition > 0 ? '+' : ''}{globalTransposition}
                </span>
              </div>
              {/* Velocity curve */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 w-20 shrink-0">Velocity</span>
                <div className="flex gap-1">
                  {VELOCITY_CURVES.map(vc => (
                    <button
                      key={vc.value}
                      onClick={() => onVelocityCurveChange(vc.value)}
                      className={cn(
                        'px-2 py-0.5 rounded text-[9px] font-medium active:scale-95 transition-all',
                        globalVelocityCurve === vc.value
                          ? 'bg-cyan-500/15 text-cyan-400'
                          : 'text-slate-500 hover:text-slate-300'
                      )}
                    >
                      {vc.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action row */}
            <div className="flex items-center gap-2 border-t border-slate-800/20 pt-3">
              <button
                onClick={isPlaying ? onStop : onPlay}
                disabled={!extraction || isExtracting}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed',
                  isPlaying
                    ? 'bg-red-500/15 text-red-400'
                    : 'bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25'
                )}
              >
                {isPlaying ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                {isPlaying ? 'Stop' : 'Play'}
              </button>
              <button
                onClick={onRender}
                disabled={isRendering || !extraction}
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
          </>
        )}
      </div>
    </div>
  );
}
