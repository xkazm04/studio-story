'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Layers,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  PieChart,
  Activity,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type {
  Theme,
  ThemeCoverage,
  ThematicBalance,
  PremiseFulfillment,
  BalanceRecommendation,
  FulfillmentIssue,
  FulfillmentMilestone,
  ThemeGap,
} from '@/lib/themes/ThemeTracker';

// ===== TYPES =====

interface ThematicAnalysisProps {
  themes: Theme[];
  coverageData: Map<string, ThemeCoverage>;
  balance: ThematicBalance;
  fulfillment: PremiseFulfillment;
  sceneCount: number;
  onThemeClick?: (themeId: string) => void;
  onGapClick?: (themeId: string, gap: ThemeGap) => void;
  compact?: boolean;
}

type AnalysisTab = 'coverage' | 'balance' | 'fulfillment';

// ===== SUBCOMPONENTS =====

// Score Ring
function ScoreRing({
  score,
  size = 80,
  strokeWidth = 8,
  label,
  sublabel,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getScoreColor = (s: number) => {
    if (s >= 75) return 'text-emerald-400';
    if (s >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const getStrokeColor = (s: number) => {
    if (s >= 75) return 'stroke-emerald-400';
    if (s >= 50) return 'stroke-amber-400';
    return 'stroke-red-400';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            className="stroke-slate-700"
            fill="none"
            strokeWidth={strokeWidth}
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <motion.circle
            className={cn('transition-colors', getStrokeColor(score))}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('text-xl font-bold', getScoreColor(score))}>
            {score}
          </span>
        </div>
      </div>
      {label && (
        <span className="mt-1 text-xs font-medium text-slate-300">{label}</span>
      )}
      {sublabel && (
        <span className="text-xs text-slate-500">{sublabel}</span>
      )}
    </div>
  );
}

// Coverage Bar
function CoverageBar({
  coverage,
  onClick,
}: {
  coverage: ThemeCoverage;
  onClick?: () => void;
}) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'primary': return 'bg-violet-500';
      case 'secondary': return 'bg-blue-500';
      case 'motif': return 'bg-cyan-500';
      default: return 'bg-slate-500';
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'primary': return 'P';
      case 'secondary': return 'S';
      case 'motif': return 'M';
      default: return '?';
    }
  };

  return (
    <motion.div
      className={cn(
        'p-3 rounded-lg bg-slate-800/50 border border-slate-700/50',
        onClick && 'cursor-pointer hover:border-slate-600 transition-colors'
      )}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.01 } : undefined}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'w-5 h-5 rounded text-xs font-bold flex items-center justify-center text-white',
              getLevelColor(coverage.level)
            )}
          >
            {getLevelBadge(coverage.level)}
          </span>
          <span className="text-sm font-medium text-slate-200">
            {coverage.themeName}
          </span>
        </div>
        <span className="text-sm font-mono text-slate-400">
          {Math.round(coverage.coveragePercentage)}%
        </span>
      </div>

      {/* Coverage bar */}
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
        <motion.div
          className={cn('h-full rounded-full', getLevelColor(coverage.level))}
          initial={{ width: 0 }}
          animate={{ width: `${coverage.coveragePercentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span title="Scenes with this theme">
          {coverage.sceneCount} scenes
        </span>
        <span className="text-slate-600">|</span>
        <span title="Distribution score">
          Dist: {coverage.distributionScore}%
        </span>
        {coverage.gaps.length > 0 && (
          <>
            <span className="text-slate-600">|</span>
            <span className="text-amber-400" title="Gaps in coverage">
              {coverage.gaps.length} gap{coverage.gaps.length !== 1 ? 's' : ''}
            </span>
          </>
        )}
      </div>

      {/* Relevance breakdown */}
      <div className="flex items-center gap-1 mt-2">
        {coverage.strongOccurrences > 0 && (
          <span className="px-1.5 py-0.5 text-xs rounded bg-emerald-500/20 text-emerald-400">
            {coverage.strongOccurrences} strong
          </span>
        )}
        {coverage.moderateOccurrences > 0 && (
          <span className="px-1.5 py-0.5 text-xs rounded bg-blue-500/20 text-blue-400">
            {coverage.moderateOccurrences} moderate
          </span>
        )}
        {coverage.subtleOccurrences > 0 && (
          <span className="px-1.5 py-0.5 text-xs rounded bg-slate-500/20 text-slate-400">
            {coverage.subtleOccurrences} subtle
          </span>
        )}
        {coverage.implicitOccurrences > 0 && (
          <span className="px-1.5 py-0.5 text-xs rounded bg-slate-600/20 text-slate-500">
            {coverage.implicitOccurrences} implicit
          </span>
        )}
      </div>
    </motion.div>
  );
}

// Gap Visualization
function GapVisualization({
  coverage,
  sceneCount,
  onGapClick,
}: {
  coverage: ThemeCoverage;
  sceneCount: number;
  onGapClick?: (gap: ThemeGap) => void;
}) {
  if (coverage.gaps.length === 0) return null;

  return (
    <div className="mt-2 p-2 rounded bg-slate-900/50">
      <div className="text-xs text-slate-500 mb-2">Coverage gaps:</div>
      <div className="flex h-6 rounded overflow-hidden bg-slate-800">
        {Array.from({ length: sceneCount }).map((_, idx) => {
          const inGap = coverage.gaps.some(
            g => idx >= g.startSceneIndex && idx <= g.endSceneIndex
          );
          const gap = coverage.gaps.find(
            g => idx >= g.startSceneIndex && idx <= g.endSceneIndex
          );

          return (
            <div
              key={idx}
              className={cn(
                'flex-1 border-r border-slate-700/50 last:border-r-0 transition-colors',
                inGap
                  ? gap?.severity === 'significant'
                    ? 'bg-red-500/30 hover:bg-red-500/50'
                    : gap?.severity === 'moderate'
                    ? 'bg-amber-500/30 hover:bg-amber-500/50'
                    : 'bg-yellow-500/20 hover:bg-yellow-500/40'
                  : 'bg-emerald-500/30'
              )}
              onClick={() => gap && onGapClick?.(gap)}
              title={`Scene ${idx + 1}${inGap ? ' (gap)' : ''}`}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-500/30" />
          Covered
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-500/30" />
          Gap
        </span>
      </div>
    </div>
  );
}

// Recommendation Card
function RecommendationCard({
  recommendation,
  onThemeClick,
}: {
  recommendation: BalanceRecommendation;
  onThemeClick?: (themeId: string) => void;
}) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500/50 bg-red-500/5';
      case 'medium': return 'border-amber-500/50 bg-amber-500/5';
      case 'low': return 'border-slate-500/50 bg-slate-500/5';
      default: return 'border-slate-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'add_theme': return <Sparkles className="w-4 h-4" />;
      case 'strengthen_theme': return <TrendingUp className="w-4 h-4" />;
      case 'distribute_theme': return <Activity className="w-4 h-4" />;
      case 'reduce_theme': return <AlertTriangle className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      className={cn(
        'p-3 rounded-lg border',
        getPriorityColor(recommendation.priority)
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start gap-2">
        <span className="text-slate-400 mt-0.5">
          {getTypeIcon(recommendation.type)}
        </span>
        <div className="flex-1">
          <p className="text-sm text-slate-300">{recommendation.message}</p>
          {recommendation.sceneRange && (
            <p className="text-xs text-slate-500 mt-1">
              Scenes {recommendation.sceneRange.start + 1} -{' '}
              {recommendation.sceneRange.end + 1}
            </p>
          )}
          {recommendation.themeId && (
            <button
              className="text-xs text-violet-400 hover:text-violet-300 mt-1"
              onClick={() => onThemeClick?.(recommendation.themeId!)}
            >
              View theme &rarr;
            </button>
          )}
        </div>
        <span
          className={cn(
            'px-1.5 py-0.5 text-xs rounded font-medium',
            recommendation.priority === 'high'
              ? 'bg-red-500/20 text-red-400'
              : recommendation.priority === 'medium'
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-slate-500/20 text-slate-400'
          )}
        >
          {recommendation.priority}
        </span>
      </div>
    </motion.div>
  );
}

// Milestone Item
function MilestoneItem({ milestone }: { milestone: FulfillmentMilestone }) {
  return (
    <div className="flex items-center gap-3 py-2">
      {milestone.achieved ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-slate-600 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium',
            milestone.achieved ? 'text-slate-300' : 'text-slate-500'
          )}
        >
          {milestone.name}
        </p>
        <p className="text-xs text-slate-500 truncate">{milestone.description}</p>
      </div>
    </div>
  );
}

// Issue Card
function IssueCard({ issue }: { issue: FulfillmentIssue }) {
  const [expanded, setExpanded] = useState(false);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'missing': return 'Missing';
      case 'underdeveloped': return 'Underdeveloped';
      case 'inconsistent': return 'Inconsistent';
      case 'unresolved': return 'Unresolved';
      default: return type;
    }
  };

  return (
    <div className="p-3 rounded-lg bg-slate-800/50 border border-amber-500/30">
      <button
        className="w-full flex items-center justify-between text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-slate-300">{issue.message}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
            {getTypeLabel(issue.type)}
          </span>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-slate-700">
              <p className="text-xs text-slate-500 mb-2">Suggestions:</p>
              <ul className="space-y-1">
                {issue.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="text-violet-400 mt-0.5">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Component Score Bar
function ComponentScoreBar({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  const getScoreColor = (s: number) => {
    if (s >= 75) return 'bg-emerald-500';
    if (s >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 font-mono">{score}%</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', getScoreColor(score))}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ===== MAIN COMPONENT =====

export function ThematicAnalysis({
  themes,
  coverageData,
  balance,
  fulfillment,
  sceneCount,
  onThemeClick,
  onGapClick,
  compact = false,
}: ThematicAnalysisProps) {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('coverage');
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  // Filter coverage data by level
  const filteredCoverage = useMemo(() => {
    const coverages = Array.from(coverageData.values());
    if (!selectedLevel) return coverages;
    return coverages.filter(c => c.level === selectedLevel);
  }, [coverageData, selectedLevel]);

  // Sort by coverage percentage
  const sortedCoverage = useMemo(() => {
    return [...filteredCoverage].sort(
      (a, b) => b.coveragePercentage - a.coveragePercentage
    );
  }, [filteredCoverage]);

  const tabs: { id: AnalysisTab; label: string; icon: React.ReactNode }[] = [
    { id: 'coverage', label: 'Coverage', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'balance', label: 'Balance', icon: <PieChart className="w-4 h-4" /> },
    { id: 'fulfillment', label: 'Fulfillment', icon: <Target className="w-4 h-4" /> },
  ];

  if (compact) {
    // Compact view - just show overall scores
    return (
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-200">Thematic Analysis</h3>
          <Activity className="w-4 h-4 text-slate-500" />
        </div>
        <div className="flex items-center justify-around">
          <ScoreRing score={balance.overallScore} size={60} label="Balance" />
          <ScoreRing score={fulfillment.overallScore} size={60} label="Fulfillment" />
        </div>
        {balance.recommendations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-700">
            <p className="text-xs text-slate-500">
              {balance.recommendations.filter(r => r.priority === 'high').length} high priority recommendations
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-lg">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-slate-700 text-slate-200'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'coverage' && (
          <motion.div
            key="coverage"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Level Filter */}
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" />
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedLevel(null)}
                  className={cn(
                    'px-2 py-1 text-xs rounded transition-colors',
                    !selectedLevel
                      ? 'bg-slate-700 text-slate-200'
                      : 'text-slate-400 hover:text-slate-300'
                  )}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedLevel('primary')}
                  className={cn(
                    'px-2 py-1 text-xs rounded transition-colors',
                    selectedLevel === 'primary'
                      ? 'bg-violet-500/20 text-violet-400'
                      : 'text-slate-400 hover:text-slate-300'
                  )}
                >
                  Primary
                </button>
                <button
                  onClick={() => setSelectedLevel('secondary')}
                  className={cn(
                    'px-2 py-1 text-xs rounded transition-colors',
                    selectedLevel === 'secondary'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-slate-400 hover:text-slate-300'
                  )}
                >
                  Secondary
                </button>
                <button
                  onClick={() => setSelectedLevel('motif')}
                  className={cn(
                    'px-2 py-1 text-xs rounded transition-colors',
                    selectedLevel === 'motif'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-slate-400 hover:text-slate-300'
                  )}
                >
                  Motifs
                </button>
              </div>
            </div>

            {/* Coverage List */}
            {sortedCoverage.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No themes to analyze</p>
                <p className="text-xs mt-1">Add themes to see coverage analysis</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedCoverage.map(coverage => (
                  <div key={coverage.themeId}>
                    <CoverageBar
                      coverage={coverage}
                      onClick={() => onThemeClick?.(coverage.themeId)}
                    />
                    <GapVisualization
                      coverage={coverage}
                      sceneCount={sceneCount}
                      onGapClick={gap => onGapClick?.(coverage.themeId, gap)}
                    />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'balance' && (
          <motion.div
            key="balance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Overall Score */}
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-1">
                    Thematic Balance
                  </h3>
                  <p className="text-xs text-slate-500">
                    How well themes are distributed across your story
                  </p>
                </div>
                <ScoreRing score={balance.overallScore} size={80} />
              </div>

              {/* Level breakdown */}
              <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-violet-400">
                    {balance.primaryThemesCoverage}%
                  </div>
                  <div className="text-xs text-slate-500">Primary</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">
                    {balance.secondaryThemesCoverage}%
                  </div>
                  <div className="text-xs text-slate-500">Secondary</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-cyan-400">
                    {balance.motifsCoverage}%
                  </div>
                  <div className="text-xs text-slate-500">Motifs</div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {balance.recommendations.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-medium text-slate-300">
                    Recommendations ({balance.recommendations.length})
                  </h4>
                </div>
                {balance.recommendations.map((rec, idx) => (
                  <RecommendationCard
                    key={idx}
                    recommendation={rec}
                    onThemeClick={onThemeClick}
                  />
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                <p className="text-emerald-400 font-medium">Well balanced!</p>
                <p className="text-xs mt-1">Your themes are well distributed</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'fulfillment' && (
          <motion.div
            key="fulfillment"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Overall Fulfillment Score */}
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-1">
                    Premise Fulfillment
                  </h3>
                  <p className="text-xs text-slate-500">
                    How well your story delivers on its premise
                  </p>
                </div>
                <ScoreRing score={fulfillment.overallScore} size={80} />
              </div>

              {/* Component scores */}
              <div className="space-y-3 pt-4 border-t border-slate-700">
                <ComponentScoreBar
                  label="Protagonist Development"
                  score={fulfillment.componentScores.protagonistDevelopment}
                />
                <ComponentScoreBar
                  label="Goal Pursuit"
                  score={fulfillment.componentScores.goalPursuit}
                />
                <ComponentScoreBar
                  label="Motivation Exploration"
                  score={fulfillment.componentScores.motivationExploration}
                />
                <ComponentScoreBar
                  label="Stakes Escalation"
                  score={fulfillment.componentScores.stakesEscalation}
                />
                <ComponentScoreBar
                  label="Conflict Resolution"
                  score={fulfillment.componentScores.conflictResolution}
                />
              </div>
            </div>

            {/* Milestones */}
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <h4 className="text-sm font-semibold text-slate-200 mb-3">
                Story Milestones
              </h4>
              <div className="space-y-1">
                {fulfillment.milestones.map(milestone => (
                  <MilestoneItem key={milestone.id} milestone={milestone} />
                ))}
              </div>
            </div>

            {/* Issues */}
            {fulfillment.issues.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-medium text-slate-300">
                    Areas to Address ({fulfillment.issues.length})
                  </h4>
                </div>
                {fulfillment.issues.map((issue, idx) => (
                  <IssueCard key={idx} issue={issue} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ThematicAnalysis;
