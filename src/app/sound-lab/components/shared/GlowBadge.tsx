'use client';

import { cn } from '@/app/lib/utils';

type BadgeStatus = 'connected' | 'demo' | 'offline';

interface GlowBadgeProps {
  status: BadgeStatus;
  label?: string;
  className?: string;
}

const STATUS_CONFIG: Record<BadgeStatus, { dot: string; text: string; bg: string; glow: string; defaultLabel: string }> = {
  connected: {
    dot: 'bg-emerald-400',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    glow: 'shadow-emerald-500/20',
    defaultLabel: 'Connected',
  },
  demo: {
    dot: 'bg-orange-400',
    text: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
    glow: 'shadow-orange-500/20',
    defaultLabel: 'Demo Mode',
  },
  offline: {
    dot: 'bg-slate-500',
    text: 'text-slate-500',
    bg: 'bg-slate-500/10 border-slate-500/20',
    glow: '',
    defaultLabel: 'Offline',
  },
};

export default function GlowBadge({ status, label, className }: GlowBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium shadow-sm',
        config.bg,
        config.text,
        config.glow,
        className
      )}
    >
      <div className={cn('w-1.5 h-1.5 rounded-full', config.dot, status === 'connected' && 'animate-pulse')} />
      {label ?? config.defaultLabel}
    </div>
  );
}
