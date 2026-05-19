'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RotateCcw, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type { AgentMessage, MessageRating } from '../types';

export type AdvisorVariant = 'overlay' | 'panel';

/** Position of a message within a consecutive same-role group. */
export type GroupPosition = 'first' | 'middle' | 'last' | 'solo';

const messageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const },
  },
};

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${Math.floor(diffHour / 24)}d ago`;
}

function formatAbsoluteTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Return border-radius value for grouped bubbles. User msgs tighten right side, agent msgs left. */
function groupedBorderRadius(position: GroupPosition, isUser: boolean): string {
  const full = '0.5rem';  // ~rounded-lg
  const tight = '0.175rem'; // ~rounded-sm
  // top-left top-right bottom-right bottom-left
  if (isUser) {
    switch (position) {
      case 'first':  return `${full} ${full} ${tight} ${full}`;
      case 'middle': return `${full} ${tight} ${tight} ${full}`;
      case 'last':   return `${full} ${tight} ${full} ${full}`;
    }
  } else {
    switch (position) {
      case 'first':  return `${full} ${full} ${full} ${tight}`;
      case 'middle': return `${tight} ${full} ${full} ${tight}`;
      case 'last':   return `${tight} ${full} ${full} ${full}`;
    }
  }
  return full;
}

interface AdvisorMessageBubbleProps {
  message: AgentMessage;
  variant?: AdvisorVariant;
  onRetry?: () => void;
  /** Position within a same-role message group. Default: 'solo' */
  groupPosition?: GroupPosition;
  /** Whether to show the timestamp below this bubble. Default: true */
  showTimestamp?: boolean;
  /** Callback when user rates a message */
  onRate?: (id: string, rating: MessageRating) => void;
  /** Callback when user wants to regenerate after a negative rating */
  onRegenerate?: (messageId: string) => void;
}

export function AdvisorMessageBubble({
  message,
  variant = 'overlay',
  onRetry,
  groupPosition = 'solo',
  showTimestamp = true,
  onRate,
  onRegenerate,
}: AdvisorMessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAgent = message.role === 'agent';
  const isSystem = message.role === 'system';
  const isError = message.isError;
  const isRetry = !!message.retryInfo;

  const [hovered, setHovered] = useState(false);
  const shouldShowTimestamp = variant === 'overlay' && showTimestamp;
  const shouldShowHoverTimestamp = variant === 'overlay' && !showTimestamp && hovered;

  // Show rating buttons on finalized agent messages only
  const canRate = isAgent && !message.isStreaming && !isError && onRate;

  // Compute inline border-radius for grouped messages
  const radiusStyle = groupPosition !== 'solo'
    ? { style: { borderRadius: groupedBorderRadius(groupPosition, isUser) } }
    : {};

  return (
    <motion.div
      className={cn('flex flex-col', isUser ? 'items-end' : 'items-start')}
      variants={messageVariants}
      initial="initial"
      animate="animate"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={cn(
          'max-w-[85%] px-3 py-2 text-sm leading-relaxed',
          groupPosition === 'solo' && 'rounded-lg',
          isUser && 'bg-blue-600/20 text-blue-200 border border-blue-500/20',
          isError && 'bg-red-500/10 text-red-300 border border-red-500/20',
          isRetry && 'bg-amber-500/10 text-amber-300 border border-amber-500/20 italic',
          !isUser && !isSystem && !isError && !isRetry && 'bg-slate-800/60 text-slate-300 border border-slate-700/40 shadow-sm',
          isSystem && !isRetry && 'bg-slate-900/40 text-slate-400 italic text-sm border border-slate-800/30',
        )}
        {...radiusStyle}
      >
        {isError && (
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{message.content}</span>
          </div>
        )}
        {isRetry && (
          <div className="flex items-center gap-2">
            <RotateCcw className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-spin" />
            <span>{message.content}</span>
          </div>
        )}
        {!isError && !isRetry && (
          <>
            {message.content}
            {message.isStreaming && (
              <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-cyan-400/70 animate-pulse rounded-sm align-text-bottom" />
            )}
          </>
        )}
        {isError && onRetry && (
          <button
            onClick={onRetry}
            aria-label="Retry failed message"
            className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retry
          </button>
        )}
      </div>
      {/* Rating buttons for agent messages */}
      <AnimatePresence>
        {canRate && hovered && !message.rating && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1 mt-0.5 px-1"
          >
            <button
              onClick={() => onRate(message.id, 'positive')}
              aria-label="Rate response helpful"
              className="p-0.5 rounded text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            >
              <ThumbsUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => onRate(message.id, 'negative')}
              aria-label="Rate response unhelpful"
              className="p-0.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <ThumbsDown className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persisted rating indicator + regenerate */}
      {message.rating && (
        <div className="flex items-center gap-1.5 mt-0.5 px-1">
          {message.rating === 'positive' ? (
            <ThumbsUp className="w-3 h-3 text-emerald-400" />
          ) : (
            <>
              <ThumbsDown className="w-3 h-3 text-red-400" />
              {onRegenerate && (
                <button
                  onClick={() => onRegenerate(message.id)}
                  aria-label="Regenerate response"
                  className="flex items-center gap-1 text-xs text-red-400/80 hover:text-red-300 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Regenerate</span>
                </button>
              )}
            </>
          )}
        </div>
      )}

      {shouldShowTimestamp && (
        <span className="mt-0.5 text-xs text-slate-500 px-1">
          {formatRelativeTime(message.timestamp)}
        </span>
      )}
      {shouldShowHoverTimestamp && (
        <span className="mt-0.5 text-xs text-slate-600 px-1 animate-in fade-in duration-150">
          {formatAbsoluteTime(message.timestamp)}
        </span>
      )}
    </motion.div>
  );
}
