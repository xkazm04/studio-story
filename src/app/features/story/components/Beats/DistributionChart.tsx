/**
 * DistributionChart
 * Visualization of beat type, emotion, and function tag distribution
 * with balance metrics and recommendations
 */

'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  PieChart,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Target,
  Heart,
  Tag,
} from 'lucide-react';
import {
  type BeatCategory,
  type EmotionType,
  type FunctionTag,
  type BeatClassification,
  type DistributionAnalysis,
  type BalanceRecommendation,
  type CategoryDistribution,
  type EmotionDistribution,
  type FunctionDistribution,
  BEAT_TYPES,
  EMOTIONS,
  FUNCTIONS,
  getEmotion,
  getFunction,
} from '@/lib/beats/TaxonomyLibrary';

// Category colors
const CATEGORY_COLORS: Record<BeatCategory, string> = {
  action: '#EF4444',
  revelation: '#F59E0B',
  decision: '#8B5CF6',
  emotional: '#EC4899',
  dialogue: '#06B6D4',
  transition: '#6B7280',
  setup: '#10B981',
  payoff: '#3B82F6',
};

interface DistributionChartProps {
  classifications: BeatClassification[];
  totalBeats: number;
  showRecommendations?: boolean;
}

// Calculate distribution analysis
function calculateAnalysis(
  classifications: BeatClassification[],
  totalBeats: number
): DistributionAnalysis {
  // Category distribution
  const categoryMap = new Map<BeatCategory, string[]>();
  const emotionMap = new Map<EmotionType, { count: number; totalIntensity: number }>();
  const functionMap = new Map<FunctionTag, { count: number; positions: number[] }>();

  classifications.forEach((c, index) => {
    // Categories
    const existing = categoryMap.get(c.category) || [];
    categoryMap.set(c.category, [...existing, c.beatId]);

    // Emotions
    c.emotionalMarkers.forEach(marker => {
      const existing = emotionMap.get(marker.primary) || { count: 0, totalIntensity: 0 };
      emotionMap.set(marker.primary, {
        count: existing.count + 1,
        totalIntensity: existing.totalIntensity + marker.intensity,
      });

      if (marker.secondary) {
        const existingSec = emotionMap.get(marker.secondary) || { count: 0, totalIntensity: 0 };
        emotionMap.set(marker.secondary, {
          count: existingSec.count + 1,
          totalIntensity: existingSec.totalIntensity + (marker.intensity * 0.5),
        });
      }
    });

    // Functions
    c.functionTags.forEach(tag => {
      const position = totalBeats > 0 ? index / totalBeats : 0;
      const existing = functionMap.get(tag) || { count: 0, positions: [] };
      functionMap.set(tag, {
        count: existing.count + 1,
        positions: [...existing.positions, position],
      });
    });
  });

  const classifiedCount = classifications.length;

  // Build distribution arrays
  const categoryDistribution: CategoryDistribution[] = Array.from(categoryMap.entries())
    .map(([category, beats]) => ({
      category,
      count: beats.length,
      percentage: classifiedCount > 0 ? (beats.length / classifiedCount) * 100 : 0,
      beats,
    }))
    .sort((a, b) => b.count - a.count);

  const emotionDistribution: EmotionDistribution[] = Array.from(emotionMap.entries())
    .map(([emotion, data]) => ({
      emotion,
      count: data.count,
      percentage: classifiedCount > 0 ? (data.count / classifiedCount) * 100 : 0,
      averageIntensity: data.count > 0 ? data.totalIntensity / data.count : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const functionDistribution: FunctionDistribution[] = Array.from(functionMap.entries())
    .map(([func, data]) => ({
      function: func,
      count: data.count,
      percentage: classifiedCount > 0 ? (data.count / classifiedCount) * 100 : 0,
      positions: data.positions,
    }))
    .sort((a, b) => b.count - a.count);

  // Calculate balance score (0-100)
  let balanceScore = 100;
  const recommendations: BalanceRecommendation[] = [];

  // Check for category imbalance
  if (categoryDistribution.length > 0) {
    const maxCategory = categoryDistribution[0];
    if (maxCategory.percentage > 40) {
      balanceScore -= 15;
      recommendations.push({
        type: 'rebalance',
        category: maxCategory.category,
        message: `Too many ${maxCategory.category} beats (${Math.round(maxCategory.percentage)}%)`,
        severity: maxCategory.percentage > 50 ? 'warning' : 'info',
        suggestion: `Consider adding more variety with different beat types`,
      });
    }
  }

  // Check for missing categories
  const presentCategories = new Set(categoryDistribution.map(c => c.category));
  const allCategories: BeatCategory[] = ['action', 'revelation', 'decision', 'emotional', 'dialogue', 'transition', 'setup', 'payoff'];
  const missingCategories = allCategories.filter(c => !presentCategories.has(c));

  if (missingCategories.length > 4 && classifiedCount >= 5) {
    balanceScore -= 10;
    recommendations.push({
      type: 'add',
      message: `Missing beat categories: ${missingCategories.join(', ')}`,
      severity: 'info',
      suggestion: 'A balanced story typically includes various beat types',
    });
  }

  // Check emotional variety
  const positiveEmotions = emotionDistribution.filter(e => {
    const def = getEmotion(e.emotion);
    return def?.valence === 'positive';
  });
  const negativeEmotions = emotionDistribution.filter(e => {
    const def = getEmotion(e.emotion);
    return def?.valence === 'negative';
  });

  const positiveCount = positiveEmotions.reduce((sum, e) => sum + e.count, 0);
  const negativeCount = negativeEmotions.reduce((sum, e) => sum + e.count, 0);
  const totalEmotionCount = positiveCount + negativeCount;

  if (totalEmotionCount > 0) {
    const positiveRatio = positiveCount / totalEmotionCount;
    if (positiveRatio > 0.8) {
      balanceScore -= 10;
      recommendations.push({
        type: 'add',
        emotion: 'tension' as EmotionType,
        message: 'Story is heavily weighted toward positive emotions',
        severity: 'info',
        suggestion: 'Adding conflict and tension can create more engaging narrative',
      });
    } else if (positiveRatio < 0.2) {
      balanceScore -= 10;
      recommendations.push({
        type: 'add',
        emotion: 'hope' as EmotionType,
        message: 'Story is heavily weighted toward negative emotions',
        severity: 'info',
        suggestion: 'Adding moments of hope or joy can provide emotional relief',
      });
    }
  }

  // Check for critical structural functions
  const criticalFunctions: FunctionTag[] = ['inciting_incident', 'climax', 'resolution'];
  const missingCritical = criticalFunctions.filter(
    f => !functionDistribution.find(fd => fd.function === f)
  );

  if (missingCritical.length > 0 && classifiedCount >= 5) {
    balanceScore -= missingCritical.length * 10;
    recommendations.push({
      type: 'add',
      message: `Missing critical story beats: ${missingCritical.map(f => f.replace('_', ' ')).join(', ')}`,
      severity: 'warning',
      suggestion: 'These structural elements are essential for a complete story',
    });
  }

  // Check for setup/payoff balance
  const setupCount = functionDistribution.find(f => f.function === 'setup')?.count || 0;
  const payoffCount = functionDistribution.find(f => f.function === 'payoff')?.count || 0;

  if (setupCount > payoffCount + 2 && setupCount > 3) {
    balanceScore -= 10;
    recommendations.push({
      type: 'add',
      function: 'payoff' as FunctionTag,
      message: `${setupCount} setups but only ${payoffCount} payoffs`,
      severity: 'warning',
      suggestion: 'Ensure each setup has a corresponding payoff',
    });
  }

  return {
    totalBeats,
    categoryDistribution,
    emotionDistribution,
    functionDistribution,
    balanceScore: Math.max(0, balanceScore),
    recommendations,
  };
}

// Bar chart component
function HorizontalBarChart({
  data,
  maxValue,
  colorFn,
}: {
  data: { label: string; value: number; percentage: number }[];
  maxValue: number;
  colorFn: (label: string) => string;
}) {
  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center gap-2"
        >
          <span className="text-xs text-slate-400 w-20 truncate capitalize">
            {item.label.replace('_', ' ')}
          </span>
          <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / maxValue) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: colorFn(item.label) }}
            />
          </div>
          <span className="text-xs text-slate-300 w-12 text-right">
            {item.value} <span className="text-slate-500">({Math.round(item.percentage)}%)</span>
          </span>
        </motion.div>
      ))}
    </div>
  );
}

