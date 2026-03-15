/**
 * DataVizTheme — Shared constants and SVG primitives for data visualizations.
 *
 * Provides unified axis colors, grid patterns, tooltip styling, legend layout,
 * and animation timing across DistributionChart, DependencyGraph, NarrativeMap,
 * and GanttTimeline.
 */

import React from 'react';
import { cn } from '@/lib/utils';

// ─── Theme Constants ─────────────────────────────

export const DATA_VIZ = {
  /** Axis tick and label color */
  axisColor: 'text-slate-500',
  axisStroke: '#64748b', // slate-500

  /** Grid pattern */
  gridStroke: 'rgba(148, 163, 184, 0.1)', // slate-400/10
  gridSpacing: 50,

  /** Chart container */
  containerBg: 'bg-slate-900/50',
  containerBorder: 'border-slate-700/50',

  /** Tooltip / overlay */
  tooltipBg: 'bg-slate-800/95',
  tooltipBorder: 'border-slate-700/50',
  tooltipBlur: 'backdrop-blur-sm',

  /** Legend */
  legendBg: 'bg-slate-800/90',
  legendBorder: 'border-slate-700/50',
  legendText: 'text-slate-400',
  legendTitle: 'text-slate-200',

  /** Animation timing — aligned with BEAT_ANIMATIONS.slow (0.5s) */
  animDuration: 0.5,
  animEase: 'easeOut' as const,
  animStaggerDelay: 0.05,

  /** Text styles */
  labelText: 'text-sm text-slate-400',
  valueText: 'text-sm text-slate-300',
  headingText: 'text-sm font-semibold text-slate-200',

  /** Bar track */
  barTrackBg: 'bg-slate-800/60',

  /** Controls */
  controlBg: 'bg-slate-800/80',
  controlBorder: 'border-slate-700',
  controlText: 'text-slate-300 hover:text-white',

  /** Stats overlay */
  statsText: 'text-sm text-slate-400',
} as const;

// ─── ChartGrid — SVG dot/line grid pattern ───────

export function ChartGrid({
  id = 'dataviz-grid',
  spacing = DATA_VIZ.gridSpacing,
  variant = 'dots',
}: {
  id?: string;
  spacing?: number;
  variant?: 'dots' | 'lines';
}) {
  return (
    <defs>
      <pattern
        id={id}
        width={spacing}
        height={spacing}
        patternUnits="userSpaceOnUse"
      >
        {variant === 'dots' ? (
          <circle
            cx={spacing / 2}
            cy={spacing / 2}
            r={1}
            fill={DATA_VIZ.gridStroke}
          />
        ) : (
          <path
            d={`M ${spacing} 0 L 0 0 0 ${spacing}`}
            fill="none"
            stroke={DATA_VIZ.gridStroke}
            strokeWidth="1"
          />
        )}
      </pattern>
    </defs>
  );
}

// ─── ChartLegend — Bottom-aligned legend strip ───

export interface LegendItem {
  color: string;
  label: string;
  /** Render a line swatch instead of a box */
  isLine?: boolean;
  /** Dashed line */
  isDashed?: boolean;
}

export function ChartLegend({
  items,
  className,
}: {
  items: LegendItem[];
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-4 text-sm', DATA_VIZ.legendText, className)}>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          {item.isLine ? (
            <div
              className="w-4 h-0.5"
              style={{
                backgroundColor: item.color,
                borderBottom: item.isDashed ? `2px dashed ${item.color}` : undefined,
                background: item.isDashed ? 'none' : item.color,
              }}
            />
          ) : (
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
          )}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── ChartTooltip — Positioned tooltip container ──

export function ChartTooltip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2 shadow-xl',
        DATA_VIZ.tooltipBg,
        DATA_VIZ.tooltipBorder,
        DATA_VIZ.tooltipBlur,
        className,
      )}
    >
      {children}
    </div>
  );
}

// ─── ChartContainer — Wrapper for chart areas ────

export function ChartContainer({
  children,
  className,
  compact = false,
}: {
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border',
        DATA_VIZ.containerBg,
        DATA_VIZ.containerBorder,
        compact ? 'h-48' : 'h-96',
        className,
      )}
    >
      {children}
    </div>
  );
}

// ─── Chart animation presets ─────────────────────

export const chartAnimations = {
  /** Standard enter for a chart element */
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: DATA_VIZ.animDuration, ease: DATA_VIZ.animEase },
  },
  /** Slide up for overlays and legends */
  slideUp: {
    initial: { y: 50, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: DATA_VIZ.animDuration, ease: DATA_VIZ.animEase },
  },
  /** Bar grow animation */
  barGrow: (delay: number = 0) => ({
    initial: { width: 0 },
    animate: { width: 'auto' },
    transition: { duration: DATA_VIZ.animDuration, ease: DATA_VIZ.animEase, delay },
  }),
  /** Node pop-in */
  nodeEnter: (delay: number = 0) => ({
    initial: { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: DATA_VIZ.animDuration * 0.5, delay },
  }),
  /** Stagger delay for list items */
  stagger: (index: number) => DATA_VIZ.animStaggerDelay * index,
} as const;
