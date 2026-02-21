'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart2,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  ThumbsUp,
  ThumbsDown,
  Clock,
  FileText,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Activity,
  Target,
  Zap,
  GitCompare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/UI/Button';
import {
  templateManager,
  type PromptTemplate,
  type TemplateRating,
  type ABTestConfig,
} from '@/lib/templates';

interface EffectivenessPanelProps {
  template: PromptTemplate;
  onRatingSubmit?: (rating: number, feedback?: string, quality?: TemplateRating['outputQuality']) => void;
  onStartABTest?: (config: ABTestConfig) => void;
  className?: string;
}

const QUALITY_OPTIONS: { value: TemplateRating['outputQuality']; label: string; icon: React.ReactNode }[] = [
  { value: 'poor', label: 'Poor', icon: <ThumbsDown className="w-3 h-3" /> },
  { value: 'fair', label: 'Fair', icon: <Minus className="w-3 h-3" /> },
  { value: 'good', label: 'Good', icon: <ThumbsUp className="w-3 h-3" /> },
  { value: 'excellent', label: 'Excellent', icon: <Star className="w-3 h-3" /> },
];

export const EffectivenessPanel: React.FC<EffectivenessPanelProps> = ({
  template,
  onRatingSubmit,
  onStartABTest,
  className,
}) => {
  // State
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');
  const [userRating, setUserRating] = useState<number>(0);
  const [userFeedback, setUserFeedback] = useState('');
  const [userQuality, setUserQuality] = useState<TemplateRating['outputQuality']>();
  const [showRatingForm, setShowRatingForm] = useState(false);

  // Get effectiveness report
  const report = useMemo(() => {
    return templateManager.getEffectivenessReport(template.id);
  }, [template.id]);

  // Toggle section
  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  // Handle rating submission
  const handleSubmitRating = useCallback(() => {
    if (userRating < 1) return;

    templateManager.addRating(
      template.id,
      'current_user', // In production, use actual user ID
      userRating,
      userFeedback || undefined,
      userQuality
    );

    onRatingSubmit?.(userRating, userFeedback, userQuality);

    // Reset form
    setUserRating(0);
    setUserFeedback('');
    setUserQuality(undefined);
    setShowRatingForm(false);
  }, [template.id, userRating, userFeedback, userQuality, onRatingSubmit]);

  // Render trend indicator
  const renderTrend = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return (
          <span className="flex items-center gap-1 text-green-400 text-xs">
            <TrendingUp className="w-3 h-3" />
            Improving
          </span>
        );
      case 'declining':
        return (
          <span className="flex items-center gap-1 text-red-400 text-xs">
            <TrendingDown className="w-3 h-3" />
            Declining
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-slate-400 text-xs">
            <Minus className="w-3 h-3" />
            Stable
          </span>
        );
    }
  };

  // Render star rating input
  const renderStarInput = () => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => setUserRating(star)}
          className="p-0.5 hover:scale-110 transition-transform"
        >
          <Star
            className={cn(
              'w-5 h-5 transition-colors',
              star <= userRating ? 'text-amber-400 fill-amber-400' : 'text-slate-600 hover:text-slate-500'
            )}
          />
        </button>
      ))}
    </div>
  );

  // Render distribution bar
  const renderDistributionBar = (value: number, max: number, color: string) => (
    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
        className={cn('h-full rounded-full', color)}
      />
    </div>
  );

  if (!report) {
    return (
      <div className={cn('p-4 text-center text-slate-500', className)}>
        <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No effectiveness data available</p>
      </div>
    );
  }

  const maxRatingCount = Math.max(...Object.values(report.ratingDistribution));
  const maxQualityCount = Math.max(...Object.values(report.qualityDistribution));

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header */}
      <div className="shrink-0 p-3 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-slate-200">Effectiveness Metrics</h3>
          </div>
          {renderTrend(report.trend)}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Overview Section */}
        <div className="border-b border-slate-800">
          <button
            onClick={() => toggleSection('overview')}
            className="w-full flex items-center justify-between p-3 hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              {expandedSection === 'overview' ? (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )}
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-medium text-slate-300">Overview</span>
            </div>
          </button>

          <AnimatePresence>
            {expandedSection === 'overview' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 grid grid-cols-2 gap-3">
                  {/* Usage Count */}
                  <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                      <Zap className="w-3 h-3" />
                      <span className="text-[10px]">Total Uses</span>
                    </div>
                    <div className="text-lg font-semibold text-slate-200">
                      {report.metrics.usageCount.toLocaleString()}
                    </div>
                  </div>

                  {/* Average Rating */}
                  <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                      <Star className="w-3 h-3" />
                      <span className="text-[10px]">Avg Rating</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-semibold text-slate-200">
                        {report.metrics.averageRating.toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-500">/ 5</span>
                    </div>
                  </div>

                  {/* Success Rate */}
                  <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                      <Target className="w-3 h-3" />
                      <span className="text-[10px]">Success Rate</span>
                    </div>
                    <div className="text-lg font-semibold text-green-400">
                      {(report.metrics.successRate * 100).toFixed(0)}%
                    </div>
                  </div>

                  {/* Avg Output Length */}
                  <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                      <FileText className="w-3 h-3" />
                      <span className="text-[10px]">Avg Output</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-semibold text-slate-200">
                        {Math.round(report.metrics.averageOutputLength).toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500">chars</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Rating Distribution Section */}
        <div className="border-b border-slate-800">
          <button
            onClick={() => toggleSection('ratings')}
            className="w-full flex items-center justify-between p-3 hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              {expandedSection === 'ratings' ? (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )}
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-slate-300">Rating Distribution</span>
            </div>
            <span className="text-xs text-slate-500">{report.metrics.ratingCount} ratings</span>
          </button>

          <AnimatePresence>
            {expandedSection === 'ratings' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-4">{rating}</span>
                      <Star className="w-3 h-3 text-amber-400" />
                      {renderDistributionBar(
                        report.ratingDistribution[rating] || 0,
                        maxRatingCount,
                        rating >= 4 ? 'bg-green-500' : rating >= 3 ? 'bg-amber-500' : 'bg-red-500'
                      )}
                      <span className="text-xs text-slate-500 w-8 text-right">
                        {report.ratingDistribution[rating] || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quality Distribution Section */}
        <div className="border-b border-slate-800">
          <button
            onClick={() => toggleSection('quality')}
            className="w-full flex items-center justify-between p-3 hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              {expandedSection === 'quality' ? (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )}
              <ThumbsUp className="w-4 h-4 text-green-400" />
              <span className="text-xs font-medium text-slate-300">Output Quality</span>
            </div>
          </button>

          <AnimatePresence>
            {expandedSection === 'quality' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 space-y-2">
                  {QUALITY_OPTIONS.slice().reverse().map(({ value, label }) => (
                    <div key={value} className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-16">{label}</span>
                      {renderDistributionBar(
                        report.qualityDistribution[value!] || 0,
                        maxQualityCount,
                        value === 'excellent' ? 'bg-purple-500' :
                        value === 'good' ? 'bg-green-500' :
                        value === 'fair' ? 'bg-amber-500' : 'bg-red-500'
                      )}
                      <span className="text-xs text-slate-500 w-8 text-right">
                        {report.qualityDistribution[value!] || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* A/B Test Results Section */}
        {report.metrics.abTestResults && report.metrics.abTestResults.length > 0 && (
          <div className="border-b border-slate-800">
            <button
              onClick={() => toggleSection('abtests')}
              className="w-full flex items-center justify-between p-3 hover:bg-slate-800/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                {expandedSection === 'abtests' ? (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                )}
                <GitCompare className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-medium text-slate-300">A/B Test Results</span>
              </div>
              <span className="text-xs text-slate-500">
                {report.metrics.abTestResults.length} tests
              </span>
            </button>

            <AnimatePresence>
              {expandedSection === 'abtests' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 space-y-2">
                    {report.metrics.abTestResults.map((test, idx) => (
                      <div
                        key={test.testId}
                        className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-800"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-400">Test #{idx + 1}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(test.completedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500">Winner: </span>
                            <span className="text-green-400">{test.winnerRating.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Loser: </span>
                            <span className="text-red-400">{test.loserRating.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Sample: </span>
                            <span className="text-slate-300">{test.sampleSize}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Confidence: </span>
                            <span className="text-cyan-400">{(test.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Rate This Template Section */}
        <div className="p-3">
          <button
            onClick={() => setShowRatingForm(!showRatingForm)}
            className="w-full flex items-center justify-between p-2.5 bg-slate-900/50 border border-slate-800 rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-medium text-slate-300">Rate This Template</span>
            </div>
            <ChevronDown
              className={cn('w-4 h-4 text-slate-500 transition-transform', showRatingForm && 'rotate-180')}
            />
          </button>

          <AnimatePresence>
            {showRatingForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-3">
                  {/* Star Rating */}
                  <div>
                    <label className="text-[10px] font-medium text-slate-400 mb-1.5 block">
                      Your Rating
                    </label>
                    {renderStarInput()}
                  </div>

                  {/* Output Quality */}
                  <div>
                    <label className="text-[10px] font-medium text-slate-400 mb-1.5 block">
                      Output Quality
                    </label>
                    <div className="flex gap-1">
                      {QUALITY_OPTIONS.map(({ value, label, icon }) => (
                        <button
                          key={value}
                          onClick={() => setUserQuality(value)}
                          className={cn(
                            'flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] rounded transition-colors',
                            userQuality === value
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : 'bg-slate-800 text-slate-400 border border-transparent hover:text-slate-300'
                          )}
                        >
                          {icon}
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feedback */}
                  <div>
                    <label className="text-[10px] font-medium text-slate-400 mb-1.5 block">
                      Feedback (optional)
                    </label>
                    <textarea
                      value={userFeedback}
                      onChange={(e) => setUserFeedback(e.target.value)}
                      placeholder="Share your experience with this template..."
                      rows={2}
                      className="w-full px-2.5 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    size="sm"
                    onClick={handleSubmitRating}
                    disabled={userRating < 1}
                    className="w-full h-8 text-xs"
                  >
                    Submit Rating
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default EffectivenessPanel;
