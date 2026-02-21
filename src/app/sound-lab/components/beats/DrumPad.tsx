'use client';

import { Circle, Keyboard } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { INSTRUMENT_TYPE_STYLES } from '../../types';
import type { BeatPattern, InstrumentType } from '../../types';

const KEY_LABELS: { key: string; code: string; instrument: InstrumentType }[] = [
  { key: 'Q', code: 'KeyQ', instrument: 'kick' },
  { key: 'W', code: 'KeyW', instrument: 'snare' },
  { key: 'E', code: 'KeyE', instrument: 'hihat' },
  { key: 'R', code: 'KeyR', instrument: 'clap' },
  { key: 'T', code: 'KeyT', instrument: 'tom' },
  { key: 'Y', code: 'KeyY', instrument: 'cymbal' },
  { key: 'A', code: 'KeyA', instrument: 'bass' },
  { key: 'S', code: 'KeyS', instrument: 'pad' },
  { key: 'D', code: 'KeyD', instrument: 'arp' },
  { key: 'F', code: 'KeyF', instrument: 'perc' },
];

// Glow colors for pressed pads — maps instrument to rgba shadow
const PAD_GLOW: Record<InstrumentType, string> = {
  kick: '0 0 12px rgba(249, 115, 22, 0.3)',
  snare: '0 0 12px rgba(245, 158, 11, 0.3)',
  hihat: '0 0 12px rgba(234, 179, 8, 0.3)',
  clap: '0 0 12px rgba(244, 63, 94, 0.3)',
  tom: '0 0 12px rgba(239, 68, 68, 0.3)',
  cymbal: '0 0 12px rgba(148, 163, 184, 0.3)',
  bass: '0 0 12px rgba(56, 189, 248, 0.3)',
  pad: '0 0 12px rgba(167, 139, 250, 0.3)',
  arp: '0 0 12px rgba(52, 211, 153, 0.3)',
  perc: '0 0 12px rgba(45, 212, 191, 0.3)',
};

interface DrumPadProps {
  pattern: BeatPattern;
  pressedKeys: Set<string>;
  recording: boolean;
  onToggleRecording: () => void;
}

export default function DrumPad({
  pattern,
  pressedKeys,
  recording,
  onToggleRecording,
}: DrumPadProps) {
  return (
    <div
      className="rounded-lg border border-orange-500/10 p-3 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(2, 6, 23, 0.8) 100%)' }}
    >
      <div className="flex items-center gap-2 mb-2 relative">
        <div
          className="p-1 rounded border border-amber-500/25"
          style={{ background: 'rgba(245, 158, 11, 0.08)', boxShadow: '0 0 8px rgba(245, 158, 11, 0.08)' }}
        >
          <Keyboard className="w-3 h-3 text-amber-400" />
        </div>
        <span className="text-[11px] font-semibold text-slate-300 tracking-wide">Keyboard Pad</span>
        <div className="flex-1" />
        <button
          onClick={onToggleRecording}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all',
            recording
              ? 'bg-red-600 text-white'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
          )}
          style={recording ? { boxShadow: '0 0 14px rgba(239, 68, 68, 0.35)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' } : undefined}
        >
          <Circle className={cn('w-2.5 h-2.5', recording && 'fill-current')} />
          {recording ? 'REC' : 'Rec'}
        </button>
      </div>

      {recording && (
        <p className="text-[10px] text-slate-500 mb-2">
          Press keys during playback to record hits at the current step
        </p>
      )}

      {/* Pad Grid */}
      <div className="space-y-1.5">
        {/* Row 1: Q-Y (drums) */}
        <div className="flex gap-1">
          {KEY_LABELS.slice(0, 6).map(({ key, code, instrument }) => {
            const style = INSTRUMENT_TYPE_STYLES[instrument];
            const isPressed = pressedKeys.has(code);
            const hasTrack = pattern.tracks.some((t) => t.instrument === instrument);
            return (
              <div
                key={code}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center py-2 rounded-md border transition-all duration-100 cursor-pointer select-none',
                  isPressed
                    ? cn('border-transparent scale-95', style.bgClass)
                    : hasTrack
                      ? 'border-slate-700/30 bg-slate-800/20 hover:bg-slate-800/40'
                      : 'border-slate-800/20 bg-slate-900/20 hover:bg-slate-800/30'
                )}
                style={isPressed ? { boxShadow: PAD_GLOW[instrument] } : undefined}
              >
                <kbd className={cn(
                  'text-xs font-mono font-bold mb-0.5 transition-colors',
                  isPressed ? 'text-white' : style.textClass
                )}
                  style={isPressed ? { textShadow: PAD_GLOW[instrument] } : undefined}
                >
                  {key}
                </kbd>
                <span className={cn('text-[8px]', isPressed ? 'text-white/80' : 'text-slate-500')}>
                  {style.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Row 2: A-F (melodic + perc) */}
        <div className="flex gap-1">
          {KEY_LABELS.slice(6).map(({ key, code, instrument }) => {
            const style = INSTRUMENT_TYPE_STYLES[instrument];
            const isPressed = pressedKeys.has(code);
            const hasTrack = pattern.tracks.some((t) => t.instrument === instrument);
            return (
              <div
                key={code}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center py-2 rounded-md border transition-all duration-100 cursor-pointer select-none',
                  isPressed
                    ? cn('border-transparent scale-95', style.bgClass)
                    : hasTrack
                      ? 'border-slate-700/30 bg-slate-800/20 hover:bg-slate-800/40'
                      : 'border-slate-800/20 bg-slate-900/20 hover:bg-slate-800/30'
                )}
                style={isPressed ? { boxShadow: PAD_GLOW[instrument] } : undefined}
              >
                <kbd className={cn(
                  'text-xs font-mono font-bold mb-0.5 transition-colors',
                  isPressed ? 'text-white' : style.textClass
                )}
                  style={isPressed ? { textShadow: PAD_GLOW[instrument] } : undefined}
                >
                  {key}
                </kbd>
                <span className={cn('text-[8px]', isPressed ? 'text-white/80' : 'text-slate-500')}>
                  {style.label}
                </span>
              </div>
            );
          })}
          <div className="flex-1" />
          <div className="flex-1" />
        </div>
      </div>
    </div>
  );
}
