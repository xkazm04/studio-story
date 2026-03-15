'use client';

import { ReactNode, HTMLAttributes } from 'react';
import Image from 'next/image';
import { clsx } from 'clsx';
import { focusRing } from '@/app/utils/focusRing';

export type CardVariant = 'default' | 'bordered' | 'gradient' | 'glass';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  hoverable?: boolean;
  clickable?: boolean;
  children: ReactNode;
}

export function Card({
  variant = 'default',
  padding = 'md',
  hoverable = false,
  clickable = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      data-variant={variant}
      data-padding={padding}
      {...(hoverable ? { 'data-hoverable': '' } : {})}
      {...(clickable ? { 'data-clickable': '' } : {})}
      className={clsx(
        'ms-card-v2',
        clickable && focusRing.card,
        className
      )}
      tabIndex={clickable ? 0 : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

// Card subcomponents for structured layouts
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}

export function CardHeader({
  title,
  subtitle,
  icon,
  action,
  children,
  className,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={clsx('flex items-start justify-between gap-2 mb-2', className)}
      {...props}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {icon && (
          <div className="flex-shrink-0 w-4 h-4 text-cyan-400">
            {icon}
          </div>
        )}
        {(title || subtitle) && (
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-sm font-semibold text-white truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-slate-400 truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div className={clsx('text-sm text-slate-300', className)} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div
      className={clsx(
        'flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-700/50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Compact Card variant for lists
interface CompactCardProps extends Omit<CardProps, 'padding' | 'children' | 'clickable'> {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  meta?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export function CompactCard({
  icon,
  title,
  subtitle,
  meta,
  actions,
  children,
  className,
  ...props
}: CompactCardProps) {
  return (
    <Card
      padding="sm"
      hoverable
      className={clsx('flex items-center gap-2', className)}
      {...props}
    >
      {icon && (
        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/10 rounded border border-cyan-500/30">
          <span className="w-3.5 h-3.5 text-cyan-400">{icon}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-white truncate">{title}</h4>
          {meta && (
            <span className="text-sm text-slate-400 flex-shrink-0">{meta}</span>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-slate-400 truncate">{subtitle}</p>
        )}
        {children}
      </div>
      {actions && <div className="flex-shrink-0">{actions}</div>}
    </Card>
  );
}

// Grid Card variant for galleries
interface GridCardProps extends CardProps {
  image?: string;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  overlay?: ReactNode;
}

export function GridCard({
  onClick,
  image,
  title,
  subtitle,
  badge,
  overlay,
  className,
  children,
  ...props
}: GridCardProps) {
  return (
    <Card
      padding="none"
      hoverable
      className={clsx('overflow-hidden group', className)}
      {...props}
    >
      {/* Image Section */}
      {image && (
        <div className="relative aspect-square overflow-hidden bg-slate-900">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          {badge && (
            <div className="absolute top-2 right-2 z-10">
              {badge}
            </div>
          )}
          {overlay && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
              {overlay}
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className="p-2">
        <h4 className="text-sm font-semibold text-white truncate">{title}</h4>
        {subtitle && (
          <p className="text-xs text-slate-400 truncate mt-0.5">{subtitle}</p>
        )}
        {children && <div className="mt-1.5">{children}</div>}
      </div>
    </Card>
  );
}
