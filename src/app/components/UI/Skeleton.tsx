'use client';

import { ReactNode } from 'react';
import { cn } from '@/app/lib/utils';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'card';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  size?: number;
  shimmer?: boolean;
  className?: string;
  'data-testid'?: string;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  size,
  shimmer = false,
  className,
  'data-testid': testId,
}: SkeletonProps) {
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;
  if (size && variant === 'circular') {
    style.width = `${size}px`;
    style.height = `${size}px`;
  }

  return (
    <div
      className={cn(
        'bg-slate-800/70',
        shimmer ? 'relative overflow-hidden' : 'animate-pulse',
        variant === 'text' && 'h-4 rounded',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-lg',
        variant === 'card' && 'rounded-lg border border-slate-800/50 p-4',
        className
      )}
      style={style}
      data-testid={testId}
    >
      {shimmer && (
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      )}
    </div>
  );
}

export interface SkeletonGroupProps {
  count: number;
  gap?: 'xs' | 'sm' | 'md' | 'lg';
  direction?: 'row' | 'column';
  children: ReactNode;
  className?: string;
}

const gapClasses = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
};

export function SkeletonGroup({
  count,
  gap = 'sm',
  direction = 'column',
  children,
  className,
}: SkeletonGroupProps) {
  return (
    <div
      className={cn(
        'flex',
        direction === 'column' ? 'flex-col' : 'flex-row',
        gapClasses[gap],
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{children}</div>
      ))}
    </div>
  );
}

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';
export type SpinnerColor = 'cyan' | 'blue' | 'amber' | 'white' | 'emerald';

export interface SpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
  label?: string;
  className?: string;
}

const spinnerSizeClasses: Record<SpinnerSize, string> = {
  xs: 'w-3 h-3 border',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-2',
};

const spinnerColorClasses: Record<SpinnerColor, string> = {
  cyan: 'border-cyan-500/30 border-t-cyan-500',
  blue: 'border-blue-500/30 border-t-blue-500',
  amber: 'border-amber-500/30 border-t-amber-500',
  white: 'border-white/30 border-t-white',
  emerald: 'border-emerald-500/30 border-t-emerald-500',
};

const spinnerGlowClasses: Record<SpinnerColor, string> = {
  cyan: 'shadow-[0_0_8px_rgba(6,182,212,0.4)]',
  blue: 'shadow-[0_0_8px_rgba(59,130,246,0.4)]',
  amber: 'shadow-[0_0_8px_rgba(245,158,11,0.4)]',
  white: 'shadow-[0_0_8px_rgba(255,255,255,0.3)]',
  emerald: 'shadow-[0_0_8px_rgba(16,185,129,0.4)]',
};

export function Spinner({
  size = 'md',
  color = 'cyan',
  label,
  className,
}: SpinnerProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'rounded-full animate-spin',
          spinnerSizeClasses[size],
          spinnerColorClasses[color],
          spinnerGlowClasses[color]
        )}
      />
      {label && <span className="font-mono text-xs uppercase tracking-wider text-slate-400">{label}</span>}
    </div>
  );
}

export interface LoadingOverlayProps {
  label?: string;
  overlay?: boolean;
  className?: string;
}

export function LoadingOverlay({ label = 'Loading...', overlay = false, className }: LoadingOverlayProps) {
  if (overlay) {
    return (
      <div className={cn('fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm', className)}>
        <div className="flex items-center gap-3 px-6 py-4 bg-slate-800/80 backdrop-blur-md rounded-lg border border-slate-700/50 shadow-lg">
          <Spinner size="sm" />
          <span className="font-mono text-sm text-slate-300">{label}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-8', className)}>
      <Spinner size="lg" />
      <span className="font-mono text-xs uppercase tracking-wider text-slate-400">{label}</span>
    </div>
  );
}
