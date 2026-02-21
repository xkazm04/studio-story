/**
 * ConsistencyChecker - Detect and report style deviations
 * Design: Clean Manuscript style with cyan accents
 *
 * Analyzes character avatars and reports style consistency issues
 */

'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  AlertTriangle,
  Check,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Palette,
  Sun,
  Paintbrush,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type {
  StyleConsistencyReport,
  StyleDeviation,
  StyleRecommendation,
  CharacterStyleScore,
  StyleDefinition,
} from '../lib/styleEngine';

// ============================================================================
// Types
// ============================================================================

export interface ConsistencyCheckerProps {
  report?: StyleConsistencyReport | null;
  styleDefinition?: StyleDefinition;
  onRunAnalysis?: () => Promise<void>;
  onSelectCharacter?: (characterId: string) => void;
  onApplyRecommendation?: (recommendation: StyleRecommendation) => void;
  isAnalyzing?: boolean;
  compact?: boolean;
}

type ViewMode = 'overview' | 'characters' | 'deviations' | 'recommendations';

// ============================================================================
// Constants
// ============================================================================

const SEVERITY_CONFIG = {
  low: {
    color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
    icon: <Minus size={12} />,
    label: 'Low',
  },
  medium: {
    color: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
    icon: <AlertTriangle size={12} />,
    label: 'Medium',
  },
  high: {
    color: 'text-red-400 bg-red-500/20 border-red-500/30',
    icon: <XCircle size={12} />,
    label: 'High',
  },
};

const DEVIATION_TYPE_CONFIG = {
  color: {
    icon: <Palette size={14} />,
    label: 'Color',
    color: 'text-pink-400',
  },
  lighting: {
    icon: <Sun size={14} />,
    label: 'Lighting',
    color: 'text-yellow-400',
  },
  artStyle: {
    icon: <Paintbrush size={14} />,
    label: 'Art Style',
    color: 'text-purple-400',
  },
  composition: {
    icon: <BarChart3 size={14} />,
    label: 'Composition',
    color: 'text-blue-400',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-400';
  if (score >= 70) return 'text-cyan-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

function getScoreBgColor(score: number): string {
  if (score >= 90) return 'bg-green-500/20';
  if (score >= 70) return 'bg-cyan-500/20';
  if (score >= 50) return 'bg-yellow-500/20';
  return 'bg-red-500/20';
}

function getScoreGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

// ============================================================================
// Subcomponents
// ============================================================================

interface ScoreGaugeProps {
  score: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, label, size = 'md' }) => {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  const dimensions = {
    sm: { width: 60, strokeWidth: 6 },
    md: { width: 80, strokeWidth: 8 },
    lg: { width: 100, strokeWidth: 10 },
  };

  const { width, strokeWidth } = dimensions[size];

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width, height: width }}>
        <svg className="transform -rotate-90" style={{ width, height: width }}>
          {/* Background circle */}
          <circle
            cx={width / 2}
            cy={width / 2}
            r={40}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-700"
          />
          {/* Score circle */}
          <circle
            cx={width / 2}
            cy={width / 2}
            r={40}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={getScoreColor(score)}
            style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-mono font-bold', getScoreColor(score), {
            'text-lg': size === 'sm',
            'text-2xl': size === 'md',
            'text-3xl': size === 'lg',
          })}>
            {score}
          </span>
          <span className="font-mono text-[8px] text-slate-500 uppercase">
            {getScoreGrade(score)}
          </span>
        </div>
      </div>
      <span className="font-mono text-[10px] text-slate-500 mt-1">{label}</span>
    </div>
  );
};

interface CharacterScoreRowProps {
  score: CharacterStyleScore;
  onClick?: () => void;
}

