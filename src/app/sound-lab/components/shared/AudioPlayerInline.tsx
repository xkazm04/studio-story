'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import WaveformVisualizer from './WaveformVisualizer';

interface AudioPlayerInlineProps {
  waveformData: number[];
  duration: number;
  audioUrl?: string;
  className?: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AudioPlayerInline({
  waveformData,
  duration,
  audioUrl,
  className,
}: AudioPlayerInlineProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (mockTimerRef.current) clearInterval(mockTimerRef.current);
    };
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      // Stop
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (mockTimerRef.current) {
        clearInterval(mockTimerRef.current);
        mockTimerRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    setProgress(0);

    if (audioUrl) {
      // Real audio playback
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.ontimeupdate = () => {
        if (audio.duration && isFinite(audio.duration)) {
          setProgress(audio.currentTime / audio.duration);
        }
      };
      audio.onended = () => {
        setIsPlaying(false);
        setProgress(0);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setIsPlaying(false);
        setProgress(0);
        audioRef.current = null;
      };
      audio.play();
    } else {
      // Mock playback progression
      const steps = 40;
      const interval = (Math.min(duration, 5) * 1000) / steps;
      let step = 0;
      mockTimerRef.current = setInterval(() => {
        step++;
        setProgress(step / steps);
        if (step >= steps) {
          if (mockTimerRef.current) clearInterval(mockTimerRef.current);
          mockTimerRef.current = null;
          setIsPlaying(false);
          setProgress(0);
        }
      }, interval);
    }
  }, [isPlaying, duration, audioUrl]);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        onClick={togglePlay}
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-200',
          isPlaying
            ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
        )}
      >
        {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
      </button>

      <WaveformVisualizer
        data={waveformData}
        height={20}
        barWidth={2}
        gap={1}
        progress={progress}
        animated={isPlaying}
        className="flex-1"
      />

      <div className="flex items-center gap-1 shrink-0">
        <Volume2 className="w-3 h-3 text-slate-600" />
        <span className="text-[11px] text-slate-400 font-mono w-8">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
