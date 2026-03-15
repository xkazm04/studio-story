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
      data-variant={variant}
      data-size={size}
      {...(outline ? { 'data-outline': '' } : {})}
      className={cn(
        'ms-badge-v2',
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
        <span className="shrink-0">{icon}</span>
      )}
      {children}
    </span>
  );
}
