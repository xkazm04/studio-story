'use client';

import React from 'react';
import { motion, type Easing } from 'framer-motion';
import { clsx } from 'clsx';

export interface ProgressCardAnimationConfig {
  duration?: number;
  ease?: Easing;
  glowOpacity?: number;
  glowOpacityComplete?: number;
}

export interface ProgressCardProps {
  title: string;
  current: number;
  target: number;
  color: string;
  animationConfig?: ProgressCardAnimationConfig;
  className?: string;
  showPercentage?: boolean;
  formatLabel?: (current: number, target: number) => string;
  'data-testid'?: string;
}

const defaultAnimationConfig: Required<ProgressCardAnimationConfig> = {
  duration: 0.6,
  ease: 'easeOut',
  glowOpacity: 0.3,
  glowOpacityComplete: 0.4,
};

/**
 * ProgressCard - A reusable animated progress indicator component
 *
 * Features:
 * - Animated progress bar with customizable colors
 * - Glow effects for visual polish
 * - Configurable animation timing
 * - Optional percentage display
 * - Custom label formatting
 *
 * @example
 * ```tsx
 * <ProgressCard
 *   title="Acts"
 *   current={2}
 *   target={3}
 *   color="bg-blue-500"
 *   data-testid="acts-progress"
 * />
 * ```
 */
export const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  current,
  target,
  color,
  animationConfig = {},
  className,
  showPercentage = false,
  formatLabel,
  'data-testid': testId,
}) => {
  const config = { ...defaultAnimationConfig, ...animationConfig };
  const percentage = Math.min((current / target) * 100, 100);
  const isComplete = current >= target;

  // Default label formatter
  const defaultFormatLabel = (curr: number, tgt: number) => `${curr} / ${tgt}`;
  const labelFormatter = formatLabel || defaultFormatLabel;

  return (
    <div className={clsx('space-y-2', className)} data-testid={testId}>
      {/* Header with title and progress label */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-300 font-medium" data-testid={`${testId}-title`}>
          {title}
        </span>
        <span
          className={clsx(
            'text-xs font-mono',
            isComplete ? 'text-green-400' : 'text-gray-400'
          )}
          data-testid={`${testId}-label`}
        >
          {showPercentage ? `${Math.round(percentage)}%` : labelFormatter(current, target)}
        </span>
      </div>

      {/* Progress bar container */}
      <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
        {/* Main progress bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: config.duration, ease: config.ease }}
          className={clsx('absolute inset-y-0 left-0 rounded-full', color)}
          data-testid={`${testId}-bar`}
        />

        {/* Glow effect */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{
            width: `${percentage}%`,
            opacity: isComplete ? config.glowOpacityComplete : config.glowOpacity,
          }}
          transition={{ duration: config.duration, ease: config.ease }}
          className={clsx('absolute inset-y-0 left-0 rounded-full blur-sm', color)}
        />
      </div>
    </div>
  );
};

/**
 * ProgressCardGrid - Container for displaying multiple progress cards
 *
 * @example
 * ```tsx
 * <ProgressCardGrid>
 *   <ProgressCard title="Acts" current={2} target={3} color="bg-blue-500" />
 *   <ProgressCard title="Scenes" current={8} target={10} color="bg-purple-500" />
 * </ProgressCardGrid>
 * ```
 */
export const ProgressCardGrid: React.FC<{
  children: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}> = ({ children, className, 'data-testid': testId }) => {
  return (
    <div className={clsx('space-y-5', className)} data-testid={testId}>
      {children}
    </div>
  );
};

/**
 * ProgressSummaryCard - Displays a summary statistic
 *
 * @example
 * ```tsx
 * <ProgressSummaryCard
 *   value="2"
 *   label="Acts"
 *   color="text-blue-400"
 * />
 * ```
 */
export interface ProgressSummaryCardProps {
  value: string | number;
  label: string;
  color?: string;
  className?: string;
  'data-testid'?: string;
}

export const ProgressSummaryCard: React.FC<ProgressSummaryCardProps> = ({
  value,
  label,
  color = 'text-white',
  className,
  'data-testid': testId,
}) => {
  return (
    <div className={clsx('text-center', className)} data-testid={testId}>
      <div className={clsx('text-2xl font-bold', color)} data-testid={`${testId}-value`}>
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-1" data-testid={`${testId}-label`}>
        {label}
      </div>
    </div>
  );
};

/**
 * ProgressSummaryGrid - Grid container for summary cards
 *
 * @example
 * ```tsx
 * <ProgressSummaryGrid>
 *   <ProgressSummaryCard value="2" label="Acts" color="text-blue-400" />
 *   <ProgressSummaryCard value="8" label="Scenes" color="text-purple-400" />
 * </ProgressSummaryGrid>
 * ```
 */
export const ProgressSummaryGrid: React.FC<{
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
  'data-testid'?: string;
}> = ({ children, columns = 3, className, 'data-testid': testId }) => {
  const gridClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div
      className={clsx('grid gap-4', gridClasses[columns], className)}
      data-testid={testId}
    >
      {children}
    </div>
  );
};
