'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Settings,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Filter,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import { useAIAssistant } from '@/app/hooks/useAIAssistant';
import { SuggestionCard } from './components/SuggestionCard';
import type { SuggestionType, SuggestionDepth, AISuggestion } from '@/app/types/AIAssistant';
import { SectionWrapper } from '@/app/components/UI';

interface AIAssistantPanelProps {
  projectId?: string;
  contextType: 'act' | 'beat' | 'character' | 'scene' | 'general';
  contextId?: string;
  onInsertSuggestion?: (content: string) => void;
  className?: string;
}

const suggestionTypeLabels: Record<SuggestionType, string> = {
  scene_hook: 'Scene Hooks',
  beat_outline: 'Beat Outlines',
  dialogue_snippet: 'Dialogue',
  character_action: 'Character Actions',
  plot_twist: 'Plot Twists',
  world_building: 'World Building',
};

const depthLabels: Record<SuggestionDepth, string> = {
  brief: 'Brief',
  moderate: 'Moderate',
  detailed: 'Detailed',
};

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  projectId,
  contextType,
  contextId,
  onInsertSuggestion,
  className = '',
}) => {
  const {
    settings,
    activeSuggestions,
    isEnabled,
    isHealthy,
    isGenerating,
    isError,
    error,
    generateSuggestions,
    clearSuggestions,
    removeSuggestion,
    updateSettings,
    toggleEnabled,
    copySuggestion,
  } = useAIAssistant({ projectId });

  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Auto-generate on mount if enabled and auto-suggest is on
  useEffect(() => {
    const canAutoGenerate = isEnabled && settings.auto_suggest;
    const hasValidProject = Boolean(projectId);
    const serviceAvailable = isHealthy;

    const shouldAutoGenerate = canAutoGenerate && hasValidProject && serviceAvailable;

    if (shouldAutoGenerate) {
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, contextType, contextId]);

  const handleGenerate = async () => {
    if (!projectId) return;
    await generateSuggestions(contextType, contextId);
  };

  const handleInsert = (suggestion: AISuggestion) => {
    if (onInsertSuggestion) {
      onInsertSuggestion(suggestion.content);
    }
  };

  const toggleSuggestionType = (type: SuggestionType) => {
    const types = settings.suggestion_types.includes(type)
      ? settings.suggestion_types.filter((t) => t !== type)
      : [...settings.suggestion_types, type];
    updateSettings({ suggestion_types: types });
  };

  if (!projectId) {
    return (
      <div className={`p-4 ${className}`}>
        <SectionWrapper borderColor="gray" padding="md" className="text-center">
          <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Select a project to use AI Assistant</p>
        </SectionWrapper>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-5 h-5 ${isEnabled ? 'text-purple-400' : 'text-gray-500'}`} />
            <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
            {!isHealthy && (
              <span className="text-xs text-red-400" title="AI service unavailable">
                (Offline)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 hover:bg-gray-700 rounded transition-colors"
              title={collapsed ? 'Expand' : 'Collapse'}
              data-testid="toggle-assistant-btn"
            >
              {collapsed ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <button
              onClick={toggleEnabled}
              className={`p-1.5 rounded transition-colors ${
                isEnabled ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'
              }`}
              title={isEnabled ? 'Disable' : 'Enable'}
              data-testid="toggle-enabled-btn"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!collapsed && isEnabled && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !isHealthy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded text-xs text-white transition-colors flex-1"
              data-testid="generate-suggestions-btn"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3" />
                  Generate
                </>
              )}
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              title="Filters"
              data-testid="toggle-filters-btn"
            >
              <Filter className="w-3 h-3 text-gray-300" />
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              title="Settings"
              data-testid="toggle-settings-btn"
            >
              <Settings className="w-3 h-3 text-gray-300" />
            </button>

            {activeSuggestions.length > 0 && (
              <button
                onClick={clearSuggestions}
                className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                title="Clear all"
                data-testid="clear-suggestions-btn"
              >
                <X className="w-3 h-3 text-gray-300" />
              </button>
            )}
          </div>
        )}

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && !collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 p-2 bg-gray-800/50 rounded border border-gray-700"
            >
              <p className="text-xs font-medium text-gray-300 mb-2">Suggestion Types:</p>
              <div className="flex flex-wrap gap-1">
                {(Object.keys(suggestionTypeLabels) as SuggestionType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleSuggestionType(type)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      settings.suggestion_types.includes(type)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                    data-testid={`filter-${type}-btn`}
                  >
                    {suggestionTypeLabels[type]}
                  </button>
                ))}
              </div>

              <p className="text-xs font-medium text-gray-300 mb-2 mt-3">Depth:</p>
              <div className="flex gap-1">
                {(Object.keys(depthLabels) as SuggestionDepth[]).map((depth) => (
                  <button
                    key={depth}
                    onClick={() => updateSettings({ depth })}
                    className={`px-3 py-1 text-xs rounded transition-colors flex-1 ${
                      settings.depth === depth
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                    data-testid={`depth-${depth}-btn`}
                  >
                    {depthLabels[depth]}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && !collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 p-2 bg-gray-800/50 rounded border border-gray-700"
            >
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.auto_suggest}
                    onChange={(e) => updateSettings({ auto_suggest: e.target.checked })}
                    className="rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                    data-testid="auto-suggest-checkbox"
                  />
                  <span className="text-xs text-gray-300">Auto-suggest on context change</span>
                </label>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Max Suggestions:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.max_suggestions}
                    onChange={(e) =>
                      updateSettings({ max_suggestions: parseInt(e.target.value) || 5 })
                    }
                    className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:ring-1 focus:ring-purple-500"
                    data-testid="max-suggestions-input"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Genre Filter (optional):</label>
                  <input
                    type="text"
                    value={settings.genre_filter || ''}
                    onChange={(e) => updateSettings({ genre_filter: e.target.value })}
                    placeholder="e.g., sci-fi, fantasy..."
                    className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:ring-1 focus:ring-purple-500"
                    data-testid="genre-filter-input"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <AnimatePresence>
        {!collapsed && isEnabled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-y-auto p-3 space-y-2"
          >
            {isError && (
              <SectionWrapper padding="md" className="text-center border border-red-500/30">
                <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                <p className="text-xs text-red-300">
                  {error instanceof Error ? error.message : 'Failed to generate suggestions'}
                </p>
              </SectionWrapper>
            )}

            {!isGenerating && activeSuggestions.length === 0 && !isError && (
              <SectionWrapper borderColor="purple" padding="lg" className="text-center">
                <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-2 opacity-50" />
                <p className="text-sm text-gray-400">No suggestions yet</p>
                <p className="text-xs text-gray-500 mt-1">
                  Click &quot;Generate&quot; to get AI-powered ideas
                </p>
              </SectionWrapper>
            )}

            <AnimatePresence>
              {activeSuggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onCopy={copySuggestion}
                  onInsert={onInsertSuggestion ? handleInsert : undefined}
                  onDismiss={removeSuggestion}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIAssistantPanel;
