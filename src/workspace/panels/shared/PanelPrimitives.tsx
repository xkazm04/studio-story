'use client';

import React from 'react';
import { cn } from '@/app/lib/utils';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface PanelSectionTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function PanelSectionTitle({ title, subtitle, className }: PanelSectionTitleProps) {
  return (
    <div className={cn('space-y-0.5', className)}>
      <h3 className="text-[11px] font-semibold tracking-wide text-slate-300">{title}</h3>
      {subtitle ? <p className="text-[10px] text-slate-500">{subtitle}</p> : null}
    </div>
  );
}

interface PanelEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PanelEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: PanelEmptyStateProps) {
  return (
    <div className={cn('flex h-full min-h-0 items-center justify-center p-6', className)}>
      <div className="flex max-w-72 flex-col items-center text-center">
        {Icon ? (
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-800/50 bg-slate-900/60">
            <Icon className="h-5 w-5 text-slate-600" />
          </div>
        ) : null}
        <p className="text-xs text-slate-300">{title}</p>
        {description ? <p className="mt-1 text-[10px] text-slate-500">{description}</p> : null}
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}

interface PanelSkeletonListProps {
  rows?: number;
  className?: string;
}

export function PanelSkeletonList({ rows = 3, className }: PanelSkeletonListProps) {
  return (
    <div className={cn('space-y-2 p-3', className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-lg bg-slate-800/40" />
      ))}
    </div>
  );
}

type PanelSaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

interface PanelSaveStateBadgeProps {
  state: PanelSaveState;
  className?: string;
}

export function PanelSaveStateBadge({ state, className }: PanelSaveStateBadgeProps) {
  if (state === 'idle') return null;

  const map = {
    dirty: {
      label: 'Unsaved',
      icon: null,
      classes: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    },
    saving: {
      label: 'Saving…',
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
      classes: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
    },
    saved: {
      label: 'Saved',
      icon: <CheckCircle2 className="h-3 w-3" />,
      classes: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    },
    error: {
      label: 'Save failed',
      icon: <AlertCircle className="h-3 w-3" />,
      classes: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    },
  } as const;

  const entry = map[state as Exclude<PanelSaveState, 'idle'>];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-medium tracking-wide',
        entry.classes,
        className,
      )}
    >
      {entry.icon}
      {entry.label}
    </span>
  );
}
