'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

export interface BeatSuggestion {
  name: string;
  description: string;
  reasoning: string;
}

interface BeatNameSuggestionPanelProps {
  suggestions: BeatSuggestion[];
  isLoading: boolean;
  isVisible: boolean;
  onSelect: (suggestion: BeatSuggestion) => void;
  position?: 'above' | 'below';
}

export const BeatNameSuggestionPanel = ({
  suggestions,
  isLoading,
  isVisible,
  onSelect,
  position = 'below',
}: BeatNameSuggestionPanelProps) => {
  if (!isVisible && !isLoading) return null;

  return (
    <AnimatePresence>
      {(isVisible || isLoading) && (
        <motion.div
          initial={{ opacity: 0, y: position === 'below' ? -10 : 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === 'below' ? -10 : 10, scale: 0.95 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={clsx(
            'absolute left-0 right-0 z-50',
            position === 'below' ? 'top-full mt-1' : 'bottom-full mb-1'
          )}
          data-testid="beat-suggestion-panel"
        >
          <div className="bg-gray-900/95 backdrop-blur-sm border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/10 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center gap-3 px-4 py-3" data-testid="beat-suggestion-loading">
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-sm text-gray-400">
                  Generating suggestions...
                </span>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                <div className="px-3 py-2 bg-cyan-500/10 border-b border-cyan-500/20">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs font-medium text-cyan-300 uppercase tracking-wide">
                      AI Suggestions
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-gray-800">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => onSelect(suggestion)}
                      className={clsx(
                        'w-full text-left px-4 py-3 transition-all',
                        'hover:bg-cyan-500/10 focus:bg-cyan-500/15',
                        'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-inset',
                        'group'
                      )}
                      data-testid={`beat-suggestion-item-${index}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
                            <Check className="w-3 h-3 text-cyan-400" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <h4 className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                              {suggestion.name}
                            </h4>
                            {suggestion.reasoning && (
                              <span className="text-xs text-gray-500 italic truncate">
                                {suggestion.reasoning}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                            {suggestion.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="px-3 py-2 bg-gray-800/50 border-t border-gray-800">
                  <p className="text-xs text-gray-500 text-center">
                    Click a suggestion to use it, or keep typing to refine
                  </p>
                </div>
              </div>
            ) : (
              <div className="px-4 py-3" data-testid="beat-suggestion-empty">
                <p className="text-xs text-gray-500 text-center">
                  No suggestions available
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
