'use client';

import { ReactNode } from 'react';
import { cn } from '@/app/lib/utils';

export type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'info' | 'purple';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  dot?: boolean;
  dotColor?: string;
  outline?: boolean;
  mono?: boolean;
  children: ReactNode;
  className?: string;
  title?: string;
  'data-testid'?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-500/15 border-slate-500/30 text-slate-400',
  success: 'bg-green-500/15 border-green-500/30 text-green-400',
  danger: 'bg-red-500/15 border-red-500/30 text-red-400',
  warning: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
  info: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
  purple: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
};

const outlineVariantClasses: Record<BadgeVariant, string> = {
  default: 'border-slate-500/50 text-slate-400 bg-transparent',
  success: 'border-green-500/50 text-green-400 bg-transparent',
  danger: 'border-red-500/50 text-red-400 bg-transparent',
  warning: 'border-amber-500/50 text-amber-400 bg-transparent',
  info: 'border-cyan-500/50 text-cyan-400 bg-transparent',
  purple: 'border-purple-500/50 text-purple-400 bg-transparent',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px] gap-1',
  md: 'px-2 py-1 text-xs gap-1.5',
  lg: 'px-3 py-1.5 text-sm gap-2',
};

const iconSizeClasses: Record<BadgeSize, string> = {
  sm: '[&>svg]:w-2.5 [&>svg]:h-2.5',
  md: '[&>svg]:w-3 [&>svg]:h-3',
  lg: '[&>svg]:w-3.5 [&>svg]:h-3.5',
};

export function Badge({
  variant = 'default',
  size = 'sm',
  icon,
  dot,
  dotColor,
  outline = false,
  mono = false,
  children,
  className,
  title,
  'data-testid': testId,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border transition-all duration-200',
        sizeClasses[size],
        outline ? outlineVariantClasses[variant] : variantClasses[variant],
        mono && 'font-mono uppercase tracking-wider',
        className
      )}
      title={title}
      data-testid={testId}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full', dotColor || 'bg-current')}
        />
      )}
      {icon && (
        <span className={cn('shrink-0', iconSizeClasses[size])}>{icon}</span>
      )}
      {children}
    </span>
  );
}