// Balance score gauge
function BalanceGauge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getLabel = () => {
    if (score >= 80) return 'Well Balanced';
    if (score >= 60) return 'Needs Attention';
    return 'Imbalanced';
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="#1E293B"
            strokeWidth="6"
          />
          <motion.circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke={getColor()}
            strokeWidth="6"
            strokeLinecap="round"
            initial={{ strokeDasharray: '0 176' }}
            animate={{ strokeDasharray: `${(score / 100) * 176} 176` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color: getColor() }}>
            {score}
          </span>
        </div>
      </div>
      <div>
        <div className="text-sm font-medium text-slate-200">{getLabel()}</div>
        <div className="text-xs text-slate-500">Balance Score</div>
      </div>
    </div>
  );
}

// Recommendation card
function RecommendationCard({ recommendation }: { recommendation: BalanceRecommendation }) {
  const getIcon = () => {
    switch (recommendation.severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default: return <Info className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getBorderColor = () => {
    switch (recommendation.severity) {
      case 'critical': return 'border-red-500/30 bg-red-500/5';
      case 'warning': return 'border-amber-500/30 bg-amber-500/5';
      default: return 'border-cyan-500/30 bg-cyan-500/5';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-3 rounded-lg border',
        getBorderColor()
      )}
    >
      <div className="flex items-start gap-2">
        {getIcon()}
        <div className="flex-1">
          <div className="text-xs text-slate-200">{recommendation.message}</div>
          {recommendation.suggestion && (
            <div className="text-[10px] text-slate-500 mt-1">{recommendation.suggestion}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function DistributionChart({
  classifications,
  totalBeats,
  showRecommendations = true,
}: DistributionChartProps) {
  const [activeTab, setActiveTab] = useState<'category' | 'emotion' | 'function'>('category');
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);

  const analysis = useMemo(
    () => calculateAnalysis(classifications, totalBeats),
    [classifications, totalBeats]
  );

  const classifiedCount = classifications.length;
  const unclassifiedCount = totalBeats - classifiedCount;

  // Tab data
  const tabs = [
    { id: 'category' as const, label: 'Categories', icon: Target, count: analysis.categoryDistribution.length },
    { id: 'emotion' as const, label: 'Emotions', icon: Heart, count: analysis.emotionDistribution.length },
    { id: 'function' as const, label: 'Functions', icon: Tag, count: analysis.functionDistribution.length },
  ];

  // Max values for charts
  const maxCategoryCount = Math.max(...analysis.categoryDistribution.map(c => c.count), 1);
  const maxEmotionCount = Math.max(...analysis.emotionDistribution.map(e => e.count), 1);
  const maxFunctionCount = Math.max(...analysis.functionDistribution.map(f => f.count), 1);

  const displayedRecommendations = showAllRecommendations
    ? analysis.recommendations
    : analysis.recommendations.slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Header with balance score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-slate-200">Beat Distribution</span>
        </div>
        <BalanceGauge score={analysis.balanceScore} />
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 bg-slate-800/50 rounded-lg text-center">
          <div className="text-lg font-bold text-cyan-400">{totalBeats}</div>
          <div className="text-[10px] text-slate-500">Total Beats</div>
        </div>
        <div className="p-2 bg-slate-800/50 rounded-lg text-center">
          <div className="text-lg font-bold text-emerald-400">{classifiedCount}</div>
          <div className="text-[10px] text-slate-500">Classified</div>
        </div>
        <div className="p-2 bg-slate-800/50 rounded-lg text-center">
          <div className="text-lg font-bold text-slate-400">{unclassifiedCount}</div>
          <div className="text-[10px] text-slate-500">Unclassified</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            <span className="ml-1 px-1.5 py-0.5 rounded bg-slate-700 text-[10px]">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Chart content */}
      <div className="min-h-[200px]">
        <AnimatePresence mode="wait">
          {activeTab === 'category' && (
            <motion.div
              key="category"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {analysis.categoryDistribution.length > 0 ? (
                <HorizontalBarChart
                  data={analysis.categoryDistribution.map(c => ({
                    label: c.category,
                    value: c.count,
                    percentage: c.percentage,
                  }))}
                  maxValue={maxCategoryCount}
                  colorFn={(label) => CATEGORY_COLORS[label as BeatCategory] || '#6B7280'}
                />
              ) : (
                <div className="flex items-center justify-center h-32 text-sm text-slate-500">
                  No beats classified yet
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'emotion' && (
            <motion.div
              key="emotion"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {analysis.emotionDistribution.length > 0 ? (
                <HorizontalBarChart
                  data={analysis.emotionDistribution.map(e => ({
                    label: e.emotion,
                    value: e.count,
                    percentage: e.percentage,
                  }))}
                  maxValue={maxEmotionCount}
                  colorFn={(label) => getEmotion(label as EmotionType)?.color || '#6B7280'}
                />
              ) : (
                <div className="flex items-center justify-center h-32 text-sm text-slate-500">
                  No emotional markers added yet
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'function' && (
            <motion.div
              key="function"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {analysis.functionDistribution.length > 0 ? (
                <HorizontalBarChart
                  data={analysis.functionDistribution.map(f => ({
                    label: f.function,
                    value: f.count,
                    percentage: f.percentage,
                  }))}
                  maxValue={maxFunctionCount}
                  colorFn={() => '#06B6D4'}
                />
              ) : (
                <div className="flex items-center justify-center h-32 text-sm text-slate-500">
                  No function tags assigned yet
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recommendations */}
      {showRecommendations && analysis.recommendations.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <Sparkles className="w-3.5 h-3.5" />
              Recommendations ({analysis.recommendations.length})
            </div>
            {analysis.recommendations.length > 3 && (
              <button
                onClick={() => setShowAllRecommendations(!showAllRecommendations)}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                {showAllRecommendations ? 'Show less' : 'Show all'}
                <ChevronDown className={cn(
                  'w-3 h-3 transition-transform',
                  showAllRecommendations && 'rotate-180'
                )} />
              </button>
            )}
          </div>
          <div className="space-y-2">
            <AnimatePresence>
              {displayedRecommendations.map((rec, index) => (
                <RecommendationCard key={index} recommendation={rec} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* All good message */}
      {showRecommendations && analysis.recommendations.length === 0 && classifiedCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-emerald-400">
            Your beat distribution looks well balanced!
          </span>
        </div>
      )}
    </div>
  );
}
