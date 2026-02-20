'use client';

import { ReactNode } from 'react';
import { cn } from '@/app/lib/utils';

export type PanelHeaderSize = 'sm' | 'md' | 'lg';

export interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  size?: PanelHeaderSize;
  className?: string;
  'data-testid'?: string;
}

const sizeClasses: Record<PanelHeaderSize, { container: string; title: string; subtitle: string; icon: string }> = {
  sm: {
    container: 'px-3 py-2',
    title: 'text-xs font-medium',
    subtitle: 'text-[10px]',
    icon: '[&>svg]:w-3.5 [&>svg]:h-3.5',
  },
  md: {
    container: 'px-4 py-3',
    title: 'text-sm font-semibold',
    subtitle: 'text-xs',
    icon: '[&>svg]:w-4 [&>svg]:h-4',
  },
  lg: {
    container: 'px-4 py-4',
    title: 'text-base font-semibold',
    subtitle: 'text-sm',
    icon: '[&>svg]:w-5 [&>svg]:h-5',
  },
};

export function PanelHeader({
  title,
  subtitle,
  icon,
  actions,
  size = 'md',
  className,
  'data-testid': testId,
}: PanelHeaderProps) {
  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        'flex items-center justify-between border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/60',
        sizes.container,
        className
      )}
      data-testid={testId}
    >
      <div className="flex items-center gap-2 min-w-0">
        {icon && (
          <span className={cn('text-cyan-400 shrink-0 transition-colors', sizes.icon)}>{icon}</span>
        )}
        <div className="min-w-0">
          <h3 className={cn(sizes.title, 'text-slate-200 truncate')}>{title}</h3>
          {subtitle && (
            <p className={cn(sizes.subtitle, 'text-slate-500 truncate')}>{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-1.5 shrink-0">{actions}</div>}
    </div>
  );
}
