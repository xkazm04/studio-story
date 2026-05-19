'use client';

/**
 * SignalNotificationCard — Rich notification card for signal detections.
 *
 * Replaces plain-text signal log entries with a visually distinct card:
 * - Colored left border (red/amber/slate by severity)
 * - Severity badge pill
 * - Pattern summary
 * - Inline "Fix" action button
 */

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, Info, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type { SignalPatternSummary } from './types';

interface SignalNotificationCardProps {
  patterns: SignalPatternSummary[];
  onFix: () => void;
  isFixing: boolean;
}

const SEVERITY_CONFIG = {
  high: {
    border: 'border-l-red-500',
    badge: 'bg-red-500/15 text-red-400',
    icon: AlertCircle,
    label: 'High',
  },
  medium: {
    border: 'border-l-amber-500',
    badge: 'bg-amber-500/15 text-amber-400',
    icon: AlertTriangle,
    label: 'Medium',
  },
  low: {
    border: 'border-l-slate-500',
    badge: 'bg-slate-500/15 text-slate-400',
    icon: Info,
    label: 'Low',
  },
} as const;

function maxSeverity(patterns: SignalPatternSummary[]): 'low' | 'medium' | 'high' {
  if (patterns.some((p) => p.severity === 'high')) return 'high';
  if (patterns.some((p) => p.severity === 'medium')) return 'medium';
  return 'low';
}

export default function SignalNotificationCard({
  patterns,
  onFix,
  isFixing,
}: SignalNotificationCardProps) {
  const severity = maxSeverity(patterns);
  const config = SEVERITY_CONFIG[severity];
  const totalCount = patterns.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.97 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'rounded-md border border-[var(--ms-border-subtle)] border-l-[3px] bg-[var(--ms-bg-surface)]/80',
        'mx-1 my-1.5',
        config.border
      )}
    >
      {/* Header row: badge + summary + fix button */}
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        <config.icon className={cn('w-3.5 h-3.5 shrink-0', SEVERITY_CONFIG[severity].badge.split(' ')[1])} />

        {/* Severity pill */}
        <span
          className={cn(
            'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide',
            config.badge
          )}
        >
          {config.label}
        </span>

        {/* Summary */}
        <span className="text-xs text-[var(--ms-text-secondary)] flex-1 truncate">
          {totalCount} issue{totalCount !== 1 ? 's' : ''} detected
        </span>

        {/* Fix button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFix();
          }}
          disabled={isFixing}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
            'bg-[var(--ms-accent)]/15 text-[var(--ms-accent)] hover:bg-[var(--ms-accent)]/25',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isFixing ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Fixing...
            </>
          ) : (
            <>
              <Zap className="w-3 h-3" />
              Fix
            </>
          )}
        </button>
      </div>

      {/* Pattern rows */}
      <div className="px-2.5 pb-2 space-y-0.5">
        {patterns.slice(0, 4).map((pattern) => {
          const pConfig = SEVERITY_CONFIG[pattern.severity];
          const PIcon = pConfig.icon;
          return (
            <div
              key={pattern.fingerprint}
              className="flex items-center gap-1.5 text-[11px] leading-tight"
            >
              <PIcon className={cn('w-2.5 h-2.5 shrink-0', pConfig.badge.split(' ')[1])} />
              <span className="text-slate-300 font-medium">{pattern.type}</span>
              {pattern.toolName && (
                <span className="text-amber-300/70 truncate">{pattern.toolName}</span>
              )}
              <span className="text-slate-500">x{pattern.count}</span>
              {pattern.suggestedFix && (
                <span className="text-slate-500 truncate ml-auto max-w-[40%]">
                  {pattern.suggestedFix}
                </span>
              )}
            </div>
          );
        })}
        {patterns.length > 4 && (
          <div className="text-[10px] text-slate-500 pl-4">
            +{patterns.length - 4} more
          </div>
        )}
      </div>
    </motion.div>
  );
}
