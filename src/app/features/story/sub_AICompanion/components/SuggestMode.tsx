/**
 * SuggestMode — "Next Steps" mode for AI Companion
 * Displays AI-generated story progression suggestions
 */

'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TYPOGRAPHY, SEMANTIC_COLORS, FM_VARIANTS, FM_TRANSITION } from '@/workspace/theme/tokens';
import {
  Sparkles,
  Wand2,
  Loader2,
  RefreshCw,
  XCircle,
  Check,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/app/components/UI/Button';
import type { NextStepSuggestion } from '../types';

interface SuggestModeProps {
  suggestions: NextStepSuggestion[];
  isGenerating: boolean;
  scenesLength: number;
  currentSceneId: string | null;
  onGenerate: () => void;
  onAccept: (suggestion: NextStepSuggestion) => void;
  onDecline: (id: string) => void;
  onDismissAll: () => void;
}

export function SuggestMode({
  suggestions,
  isGenerating,
  scenesLength,
  currentSceneId,
  onGenerate,
  onAccept,
  onDecline,
  onDismissAll,
}: SuggestModeProps) {
  if (scenesLength === 0) {
    return (
      <div className="text-center py-8">
        <Wand2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <p className="text-sm text-slate-400">Create your first scene to get AI suggestions</p>
      </div>
    );
  }

  if (suggestions.length === 0 && !isGenerating) {
    return (
      <div className="text-center py-8">
        <Lightbulb className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <p className="text-sm text-slate-400 mb-4">
          {currentSceneId ? 'Ready to suggest what happens next' : 'Select a scene to get suggestions'}
        </p>
        <Button onClick={onGenerate} disabled={!currentSceneId} className="gap-2">
          <Sparkles className="w-4 h-4" />
          Generate Ideas
        </Button>
      </div>
    );
  }

  if (isGenerating && suggestions.length === 0) {
    return (
      <div className="text-center py-8">
        <Loader2 className={cn('w-10 h-10 mx-auto mb-3 animate-spin', SEMANTIC_COLORS.brand.text, 'opacity-50')} />
        <p className="text-sm text-slate-400">Thinking about what happens next...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          <span className="font-semibold text-slate-300">{suggestions.length}</span> suggestions
        </p>
        <div className="flex gap-2">
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className={cn(
              'flex items-center gap-1 px-2 py-1 text-sm font-medium rounded',
              SEMANTIC_COLORS.brand.bg, SEMANTIC_COLORS.brand.text, SEMANTIC_COLORS.brand.hover,
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <RefreshCw className={cn('w-3 h-3', isGenerating && 'animate-spin')} />
            Refresh
          </button>
          <button
            onClick={onDismissAll}
            className="flex items-center gap-1 px-2 py-1 text-sm font-medium rounded bg-slate-800 text-slate-400 hover:bg-slate-700"
          >
            <XCircle className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onAccept={() => onAccept(suggestion)}
            onDecline={() => onDecline(suggestion.id)}
          />
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-400 pt-2 border-t border-slate-800">
        <span className="flex items-center gap-1">
          <div className={cn('w-2 h-2 rounded-full', SEMANTIC_COLORS.success.dot)} />
          High
        </span>
        <span className="flex items-center gap-1">
          <div className={cn('w-2 h-2 rounded-full', SEMANTIC_COLORS.warning.dot)} />
          Medium
        </span>
        <span className="flex items-center gap-1">
          <div className={cn('w-2 h-2 rounded-full', SEMANTIC_COLORS.danger.dot)} />
          Low
        </span>
      </div>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  onAccept,
  onDecline,
}: {
  suggestion: NextStepSuggestion;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const confidenceColor =
    suggestion.confidence >= 0.7
      ? SEMANTIC_COLORS.success.dot
      : suggestion.confidence >= 0.4
      ? SEMANTIC_COLORS.warning.dot
      : SEMANTIC_COLORS.danger.dot;

  return (
    <motion.div
      {...FM_VARIANTS.fadeIn}
      transition={FM_TRANSITION.normal}
      className="p-3 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors"
    >
      <div className="flex items-start gap-2 mb-2">
        <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', confidenceColor)} />
        <div className="flex-1 min-w-0">
          <h4 className={cn(TYPOGRAPHY.h3, 'truncate')}>{suggestion.title}</h4>
          <p className="text-sm text-slate-400 line-clamp-2 mt-0.5">{suggestion.content}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className={cn('text-sm flex items-center gap-1', SEMANTIC_COLORS.brand.text)}>
          <ArrowRight className="w-3 h-3" />
          {suggestion.choiceLabel}
        </span>
        <div className="flex gap-1.5">
          <button
            onClick={onAccept}
            className={cn('p-1.5 rounded', SEMANTIC_COLORS.brand.bg, SEMANTIC_COLORS.brand.text, SEMANTIC_COLORS.brand.hover)}
            title="Accept suggestion"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDecline}
            className="p-1.5 rounded bg-slate-700 text-slate-400 hover:bg-slate-600"
            title="Decline suggestion"
          >
            <XCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
