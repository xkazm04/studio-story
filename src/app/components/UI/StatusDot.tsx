'use client';

import { cn } from '@/app/lib/utils';

export type StatusDotColor = 'green' | 'red' | 'amber' | 'cyan' | 'purple' | 'slate';
export type StatusDotSize = 'xs' | 'sm' | 'md';

export interface StatusDotProps {
  color?: StatusDotColor;
  size?: StatusDotSize;
  pulse?: boolean;
  ring?: boolean;
  label?: string;
  className?: string;
}

const colorClasses: Record<StatusDotColor, string> = {
  green: 'bg-emerald-500',
  red: 'bg-red-500',
  amber: 'bg-amber-400',
  cyan: 'bg-cyan-400',
  purple: 'bg-purple-400',
  slate: 'bg-slate-500',
};

const glowClasses: Record<StatusDotColor, string> = {
  green: 'shadow-[0_0_6px_rgba(16,185,129,0.6)]',
  red: 'shadow-[0_0_6px_rgba(239,68,68,0.6)]',
  amber: 'shadow-[0_0_6px_rgba(251,191,36,0.6)]',
  cyan: 'shadow-[0_0_6px_rgba(34,211,238,0.6)]',
  purple: 'shadow-[0_0_6px_rgba(192,132,252,0.6)]',
  slate: 'shadow-[0_0_6px_rgba(100,116,139,0.6)]',
};

const ringClasses: Record<StatusDotColor, string> = {
  green: 'ring-2 ring-emerald-500/30',
  red: 'ring-2 ring-red-500/30',
  amber: 'ring-2 ring-amber-400/30',
  cyan: 'ring-2 ring-cyan-400/30',
  purple: 'ring-2 ring-purple-400/30',
  slate: 'ring-2 ring-slate-500/30',
};

const sizeClasses: Record<StatusDotSize, string> = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
};

export function StatusDot({
  color = 'green',
  size = 'sm',
  pulse = false,
  ring = false,
  label,
  className,
}: StatusDotProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        className={cn(
          'rounded-full',
          sizeClasses[size],
          colorClasses[color],
          pulse && 'animate-pulse',
          pulse && glowClasses[color],
          ring && ringClasses[color]
        )}
      />
      {label && <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{label}</span>}
    </span>
  );
}
