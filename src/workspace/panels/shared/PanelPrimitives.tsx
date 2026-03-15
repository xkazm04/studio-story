'use client';

import React from 'react';
import { cn } from '@/app/lib/utils';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface PanelSectionTitleProps {
  title: string;
  subtitle?: string;
  accent?: boolean;
  className?: string;
}

export function PanelSectionTitle({ title, subtitle, accent, className }: PanelSectionTitleProps) {
  return (
    <div className={cn('space-y-0.5', className)}>
      <h3 className={cn(
        'text-xs font-semibold uppercase tracking-wider text-slate-400',
        accent && 'border-l-2 border-l-cyan-500/40 pl-2',
      )}>
        {title}
      </h3>
      {subtitle ? <p className={cn('text-xs text-slate-500', accent && 'pl-2')}>{subtitle}</p> : null}
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
    <div role="status" className={cn('flex h-full min-h-0 items-center justify-center p-4', className)}>
      <div className="flex max-w-72 flex-col items-center text-center">
        {Icon ? (
          <div className="mb-2 flex h-9 w-9 animate-[float_3s_ease-in-out_infinite] items-center justify-center rounded-lg border border-slate-800/50 bg-slate-900/60 shadow-lg shadow-black/10">
            <Icon className="h-4 w-4 text-slate-400" />
          </div>
        ) : null}
        <p className="text-sm font-medium text-slate-300">{title}</p>
        {description ? <p className="mt-0.5 text-xs text-slate-400">{description}</p> : null}
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  );
}

interface PanelErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function PanelErrorState({
  message,
  onRetry,
  className,
}: PanelErrorStateProps) {
  return (
    <div role="alert" className={cn('flex h-full min-h-0 items-center justify-center p-4', className)}>
      <div className="flex max-w-72 flex-col items-center text-center">
        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 shadow-lg shadow-black/10">
          <AlertCircle className="h-4 w-4 text-rose-400" />
        </div>
        <p className="text-sm font-medium text-rose-300">Failed to load</p>
        {message ? <p className="mt-0.5 text-xs text-slate-400">{message}</p> : null}
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/20"
          >
            Retry
          </button>
        ) : null}
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
    <div aria-busy="true" aria-live="polite" className={cn('space-y-1.5 p-2', className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-7 overflow-hidden rounded-md bg-slate-800/40"
          style={{ animationDelay: `${index * 120}ms` }}
        >
          <div className="h-full w-full animate-[shimmer_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-slate-700/20 to-transparent" />
        </div>
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
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium tracking-wide transition-all duration-300',
        entry.classes,
        className,
      )}
    >
      {entry.icon}
      {entry.label}
    </span>
  );
}
