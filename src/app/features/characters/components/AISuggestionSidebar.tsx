'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, X, Loader2, ChevronRight, Lightbulb } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { AISuggestion } from '@/app/services/aiSuggestionService';
import { Card, CardHeader, CardContent } from '@/app/components/UI/Card';
import { Button, IconButton } from '@/app/components/UI/Button';

interface AISuggestionSidebarProps {
  suggestions: AISuggestion[];
  isLoading: boolean;
  isStreaming: boolean;
  streamProgress: string;
  onApplySuggestion: (suggestion: AISuggestion) => void;
  onDismiss: () => void;
  position?: 'left' | 'right';
}

const AISuggestionSidebar: React.FC<AISuggestionSidebarProps> = ({
  suggestions,
  isLoading,
  isStreaming,
  streamProgress,
  onApplySuggestion,
  onDismiss,
  position = 'right',
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<number>>(new Set());

  const handleApply = (suggestion: AISuggestion, index: number) => {
    onApplySuggestion(suggestion);
    setAppliedSuggestions(prev => new Set([...prev, index]));

    // Auto-collapse after apply
    setTimeout(() => setExpandedIndex(null), 300);
  };

  const positionClasses = position === 'left'
    ? 'left-0 border-r'
    : 'right-0 border-l';

  return (
    <motion.div
      initial={{ x: position === 'left' ? -320 : 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: position === 'left' ? -320 : 320, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn('fixed top-0', positionClasses, 'h-full w-80 bg-slate-950/95 backdrop-blur-xl border-cyan-500/20 shadow-2xl z-50 flex flex-col')}
      data-testid="ai-suggestion-sidebar"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Sparkles size={16} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Suggestions</h3>
            <p className="text-xs text-gray-400">Live enhancements</p>
          </div>
        </div>
        <IconButton
          icon={<X size={16} />}
          size="sm"
          variant="ghost"
          onClick={onDismiss}
          aria-label="Close suggestions"
          data-testid="close-suggestions-btn"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {/* Loading State */}
        {isLoading && suggestions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 size={32} className="text-cyan-400 animate-spin mb-3" />
            <p className="text-sm text-gray-400">Analyzing your text...</p>
          </div>
        )}

        {/* Streaming Progress */}
        {isStreaming && (
          <Card variant="glass" padding="sm" className="mb-2">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 size={14} className="text-cyan-400 animate-spin" />
              <span className="text-xs text-cyan-400 font-medium">Generating...</span>
            </div>
            {streamProgress && (
              <p className="text-xs text-gray-400 line-clamp-2">{streamProgress}</p>
            )}
          </Card>
        )}

        {/* Suggestions List */}
        <AnimatePresence mode="popLayout">
          {suggestions.map((suggestion, index) => {
            const isExpanded = expandedIndex === index;
            const isApplied = appliedSuggestions.has(index);

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  variant="bordered"
                  padding="none"
                  className={cn(
                    'overflow-hidden transition-all',
                    isApplied && 'opacity-50 bg-green-500/5'
                  )}
                  data-testid={`suggestion-card-${index}`}
                >
                  {/* Suggestion Header */}
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    className="w-full p-2.5 flex items-start gap-2 text-left hover:bg-slate-800/40 transition-colors"
                    data-testid={`suggestion-toggle-${index}`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <Lightbulb size={14} className="text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-medium text-white truncate">
                        {suggestion.title}
                      </h4>
                      {!isExpanded && (
                        <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                          {suggestion.suggestion}
                        </p>
                      )}
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-shrink-0"
                    >
                      <ChevronRight size={14} className="text-gray-500" />
                    </motion.div>
                  </button>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-2.5 pt-0 space-y-2 border-t border-slate-800/50">
                          {/* Suggestion Text */}
                          <div>
                            <label className="text-[10px] uppercase tracking-wide text-gray-500 font-medium">
                              Suggestion
                            </label>
                            <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                              {suggestion.suggestion}
                            </p>
                          </div>

                          {/* Reasoning */}
                          <div>
                            <label className="text-[10px] uppercase tracking-wide text-gray-500 font-medium">
                              Why?
                            </label>
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed italic">
                              {suggestion.reasoning}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1.5 pt-1">
                            {!isApplied ? (
                              <Button
                                size="xs"
                                variant="primary"
                                icon={<Check size={12} />}
                                onClick={() => handleApply(suggestion, index)}
                                fullWidth
                                data-testid={`apply-suggestion-${index}`}
                              >
                                Apply
                              </Button>
                            ) : (
                              <div className="w-full px-2 py-1.5 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-400 flex items-center justify-center gap-1">
                                <Check size={12} />
                                Applied
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty State */}
        {!isLoading && suggestions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-3">
              <Sparkles size={20} className="text-gray-500" />
            </div>
            <h4 className="text-sm font-medium text-gray-400 text-center mb-1">
              Start typing to get suggestions
            </h4>
            <p className="text-xs text-gray-500 text-center">
              AI will analyze your text and provide creative enhancements
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/50">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Sparkles size={12} className="text-cyan-500" />
          <span>{suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default AISuggestionSidebar;
