'use client';

/**
 * NarrativeAnalyticsDashboard
 *
 * Central analysis view for comprehensive story health assessment.
 * Aggregates structure, pacing, character, theme, and engagement metrics.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Activity,
  Users,
  Palette,
  Heart,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Target,
  BookOpen,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Lightbulb,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/UI/Button';

import {
  structureAnalyzer,
  pacingAnalyzer,
  characterArcAnalyzer,
  thematicAnalyzer,
  engagementSimulator,
  type StructureAnalysisResult,
  type PacingAnalysisResult,
  type CharacterAnalysisResult,
  type ThematicAnalysisResult,
  type ReaderExperienceReport,
  type StructureTemplate,
  type Genre,
} from '@/lib/analytics';

import type { Act } from '@/app/types/Act';
import type { Beat } from '@/app/types/Beat';
import type { Scene } from '@/app/types/Scene';
import type { Character } from '@/app/types/Character';

// ============================================================================
// Types
// ============================================================================

interface NarrativeAnalyticsDashboardProps {
  acts: Act[];
  beats: Beat[];
  scenes: Scene[];
  characters: Character[];
  structureTemplate?: StructureTemplate;
  genre?: Genre;
  onNavigateToScene?: (sceneId: string) => void;
  onNavigateToCharacter?: (characterId: string) => void;
}

interface AnalysisResults {
  structure: StructureAnalysisResult;
  pacing: PacingAnalysisResult;
  characters: CharacterAnalysisResult;
  themes: ThematicAnalysisResult;
  engagement: ReaderExperienceReport;
}

// ============================================================================
// Health Score Component
// ============================================================================

interface HealthScoreProps {
  score: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

const HealthScore: React.FC<HealthScoreProps> = ({ score, label, size = 'md' }) => {
  const getColor = (s: number) => {
    if (s >= 80) return { bg: 'bg-emerald-500', text: 'text-emerald-400', ring: 'ring-emerald-500/30' };
    if (s >= 60) return { bg: 'bg-cyan-500', text: 'text-cyan-400', ring: 'ring-cyan-500/30' };
    if (s >= 40) return { bg: 'bg-amber-500', text: 'text-amber-400', ring: 'ring-amber-500/30' };
    return { bg: 'bg-red-500', text: 'text-red-400', ring: 'ring-red-500/30' };
  };

  const colors = getColor(score);
  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-lg',
    lg: 'w-24 h-24 text-2xl',
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={cn(
          'relative rounded-full flex items-center justify-center ring-4 bg-slate-900',
          colors.ring,
          sizeClasses[size]
        )}
      >
        <span className={cn('font-bold font-mono', colors.text)}>{score}</span>
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-slate-800"
          />
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${score}, 100`}
            strokeLinecap="round"
            className={colors.text}
          />
        </svg>
      </div>
      <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
  );
};

// ============================================================================
// Section Component
// ============================================================================

interface SectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  score: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({
  title,
  icon: Icon,
  score,
  isExpanded,
  onToggle,
  children,
  badge,
}) => {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-emerald-400';
    if (s >= 60) return 'text-cyan-400';
    if (s >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/50">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
            <Icon className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-sm font-medium text-slate-200">{title}</span>
          {badge}
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('text-sm font-mono font-bold', getScoreColor(score))}>
            {score}
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-slate-800/50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// Issue List Component
// ============================================================================

interface Issue {
  message: string;
  severity: 'critical' | 'warning' | 'info';
  suggestion?: string;
}

interface IssueListProps {
  issues: Issue[];
  maxVisible?: number;
}

const IssueList: React.FC<IssueListProps> = ({ issues, maxVisible = 5 }) => {
  const [showAll, setShowAll] = useState(false);
  const displayedIssues = showAll ? issues : issues.slice(0, maxVisible);

  const getSeverityIcon = (severity: Issue['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-3.5 h-3.5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Info className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  if (issues.length === 0) {
    return (
      <div className="flex items-center gap-2 text-emerald-400 text-xs">
        <CheckCircle2 className="w-4 h-4" />
        <span>No issues detected</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {displayedIssues.map((issue, i) => (
        <div
          key={i}
          className={cn(
            'flex items-start gap-2 text-xs p-2 rounded-md',
            issue.severity === 'critical' && 'bg-red-500/10 border border-red-500/20',
            issue.severity === 'warning' && 'bg-amber-500/10 border border-amber-500/20',
            issue.severity === 'info' && 'bg-slate-800/50'
          )}
        >
          <div className="mt-0.5">{getSeverityIcon(issue.severity)}</div>
          <div className="flex-1">
            <p className="text-slate-300">{issue.message}</p>
            {issue.suggestion && (
              <p className="text-slate-500 mt-1 italic">{issue.suggestion}</p>
            )}
          </div>
        </div>
      ))}
      {issues.length > maxVisible && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          {showAll ? 'Show less' : `Show ${issues.length - maxVisible} more`}
        </button>
      )}
    </div>
  );
};

// ============================================================================
// Tension Curve Visualization
// ============================================================================

interface TensionCurveProps {
  points: { position: number; tension: number }[];
}

const TensionCurve: React.FC<TensionCurveProps> = ({ points }) => {
  if (points.length === 0) return <div className="h-20 bg-slate-800/50 rounded" />;

  const pathD = points
    .map((p, i) => {
      const x = p.position * 100;
      const y = 100 - p.tension;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className="h-24 relative">
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        {/* Grid lines */}
        <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.5" className="text-slate-700" />
        <line x1="25" y1="0" x2="25" y2="100" stroke="currentColor" strokeWidth="0.5" className="text-slate-700" />
        <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="0.5" className="text-slate-700" />
        <line x1="75" y1="0" x2="75" y2="100" stroke="currentColor" strokeWidth="0.5" className="text-slate-700" />

        {/* Tension curve */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#tensionGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="tensionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
      </svg>

      {/* Labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[9px] text-slate-600">
        <span>Start</span>
        <span>Mid</span>
        <span>End</span>
      </div>
    </div>
  );
};

// ============================================================================
// Main Dashboard Component
// ============================================================================

const NarrativeAnalyticsDashboard: React.FC<NarrativeAnalyticsDashboardProps> = ({
  acts,
  beats,
  scenes,
  characters,
  structureTemplate = 'three-act',
  genre,
  onNavigateToScene,
  onNavigateToCharacter,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Run all analyses
  const results = useMemo<AnalysisResults | null>(() => {
    if (scenes.length === 0 && beats.length === 0) return null;

    setIsAnalyzing(true);

    try {
      const structure = structureAnalyzer.analyzeStructure(acts, beats, scenes, structureTemplate);
      const pacing = pacingAnalyzer.analyzePacing(beats, scenes, genre);
      const charAnalysis = characterArcAnalyzer.analyzeCharacters(characters, scenes, beats);
      const themes = thematicAnalyzer.analyzeThemes(scenes, beats);
      const engagement = engagementSimulator.simulateEngagement(scenes, beats);

      return { structure, pacing, characters: charAnalysis, themes, engagement };
    } finally {
      setIsAnalyzing(false);
    }
  }, [acts, beats, scenes, characters, structureTemplate, genre]);

  // Calculate overall story health
  const storyHealth = useMemo(() => {
    if (!results) return 0;

    return Math.round(
      results.structure.overallScore * 0.2 +
      results.pacing.pacingScore * 0.2 +
      results.characters.overallScore * 0.2 +
      results.themes.thematicScore * 0.2 +
      results.engagement.overallEngagement * 0.2
    );
  }, [results]);

  // Aggregate all recommendations
  const allRecommendations = useMemo(() => {
    if (!results) return [];

    return [
      ...results.structure.recommendations,
      ...results.pacing.recommendations,
      ...results.characters.recommendations,
      ...results.themes.recommendations,
      ...results.engagement.recommendations,
    ].slice(0, 8);
  }, [results]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  if (isAnalyzing) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-sm text-slate-400">Analyzing story...</span>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Add scenes or beats to analyze your story</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Header with Overall Health */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-800 rounded-xl p-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Story Health
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Comprehensive narrative analysis
            </p>
          </div>
          <HealthScore score={storyHealth} label="Overall" size="lg" />
        </div>

        {/* Mini scores */}
        <div className="mt-4 grid grid-cols-5 gap-2">
          <HealthScore score={results.structure.overallScore} label="Structure" size="sm" />
          <HealthScore score={results.pacing.pacingScore} label="Pacing" size="sm" />
          <HealthScore score={results.characters.overallScore} label="Characters" size="sm" />
          <HealthScore score={results.themes.thematicScore} label="Themes" size="sm" />
          <HealthScore score={results.engagement.overallEngagement} label="Engagement" size="sm" />
        </div>
      </motion.div>

      {/* Key Recommendations */}
      {allRecommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4"
        >
          <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4" />
            Top Recommendations
          </h3>
          <ul className="space-y-2">
            {allRecommendations.slice(0, 4).map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                <ChevronRight className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Analysis Sections */}
      <div className="space-y-3">
        {/* Structure Analysis */}
        <Section
          title="Structure Analysis"
          icon={BarChart3}
          score={results.structure.overallScore}
          isExpanded={expandedSections.has('structure')}
          onToggle={() => toggleSection('structure')}
          badge={
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              {results.structure.templateName}
            </span>
          }
        >
          <div className="space-y-4">
            {/* Act breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Act Balance
              </h4>
              {results.structure.actAnalyses.map(act => (
                <div key={act.actId} className="flex items-center gap-2">
                  <span className="text-xs text-slate-300 w-24 truncate">{act.actName}</span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${act.percentageOfTotal}%` }}
                      transition={{ duration: 0.5 }}
                      className={cn(
                        'h-full rounded-full',
                        act.isBalanced ? 'bg-cyan-500' : 'bg-amber-500'
                      )}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 w-12 text-right">
                    {act.percentageOfTotal.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>

            {/* Issues */}
            <div>
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Issues
              </h4>
              <IssueList
                issues={results.structure.issues.map(i => ({
                  message: i.message,
                  severity: i.severity,
                  suggestion: i.suggestion,
                }))}
              />
            </div>
          </div>
        </Section>

        {/* Pacing Analysis */}
        <Section
          title="Pacing Analysis"
          icon={Activity}
          score={results.pacing.pacingScore}
          isExpanded={expandedSections.has('pacing')}
          onToggle={() => toggleSection('pacing')}
          badge={
            genre && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 capitalize">
                {genre}
              </span>
            )
          }
        >
          <div className="space-y-4">
            {/* Tension curve */}
            <div>
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Tension Curve
              </h4>
              <TensionCurve points={results.pacing.tensionCurve.points} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                <div className="text-lg font-mono font-bold text-cyan-400">
                  {Math.round(results.pacing.tensionCurve.averageTension)}
                </div>
                <div className="text-[9px] text-slate-500 uppercase">Avg Tension</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                <div className="text-lg font-mono font-bold text-purple-400">
                  {Math.round(results.pacing.tensionCurve.peakTension)}
                </div>
                <div className="text-[9px] text-slate-500 uppercase">Peak</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                <div className="text-lg font-mono font-bold text-amber-400">
                  {Math.round(results.pacing.tensionCurve.peakPosition * 100)}%
                </div>
                <div className="text-[9px] text-slate-500 uppercase">Climax Position</div>
              </div>
            </div>

            {/* Issues */}
            <div>
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Issues
              </h4>
              <IssueList
                issues={results.pacing.issues.map(i => ({
                  message: i.message,
                  severity: i.severity,
                  suggestion: i.suggestion,
                }))}
              />
            </div>
          </div>
        </Section>

        {/* Character Analysis */}
        <Section
          title="Character Analysis"
          icon={Users}
          score={results.characters.overallScore}
          isExpanded={expandedSections.has('characters')}
          onToggle={() => toggleSection('characters')}
          badge={
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              {characters.length} characters
            </span>
          }
        >
          <div className="space-y-4">
            {/* Screen time */}
            <div>
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Screen Time
              </h4>
              <div className="space-y-2">
                {results.characters.screenTimeAnalysis.slice(0, 5).map(st => (
                  <div key={st.characterId} className="flex items-center gap-2">
                    <span className="text-xs text-slate-300 w-24 truncate">{st.characterName}</span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${st.percentageOfScenes}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full rounded-full bg-cyan-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 w-12 text-right">
                      {st.percentageOfScenes.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Character arcs */}
            <div>
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Character Arcs
              </h4>
              <div className="flex flex-wrap gap-2">
                {results.characters.arcs.slice(0, 5).map(arc => (
                  <button
                    key={arc.characterId}
                    onClick={() => onNavigateToCharacter?.(arc.characterId)}
                    className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/50 rounded text-xs hover:bg-slate-700/50 transition-colors"
                  >
                    <span className="text-slate-300">{arc.characterName}</span>
                    <span className={cn(
                      'text-[9px] px-1 py-0.5 rounded capitalize',
                      arc.arcType === 'growth' && 'bg-emerald-500/20 text-emerald-400',
                      arc.arcType === 'fall' && 'bg-red-500/20 text-red-400',
                      arc.arcType === 'redemption' && 'bg-purple-500/20 text-purple-400',
                      arc.arcType === 'flat' && 'bg-slate-600/50 text-slate-400',
                      arc.arcType === 'undefined' && 'bg-slate-700 text-slate-500'
                    )}>
                      {arc.arcType}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Issues */}
            <div>
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Consistency Issues
              </h4>
              <IssueList
                issues={results.characters.consistencyIssues.map(i => ({
                  message: i.message,
                  severity: i.severity,
                  suggestion: i.suggestion,
                }))}
              />
            </div>
          </div>
        </Section>

        {/* Theme Analysis */}
        <Section
          title="Thematic Analysis"
          icon={Palette}
          score={results.themes.thematicScore}
          isExpanded={expandedSections.has('themes')}
          onToggle={() => toggleSection('themes')}
          badge={
            results.themes.primaryTheme && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                {results.themes.primaryTheme.themeName}
              </span>
            )
          }
        >
          <div className="space-y-4">
            {/* Theme presence */}
            <div>
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Detected Themes
              </h4>
              <div className="flex flex-wrap gap-2">
                {results.themes.detectedThemes.slice(0, 6).map((theme, i) => (
                  <div
                    key={theme.themeId}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1 rounded text-xs',
                      i === 0 ? 'bg-purple-500/20 text-purple-300' :
                      i < 3 ? 'bg-cyan-500/10 text-cyan-400' :
                      'bg-slate-800/50 text-slate-400'
                    )}
                  >
                    <span>{theme.themeName}</span>
                    <span className={cn(
                      'text-[9px]',
                      theme.trajectory === 'increasing' && 'text-emerald-400',
                      theme.trajectory === 'decreasing' && 'text-amber-400',
                      theme.trajectory === 'fluctuating' && 'text-purple-400',
                      theme.trajectory === 'steady' && 'text-slate-500'
                    )}>
                      {theme.trajectory === 'increasing' && <TrendingUp className="w-3 h-3" />}
                      {theme.trajectory === 'decreasing' && <TrendingDown className="w-3 h-3" />}
                      {theme.trajectory === 'steady' && <Minus className="w-3 h-3" />}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                <div className="text-lg font-mono font-bold text-cyan-400">
                  {results.themes.coherenceScore}
                </div>
                <div className="text-[9px] text-slate-500 uppercase">Coherence</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                <div className="text-lg font-mono font-bold text-purple-400">
                  {results.themes.developmentScore}
                </div>
                <div className="text-[9px] text-slate-500 uppercase">Development</div>
              </div>
            </div>

            {/* Issues */}
            <div>
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Thematic Issues
              </h4>
              <IssueList
                issues={results.themes.issues.map(i => ({
                  message: i.message,
                  severity: i.severity,
                  suggestion: i.suggestion,
                }))}
              />
            </div>
          </div>
        </Section>

        {/* Engagement Analysis */}
        <Section
          title="Reader Engagement"
          icon={Heart}
          score={results.engagement.overallEngagement}
          isExpanded={expandedSections.has('engagement')}
          onToggle={() => toggleSection('engagement')}
          badge={
            <span className={cn(
              'text-[10px] px-1.5 py-0.5 rounded',
              results.engagement.retentionPrediction.finishProbability >= 0.7 && 'bg-emerald-500/20 text-emerald-400',
              results.engagement.retentionPrediction.finishProbability >= 0.4 && results.engagement.retentionPrediction.finishProbability < 0.7 && 'bg-amber-500/20 text-amber-400',
              results.engagement.retentionPrediction.finishProbability < 0.4 && 'bg-red-500/20 text-red-400'
            )}>
              {Math.round(results.engagement.retentionPrediction.finishProbability * 100)}% retention
            </span>
          }
        >
          <div className="space-y-4">
            {/* Engagement curve summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                <div className="text-lg font-mono font-bold text-cyan-400">
                  {results.engagement.hooks.length}
                </div>
                <div className="text-[9px] text-slate-500 uppercase">Hooks</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                <div className="text-lg font-mono font-bold text-purple-400">
                  {results.engagement.payoffs.length}
                </div>
                <div className="text-[9px] text-slate-500 uppercase">Payoffs</div>
              </div>
            </div>

            {/* Pacing assessment */}
            <div className="bg-slate-800/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  'text-xs font-medium capitalize',
                  results.engagement.pacingAssessment.overall === 'good' && 'text-emerald-400',
                  results.engagement.pacingAssessment.overall === 'too-slow' && 'text-amber-400',
                  results.engagement.pacingAssessment.overall === 'too-fast' && 'text-orange-400',
                  results.engagement.pacingAssessment.overall === 'inconsistent' && 'text-purple-400'
                )}>
                  Pacing: {results.engagement.pacingAssessment.overall.replace('-', ' ')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {results.engagement.pacingAssessment.details}
              </p>
            </div>

            {/* Drop-off predictions */}
            {results.engagement.dropOffPredictions.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  Drop-off Risks
                </h4>
                <div className="space-y-2">
                  {results.engagement.dropOffPredictions.slice(0, 3).map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs bg-red-500/10 border border-red-500/20 rounded p-2"
                    >
                      <Target className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-slate-300 flex-1">{d.reason}</span>
                      <span className="text-red-400 font-mono text-[10px]">
                        {Math.round(d.probability * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confusion points */}
            {results.engagement.confusionPoints.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  Confusion Points
                </h4>
                <IssueList
                  issues={results.engagement.confusionPoints.map(c => ({
                    message: c.reason,
                    severity: c.severity === 'severe' ? 'critical' : c.severity === 'moderate' ? 'warning' : 'info',
                    suggestion: c.suggestions[0],
                  }))}
                />
              </div>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
};

export default NarrativeAnalyticsDashboard;
