'use client';

import { BeatPacingSuggestion } from '@/app/types/Beat';
import { BeatTableItem } from '../BeatsOverview';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/app/components/UI/Button';
import { Sparkles, X, CheckCircle, Clock, ArrowRight, Merge, Split } from 'lucide-react';

interface PacingSuggestionsProps {
  suggestions: BeatPacingSuggestion[];
  beats: BeatTableItem[];
  onApplySuggestion: (suggestion: BeatPacingSuggestion) => void;
  onDismissSuggestion: (id: string) => void;
}

const PacingSuggestions = ({
  suggestions,
  beats,
  onApplySuggestion,
  onDismissSuggestion,
}: PacingSuggestionsProps) => {
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'reorder':
        return <ArrowRight className="h-4 w-4" />;
      case 'adjust_duration':
        return <Clock className="h-4 w-4" />;
      case 'merge':
        return <Merge className="h-4 w-4" />;
      case 'split':
        return <Split className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="absolute top-4 left-4 w-80 max-h-[calc(100%-2rem)] overflow-y-auto bg-gray-900/95 backdrop-blur-md border border-gray-800 rounded-lg shadow-2xl"
      data-testid="pacing-suggestions-panel"
    >
      <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-400" />
          <h3 className="text-sm font-semibold text-gray-200">AI Pacing Suggestions</h3>
        </div>
        <div className="text-xs text-gray-400 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">
          {suggestions.length}
        </div>
      </div>

      <div className="p-3 space-y-3">
        <AnimatePresence>
          {suggestions.map((suggestion) => {
            const beat = beats.find((b) => b.id === suggestion.beat_id);
            if (!beat) return null;

            return (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-gray-950/50 rounded-lg border border-gray-800 p-3 hover:border-purple-500/30 transition-colors"
                data-testid={`pacing-suggestion-${suggestion.id}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="text-purple-400">
                      {getSuggestionIcon(suggestion.suggestion_type)}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-200 capitalize">
                        {suggestion.suggestion_type.replace('_', ' ')}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Beat: {beat.name}
                      </div>
                    </div>
                  </div>

                  {/* Confidence Badge */}
                  <div
                    className={`text-[10px] font-medium px-2 py-0.5 rounded ${getConfidenceColor(
                      suggestion.confidence
                    )} bg-gray-900/50 border border-current/20`}
                  >
                    {getConfidenceLabel(suggestion.confidence)} ({Math.round(suggestion.confidence * 100)}%)
                  </div>
                </div>

                {/* Suggestion Details */}
                {suggestion.suggestion_type === 'reorder' && suggestion.suggested_order !== undefined && (
                  <div className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                    <span className="text-gray-500">Current:</span>
                    <span className="bg-gray-800 px-2 py-0.5 rounded">{(beat.order || 0) + 1}</span>
                    <ArrowRight className="h-3 w-3 text-purple-400" />
                    <span className="text-gray-500">Suggested:</span>
                    <span className="bg-purple-500/20 px-2 py-0.5 rounded text-purple-300 border border-purple-500/30">
                      {suggestion.suggested_order + 1}
                    </span>
                  </div>
                )}

                {suggestion.suggestion_type === 'adjust_duration' &&
                  suggestion.suggested_duration !== undefined && (
                    <div className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                      <span className="text-gray-500">Current:</span>
                      <span className="bg-gray-800 px-2 py-0.5 rounded">
                        {beat.estimated_duration || 10}m
                      </span>
                      <ArrowRight className="h-3 w-3 text-purple-400" />
                      <span className="text-gray-500">Suggested:</span>
                      <span className="bg-purple-500/20 px-2 py-0.5 rounded text-purple-300 border border-purple-500/30">
                        {suggestion.suggested_duration}m
                      </span>
                    </div>
                  )}

                {/* Reasoning */}
                <div className="text-xs text-gray-400 mb-3 leading-relaxed bg-gray-900/30 rounded p-2 border border-gray-800/50">
                  {suggestion.reasoning}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onApplySuggestion(suggestion)}
                    className="flex-1 flex items-center justify-center gap-1.5"
                    data-testid={`apply-suggestion-${suggestion.id}`}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onDismissSuggestion(suggestion.id)}
                    data-testid={`dismiss-suggestion-${suggestion.id}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {suggestions.length === 0 && (
          <div className="py-8 text-center text-gray-500 text-xs">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No pacing suggestions available</p>
            <p className="text-[10px] mt-1">AI will analyze your beats for optimization opportunities</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PacingSuggestions;
