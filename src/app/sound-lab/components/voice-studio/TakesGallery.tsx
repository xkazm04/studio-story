'use client';

import { useState, useCallback, useRef } from 'react';
import { Play, Square, Star, Check, Loader2 } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import WaveformVisualizer from '../shared/WaveformVisualizer';
import { EMOTIONS } from '../../lib/voiceModifiers';
import type { ScriptLineTake } from '../../types';

interface TakesGalleryProps {
  takes: ScriptLineTake[];
  selectedIdx: number;
  onSelect: (idx: number) => void;
  onRate: (idx: number, rating: number) => void;
  isGenerating: boolean;
  progress?: { done: number; total: number };
}

export default function TakesGallery({
  takes,
  selectedIdx,
  onSelect,
  onRate,
  isGenerating,
  progress,
}: TakesGalleryProps) {
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = useCallback((idx: number) => {
    // Stop current
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (playingIdx === idx) {
      setPlayingIdx(null);
      return;
    }

    const take = takes[idx];
    if (!take?.audioUrl) return;

    const audio = new Audio(take.audioUrl);
    audioRef.current = audio;
    setPlayingIdx(idx);

    audio.onended = () => {
      setPlayingIdx(null);
      audioRef.current = null;
    };
    audio.onerror = () => {
      setPlayingIdx(null);
      audioRef.current = null;
    };
    audio.play();
  }, [playingIdx, takes]);

  const getEmotionInfo = (emotionType: string) => {
    return EMOTIONS.find((e) => e.type === emotionType) ?? { label: emotionType, color: 'bg-slate-400' };
  };

  // Find highest rated take
  const bestIdx = takes.reduce<number | null>((best, take, idx) => {
    if (!take.rating) return best;
    if (best === null) return idx;
    return (take.rating > (takes[best]?.rating ?? 0)) ? idx : best;
  }, null);

  if (takes.length === 0 && !isGenerating) {
    return (
      <div className="text-center py-4">
        <span className="text-[11px] text-slate-500">No takes generated yet</span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {/* Progress bar during generation */}
      {isGenerating && progress && (
        <div className="flex items-center gap-2 mb-2">
          <Loader2 className="w-3.5 h-3.5 text-orange-400 animate-spin shrink-0" />
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
              style={{ width: progress.total > 0 ? `${(progress.done / progress.total) * 100}%` : '0%' }}
            />
          </div>
          <span className="text-[11px] text-orange-400 font-mono shrink-0">
            {progress.done}/{progress.total}
          </span>
        </div>
      )}

      {/* Take cards */}
      {takes.map((take, idx) => {
        const emotionInfo = getEmotionInfo(take.emotion);
        const isSelected = idx === selectedIdx;
        const isBest = idx === bestIdx;
        const isPlaying = playingIdx === idx;

        return (
          <div
            key={take.id}
            className={cn(
              'flex items-center gap-2 p-2 rounded-lg border transition-all duration-200',
              isSelected
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-slate-800/50 bg-slate-900/30 hover:border-slate-700/80'
            )}
          >
            {/* Emotion badge */}
            <div className="flex flex-col items-center gap-0.5 shrink-0 w-14">
              <div className={cn('w-4 h-4 rounded-full', emotionInfo.color)} />
              <span className="text-[9px] text-slate-400 text-center leading-tight">
                {emotionInfo.label}
              </span>
            </div>

            {/* Waveform + duration */}
            <div className="flex-1 min-w-0 space-y-1">
              <WaveformVisualizer
                data={take.waveformData}
                height={20}
                barWidth={2}
                gap={1}
                animated={isPlaying}
              />
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-mono">
                  {take.duration.toFixed(1)}s
                </span>
                <span className="text-[10px] text-slate-600">
                  {take.delivery} @ {take.intensity}%
                </span>
                {isBest && (
                  <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">
                    BEST
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              {/* Play */}
              <button
                onClick={() => handlePlay(idx)}
                className={cn(
                  'p-1 rounded transition-colors',
                  isPlaying ? 'text-orange-400' : 'text-slate-500 hover:text-slate-300'
                )}
              >
                {isPlaying ? (
                  <Square className="w-3 h-3" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
              </button>

              {/* Star Rating */}
              <div className="flex gap-px">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => onRate(idx, star)}
                    className={cn(
                      'transition-colors',
                      (take.rating ?? 0) >= star ? 'text-amber-400' : 'text-slate-700 hover:text-slate-500'
                    )}
                  >
                    <Star className="w-2.5 h-2.5" fill={(take.rating ?? 0) >= star ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>

              {/* Select */}
              <button
                onClick={() => onSelect(idx)}
                className={cn(
                  'text-[9px] px-1.5 py-0.5 rounded font-medium transition-colors',
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-orange-600/80 hover:bg-orange-500 text-white'
                )}
              >
                {isSelected ? <Check className="w-3 h-3" /> : 'Select'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
