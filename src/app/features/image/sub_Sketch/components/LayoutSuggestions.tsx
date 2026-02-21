'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  Target,
  Scale,
  ArrowRight,
  Plus,
  Minus,
  Move,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Info,
  Sparkles,
  Crosshair,
  Layout,
} from 'lucide-react';
import {
  focalPointDetector,
  type FocalPoint,
  type BalanceAnalysis,
  type BalanceSuggestion,
} from '@/lib/composition';
import { cn } from '@/app/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface LayoutSuggestionsProps {
  imageSource?: HTMLImageElement | HTMLCanvasElement | ImageData | null;
  focalPoints?: FocalPoint[];
  balance?: BalanceAnalysis | null;
  onAnalyze?: () => void;
  onSuggestionClick?: (suggestion: BalanceSuggestion) => void;
  className?: string;
}

interface QuadrantVisualProps {
  weights: {
    topLeft: number;
    topRight: number;
    bottomLeft: number;
    bottomRight: number;
  };
  centerOfMass: { x: number; y: number };
}

// ============================================================================
// Helper Functions
// ============================================================================

function getSuggestionIcon(type: BalanceSuggestion['type']) {
  switch (type) {
    case 'move':
      return Move;
    case 'add':
      return Plus;
    case 'remove':
      return Minus;
    case 'resize':
      return Scale;
    default:
      return Lightbulb;
  }
}

function getPriorityColor(priority: BalanceSuggestion['priority']) {
  switch (priority) {
    case 'high':
      return 'text-red-400 bg-red-500/10';
    case 'medium':
      return 'text-yellow-400 bg-yellow-500/10';
    case 'low':
      return 'text-green-400 bg-green-500/10';
    default:
      return 'text-slate-400 bg-slate-500/10';
  }
}

function getBalanceColor(balance: number): string {
  if (balance >= 0.8) return 'text-green-400';
  if (balance >= 0.6) return 'text-yellow-400';
  return 'text-red-400';
}

function getBalanceLabel(balance: number): string {
  if (balance >= 0.9) return 'Excellent';
  if (balance >= 0.8) return 'Good';
  if (balance >= 0.6) return 'Fair';
  if (balance >= 0.4) return 'Unbalanced';
  return 'Needs Work';
}

// ============================================================================
// Sub-components
// ============================================================================

const QuadrantVisual: React.FC<QuadrantVisualProps> = ({ weights, centerOfMass }) => {
  const maxWeight = Math.max(
    weights.topLeft,
    weights.topRight,
    weights.bottomLeft,
    weights.bottomRight
  );

  const getOpacity = (weight: number) => {
    return 0.2 + (weight / maxWeight) * 0.6;
  };

  return (
    <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-700/50">
      {/* Quadrant Grid */}
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        <div
          className="border-r border-b border-slate-600/50"
          style={{ backgroundColor: `rgba(59, 130, 246, ${getOpacity(weights.topLeft)})` }}
        >
          <span className="absolute top-1 left-1 text-[10px] text-slate-300 font-mono">
            {Math.round(weights.topLeft * 100)}%
          </span>
        </div>
        <div
          className="border-b border-slate-600/50"
          style={{ backgroundColor: `rgba(59, 130, 246, ${getOpacity(weights.topRight)})` }}
        >
          <span className="absolute top-1 right-1 text-[10px] text-slate-300 font-mono">
            {Math.round(weights.topRight * 100)}%
          </span>
        </div>
        <div
          className="border-r border-slate-600/50"
          style={{ backgroundColor: `rgba(59, 130, 246, ${getOpacity(weights.bottomLeft)})` }}
        >
          <span className="absolute bottom-1 left-1 text-[10px] text-slate-300 font-mono">
            {Math.round(weights.bottomLeft * 100)}%
          </span>
        </div>
        <div
          style={{ backgroundColor: `rgba(59, 130, 246, ${getOpacity(weights.bottomRight)})` }}
        >
          <span className="absolute bottom-1 right-1 text-[10px] text-slate-300 font-mono">
            {Math.round(weights.bottomRight * 100)}%
          </span>
        </div>
      </div>

      {/* Center of Mass Indicator */}
      <motion.div
        className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-cyan-500 border-2 border-white shadow-lg"
        style={{
          left: `${centerOfMass.x * 100}%`,
          top: `${centerOfMass.y * 100}%`,
        }}
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Crosshair className="w-2 h-2 absolute inset-0 m-auto text-white" />
      </motion.div>

      {/* Center Point Reference */}
      <div className="absolute w-1 h-1 left-1/2 top-1/2 -ml-0.5 -mt-0.5 rounded-full bg-slate-400 opacity-50" />
    </div>
  );
};

