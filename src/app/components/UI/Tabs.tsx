'use client';

import { ReactNode, useState } from 'react';
import { cn } from '@/app/lib/utils';

export interface TabItem {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  variant?: 'pills' | 'underline';
  size?: 'sm' | 'md';
  className?: string;
  'data-testid'?: string;
}

export function Tabs({
  items,
  value,
  onChange,
  variant = 'pills',
  size = 'sm',
  className,
  'data-testid': testId,
}: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex',
        variant === 'pills' && 'gap-1 p-1 bg-slate-950/80 border border-slate-800/50 rounded-lg backdrop-blur-sm',
        variant === 'underline' && 'gap-0 border-b border-slate-800',
        className
      )}
      data-testid={testId}
    >
      {items.map((tab) => {
        const isActive = value === tab.value;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => onChange(tab.value)}
            className={cn(
              'flex items-center gap-1.5 font-medium transition-all duration-200 whitespace-nowrap',
              size === 'sm' && 'px-2.5 py-1.5 text-xs',
              size === 'md' && 'px-3.5 py-2 text-sm',
              variant === 'pills' && [
                'rounded-md',
                isActive
                  ? 'bg-cyan-600/20 border border-cyan-500/50 text-slate-50 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent',
              ],
              variant === 'underline' && [
                'border-b-2 -mb-px',
                isActive
                  ? 'border-cyan-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600',
              ],
              tab.disabled && 'opacity-40 cursor-not-allowed'
            )}
          >
            {tab.icon && <span className="[&>svg]:w-3.5 [&>svg]:h-3.5 shrink-0">{tab.icon}</span>}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
