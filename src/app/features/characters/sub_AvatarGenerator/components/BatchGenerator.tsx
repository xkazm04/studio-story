/**
 * BatchGenerator - Generate multiple expressions/poses at once
 * Design: Clean Manuscript style with cyan accents
 *
 * Enables batch generation of expression sets for comprehensive avatar libraries
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Play,
  Pause,
  Square,
  CheckCircle,
  XCircle,
  Clock,
  Image,
  AlertTriangle,
  RefreshCw,
  Download,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  Shield,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { Expression, EXPRESSION_LIBRARY } from './ExpressionLibrary';
import { Pose, Angle, POSE_PRESETS, ANGLE_PRESETS } from './PoseSelector';
import type { StyleDefinition, CharacterStyleProfile, ClosedLoopConfig } from '../lib/styleEngine';
import { DEFAULT_CLOSED_LOOP_CONFIG, calculateStyleDeviation, strengthenStylePrompt, evaluateGenerationResult } from '../lib/styleEngine';

// ============================================================================
// Types
// ============================================================================

export interface BatchItem {
  id: string;
  expression: Expression;
  pose: Pose | null;
  angle: Angle | null;
  intensity: number;
  status: BatchItemStatus;
  imageUrl?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  /** Closed-loop: number of retry attempts */
  retryCount?: number;
  /** Closed-loop: style deviation score (0-100, lower = better) */
  deviationScore?: number;
  /** Closed-loop: whether this item was auto-retried */
  wasRetried?: boolean;
}

export type BatchItemStatus = 'pending' | 'generating' | 'completed' | 'failed' | 'cancelled';

export interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  generating: number;
  retried: number;
}

export interface BatchGeneratorProps {
  basePrompt: string;
  characterId: string;
  styleDefinition?: StyleDefinition;
  onBatchComplete?: (items: BatchItem[]) => void;
  onItemGenerated?: (item: BatchItem) => void;
  disabled?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const QUICK_PRESETS = [
  {
    id: 'basic_emotions',
    name: 'Basic Emotions',
    description: '8 core expressions',
    expressionIds: ['happy', 'sad', 'angry', 'surprised', 'fearful', 'confident', 'thoughtful', 'serene'],
  },
  {
    id: 'positive_set',
    name: 'Positive Set',
    description: 'Happy and uplifting expressions',
    expressionIds: ['happy', 'excited', 'loving', 'confident'],
  },
  {
    id: 'dramatic_set',
    name: 'Dramatic Set',
    description: 'Intense emotional range',
    expressionIds: ['angry', 'fearful', 'determined', 'mysterious'],
  },
  {
    id: 'full_library',
    name: 'Full Library',
    description: 'All 12 expressions',
    expressionIds: EXPRESSION_LIBRARY.map(e => e.id),
  },
];

// ============================================================================
// Subcomponents
// ============================================================================

interface BatchItemCardProps {
  item: BatchItem;
  onRemove: () => void;
  onRetry: () => void;
  disabled?: boolean;
}

const BatchItemCard: React.FC<BatchItemCardProps> = ({
  item,
  onRemove,
  onRetry,
  disabled,
}) => {
  const statusConfig = {
    pending: { icon: <Clock size={14} />, color: 'text-slate-400', bg: 'bg-slate-500/20' },
    generating: { icon: <RefreshCw size={14} className="animate-spin" />, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
    completed: { icon: <CheckCircle size={14} />, color: 'text-green-400', bg: 'bg-green-500/20' },
    failed: { icon: <XCircle size={14} />, color: 'text-red-400', bg: 'bg-red-500/20' },
    cancelled: { icon: <Square size={14} />, color: 'text-slate-400', bg: 'bg-slate-600/20' },
  };

  const config = statusConfig[item.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'relative p-3 rounded-lg border transition-all',
        item.status === 'completed'
          ? 'bg-slate-800/60 border-green-500/30'
          : item.status === 'failed'
            ? 'bg-slate-800/60 border-red-500/30'
            : item.status === 'generating'
              ? 'bg-slate-800/60 border-cyan-500/30'
              : 'bg-slate-800/40 border-slate-700/50'
      )}
    >
      {/* Image Preview */}
      <div className="aspect-square bg-slate-900/60 rounded-md mb-2 overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.expression.name}
            className="w-full h-full object-cover"
          />
        ) : item.status === 'generating' ? (
          <div className="w-full h-full flex items-center justify-center">
            <RefreshCw size={24} className="text-cyan-400 animate-spin" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image size={24} className="text-slate-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className={cn('font-mono text-sm uppercase', item.expression.color)}>
            {item.expression.label}
          </span>
          <span className={cn('p-1 rounded', config.bg)}>
            {config.icon}
          </span>
        </div>

        {item.pose && (
          <span className="font-mono text-sm text-slate-400">
            {item.pose.label}
          </span>
        )}

        <div className="flex items-center gap-1">
          <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full', config.bg.replace('/20', ''))}
              style={{ width: `${item.intensity}%` }}
            />
          </div>
          <span className="font-mono text-sm text-slate-400">{item.intensity}%</span>
        </div>
      </div>

      {/* Deviation Score & Retry Badge */}
      {(item.deviationScore !== undefined || item.wasRetried) && (
        <div className="flex items-center gap-1.5 mt-1.5">
          {item.deviationScore !== undefined && (
            <span className={cn(
              'px-1.5 py-0.5 rounded font-mono text-sm',
              item.deviationScore <= 30
                ? 'bg-green-500/20 text-green-400'
                : item.deviationScore <= 60
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-red-500/20 text-red-400'
            )}>
              dev:{item.deviationScore}
            </span>
          )}
          {item.wasRetried && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono text-sm">
              <RotateCcw size={9} />
              ×{item.retryCount}
            </span>
          )}
        </div>
      )}

