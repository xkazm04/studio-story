'use client';

import { useState } from 'react';
import { BeatSceneSuggestion } from '@/app/types/Beat';
import { Scene } from '@/app/types/Scene';
import { Sparkles, Check, X, Edit2, ExternalLink, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeatSceneSuggestionsProps {
  beatId: string;
  beatName: string;
  beatDescription?: string;
  projectId: string;
  onAcceptSuggestion: (suggestion: BeatSceneSuggestion) => Promise<void>;
  onRejectSuggestion: (suggestion: BeatSceneSuggestion) => void;
  onModifySuggestion: (suggestion: BeatSceneSuggestion) => void;
}

export default function BeatSceneSuggestions({
  beatId,
  beatName,
  beatDescription,
  projectId,
  onAcceptSuggestion,
  onRejectSuggestion,
  onModifySuggestion,
}: BeatSceneSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<BeatSceneSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

  const generateSuggestions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/beat-scene-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beatName,
          beatDescription,
          beatType: 'act',
          projectContext: { projectId },
          maxSuggestions: 3,
          includeNewScenes: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setIsVisible(true);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (suggestion: BeatSceneSuggestion) => {
    setSelectedSuggestion(suggestion.scene_id || suggestion.scene_name);
    await onAcceptSuggestion(suggestion);
  };

  const handleReject = (suggestion: BeatSceneSuggestion) => {
    setSuggestions(prev => prev.filter(s => s !== suggestion));
    onRejectSuggestion(suggestion);
  };

  return (
    <div className="w-full">
      {/* Trigger Button */}
      {!isVisible && (
        <button
          onClick={generateSuggestions}
          disabled={isLoading}
          data-testid="generate-scene-suggestions-btn"
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 rounded hover:bg-cyan-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Generating scenes...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Generate Scene Suggestions
            </>
          )}
        </button>
      )}

      {/* Suggestions Panel */}
      <AnimatePresence>
        {isVisible && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 space-y-2"
            data-testid="scene-suggestions-panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-t">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-semibold text-white">
                  AI Scene Suggestions
                </h4>
                <span className="text-xs text-gray-400">
                  ({suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''})
                </span>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                data-testid="close-suggestions-btn"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Suggestions List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 bg-gray-800/30 border border-gray-700/50 rounded hover:border-cyan-500/30 transition-colors"
                  data-testid={`scene-suggestion-${index}`}
                >
                  {/* Suggestion Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="text-sm font-semibold text-white">
                          {suggestion.scene_name}
                        </h5>
                        {suggestion.is_new_scene && (
                          <span className="px-1.5 py-0.5 text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/30 rounded">
                            New
                          </span>
                        )}
                        {!suggestion.is_new_scene && (
                          <span className="px-1.5 py-0.5 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded">
                            Existing
                          </span>
                        )}
                      </div>
                      {suggestion.location && (
                        <p className="text-xs text-gray-400 mb-1">
                          Location: {suggestion.location}
                        </p>
                      )}
                    </div>

                    {/* Scores */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Confidence:</span>
                        <span className="text-xs font-semibold text-cyan-400">
                          {Math.round(suggestion.confidence_score * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Match:</span>
                        <span className="text-xs font-semibold text-blue-400">
                          {Math.round(suggestion.similarity_score * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-300 mb-2 line-clamp-2">
                    {suggestion.scene_description}
                  </p>

                  {/* Reasoning */}
                  <div className="p-2 bg-gray-900/50 rounded mb-3">
                    <p className="text-xs text-gray-400 italic">
                      {suggestion.reasoning}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAccept(suggestion)}
                      data-testid={`accept-suggestion-${index}-btn`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-500 rounded transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Accept
                    </button>
                    <button
                      onClick={() => onModifySuggestion(suggestion)}
                      data-testid={`modify-suggestion-${index}-btn`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 rounded transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Modify
                    </button>
                    <button
                      onClick={() => handleReject(suggestion)}
                      data-testid={`reject-suggestion-${index}-btn`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 rounded transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
