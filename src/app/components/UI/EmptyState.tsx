'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/app/lib/utils';

export type EmptyStateVariant = 'default' | 'compact' | 'centered';
export type EmptyStateIconSize = 'sm' | 'md' | 'lg';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: 'button' | 'link';
}

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: EmptyStateAction;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  variant?: EmptyStateVariant;
  iconSize?: EmptyStateIconSize;
  monoLabel?: string;
  animated?: boolean;
  glowColor?: string;
  className?: string;
  'data-testid'?: string;
}

const variantClasses: Record<EmptyStateVariant, string> = {
  default: 'flex flex-col items-center justify-center py-6 gap-2',
  compact: 'flex flex-col items-center justify-center py-4 gap-1.5',
  centered: 'flex flex-col items-center justify-center h-full min-h-48 gap-2',
};

const iconSizeClasses: Record<EmptyStateIconSize, string> = {
  sm: '[&>svg]:w-6 [&>svg]:h-6',
  md: '[&>svg]:w-9 [&>svg]:h-9',
  lg: '[&>svg]:w-12 [&>svg]:h-12',
};

function AnimatedWrapper({ animated, delay, children }: { animated: boolean; delay: number; children: ReactNode }) {
  if (!animated) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      {children}
    </motion.div>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
  secondaryAction,
  variant = 'default',
  iconSize = 'md',
  monoLabel,
  animated = false,
  glowColor,
  className,
  'data-testid': testId,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(variantClasses[variant], 'text-center', className)}
      data-testid={testId}
    >
      {icon && (
        <AnimatedWrapper animated={animated} delay={0.1}>
          <div className={cn('relative text-slate-400 mb-1', iconSizeClasses[iconSize])}>
            {glowColor && (
              <div
                className="absolute inset-0 blur-3xl opacity-20 -z-10 scale-150 backdrop-blur-sm"
                style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
              />
            )}
            {icon}
          </div>
        </AnimatedWrapper>
      )}
      {monoLabel && (
        <AnimatedWrapper animated={animated} delay={0.15}>
          <span className="font-mono text-xs uppercase tracking-wider text-slate-400">{monoLabel}</span>
        </AnimatedWrapper>
      )}
      <AnimatedWrapper animated={animated} delay={0.2}>
        <h3 className="text-sm font-medium text-slate-300">{title}</h3>
      </AnimatedWrapper>
      {subtitle && (
        <AnimatedWrapper animated={animated} delay={0.25}>
          <p className="text-sm text-slate-400 max-w-xs">{subtitle}</p>
        </AnimatedWrapper>
      )}
      {(action || secondaryAction) && (
        <AnimatedWrapper animated={animated} delay={0.3}>
          <div className="flex flex-col items-center gap-2">
            {action && (
              action.variant === 'link' ? (
                <button
                  onClick={action.onClick}
                  className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline transition-colors mt-1"
                >
                  {action.label}
                </button>
              ) : animated ? (
                <motion.button
                  onClick={action.onClick}
                  className="mt-2 px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 hover:border-cyan-500/50 text-cyan-300 text-sm rounded-lg font-medium transition-colors inline-flex items-center gap-1.5"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {action.icon && <span className="[&>svg]:w-4 [&>svg]:h-4">{action.icon}</span>}
                  {action.label}
                </motion.button>
              ) : (
                <button
                  onClick={action.onClick}
                  className="mt-2 px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 hover:border-cyan-500/50 text-cyan-300 text-sm rounded-lg font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  {action.icon && <span className="[&>svg]:w-4 [&>svg]:h-4">{action.icon}</span>}
                  {action.label}
                </button>
              )
            )}
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
              >
                {secondaryAction.label}
              </button>
            )}
          </div>
        </AnimatedWrapper>
      )}
    </div>
  );
}
