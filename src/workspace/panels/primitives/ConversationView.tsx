'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import PanelFrame from '../shared/PanelFrame';
import { PanelEmptyState, PanelErrorState } from '../shared/PanelPrimitives';
import type { BasePrimitiveProps, DialogueLine } from './types';
import { SPACING, MOTION } from '@/workspace/theme/tokens';

function ConversationSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-live="polite" className={cn(SPACING.sectionGap, SPACING.panelPadding)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-2"
          style={{ animationDelay: `${i * 120}ms` }}
        >
          {/* Speaker skeleton */}
          <div className="shrink-0 w-16 flex justify-end">
            <div className="h-4 w-[80px] overflow-hidden rounded bg-slate-800/40">
              <div className="h-full w-full animate-[shimmer_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-slate-700/20 to-transparent" />
            </div>
          </div>
          {/* Dialogue lines skeleton */}
          <div className="flex-1 space-y-1.5 rounded-md px-2.5 py-1.5 bg-slate-900/40 border border-slate-800/40">
            <div className="h-3.5 overflow-hidden rounded bg-slate-800/40" style={{ width: '90%' }}>
              <div className="h-full w-full animate-[shimmer_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-slate-700/20 to-transparent" />
            </div>
            <div className="h-3.5 overflow-hidden rounded bg-slate-800/40" style={{ width: i % 2 === 0 ? '65%' : '75%' }}>
              <div className="h-full w-full animate-[shimmer_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-slate-700/20 to-transparent" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface ConversationViewProps extends BasePrimitiveProps {
  lines: DialogueLine[];
}

export default function ConversationView({
  title,
  icon,
  headerAccent,
  onClose,
  actions,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  lines,
  density,
}: ConversationViewProps) {
  return (
    <PanelFrame
      title={title}
      icon={icon}
      headerAccent={headerAccent}
      onClose={onClose}
      actions={actions}
      density={density}
    >
      {isLoading ? (
        <ConversationSkeleton rows={4} />
      ) : isError ? (
        <PanelErrorState message={errorMessage} onRetry={onRetry} />
      ) : lines.length === 0 ? (
        <PanelEmptyState
          icon={emptyIcon ?? MessageCircle}
          title={emptyTitle ?? 'No dialogue'}
          description={emptyDescription ?? 'Dialogue lines will appear here.'}
        />
      ) : (
        <div role="log" aria-label={title} className={cn(SPACING.panelPadding, SPACING.sectionGap, 'overflow-auto h-full')}>
          {lines.map((line, index) => (
            <motion.div
              key={`${line.speaker}-${index}`}
              initial={MOTION.lineEnter}
              animate={MOTION.show}
              transition={{ duration: 0.2, delay: MOTION.stagger(index) }}
              className="flex gap-2"
            >
              {/* Speaker column */}
              <div className="shrink-0 w-16 text-right">
                <div className="text-xs font-bold text-blue-400">
                  {line.speaker}
                </div>
                {line.emotion && (
                  <div className="text-xs text-slate-400 italic">
                    ({line.emotion})
                  </div>
                )}
              </div>

              {/* Text column */}
              <div
                className={cn(
                  'flex-1 rounded-md px-2.5 py-1.5',
                  index % 2 === 0
                    ? 'bg-slate-900/40 border border-slate-800/40'
                    : 'bg-slate-900/20 border border-slate-800/20',
                )}
              >
                <p className="text-sm text-slate-200 leading-relaxed">
                  {line.text}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </PanelFrame>
  );
}
