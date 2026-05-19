'use client';

import React, { useState } from 'react';
import { useCopyToClipboard } from '@/app/hooks/useCopyToClipboard';
import { motion } from 'framer-motion';
import {
  Copy,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  MessageSquare,
  Film,
  Zap,
  BookOpen,
  Globe,
} from 'lucide-react';
import type { AISuggestion, SuggestionType } from '@/app/types/AIAssistant';
import { TYPOGRAPHY } from '@/workspace/theme/tokens';
import { cn } from '@/lib/utils';
import { SectionWrapper } from '@/app/components/UI';

/**
 * Confidence threshold constants for visual feedback
 */
const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.6,
} as const;

interface SuggestionCardProps {
  suggestion: AISuggestion;
  onCopy?: (suggestion: AISuggestion) => void;
  onInsert?: (suggestion: AISuggestion) => void;
  onDismiss?: (suggestionId: string) => void;
  showDetails?: boolean;
}

type SuggestionColor = 'blue' | 'purple' | 'green' | 'yellow' | 'red' | 'cyan';

const suggestionTypeConfig: Record<
  SuggestionType,
  { icon: React.ElementType; color: SuggestionColor; label: string }
> = {
  scene_hook: { icon: Film, color: 'blue', label: 'Scene Hook' },
  beat_outline: { icon: BookOpen, color: 'purple', label: 'Beat Outline' },
  dialogue_snippet: { icon: MessageSquare, color: 'green', label: 'Dialogue' },
  character_action: { icon: Zap, color: 'yellow', label: 'Character Action' },
  plot_twist: { icon: Lightbulb, color: 'red', label: 'Plot Twist' },
  world_building: { icon: Globe, color: 'cyan', label: 'World Building' },
};

/**
 * Static class map — avoids dynamic Tailwind class construction
 * which gets purged from production CSS bundles.
 */
const colorClasses: Record<SuggestionColor, {
  iconWrap: string;
  iconText: string;
  insertBtn: string;
}> = {
  blue: {
    iconWrap: 'bg-blue-600/20 border border-blue-600/30',
    iconText: 'text-blue-400',
    insertBtn: 'bg-blue-600 hover:bg-blue-700',
  },
  purple: {
    iconWrap: 'bg-purple-600/20 border border-purple-600/30',
    iconText: 'text-purple-400',
    insertBtn: 'bg-purple-600 hover:bg-purple-700',
  },
  green: {
    iconWrap: 'bg-green-600/20 border border-green-600/30',
    iconText: 'text-green-400',
    insertBtn: 'bg-green-600 hover:bg-green-700',
  },
  yellow: {
    iconWrap: 'bg-yellow-600/20 border border-yellow-600/30',
    iconText: 'text-yellow-400',
    insertBtn: 'bg-yellow-600 hover:bg-yellow-700',
  },
  red: {
    iconWrap: 'bg-red-600/20 border border-red-600/30',
    iconText: 'text-red-400',
    insertBtn: 'bg-red-600 hover:bg-red-700',
  },
  cyan: {
    iconWrap: 'bg-cyan-600/20 border border-cyan-600/30',
    iconText: 'text-cyan-400',
    insertBtn: 'bg-cyan-600 hover:bg-cyan-700',
  },
};

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onCopy,
  onInsert,
  onDismiss,
  showDetails = true,
}) => {
  const { copy: copyToClipboard, copied } = useCopyToClipboard();
  const [expanded, setExpanded] = useState(false);

  const config = suggestionTypeConfig[suggestion.type] || suggestionTypeConfig.scene_hook;
  const Icon = config.icon;

  const handleCopy = async () => {
    if (onCopy) {
      onCopy(suggestion);
    }
    await copyToClipboard(suggestion.content);
  };

  const handleInsert = () => {
    if (onInsert) {
      onInsert(suggestion);
    }
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss(suggestion.id);
    }
  };

  const confidenceColor =
    suggestion.confidence >= CONFIDENCE_THRESHOLDS.HIGH
      ? 'text-green-400'
      : suggestion.confidence >= CONFIDENCE_THRESHOLDS.MEDIUM
      ? 'text-yellow-400'
      : 'text-slate-400';

  const confidencePercentage = Math.round(suggestion.confidence * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <SectionWrapper borderColor={config.color} padding="sm" className="relative">
        {/* Header */}
        <div className="flex items-start gap-3 mb-2">
          <div
            className={`p-2 rounded-lg ${colorClasses[config.color].iconWrap}`}
          >
            <Icon className={`w-4 h-4 ${colorClasses[config.color].iconText}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className={cn(TYPOGRAPHY.h3, 'truncate')}>{suggestion.title}</h4>
              {onDismiss && (
                <button
                  onClick={handleDismiss}
                  className="p-1 hover:bg-slate-700 rounded transition-colors shrink-0"
                  title="Dismiss"
                  data-testid="dismiss-suggestion-btn"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-slate-400">{config.label}</span>
              {showDetails && (
                <>
                  <span className="text-sm text-slate-400">•</span>
                  <span className={`text-sm ${confidenceColor}`}>
                    {confidencePercentage}% confidence
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mb-3">
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {suggestion.content}
          </p>
        </div>

        {/* Context (expandable) */}
        {showDetails && suggestion.context && (
          <div className="mb-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-300 transition-colors"
              data-testid="expand-context-btn"
            >
              {expanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
              {expanded ? 'Hide' : 'Show'} context
            </button>

            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-2 p-3 bg-slate-800/50 rounded border border-slate-700"
              >
                <p className="text-sm text-slate-400">{suggestion.context}</p>
                {suggestion.reasoning && (
                  <p className="text-sm text-slate-400 mt-1 italic">{suggestion.reasoning}</p>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm text-white transition-colors"
            data-testid="copy-suggestion-btn"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy
              </>
            )}
          </button>

          {onInsert && (
            <button
              onClick={handleInsert}
              className={`flex items-center gap-1.5 px-3 py-1.5 ${colorClasses[config.color].insertBtn} rounded text-sm text-white transition-colors`}
              data-testid="insert-suggestion-btn"
            >
              <Zap className="w-3 h-3" />
              Insert
            </button>
          )}
        </div>
      </SectionWrapper>
    </motion.div>
  );
};

export default SuggestionCard;
