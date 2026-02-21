'use client';

import React, { useState } from 'react';
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

const suggestionTypeConfig: Record<
  SuggestionType,
  { icon: React.ElementType; color: string; label: string }
> = {
  scene_hook: { icon: Film, color: 'blue', label: 'Scene Hook' },
  beat_outline: { icon: BookOpen, color: 'purple', label: 'Beat Outline' },
  dialogue_snippet: { icon: MessageSquare, color: 'green', label: 'Dialogue' },
  character_action: { icon: Zap, color: 'yellow', label: 'Character Action' },
  plot_twist: { icon: Lightbulb, color: 'red', label: 'Plot Twist' },
  world_building: { icon: Globe, color: 'cyan', label: 'World Building' },
};

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onCopy,
  onInsert,
  onDismiss,
  showDetails = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const config = suggestionTypeConfig[suggestion.type] || suggestionTypeConfig.scene_hook;
  const Icon = config.icon;

  const handleCopy = async () => {
    if (onCopy) {
      onCopy(suggestion);
    } else {
      await navigator.clipboard.writeText(suggestion.content);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      : 'text-gray-400';

  const confidencePercentage = Math.round(suggestion.confidence * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <SectionWrapper borderColor={config.color as any} padding="sm" className="relative">
        {/* Header */}
        <div className="flex items-start gap-3 mb-2">
          <div
            className={`p-2 rounded-lg bg-${config.color}-600/20 border border-${config.color}-600/30`}
          >
            <Icon className={`w-4 h-4 text-${config.color}-400`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold text-white truncate">{suggestion.title}</h4>
              {onDismiss && (
                <button
                  onClick={handleDismiss}
                  className="p-1 hover:bg-gray-700 rounded transition-colors shrink-0"
                  title="Dismiss"
                  data-testid="dismiss-suggestion-btn"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-400">{config.label}</span>
              {showDetails && (
                <>
                  <span className="text-xs text-gray-600">•</span>
                  <span className={`text-xs ${confidenceColor}`}>
                    {confidencePercentage}% confidence
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mb-3">
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {suggestion.content}
          </p>
        </div>

        {/* Context (expandable) */}
        {showDetails && suggestion.context && (
          <div className="mb-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-300 transition-colors"
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
                className="mt-2 p-2 bg-gray-800/50 rounded border border-gray-700"
              >
                <p className="text-xs text-gray-400">{suggestion.context}</p>
                {suggestion.reasoning && (
                  <p className="text-xs text-gray-500 mt-1 italic">{suggestion.reasoning}</p>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white transition-colors"
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
              className={`flex items-center gap-1.5 px-3 py-1.5 bg-${config.color}-600 hover:bg-${config.color}-700 rounded text-xs text-white transition-colors`}
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
