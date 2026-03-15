'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bot, Lightbulb, X } from 'lucide-react';
import type { ActiveSuggestion } from '@/agents/ambient-observer';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AUTO_DISMISS_MS = 30_000;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SuggestionCardProps {
  suggestion: ActiveSuggestion;
  onApply: (suggestion: ActiveSuggestion) => void;
  onDismiss: (id: string) => void;
  /** When true, skip the 30-second auto-dismiss timer. LLM cards set this. */
  persistent?: boolean;
  /** Controls icon and border styling. Default is 'ambient'. */
  variant?: 'ambient' | 'llm';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onApply,
  onDismiss,
  persistent = false,
  variant = 'ambient',
}) => {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isLLM = variant === 'llm';

  // Enter animation
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Auto-dismiss after 30 seconds (skipped for persistent/LLM cards)
  useEffect(() => {
    if (!persistent) {
      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, AUTO_DISMISS_MS);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestion.id, persistent]);

  function handleDismiss() {
    setExiting(true);
    setTimeout(() => {
      onDismiss(suggestion.id);
    }, 200); // Wait for exit animation
  }

  function handleApply() {
    if (timerRef.current) clearTimeout(timerRef.current);
    onApply(suggestion);
  }

  // Variant-specific styling
  const borderClass = isLLM ? 'border-cyan-500/40' : 'border-slate-700/60';
  const bgClass = isLLM ? 'bg-slate-900/98' : 'bg-slate-900/95';
  const Icon = isLLM ? Bot : Lightbulb;
  const iconClass = isLLM ? 'text-cyan-400' : 'text-amber-400';

  return (
    <div
      className={`
        max-w-xs ${bgClass} border ${borderClass} rounded-lg shadow-lg backdrop-blur-sm
        flex items-center gap-2.5 px-3 py-2.5
        transition-all duration-200 ease-out
        ${visible && !exiting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <Icon className={`w-4 h-4 ${iconClass} shrink-0`} />

      {/* Text */}
      <span className="text-sm text-slate-200 flex-1 truncate">
        {suggestion.text}
      </span>

      {/* Apply button */}
      <button
        onClick={handleApply}
        className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors whitespace-nowrap cursor-pointer"
      >
        Apply
      </button>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
        aria-label="Dismiss suggestion"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Container for multiple suggestion cards (fixed position bottom-right)
// ---------------------------------------------------------------------------

export interface SuggestionStackProps {
  suggestions: ActiveSuggestion[];
  onApply: (suggestion: ActiveSuggestion) => void;
  onDismiss: (id: string) => void;
}

export const SuggestionStack: React.FC<SuggestionStackProps> = ({ suggestions, onApply, onDismiss }) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[8000] flex flex-col-reverse gap-2">
      {suggestions.map((s) => {
        const isLLM = s.patternId === '__llm_response__';
        return (
          <SuggestionCard
            key={s.id}
            suggestion={s}
            onApply={onApply}
            onDismiss={onDismiss}
            variant={isLLM ? 'llm' : 'ambient'}
            persistent={isLLM}
          />
        );
      })}
    </div>
  );
};

export default SuggestionCard;
