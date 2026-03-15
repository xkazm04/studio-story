'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/app/lib/utils';

export type LoadingStateSize = 'sm' | 'md' | 'lg';

export interface LoadingStateProps {
  size?: LoadingStateSize;
  message?: string;
  className?: string;
}

const sizeClasses: Record<LoadingStateSize, string> = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

const paddingClasses: Record<LoadingStateSize, string> = {
  sm: 'p-6',
  md: 'p-12',
  lg: 'p-16',
};

export function LoadingState({ size = 'md', message, className }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', paddingClasses[size], className)}>
      <Loader2 className={cn(sizeClasses[size], 'text-slate-400 animate-spin')} />
      {message && <p className="text-sm text-slate-400">{message}</p>}
    </div>
  );
}
