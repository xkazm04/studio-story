'use client';

import { cn } from '@/app/lib/utils';
import { Volume2, VolumeX, Trash2 } from 'lucide-react';
import { INSTRUMENT_TYPE_STYLES, TRACK_SOURCE_STYLES } from '../../types';
import type { BeatPattern, BeatSample, BeatTrackSource, BeatTrack } from '../../types';

interface StepGridProps {
  pattern: BeatPattern;
  currentStep: number;
  sampleBank: Map<string, BeatSample>;
  onToggleStep: (trackIdx: number, stepIdx: number, shiftKey: boolean) => void;
  onToggleMute: (trackIdx: number) => void;
  onRemoveTrack: (trackIdx: number) => void;
}

export default function StepGrid({
  pattern,
  currentStep,
  sampleBank,
  onToggleStep,
  onToggleMute,
  onRemoveTrack,
}: StepGridProps) {
  const totalSteps = pattern.stepsPerBeat * pattern.beats * pattern.bars;

  return (
    <div className="overflow-x-auto">
      {/* Beat markers */}
      <div className="flex items-center mb-1">
        <div className="w-32 shrink-0" />
        {Array.from({ length: totalSteps }, (_, i) => {
          const isBeatStart = i % pattern.stepsPerBeat === 0;
          const beatNum = Math.floor(i / pattern.stepsPerBeat) + 1;
          const isOddBeat = Math.floor(i / pattern.stepsPerBeat) % 2 === 1;
          const isCurrent = currentStep === i;
          return (
            <div
              key={i}
              className={cn(
                'w-7 h-5 flex items-center justify-center shrink-0',
                isCurrent && 'rounded',
                isOddBeat && 'bg-slate-800/15'
              )}
              style={isCurrent ? { background: 'rgba(245, 158, 11, 0.15)', boxShadow: '0 0 8px rgba(245, 158, 11, 0.1)' } : undefined}
            >
              {isBeatStart ? (
                <span className={cn('text-[10px] font-mono', isCurrent ? 'text-amber-400' : 'text-slate-400')}>{beatNum}</span>
              ) : (
                <span className="text-[10px] text-slate-700/50">.</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Tracks */}
      {pattern.tracks.map((track, trackIdx) => {
        const style = INSTRUMENT_TYPE_STYLES[track.instrument];
        const src = (track as BeatTrack & { source?: BeatTrackSource }).source;
        const isSample = src?.mode === 'sample';
        const sample = isSample && src?.sampleId ? sampleBank.get(src.sampleId) : null;

        return (
          <div key={`${track.instrument}-${trackIdx}`} className="flex items-center mb-1 group/track">
            {/* Track label + controls */}
            <div className="w-32 shrink-0 flex items-center gap-1 pr-2">
              <button
                onClick={() => onToggleMute(trackIdx)}
                className={cn(
                  'w-5 h-5 rounded flex items-center justify-center transition-all shrink-0',
                  track.muted
                    ? 'text-red-400 bg-red-500/10'
                    : 'text-slate-500 hover:text-slate-300'
                )}
                style={track.muted ? { boxShadow: '0 0 6px rgba(239, 68, 68, 0.15)' } : undefined}
                title={track.muted ? 'Unmute' : 'Mute'}
              >
                {track.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </button>

              <span className={cn('text-[11px] font-medium truncate', style.textClass)}>
                {style.label}
              </span>

              {/* Source badge */}
              {isSample && (
                <span className={cn('text-[9px] px-1 rounded', TRACK_SOURCE_STYLES.sample.bgClass, TRACK_SOURCE_STYLES.sample.textClass)}>
                  S
                </span>
              )}

              {/* Mini waveform for sample tracks */}
              {sample?.waveformData && (
                <div className="flex items-end gap-px h-[4px] ml-0.5">
                  {sample.waveformData.slice(0, 12).map((v, i) => (
                    <div
                      key={i}
                      className="w-[2px] bg-emerald-400/50 rounded-sm"
                      style={{ height: `${Math.max(1, v * 4)}px` }}
                    />
                  ))}
                </div>
              )}

              <button
                onClick={() => onRemoveTrack(trackIdx)}
                className="ml-auto opacity-0 group-hover/track:opacity-100 text-slate-600 hover:text-red-400 p-0.5 rounded hover:bg-red-500/10 transition-all shrink-0"
                title="Remove track"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {/* Steps */}
            {track.steps.map((step, stepIdx) => {
              const isBeatBoundary = stepIdx % pattern.stepsPerBeat === 0 && stepIdx > 0;
              const isOddBeat = Math.floor(stepIdx / pattern.stepsPerBeat) % 2 === 1;
              return (
                <button
                  key={stepIdx}
                  onClick={(e) => onToggleStep(trackIdx, stepIdx, e.shiftKey)}
                  className={cn(
                    'w-7 h-7 shrink-0 rounded-[3px] border transition-all relative overflow-hidden',
                    isBeatBoundary && 'ml-0.5',
                    isOddBeat && !step.active && 'bg-slate-800/10',
                    currentStep === stepIdx && !step.active && 'ring-1 ring-amber-400/50',
                    step.active
                      ? cn(
                          style.bgClass,
                          'border-transparent',
                          step.accent && 'ring-1 ring-white/30',
                          track.muted && 'opacity-30',
                          currentStep === stepIdx && 'ring-1 ring-amber-400/70'
                        )
                      : 'border-slate-800/30 hover:border-slate-700/40 bg-slate-900/20'
                  )}
                  style={step.active && currentStep === stepIdx ? { boxShadow: '0 0 8px rgba(245, 158, 11, 0.2)' } : undefined}
                  title={step.active ? `v:${step.velocity.toFixed(1)}${step.accent ? ' (accent)' : ''}` : 'Click to add'}
                >
                  {step.active && (
                    <div
                      className={cn('absolute bottom-0 left-0 right-0 rounded-[2px]', style.bgClass)}
                      style={{
                        height: `${30 + step.velocity * 70}%`,
                        opacity: 0.4 + step.velocity * 0.6,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        );
      })}

      {pattern.tracks.length === 0 && (
        <div className="text-center py-8 text-slate-500 text-xs">
          No tracks yet. Add instruments from the rack or use AI to generate a pattern.
        </div>
      )}
    </div>
  );
}
