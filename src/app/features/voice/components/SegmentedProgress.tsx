'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/app/lib/utils';

type LineStatus = 'pending' | 'generating' | 'done' | 'error';

interface SegmentLine {
  id: string;
  character: string;
  status: LineStatus;
}

interface SegmentedProgressProps {
  lines: SegmentLine[];
  generationStartTime: number | null;
  doneCount: number;
  totalCount: number;
}

const STATUS_CLASSES: Record<LineStatus, string> = {
  pending: 'bg-slate-800',
  generating: 'animate-pulse bg-amber-500/50',
  done: 'bg-emerald-500/60',
  error: 'bg-red-500/60',
};

const STATUS_HOVER: Record<LineStatus, string> = {
  pending: 'hover:bg-slate-700',
  generating: 'hover:bg-amber-500/70',
  done: 'hover:bg-emerald-500/80',
  error: 'hover:bg-red-500/80',
};

function formatTime(seconds: number): string {
  if (seconds < 0 || !isFinite(seconds)) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function SegmentedProgress({
  lines,
  generationStartTime,
  doneCount,
  totalCount,
}: SegmentedProgressProps) {
  const [now, setNow] = useState(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isGenerating = lines.some((l) => l.status === 'generating');
  const currentLine = lines.find((l) => l.status === 'generating');

  useEffect(() => {
    if (isGenerating) {
      intervalRef.current = setInterval(() => setNow(Date.now()), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isGenerating]);

  const eta = (() => {
    if (!generationStartTime || doneCount === 0 || totalCount === 0) return null;
    const elapsed = (now - generationStartTime) / 1000;
    const avgPerLine = elapsed / doneCount;
    const remaining = avgPerLine * (totalCount - doneCount);
    return remaining;
  })();

  const handleSegmentClick = useCallback((lineId: string) => {
    const el = document.querySelector(`[data-line-id="${lineId}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  if (lines.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-0.5">
        {lines.map((line) => (
          <button
            key={line.id}
            type="button"
            onClick={() => handleSegmentClick(line.id)}
            title={`${line.character || 'Narrator'}: ${line.status}`}
            className={cn(
              'flex-1 h-2.5 rounded-sm transition-colors cursor-pointer min-w-[4px]',
              STATUS_CLASSES[line.status],
              STATUS_HOVER[line.status],
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          {currentLine ? (
            <span className="text-amber-400">{currentLine.character || 'Narrator'}</span>
          ) : doneCount === totalCount && totalCount > 0 ? (
            <span className="text-emerald-400">Complete</span>
          ) : null}
        </span>
        <span className="font-mono">
          {doneCount}/{totalCount}
          {eta !== null && eta > 0 && (
            <span className="ml-1.5 text-slate-500">~{formatTime(eta)} left</span>
          )}
        </span>
      </div>
    </div>
  );
}
