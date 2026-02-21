'use client';

import { cn } from '@/app/lib/utils';

interface WaveformVisualizerProps {
  data: number[];
  height?: number;
  barWidth?: number;
  gap?: number;
  animated?: boolean;
  progress?: number;
  className?: string;
}

/**
 * Monochrome waveform — slate-500 bars, orange-400 for played portion.
 * No per-type color variants (readability over decoration).
 */
export default function WaveformVisualizer({
  data,
  height = 32,
  barWidth = 2,
  gap = 1,
  animated = false,
  progress = 0,
  className,
}: WaveformVisualizerProps) {
  return (
    <div
      className={cn('flex items-end', className)}
      style={{ height, gap }}
    >
      {data.map((value, i) => {
        const isPlayed = progress > 0 && i / data.length <= progress;
        return (
          <div
            key={i}
            className={cn(
              'rounded-full transition-all duration-150',
              isPlayed ? 'bg-orange-400' : 'bg-slate-600',
              animated && 'animate-pulse'
            )}
            style={{
              width: barWidth,
              height: Math.max(2, value * height),
              animationDelay: animated ? `${i * 30}ms` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
