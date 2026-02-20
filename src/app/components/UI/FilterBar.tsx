'use client';

import { ReactNode } from 'react';
import { cn } from '@/app/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

export interface FilterBarProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  variant?: 'pills' | 'underline';
  size?: 'sm' | 'md';
  className?: string;
  'data-testid'?: string;
}

export function FilterBar({
  options,
  value,
  onChange,
  variant = 'pills',
  size = 'sm',
  className,
  'data-testid': testId,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center',
        variant === 'pills' && 'gap-1.5',
        variant === 'underline' && 'gap-0 border-b border-slate-800',
        className
      )}
      data-testid={testId}
    >
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex items-center gap-1.5 font-medium transition-all duration-200',
              size === 'sm' && 'px-2.5 py-1 text-xs',
              size === 'md' && 'px-3 py-1.5 text-xs',
              variant === 'pills' && [
                'rounded-md',
                isActive
                  ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200',
              ],
              variant === 'underline' && [
                'border-b-2 -mb-px pb-2',
                isActive
                  ? 'border-cyan-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200',
              ]
            )}
          >
            {opt.icon && <span className="[&>svg]:w-3.5 [&>svg]:h-3.5 shrink-0">{opt.icon}</span>}
            {opt.label}
            {opt.count !== undefined && (
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full',
                isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'
              )}>
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