interface FocalPointDisplayProps {
  focalPoints: FocalPoint[];
}

const FocalPointDisplay: React.FC<FocalPointDisplayProps> = ({ focalPoints }) => {
  if (focalPoints.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg text-xs text-slate-500">
        <Target className="w-4 h-4" />
        <span>No focal points detected</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <span className="text-[10px] text-slate-500 uppercase tracking-wider">
        Detected Focal Points ({focalPoints.length})
      </span>
      <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-700/50">
        {focalPoints.map((point, index) => (
          <motion.div
            key={point.id}
            className="absolute flex items-center justify-center"
            style={{
              left: `${point.x * 100}%`,
              top: `${point.y * 100}%`,
              width: `${Math.max(point.radius * 200, 24)}px`,
              height: `${Math.max(point.radius * 200, 24)}px`,
              marginLeft: `-${Math.max(point.radius * 100, 12)}px`,
              marginTop: `-${Math.max(point.radius * 100, 12)}px`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <div
              className={cn(
                'absolute inset-0 rounded-full border-2 animate-pulse',
                point.type === 'edge' && 'border-purple-500 bg-purple-500/20',
                point.type === 'contrast' && 'border-orange-500 bg-orange-500/20',
                point.type === 'center-of-mass' && 'border-cyan-500 bg-cyan-500/20',
                point.type === 'intersection' && 'border-green-500 bg-green-500/20'
              )}
              style={{ opacity: point.weight }}
            />
            <span className="text-[10px] font-bold text-white z-10">{index + 1}</span>
          </motion.div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {focalPoints.map((point, index) => (
          <div
            key={point.id}
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded text-[10px]',
              point.type === 'edge' && 'bg-purple-500/20 text-purple-300',
              point.type === 'contrast' && 'bg-orange-500/20 text-orange-300',
              point.type === 'center-of-mass' && 'bg-cyan-500/20 text-cyan-300',
              point.type === 'intersection' && 'bg-green-500/20 text-green-300'
            )}
          >
            <span className="font-bold">{index + 1}</span>
            <span className="capitalize">{point.type.replace('-', ' ')}</span>
            <span className="text-slate-400">({Math.round(point.weight * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface SuggestionCardProps {
  suggestion: BalanceSuggestion;
  onClick?: () => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, onClick }) => {
  const Icon = getSuggestionIcon(suggestion.type);
  const priorityClass = getPriorityColor(suggestion.priority);

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all',
        'bg-slate-800/50 hover:bg-slate-700/50',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/50'
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className={cn('p-1.5 rounded', priorityClass)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-200">{suggestion.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.5 rounded capitalize',
              priorityClass
            )}
          >
            {suggestion.priority}
          </span>
          <span className="text-[10px] text-slate-500 capitalize">{suggestion.type}</span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
    </motion.button>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const LayoutSuggestions: React.FC<LayoutSuggestionsProps> = ({
  imageSource,
  focalPoints: externalFocalPoints,
  balance: externalBalance,
  onAnalyze,
  onSuggestionClick,
  className,
}) => {
  // State
  const [focalPoints, setFocalPoints] = useState<FocalPoint[]>([]);
  const [balance, setBalance] = useState<BalanceAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Use external data if provided, otherwise use local state
  const activeFocalPoints = externalFocalPoints ?? focalPoints;
  const activeBalance = externalBalance ?? balance;

  // Generate suggestions
  const suggestions = useMemo(() => {
    if (!activeBalance) return [];
    return focalPointDetector.generateLayoutSuggestions(activeFocalPoints, activeBalance);
  }, [activeFocalPoints, activeBalance]);

  // Analyze image
  const handleAnalyze = useCallback(async () => {
    if (!imageSource) {
      onAnalyze?.();
      return;
    }

    setIsAnalyzing(true);

    try {
      // Run detection in next frame to avoid blocking UI
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const detected = focalPointDetector.detectFocalPoints(imageSource);
      setFocalPoints(detected);

      const analyzed = focalPointDetector.analyzeBalance(imageSource);
      setBalance(analyzed);
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [imageSource, onAnalyze]);

  // Auto-analyze when source changes
  useEffect(() => {
    if (imageSource && !externalFocalPoints && !externalBalance) {
      handleAnalyze();
    }
  }, [imageSource, externalFocalPoints, externalBalance, handleAnalyze]);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-400" />
          <span className="text-xs font-medium text-slate-200">Layout Analysis</span>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
            'bg-slate-700 hover:bg-slate-600 text-slate-200',
            isAnalyzing && 'opacity-50 cursor-not-allowed'
          )}
        >
          <RefreshCw className={cn('w-3 h-3', isAnalyzing && 'animate-spin')} />
          {isAnalyzing ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {/* No Source Message */}
      {!imageSource && !activeBalance && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="p-3 bg-slate-800/50 rounded-full">
            <Layout className="w-8 h-8 text-slate-600" />
          </div>
          <div>
            <p className="text-xs text-slate-400">No image to analyze</p>
            <p className="text-[10px] text-slate-500 mt-1">
              Load an image or start sketching to see layout suggestions
            </p>
          </div>
        </div>
      )}

      {/* Balance Overview */}
      {activeBalance && (
        <div className="space-y-3">
          {/* Balance Score */}
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-300">Composition Balance</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('text-lg font-bold', getBalanceColor(activeBalance.overallBalance))}>
                {Math.round(activeBalance.overallBalance * 100)}%
              </span>
              <span className={cn('text-xs', getBalanceColor(activeBalance.overallBalance))}>
                {getBalanceLabel(activeBalance.overallBalance)}
              </span>
            </div>
          </div>

          {/* Balance Bars */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-800/50 rounded-lg">
            {/* Horizontal Balance */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-500">Horizontal</span>
                <span className="text-[10px] text-slate-400">
                  {activeBalance.horizontalBalance > 0 ? 'Right' : 'Left'} Heavy
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden relative">
                <div
                  className="absolute top-0 h-full bg-blue-500 rounded-full"
                  style={{
                    left: activeBalance.horizontalBalance > 0 ? '50%' : `${50 + activeBalance.horizontalBalance * 50}%`,
                    width: `${Math.abs(activeBalance.horizontalBalance) * 50}%`,
                  }}
                />
                <div className="absolute top-0 left-1/2 w-0.5 h-full bg-slate-500" />
              </div>
            </div>

            {/* Vertical Balance */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-500">Vertical</span>
                <span className="text-[10px] text-slate-400">
                  {activeBalance.verticalBalance > 0 ? 'Bottom' : 'Top'} Heavy
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden relative">
                <div
                  className="absolute top-0 h-full bg-purple-500 rounded-full"
                  style={{
                    left: activeBalance.verticalBalance > 0 ? '50%' : `${50 + activeBalance.verticalBalance * 50}%`,
                    width: `${Math.abs(activeBalance.verticalBalance) * 50}%`,
                  }}
                />
                <div className="absolute top-0 left-1/2 w-0.5 h-full bg-slate-500" />
              </div>
            </div>
          </div>

          {/* Quadrant Visual */}
          <div className="space-y-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
              Weight Distribution
            </span>
            <QuadrantVisual
              weights={activeBalance.quadrantWeights}
              centerOfMass={activeBalance.centerOfMass}
            />
          </div>

          {/* Show Details Toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Info className="w-3 h-3" />
            <span>{showDetails ? 'Hide' : 'Show'} focal points</span>
          </button>

          {/* Focal Points Detail */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <FocalPointDisplay focalPoints={activeFocalPoints} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-medium text-slate-200">Suggestions</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 rounded-full text-slate-400">
              {suggestions.length}
            </span>
          </div>

          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={`${suggestion.type}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <SuggestionCard
                  suggestion={suggestion}
                  onClick={() => onSuggestionClick?.(suggestion)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* All Good Message */}
      {activeBalance && activeBalance.overallBalance >= 0.8 && suggestions.length === 0 && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-xs font-medium text-green-300">Great composition!</p>
            <p className="text-[10px] text-green-400/70 mt-0.5">
              Your layout has good balance and focal points
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayoutSuggestions;