const CharacterScoreRow: React.FC<CharacterScoreRowProps> = ({ score, onClick }) => {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: onClick ? 1.01 : 1 }}
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg border transition-all',
        score.needsRegeneration
          ? 'bg-red-500/5 border-red-500/30'
          : 'bg-slate-800/40 border-slate-700/50',
        onClick && 'cursor-pointer hover:border-slate-600'
      )}
    >
      {/* Status icon */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center',
        score.needsRegeneration ? 'bg-red-500/20' : 'bg-green-500/20'
      )}>
        {score.needsRegeneration ? (
          <AlertTriangle size={14} className="text-red-400" />
        ) : (
          <Check size={14} className="text-green-400" />
        )}
      </div>

      {/* Character name */}
      <div className="flex-1 min-w-0">
        <span className="font-mono text-xs text-slate-300 truncate block">
          {score.characterName}
        </span>
      </div>

      {/* Scores */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center">
          <span className={cn('font-mono text-xs', getScoreColor(score.colorScore))}>
            {score.colorScore}
          </span>
          <span className="font-mono text-[8px] text-slate-600">color</span>
        </div>
        <div className="flex flex-col items-center">
          <span className={cn('font-mono text-xs', getScoreColor(score.lightingScore))}>
            {score.lightingScore}
          </span>
          <span className="font-mono text-[8px] text-slate-600">light</span>
        </div>
        <div className="flex flex-col items-center">
          <span className={cn('font-mono text-xs', getScoreColor(score.artStyleScore))}>
            {score.artStyleScore}
          </span>
          <span className="font-mono text-[8px] text-slate-600">style</span>
        </div>
      </div>

      {/* Overall score */}
      <div className={cn(
        'px-2 py-1 rounded',
        getScoreBgColor(score.overallScore)
      )}>
        <span className={cn('font-mono text-sm font-bold', getScoreColor(score.overallScore))}>
          {score.overallScore}%
        </span>
      </div>
    </motion.div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const ConsistencyChecker: React.FC<ConsistencyCheckerProps> = ({
  report,
  styleDefinition,
  onRunAnalysis,
  onSelectCharacter,
  onApplyRecommendation,
  isAnalyzing = false,
  compact = false,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [expandedDeviation, setExpandedDeviation] = useState<number | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Filter deviations by severity
  const filteredDeviations = useMemo(() => {
    if (!report?.deviations) return [];
    if (filterSeverity === 'all') return report.deviations;
    return report.deviations.filter(d => d.severity === filterSeverity);
  }, [report?.deviations, filterSeverity]);

  // Sort characters by score
  const sortedCharacterScores = useMemo(() => {
    if (!report?.characterScores) return [];
    return [...report.characterScores].sort((a, b) => a.overallScore - b.overallScore);
  }, [report?.characterScores]);

  // Calculate deviation counts by severity
  const deviationCounts = useMemo(() => {
    if (!report?.deviations) return { high: 0, medium: 0, low: 0 };
    return {
      high: report.deviations.filter(d => d.severity === 'high').length,
      medium: report.deviations.filter(d => d.severity === 'medium').length,
      low: report.deviations.filter(d => d.severity === 'low').length,
    };
  }, [report?.deviations]);

  if (compact) {
    return (
      <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <h3 className="font-mono text-xs uppercase tracking-wide text-slate-300">
              consistency
            </h3>
          </div>
          {onRunAnalysis && (
            <button
              onClick={onRunAnalysis}
              disabled={isAnalyzing}
              className="p-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={isAnalyzing ? 'animate-spin' : ''} />
            </button>
          )}
        </div>

        {report ? (
          <div className="flex items-center justify-between">
            <div className={cn(
              'px-2 py-1 rounded',
              getScoreBgColor(report.overallConsistencyScore)
            )}>
              <span className={cn(
                'font-mono text-sm font-bold',
                getScoreColor(report.overallConsistencyScore)
              )}>
                {report.overallConsistencyScore}%
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              {deviationCounts.high > 0 && (
                <span className="text-red-400">{deviationCounts.high} high</span>
              )}
              {deviationCounts.medium > 0 && (
                <span className="text-orange-400">{deviationCounts.medium} med</span>
              )}
            </div>
          </div>
        ) : (
          <p className="font-mono text-[10px] text-slate-600">
            Run analysis to check consistency
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
            consistency_checker
          </h3>
        </div>

        {onRunAnalysis && (
          <button
            onClick={onRunAnalysis}
            disabled={isAnalyzing}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded transition-colors',
              'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <RefreshCw size={12} className={isAnalyzing ? 'animate-spin' : ''} />
            <span className="font-mono text-xs">
              {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
            </span>
          </button>
        )}
      </div>

      {/* No report state */}
      {!report && !isAnalyzing && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <Search size={32} className="mb-3 opacity-50" />
          <p className="font-mono text-sm mb-1">No analysis available</p>
          <p className="font-mono text-xs text-slate-600">
            Run an analysis to check style consistency
          </p>
        </div>
      )}

      {/* Loading state */}
      {isAnalyzing && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4" />
          <p className="font-mono text-sm text-slate-400">Analyzing character styles...</p>
        </div>
      )}

      {/* Report Content */}
      {report && !isAnalyzing && (
        <>
          {/* View Mode Tabs */}
          <div className="flex bg-slate-800/40 rounded-lg p-0.5 mb-4">
            {([
              { mode: 'overview' as const, label: 'Overview' },
              { mode: 'characters' as const, label: `Characters (${report.characterScores.length})` },
              { mode: 'deviations' as const, label: `Issues (${report.deviations.length})` },
              { mode: 'recommendations' as const, label: `Tips (${report.recommendations.length})` },
            ]).map(({ mode, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'flex-1 px-3 py-1.5 rounded font-mono text-xs transition-colors',
                  viewMode === mode
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-slate-500 hover:text-slate-300'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {viewMode === 'overview' && (
            <div className="space-y-4">
              {/* Score Gauges */}
              <div className="flex justify-around py-4">
                <ScoreGauge
                  score={report.overallConsistencyScore}
                  label="Overall"
                  size="lg"
                />
                <ScoreGauge
                  score={report.colorConsistencyScore}
                  label="Color"
                  size="md"
                />
                <ScoreGauge
                  score={report.lightingConsistencyScore}
                  label="Lighting"
                  size="md"
                />
                <ScoreGauge
                  score={report.artStyleConsistencyScore}
                  label="Art Style"
                  size="md"
                />
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50 text-center">
                  <span className="font-mono text-2xl text-slate-300">
                    {report.characterScores.length}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500 block">
                    Characters
                  </span>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30 text-center">
                  <span className="font-mono text-2xl text-green-400">
                    {report.characterScores.filter(c => !c.needsRegeneration).length}
                  </span>
                  <span className="font-mono text-[10px] text-green-400/70 block">
                    Consistent
                  </span>
                </div>
                <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30 text-center">
                  <span className="font-mono text-2xl text-red-400">
                    {report.characterScores.filter(c => c.needsRegeneration).length}
                  </span>
                  <span className="font-mono text-[10px] text-red-400/70 block">
                    Need Work
                  </span>
                </div>
              </div>

              {/* Deviation Summary */}
              {report.deviations.length > 0 && (
                <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                  <h4 className="font-mono text-[10px] text-slate-500 uppercase mb-2">
                    issues_by_severity
                  </h4>
                  <div className="flex gap-4">
                    {Object.entries(deviationCounts).map(([severity, count]) => {
                      const config = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG];
                      return (
                        <div key={severity} className="flex items-center gap-2">
                          <span className={cn('p-1 rounded border', config.color)}>
                            {config.icon}
                          </span>
                          <span className="font-mono text-xs text-slate-400">
                            {count} {config.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Characters Tab */}
          {viewMode === 'characters' && (
            <div className="space-y-2">
              {sortedCharacterScores.map((score) => (
                <CharacterScoreRow
                  key={score.characterId}
                  score={score}
                  onClick={onSelectCharacter ? () => onSelectCharacter(score.characterId) : undefined}
                />
              ))}
            </div>
          )}

          {/* Deviations Tab */}
          {viewMode === 'deviations' && (
            <div className="space-y-3">
              {/* Severity Filter */}
              <div className="flex gap-2">
                {(['all', 'high', 'medium', 'low'] as const).map((severity) => (
                  <button
                    key={severity}
                    onClick={() => setFilterSeverity(severity)}
                    className={cn(
                      'px-2 py-1 rounded font-mono text-[10px] transition-colors',
                      filterSeverity === severity
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-slate-800/40 text-slate-500 hover:text-slate-300'
                    )}
                  >
                    {severity === 'all' ? 'All' : SEVERITY_CONFIG[severity].label}
                    {severity !== 'all' && ` (${deviationCounts[severity]})`}
                  </button>
                ))}
              </div>

              {/* Deviation List */}
              {filteredDeviations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                  <CheckCircle size={24} className="mb-2 text-green-400" />
                  <p className="font-mono text-xs">No deviations found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDeviations.map((deviation, index) => {
                    const severityConfig = SEVERITY_CONFIG[deviation.severity];
                    const typeConfig = DEVIATION_TYPE_CONFIG[deviation.deviationType];
                    const isExpanded = expandedDeviation === index;

                    return (
                      <motion.div
                        key={index}
                        className={cn(
                          'p-3 rounded-lg border transition-colors',
                          severityConfig.color.replace('text-', 'bg-').replace('/20', '/5'),
                          'border-slate-700/50'
                        )}
                      >
                        <button
                          onClick={() => setExpandedDeviation(isExpanded ? null : index)}
                          className="w-full flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className={cn('p-1 rounded border', severityConfig.color)}>
                              {severityConfig.icon}
                            </span>
                            <span className={typeConfig.color}>{typeConfig.icon}</span>
                            <span className="font-mono text-xs text-slate-300">
                              {deviation.characterName}
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp size={14} className="text-slate-500" />
                          ) : (
                            <ChevronDown size={14} className="text-slate-500" />
                          )}
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-2 pt-2 border-t border-slate-700/30"
                            >
                              <p className="font-mono text-[10px] text-slate-400 mb-2">
                                {deviation.description}
                              </p>
                              <div className="p-2 bg-slate-800/40 rounded">
                                <span className="font-mono text-[9px] text-cyan-400 uppercase block mb-1">
                                  suggestion
                                </span>
                                <p className="font-mono text-[10px] text-slate-300">
                                  {deviation.suggestion}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Recommendations Tab */}
          {viewMode === 'recommendations' && (
            <div className="space-y-3">
              {report.recommendations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                  <CheckCircle size={24} className="mb-2 text-green-400" />
                  <p className="font-mono text-xs">No recommendations - styles are consistent!</p>
                </div>
              ) : (
                report.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={cn(
                      'p-3 rounded-lg border',
                      rec.priority === 'high'
                        ? 'bg-red-500/5 border-red-500/30'
                        : rec.priority === 'medium'
                        ? 'bg-yellow-500/5 border-yellow-500/30'
                        : 'bg-slate-800/40 border-slate-700/50'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'px-1.5 py-0.5 rounded text-[9px] font-mono uppercase',
                          rec.type === 'regenerate'
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : rec.type === 'adjust'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-purple-500/20 text-purple-400'
                        )}>
                          {rec.type}
                        </span>
                        <span className={cn(
                          'px-1.5 py-0.5 rounded text-[9px] font-mono uppercase',
                          rec.priority === 'high'
                            ? 'bg-red-500/20 text-red-400'
                            : rec.priority === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-slate-600/20 text-slate-400'
                        )}>
                          {rec.priority}
                        </span>
                      </div>
                      {onApplyRecommendation && (
                        <button
                          onClick={() => onApplyRecommendation(rec)}
                          className="px-2 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30
                                     text-cyan-400 font-mono text-[10px] transition-colors"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                    <p className="font-mono text-xs text-slate-300">{rec.description}</p>
                    <p className="font-mono text-[10px] text-slate-500 mt-1">
                      Affects {rec.characterIds.length} character{rec.characterIds.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Analysis timestamp */}
          <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between">
            <span className="font-mono text-[10px] text-slate-600">
              Analyzed: {new Date(report.analyzedAt).toLocaleString()}
            </span>
            {styleDefinition && (
              <span className="font-mono text-[10px] text-slate-600">
                Style: {styleDefinition.name}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ConsistencyChecker;
