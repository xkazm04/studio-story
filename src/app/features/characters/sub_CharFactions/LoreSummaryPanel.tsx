'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Tag, RefreshCw, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { FactionLore } from '@/app/types/Faction';
import { loreAnalysisService } from '@/app/services/loreAnalysisService';

interface LoreSummaryPanelProps {
  lore: FactionLore;
  onUpdateLore?: (loreId: string, updates: Partial<FactionLore>) => void;
}

const LoreSummaryPanel: React.FC<LoreSummaryPanelProps> = ({ lore, onUpdateLore }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasSummary = !!lore.summary;
  const hasTags = !!lore.tags && lore.tags.length > 0;

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await loreAnalysisService.analyzeLore(
        lore.content,
        lore.title,
        lore.category
      );

      if (onUpdateLore) {
        onUpdateLore(lore.id, {
          summary: result.summary,
          tags: result.tags,
          ai_generated_at: result.generated_at,
        });
      }
    } catch (err) {
      console.error('Failed to generate summary:', err);
      setError('Failed to generate summary. Please try again.');

      // Fallback to mock generation
      try {
        const mockResult = loreAnalysisService.generateMockLoreAnalysis(
          lore.content,
          lore.title,
          lore.category
        );
        if (onUpdateLore) {
          onUpdateLore(lore.id, {
            summary: mockResult.summary,
            tags: mockResult.tags,
            ai_generated_at: mockResult.generated_at,
          });
        }
        setError(null);
      } catch (mockErr) {
        console.error('Mock generation also failed:', mockErr);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const formatGeneratedDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/30 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-purple-400" />
            <h4 className="text-sm font-semibold text-white">AI Summary</h4>
            {lore.ai_generated_at && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock size={12} />
                <span>{formatGeneratedDate(lore.ai_generated_at)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateSummary}
              disabled={isGenerating}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-xs font-medium transition-colors"
              data-testid="generate-summary-btn"
            >
              <RefreshCw size={12} className={isGenerating ? 'animate-spin' : ''} />
              {isGenerating ? 'Generating...' : hasSummary ? 'Regenerate' : 'Generate'}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-purple-600/30 rounded transition-colors text-gray-400 hover:text-white"
              data-testid="toggle-summary-panel-btn"
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm"
                  data-testid="summary-error-message"
                >
                  {error}
                </motion.div>
              )}

              {/* Summary section */}
              {hasSummary ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-300">Summary:</div>
                  <div
                    className="text-sm text-gray-400 leading-relaxed whitespace-pre-line bg-gray-900/50 rounded-lg p-3"
                    data-testid="lore-summary-content"
                  >
                    {lore.summary}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Sparkles size={32} className="mx-auto mb-2 text-purple-400/50" />
                  <p className="text-sm text-gray-500 mb-3">
                    No summary generated yet
                  </p>
                  <p className="text-xs text-gray-600">
                    Click "Generate" to create an AI-powered summary
                  </p>
                </div>
              )}

              {/* Tags section */}
              {hasTags && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <Tag size={14} />
                    <span>Tags:</span>
                  </div>
                  <div className="flex flex-wrap gap-2" data-testid="lore-tags-container">
                    {lore.tags!.map((tag, index) => (
                      <motion.span
                        key={tag}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="px-3 py-1 bg-gradient-to-r from-purple-600/30 to-blue-600/30 border border-purple-500/40 rounded-full text-xs font-medium text-purple-200 hover:from-purple-600/40 hover:to-blue-600/40 transition-all cursor-pointer"
                        data-testid={`lore-tag-${tag}`}
                      >
                        {tag}
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}

              {/* Info text */}
              {!hasSummary && !hasTags && !isGenerating && (
                <div className="text-xs text-gray-600 text-center">
                  AI will analyze the lore content to extract key themes and create a concise summary
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoreSummaryPanel;
