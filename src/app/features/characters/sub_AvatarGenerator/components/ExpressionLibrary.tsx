/**
 * ExpressionLibrary - Gallery of character expressions with intensity control
 * Design: Clean Manuscript style with cyan accents
 *
 * Provides 8+ emotion options with intensity gradients for avatar generation
 */

'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smile,
  Frown,
  Angry,
  Zap,
  Heart,
  Shield,
  Brain,
  Ghost,
  Sun,
  Moon,
  Sparkles,
  Eye,
  Search,
  Filter,
  Grid,
  List,
  X,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface Expression {
  id: string;
  name: string;
  label: string;
  description: string;
  promptModifier: string;
  category: ExpressionCategory;
  icon: React.ReactNode;
  intensity: number; // 0-100, applied externally
  color: string;
}

export type ExpressionCategory = 'positive' | 'negative' | 'neutral' | 'complex';

export interface ExpressionLibraryProps {
  selectedExpression: Expression | null;
  onSelectExpression: (expression: Expression | null) => void;
  intensity?: number;
  onIntensityChange?: (intensity: number) => void;
  disabled?: boolean;
  compact?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

export const EXPRESSION_LIBRARY: Expression[] = [
  // Positive emotions
  {
    id: 'happy',
    name: 'Happy',
    label: 'happy',
    description: 'Joyful, warm smile with bright eyes',
    promptModifier: 'happy expression, warm smile, bright joyful eyes, cheerful demeanor',
    category: 'positive',
    icon: <Smile size={16} />,
    intensity: 50,
    color: 'text-yellow-400',
  },
  {
    id: 'excited',
    name: 'Excited',
    label: 'excited',
    description: 'Energetic with wide eyes and open expression',
    promptModifier: 'excited expression, wide enthusiastic eyes, energetic appearance, eager smile',
    category: 'positive',
    icon: <Zap size={16} />,
    intensity: 50,
    color: 'text-orange-400',
  },
  {
    id: 'loving',
    name: 'Loving',
    label: 'loving',
    description: 'Soft, affectionate gaze with gentle smile',
    promptModifier: 'loving expression, soft affectionate gaze, gentle warm smile, tender look',
    category: 'positive',
    icon: <Heart size={16} />,
    intensity: 50,
    color: 'text-pink-400',
  },
  {
    id: 'confident',
    name: 'Confident',
    label: 'confident',
    description: 'Self-assured with slight knowing smile',
    promptModifier: 'confident expression, self-assured smirk, determined eyes, composed demeanor',
    category: 'positive',
    icon: <Shield size={16} />,
    intensity: 50,
    color: 'text-emerald-400',
  },
  // Negative emotions
  {
    id: 'sad',
    name: 'Sad',
    label: 'sad',
    description: 'Downcast eyes with sorrowful expression',
    promptModifier: 'sad expression, downcast eyes, sorrowful look, melancholic appearance',
    category: 'negative',
    icon: <Frown size={16} />,
    intensity: 50,
    color: 'text-blue-400',
  },
  {
    id: 'angry',
    name: 'Angry',
    label: 'angry',
    description: 'Furrowed brows with intense, fierce gaze',
    promptModifier: 'angry expression, furrowed brows, fierce intense eyes, clenched jaw',
    category: 'negative',
    icon: <Angry size={16} />,
    intensity: 50,
    color: 'text-red-400',
  },
  {
    id: 'fearful',
    name: 'Fearful',
    label: 'fearful',
    description: 'Wide frightened eyes with tense features',
    promptModifier: 'fearful expression, wide frightened eyes, tense features, worried look',
    category: 'negative',
    icon: <Ghost size={16} />,
    intensity: 50,
    color: 'text-purple-400',
  },
  // Neutral/Complex emotions
  {
    id: 'surprised',
    name: 'Surprised',
    label: 'surprised',
    description: 'Raised eyebrows with open expression',
    promptModifier: 'surprised expression, raised eyebrows, wide open eyes, astonished look',
    category: 'neutral',
    icon: <Sun size={16} />,
    intensity: 50,
    color: 'text-cyan-400',
  },
  {
    id: 'thoughtful',
    name: 'Thoughtful',
    label: 'thoughtful',
    description: 'Contemplative gaze with focused expression',
    promptModifier: 'thoughtful expression, contemplative gaze, focused eyes, pensive demeanor',
    category: 'neutral',
    icon: <Brain size={16} />,
    intensity: 50,
    color: 'text-indigo-400',
  },
  {
    id: 'mysterious',
    name: 'Mysterious',
    label: 'mysterious',
    description: 'Enigmatic half-smile with knowing eyes',
    promptModifier: 'mysterious expression, enigmatic smile, knowing gaze, inscrutable look',
    category: 'complex',
    icon: <Moon size={16} />,
    intensity: 50,
    color: 'text-violet-400',
  },
  {
    id: 'serene',
    name: 'Serene',
    label: 'serene',
    description: 'Peaceful, calm expression with soft features',
    promptModifier: 'serene expression, peaceful calm face, soft relaxed features, tranquil look',
    category: 'neutral',
    icon: <Sparkles size={16} />,
    intensity: 50,
    color: 'text-teal-400',
  },
  {
    id: 'determined',
    name: 'Determined',
    label: 'determined',
    description: 'Resolute gaze with set jaw and focused eyes',
    promptModifier: 'determined expression, resolute gaze, set jaw, unwavering focus',
    category: 'complex',
    icon: <Eye size={16} />,
    intensity: 50,
    color: 'text-amber-400',
  },
];

const INTENSITY_PRESETS = [
  { value: 25, label: 'subtle' },
  { value: 50, label: 'moderate' },
  { value: 75, label: 'strong' },
  { value: 100, label: 'extreme' },
];

const CATEGORY_CONFIG: Record<ExpressionCategory, { label: string; color: string }> = {
  positive: { label: 'Positive', color: 'bg-green-600/20 text-green-400 border-green-500/30' },
  negative: { label: 'Negative', color: 'bg-red-600/20 text-red-400 border-red-500/30' },
  neutral: { label: 'Neutral', color: 'bg-slate-600/20 text-slate-400 border-slate-500/30' },
  complex: { label: 'Complex', color: 'bg-purple-600/20 text-purple-400 border-purple-500/30' },
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getIntensityModifier(intensity: number): string {
  if (intensity <= 25) return 'subtle hint of';
  if (intensity <= 50) return 'moderate';
  if (intensity <= 75) return 'strong';
  return 'extreme intense';
}

export function buildExpressionPrompt(expression: Expression, intensity: number): string {
  const intensityMod = getIntensityModifier(intensity);
  return `${intensityMod} ${expression.promptModifier}`;
}

// ============================================================================
// Main Component
// ============================================================================

const ExpressionLibrary: React.FC<ExpressionLibraryProps> = ({
  selectedExpression,
  onSelectExpression,
  intensity = 50,
  onIntensityChange,
  disabled = false,
  compact = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<ExpressionCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showIntensity, setShowIntensity] = useState(false);

  // Filter expressions
  const filteredExpressions = useMemo(() => {
    return EXPRESSION_LIBRARY.filter((exp) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!exp.name.toLowerCase().includes(query) && !exp.description.toLowerCase().includes(query)) {
          return false;
        }
      }
      if (filterCategory !== 'all' && exp.category !== filterCategory) {
        return false;
      }
      return true;
    });
  }, [searchQuery, filterCategory]);

  // Group by category for compact view
  const expressionsByCategory = useMemo(() => {
    const grouped: Record<ExpressionCategory, Expression[]> = {
      positive: [],
      negative: [],
      neutral: [],
      complex: [],
    };
    filteredExpressions.forEach((exp) => {
      grouped[exp.category].push(exp);
    });
    return grouped;
  }, [filteredExpressions]);

  const handleExpressionClick = (expression: Expression) => {
    if (disabled) return;
    if (selectedExpression?.id === expression.id) {
      onSelectExpression(null);
    } else {
      onSelectExpression({ ...expression, intensity });
    }
  };

  if (compact) {
    return (
      <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/50">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <h3 className="font-mono text-xs uppercase tracking-wide text-slate-300">
            expression
          </h3>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {EXPRESSION_LIBRARY.slice(0, 8).map((expression) => {
            const isSelected = selectedExpression?.id === expression.id;
            return (
              <button
                key={expression.id}
                onClick={() => handleExpressionClick(expression)}
                disabled={disabled}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-xs transition-all',
                  isSelected
                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
                    : 'bg-slate-800/40 border border-slate-700/50 text-slate-400 hover:border-slate-600',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <span className={expression.color}>{expression.icon}</span>
                <span className="font-mono">{expression.label}</span>
              </button>
            );
          })}
        </div>
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
            expression_library
          </h3>
          {selectedExpression && (
            <span className="px-2 py-0.5 bg-cyan-500/20 rounded text-cyan-400 font-mono text-xs">
              {selectedExpression.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-1.5 rounded bg-slate-800/40 hover:bg-slate-700/60 text-slate-400 transition-colors"
          >
            {viewMode === 'grid' ? <List size={14} /> : <Grid size={14} />}
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search expressions..."
            disabled={disabled}
            className="w-full pl-8 pr-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-lg
                       font-mono text-xs text-slate-300 placeholder:text-slate-600
                       focus:outline-none focus:ring-1 focus:ring-cyan-500/50
                       disabled:opacity-50"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as ExpressionCategory | 'all')}
          disabled={disabled}
          className="px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-lg
                     font-mono text-xs text-slate-300
                     focus:outline-none focus:ring-1 focus:ring-cyan-500/50
                     disabled:opacity-50"
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
      </div>

      {/* Expression Grid/List */}
      <div className={cn(
        viewMode === 'grid'
          ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2'
          : 'space-y-2'
      )}>
        {filteredExpressions.map((expression) => {
          const isSelected = selectedExpression?.id === expression.id;
          const categoryConfig = CATEGORY_CONFIG[expression.category];

          if (viewMode === 'list') {
            return (
              <motion.button
                key={expression.id}
                onClick={() => handleExpressionClick(expression)}
                disabled={disabled}
                whileHover={{ scale: disabled ? 1 : 1.01 }}
                whileTap={{ scale: disabled ? 1 : 0.99 }}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-500/40'
                    : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className={cn('p-2 rounded-lg', expression.color, 'bg-slate-800/60')}>
                  {expression.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'font-mono text-sm uppercase',
                      isSelected ? 'text-cyan-400' : 'text-slate-300'
                    )}>
                      {expression.label}
                    </span>
                    <span className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] font-mono border',
                      categoryConfig.color
                    )}>
                      {expression.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                    {expression.description}
                  </p>
                </div>
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                )}
              </motion.button>
            );
          }

          return (
            <motion.button
              key={expression.id}
              onClick={() => handleExpressionClick(expression)}
              disabled={disabled}
              whileHover={{ scale: disabled ? 1 : 1.03 }}
              whileTap={{ scale: disabled ? 1 : 0.97 }}
              className={cn(
                'p-3 rounded-lg border transition-all text-left',
                isSelected
                  ? 'bg-cyan-500/15 border-cyan-500/40'
                  : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={expression.color}>{expression.icon}</span>
                <span className={cn(
                  'font-mono text-xs uppercase tracking-wide',
                  isSelected ? 'text-cyan-400' : 'text-slate-300'
                )}>
                  {expression.label}
                </span>
              </div>
              <p className="font-mono text-[10px] text-slate-500 leading-relaxed line-clamp-2">
                {expression.description}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Intensity Control (when expression is selected) */}
      <AnimatePresence>
        {selectedExpression && onIntensityChange && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-slate-700/50"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-slate-400 uppercase">
                intensity: {intensity}%
              </span>
              <span className="font-mono text-xs text-slate-500">
                {getIntensityModifier(intensity)}
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={100}
              value={intensity}
              onChange={(e) => onIntensityChange(Number(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400
                         disabled:opacity-50"
            />

            <div className="flex items-center gap-2 mt-2">
              {INTENSITY_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => onIntensityChange(preset.value)}
                  disabled={disabled}
                  className={cn(
                    'px-2 py-1 rounded font-mono text-[10px] uppercase transition-colors',
                    intensity === preset.value
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'bg-slate-800/40 text-slate-500 hover:text-slate-300',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Preview of prompt modifier */}
            <div className="mt-3 p-2 bg-slate-800/40 rounded border border-slate-700/30">
              <span className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
                prompt_modifier
              </span>
              <p className="font-mono text-[10px] text-slate-400">
                {buildExpressionPrompt(selectedExpression, intensity)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {filteredExpressions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-slate-500">
          <Search size={24} className="mb-2 opacity-50" />
          <p className="font-mono text-xs">No expressions found</p>
        </div>
      )}
    </div>
  );
};

export default ExpressionLibrary;