      {/* Error */}
      {item.error && (
        <div className="mt-2 p-1.5 bg-red-500/10 rounded text-sm text-red-400 font-mono">
          {item.error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 mt-2">
        {item.status === 'failed' && (
          <button
            onClick={onRetry}
            disabled={disabled}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded
                       bg-slate-700/60 hover:bg-slate-600 text-slate-300 text-sm font-mono
                       disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={10} />
            retry
          </button>
        )}
        {(item.status === 'pending' || item.status === 'failed') && (
          <button
            onClick={onRemove}
            disabled={disabled}
            className="p-1 rounded bg-slate-700/60 hover:bg-red-600/30 text-slate-400
                       hover:text-red-400 disabled:opacity-50 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const BatchGenerator: React.FC<BatchGeneratorProps> = ({
  basePrompt,
  characterId,
  styleDefinition,
  onBatchComplete,
  onItemGenerated,
  disabled = false,
}) => {
  // State
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedExpressions, setSelectedExpressions] = useState<Set<string>>(new Set());
  const [selectedPose, setSelectedPose] = useState<Pose | null>(null);
  const [selectedAngle, setSelectedAngle] = useState<Angle | null>(null);
  const [intensity, setIntensity] = useState(50);
  const [showConfig, setShowConfig] = useState(true);

  // Closed-loop consistency state
  const [closedLoopEnabled, setClosedLoopEnabled] = useState(false);
  const [deviationThreshold, setDeviationThreshold] = useState(DEFAULT_CLOSED_LOOP_CONFIG.deviationThreshold);
  const [maxRetries, setMaxRetries] = useState(DEFAULT_CLOSED_LOOP_CONFIG.maxRetries);

  // Computed
  const progress = useMemo<BatchProgress>(() => {
    return {
      total: batchItems.length,
      completed: batchItems.filter(i => i.status === 'completed').length,
      failed: batchItems.filter(i => i.status === 'failed').length,
      pending: batchItems.filter(i => i.status === 'pending').length,
      generating: batchItems.filter(i => i.status === 'generating').length,
      retried: batchItems.filter(i => i.wasRetried).length,
    };
  }, [batchItems]);

  const completedItems = useMemo(() => {
    return batchItems.filter(i => i.status === 'completed');
  }, [batchItems]);

  // Handlers
  const toggleExpression = (expressionId: string) => {
    setSelectedExpressions(prev => {
      const next = new Set(prev);
      if (next.has(expressionId)) {
        next.delete(expressionId);
      } else {
        next.add(expressionId);
      }
      return next;
    });
  };

  const applyPreset = (preset: typeof QUICK_PRESETS[0]) => {
    setSelectedExpressions(new Set(preset.expressionIds));
  };

  const createBatchItems = useCallback((): BatchItem[] => {
    return Array.from(selectedExpressions).map(expId => {
      const expression = EXPRESSION_LIBRARY.find(e => e.id === expId)!;
      return {
        id: `batch-${Date.now()}-${expId}`,
        expression,
        pose: selectedPose,
        angle: selectedAngle,
        intensity,
        status: 'pending' as BatchItemStatus,
      };
    });
  }, [selectedExpressions, selectedPose, selectedAngle, intensity]);

  const startBatch = async () => {
    if (selectedExpressions.size === 0) return;

    const items = createBatchItems();
    setBatchItems(items);
    setIsRunning(true);
    setIsPaused(false);
    setShowConfig(false);

    const closedLoopActive = closedLoopEnabled && styleDefinition;
    const loopConfig: ClosedLoopConfig | null = closedLoopActive
      ? { enabled: true, deviationThreshold, maxRetries, styleDefinition }
      : null;

    for (let i = 0; i < items.length; i++) {
      if (isPaused) break;

      const item = items[i];
      let currentAttempt = 0;
      let accepted = false;

      while (!accepted) {
        setBatchItems(prev => prev.map((it, idx) =>
          idx === i ? {
            ...it,
            status: 'generating',
            startedAt: it.startedAt || new Date().toISOString(),
            retryCount: currentAttempt,
            wasRetried: currentAttempt > 0,
          } : it
        ));

        // Simulate generation delay (would be actual API call)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulate success/failure (90% success rate)
        const success = Math.random() > 0.1;

        if (!success) {
          setBatchItems(prev => prev.map((it, idx) =>
            idx === i
              ? { ...it, status: 'failed', error: 'Generation failed', completedAt: new Date().toISOString() }
              : it
          ));
          break;
        }

        const imageUrl = `https://picsum.photos/seed/${item.id}-${currentAttempt}/512/512`;

        // Closed-loop evaluation
        if (loopConfig) {
          const mockProfile: CharacterStyleProfile = {
            characterId,
            characterName: item.expression.label,
            avatarUrl: imageUrl,
            styleDeviationScore: 0,
            extractedFeatures: {
              dominantColors: loopConfig.styleDefinition.colorPalette.primaryColors.slice(0, 2),
              colorHarmony: loopConfig.styleDefinition.colorPalette.harmonyType,
              brightness: 50 + Math.random() * 30 - 15,
              contrast: 50 + Math.random() * 30 - 15,
              saturation: 50 + Math.random() * 30 - 15,
              detectedArtStyle: [loopConfig.styleDefinition.artDirection],
            },
            lastAnalyzedAt: new Date().toISOString(),
          };

          const result = evaluateGenerationResult(mockProfile, loopConfig, currentAttempt);

          if (result.accepted) {
            accepted = true;
            setBatchItems(prev => prev.map((it, idx) =>
              idx === i
                ? {
                  ...it,
                  status: 'completed',
                  imageUrl,
                  deviationScore: Math.round(result.deviationScore),
                  retryCount: currentAttempt,
                  wasRetried: currentAttempt > 0,
                  completedAt: new Date().toISOString(),
                }
                : it
            ));
            onItemGenerated?.(items[i]);
          } else {
            // Retry with strengthened prompt
            currentAttempt++;
            // strengthenStylePrompt adjusts the prompt for next iteration
            strengthenStylePrompt(basePrompt, loopConfig.styleDefinition, currentAttempt);
          }
        } else {
          // No closed-loop — accept immediately
          accepted = true;
          setBatchItems(prev => prev.map((it, idx) =>
            idx === i
              ? {
                ...it,
                status: 'completed',
                imageUrl,
                completedAt: new Date().toISOString(),
              }
              : it
          ));
          onItemGenerated?.(items[i]);
        }
      }
    }

    setIsRunning(false);
    onBatchComplete?.(batchItems);
  };

  const pauseBatch = () => {
    setIsPaused(true);
  };

  const resumeBatch = () => {
    setIsPaused(false);
    // Resume logic would go here
  };

  const cancelBatch = () => {
    setIsRunning(false);
    setIsPaused(false);
    setBatchItems(prev => prev.map(it =>
      it.status === 'pending' || it.status === 'generating'
        ? { ...it, status: 'cancelled' }
        : it
    ));
  };

  const resetBatch = () => {
    setBatchItems([]);
    setShowConfig(true);
  };

  const retryItem = (itemId: string) => {
    setBatchItems(prev => prev.map(it =>
      it.id === itemId ? { ...it, status: 'pending', error: undefined } : it
    ));
    // Would trigger regeneration
  };

  const removeItem = (itemId: string) => {
    setBatchItems(prev => prev.filter(it => it.id !== itemId));
  };

  return (
    <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
            batch_generator
          </h3>
          {batchItems.length > 0 && (
            <span className="px-2 py-0.5 bg-cyan-500/20 rounded text-cyan-400 font-mono text-sm">
              {progress.completed}/{progress.total}
            </span>
          )}
        </div>

        {batchItems.length > 0 && (
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-1.5 rounded bg-slate-800/40 hover:bg-slate-700/60 text-slate-400"
          >
            {showConfig ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* Configuration Panel */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Quick Presets */}
            <div className="mb-4">
              <span className="font-mono text-sm text-slate-400 uppercase mb-2 block">
                quick_presets
              </span>
              <div className="flex flex-wrap gap-2">
                {QUICK_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    disabled={disabled || isRunning}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border font-mono text-sm transition-all',
                      'bg-slate-800/40 border-slate-700/50 text-slate-300',
                      'hover:border-cyan-500/40 hover:bg-cyan-500/10',
                      (disabled || isRunning) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Expression Selection */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm text-slate-400 uppercase">
                  select_expressions
                </span>
                <span className="font-mono text-sm text-slate-400">
                  {selectedExpressions.size} selected
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {EXPRESSION_LIBRARY.map(exp => {
                  const isSelected = selectedExpressions.has(exp.id);
                  return (
                    <button
                      key={exp.id}
                      onClick={() => toggleExpression(exp.id)}
                      disabled={disabled || isRunning}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2 rounded-lg border transition-all',
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-500/40'
                          : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600',
                        (disabled || isRunning) && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <span className={exp.color}>{exp.icon}</span>
                      <span className={cn(
                        'font-mono text-sm uppercase',
                        isSelected ? 'text-cyan-400' : 'text-slate-400'
                      )}>
                        {exp.label}
                      </span>
                      {isSelected && (
                        <Check size={10} className="text-cyan-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pose & Intensity */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="font-mono text-sm text-slate-400 uppercase mb-2 block">
                  pose (optional)
                </span>
                <select
                  value={selectedPose?.id || ''}
                  onChange={(e) => setSelectedPose(
                    POSE_PRESETS.find(p => p.id === e.target.value) || null
                  )}
                  disabled={disabled || isRunning}
                  className="w-full px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-lg
                             font-mono text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/50
                             disabled:opacity-50"
                >
                  <option value="">No specific pose</option>
                  {POSE_PRESETS.map(pose => (
                    <option key={pose.id} value={pose.id}>{pose.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <span className="font-mono text-sm text-slate-400 uppercase mb-2 block">
                  intensity: {intensity}%
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  disabled={disabled || isRunning}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                             [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400
                             disabled:opacity-50"
                />
              </div>
            </div>

            {/* Closed-Loop Consistency */}
            {styleDefinition && (
              <div className="mb-4 p-3 rounded-lg border border-slate-700/50 bg-slate-800/30">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 font-mono text-sm text-slate-300 uppercase">
                    <Shield size={14} className="text-purple-400" />
                    closed-loop consistency
                  </label>
                  <button
                    onClick={() => setClosedLoopEnabled(!closedLoopEnabled)}
                    disabled={disabled || isRunning}
                    className={cn(
                      'w-9 h-5 rounded-full transition-colors relative',
                      closedLoopEnabled ? 'bg-purple-500' : 'bg-slate-600',
                      (disabled || isRunning) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <span className={cn(
                      'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                      closedLoopEnabled ? 'translate-x-4' : 'translate-x-0.5'
                    )} />
                  </button>
                </div>

                <AnimatePresence>
                  {closedLoopEnabled && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-3 pt-2"
                    >
                      <p className="font-mono text-sm text-slate-400">
                        Auto-evaluate each generation and retry if style deviation exceeds threshold.
                      </p>
                      <div>
                        <span className="font-mono text-sm text-slate-400 uppercase block mb-1">
                          deviation threshold: {deviationThreshold}
                        </span>
                        <input
                          type="range"
                          min={10}
                          max={80}
                          value={deviationThreshold}
                          onChange={(e) => setDeviationThreshold(Number(e.target.value))}
                          disabled={disabled || isRunning}
                          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400
                                     disabled:opacity-50"
                        />
                        <div className="flex justify-between font-mono text-sm text-slate-500 mt-0.5">
                          <span>strict (10)</span>
                          <span>lenient (80)</span>
                        </div>
                      </div>
                      <div>
                        <span className="font-mono text-sm text-slate-400 uppercase block mb-1">
                          max retries: {maxRetries}
                        </span>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3].map(n => (
                            <button
                              key={n}
                              onClick={() => setMaxRetries(n)}
                              disabled={disabled || isRunning}
                              className={cn(
                                'flex-1 py-1.5 rounded font-mono text-sm transition-all',
                                maxRetries === n
                                  ? 'bg-purple-500/30 border border-purple-500/50 text-purple-300'
                                  : 'bg-slate-800/40 border border-slate-700/50 text-slate-400 hover:border-slate-600',
                                (disabled || isRunning) && 'opacity-50 cursor-not-allowed'
                              )}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Start Button */}
            <button
              onClick={startBatch}
              disabled={disabled || isRunning || selectedExpressions.size === 0}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg',
                'font-mono text-sm uppercase tracking-wide transition-all',
                'bg-cyan-600 hover:bg-cyan-500 text-white',
                'shadow-lg hover:shadow-cyan-500/20',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
              )}
            >
              <Layers size={16} />
              generate {selectedExpressions.size} expressions
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      {batchItems.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-sm text-slate-400 uppercase">progress</span>
            <span className="font-mono text-sm text-slate-400">
              {progress.completed} / {progress.total} completed
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-green-500 transition-all duration-300"
              style={{ width: `${(progress.completed / progress.total) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm font-mono">
            <span className="text-green-400">{progress.completed} done</span>
            <span className="text-red-400">{progress.failed} failed</span>
            <span className="text-slate-400">{progress.pending} pending</span>
            {progress.retried > 0 && (
              <span className="text-purple-400">{progress.retried} retried</span>
            )}
          </div>
        </div>
      )}

      {/* Control Buttons */}
      {isRunning && (
        <div className="flex items-center gap-2 mb-4">
          {isPaused ? (
            <button
              onClick={resumeBatch}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                         bg-green-600 hover:bg-green-500 text-white font-mono text-sm uppercase"
            >
              <Play size={14} />
              resume
            </button>
          ) : (
            <button
              onClick={pauseBatch}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                         bg-amber-600 hover:bg-amber-500 text-white font-mono text-sm uppercase"
            >
              <Pause size={14} />
              pause
            </button>
          )}
          <button
            onClick={cancelBatch}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                       bg-red-600 hover:bg-red-500 text-white font-mono text-sm uppercase"
          >
            <Square size={14} />
            cancel
          </button>
        </div>
      )}

      {/* Batch Items Grid */}
      {batchItems.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          <AnimatePresence>
            {batchItems.map(item => (
              <BatchItemCard
                key={item.id}
                item={item}
                onRemove={() => removeItem(item.id)}
                onRetry={() => retryItem(item.id)}
                disabled={isRunning}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Completion Actions */}
      {!isRunning && completedItems.length > 0 && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700/50">
          <button
            onClick={resetBatch}
            className="flex items-center gap-2 px-3 py-2 rounded-lg
                       bg-slate-700 hover:bg-slate-600 text-white font-mono text-sm uppercase"
          >
            <RefreshCw size={14} />
            new batch
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                       bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-sm uppercase"
          >
            <Download size={14} />
            export all ({completedItems.length})
          </button>
        </div>
      )}

      {/* Warning */}
      {selectedExpressions.size > 8 && showConfig && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mt-4 p-2 bg-amber-500/10 border border-amber-500/30 rounded"
        >
          <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
          <span className="font-mono text-sm text-amber-400/80">
            Large batches may take longer and use more API credits
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default BatchGenerator;
