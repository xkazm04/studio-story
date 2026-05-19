'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Zap } from 'lucide-react';
import type { AgentSuggestion } from '../types';
import type { AdvisorVariant } from './AdvisorMessageBubble';

const suggestionVariants = {
  initial: { scale: 0.95, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 400, damping: 25 },
  },
  exit: {
    opacity: 0,
    height: 0,
    marginTop: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
    transition: { duration: 0.15, ease: 'easeIn' as const },
  },
};

interface AdvisorSuggestionCardProps {
  suggestion: AgentSuggestion;
  variant?: AdvisorVariant;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function AdvisorSuggestionCard({
  suggestion,
  variant = 'overlay',
  onAccept,
  onDismiss,
}: AdvisorSuggestionCardProps) {
  if (variant === 'overlay') {
    return (
      <motion.div
        layout
        variants={suggestionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="bg-amber-500/6 border border-amber-500/20 rounded-lg px-3 py-2 flex items-center gap-2 overflow-hidden"
      >
        <Zap className="w-4 h-4 text-amber-400 shrink-0" />
        <p className="text-sm text-amber-200/80 leading-snug flex-1 line-clamp-2">{suggestion.content}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          {suggestion.action && (
            <button
              onClick={() => onAccept(suggestion.id)}
              aria-label="Accept suggestion"
              className="text-emerald-400 hover:text-emerald-300 p-1"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onDismiss(suggestion.id)}
            aria-label="Dismiss suggestion"
            className="text-slate-400 hover:text-slate-300 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  }

  // Panel variant — expanded card layout
  return (
    <div className="bg-amber-500/6 border border-amber-500/20 rounded-lg p-2.5 space-y-2">
      <p className="text-sm text-amber-200/80 leading-relaxed">{suggestion.content}</p>
      <div className="flex items-center gap-1.5">
        {suggestion.action && (
          <button
            onClick={() => onAccept(suggestion.id)}
            aria-label="Apply suggestion"
            className="flex items-center gap-1 text-sm font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded px-2 py-0.5 transition-colors"
          >
            <Check className="w-3 h-3" />
            Apply
          </button>
        )}
        <button
          onClick={() => onDismiss(suggestion.id)}
          aria-label="Dismiss suggestion"
          className="flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-slate-400 bg-slate-800/40 hover:bg-slate-800/60 rounded px-2 py-0.5 transition-colors"
        >
          <X className="w-3 h-3" />
          Dismiss
        </button>
      </div>
    </div>
  );
}
