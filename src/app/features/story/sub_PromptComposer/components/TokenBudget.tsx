/**
 * TokenBudget Component
 *
 * Visual token budget allocation and management interface.
 * Shows real-time token usage, allocation by type, and optimization suggestions.
 */

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins,
  ChevronDown,
  ChevronUp,
  PieChart,
  BarChart3,
  Zap,
  AlertTriangle,
  CheckCircle,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/UI/Button';
import { TYPOGRAPHY, SEMANTIC_COLORS, FM_VARIANTS, FM_TRANSITION } from '@/workspace/theme/tokens';
import {
  type TokenBudget as TokenBudgetType,
  type BudgetUsage,
  type ContextType,
  type CompressionLevel,
  contextCompressor,
} from '@/lib/context';

// ============================================================================
// Types
// ============================================================================

interface TokenBudgetProps {
  budget: TokenBudgetType;
  usage: BudgetUsage;
  compressionLevel: CompressionLevel;
  onBudgetChange?: (budget: TokenBudgetType) => void;
  onCompressionChange?: (level: CompressionLevel) => void;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const TYPE_LABELS: Record<ContextType, string> = {
  project: 'Project',
  scene: 'Scene',
  character: 'Characters',
  relationship: 'Relations',
  faction: 'Factions',
  beat: 'Beats',
  act: 'Acts',
  theme: 'Themes',
  visual: 'Visual',
  dialogue: 'Dialogue',
  location: 'Location',
};

/**
 * 4 semantic groups for 11 context types:
 *   brand   — project, act, beat, theme   (story structure)
 *   accent  — scene, dialogue, visual      (content)
 *   warning — character, relationship      (characters)
 *   success — faction, location            (world)
 */
const TYPE_COLORS: Record<ContextType, string> = {
  project: SEMANTIC_COLORS.brand.dot,
  act: SEMANTIC_COLORS.brand.dot,
  beat: SEMANTIC_COLORS.brand.dot,
  theme: SEMANTIC_COLORS.brand.dot,
  scene: SEMANTIC_COLORS.accent.dot,
  dialogue: SEMANTIC_COLORS.accent.dot,
  visual: SEMANTIC_COLORS.accent.dot,
  character: SEMANTIC_COLORS.warning.dot,
  relationship: SEMANTIC_COLORS.warning.dot,
  faction: SEMANTIC_COLORS.success.dot,
  location: SEMANTIC_COLORS.success.dot,
};

// ============================================================================
// Sub-Components
// ============================================================================

interface BudgetBarProps {
  type: ContextType;
  allocated: number;
  used: number;
  total: number;
}

function BudgetBar({ type, allocated, used, total }: BudgetBarProps) {
  const allocatedPercent = (allocated / total) * 100;
  const usedPercent = (used / total) * 100;
  const utilizationPercent = allocated > 0 ? (used / allocated) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-400 w-16 truncate">{TYPE_LABELS[type]}</span>
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden relative">
        {/* Allocated space indicator */}
        <div
          className="absolute h-full bg-slate-700/50 rounded-full"
          style={{ width: `${allocatedPercent}%` }}
        />
        {/* Used space */}
        <div
          className={cn('absolute h-full rounded-full transition-all', TYPE_COLORS[type])}
          style={{ width: `${usedPercent}%` }}
        />
      </div>
      <span className="text-sm text-slate-400 w-10 text-right">
        {Math.round(utilizationPercent)}%
      </span>
    </div>
  );
}

interface CompressionSelectorProps {
  level: CompressionLevel;
  onChange: (level: CompressionLevel) => void;
  disabled?: boolean;
}

function CompressionSelector({ level, onChange, disabled }: CompressionSelectorProps) {
  const levels = contextCompressor.getCompressionLevels();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">Compression Level</span>
        <span className={cn('text-sm', SEMANTIC_COLORS.brand.text)}>
          {Math.round((1 - levels.find(l => l.level === level)!.ratio) * 100)}% reduction
        </span>
      </div>
      <div className="flex gap-1">
        {levels.map(({ level: l, ratio, description }) => (
          <button
            key={l}
            onClick={() => onChange(l)}
            disabled={disabled}
            title={description}
            className={cn(
              'flex-1 py-1.5 text-sm font-medium rounded transition-all',
              level === l
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {l === 'none' ? 'Full' : l.charAt(0).toUpperCase() + l.slice(1, 3)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function TokenBudget({
  budget,
  usage,
  compressionLevel,
  onBudgetChange,
  onCompressionChange,
  className,
}: TokenBudgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Calculate usage metrics
  const metrics = useMemo(() => {
    const availableTokens = budget.total - budget.reserved;
    const usedTokens = usage.used - budget.reserved;
    const utilizationPercent = availableTokens > 0 ? (usedTokens / availableTokens) * 100 : 0;

    // Determine status
    let status: 'good' | 'warning' | 'critical' = 'good';
    if (utilizationPercent > 90) {
      status = 'critical';
    } else if (utilizationPercent > 75) {
      status = 'warning';
    }

    return {
      availableTokens,
      usedTokens,
      remainingTokens: usage.remaining,
      utilizationPercent,
      status,
    };
  }, [budget, usage]);

  // Get active types (types with allocation > 0)
  const activeTypes = useMemo(() => {
    return (Object.keys(budget.allocated) as ContextType[]).filter(
      type => budget.allocated[type] > 0
    );
  }, [budget.allocated]);

  const statusColors = {
    good: SEMANTIC_COLORS.success.text,
    warning: SEMANTIC_COLORS.warning.text,
    critical: SEMANTIC_COLORS.danger.text,
  };

  const statusIcons = {
    good: <CheckCircle className="w-3.5 h-3.5" />,
    warning: <AlertTriangle className="w-3.5 h-3.5" />,
    critical: <AlertTriangle className="w-3.5 h-3.5" />,
  };

  return (
    <div className={cn('rounded-lg border border-slate-700 bg-slate-800/50', className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded-lg', SEMANTIC_COLORS.warning.bg)}>
            <Coins className={cn('w-3.5 h-3.5', SEMANTIC_COLORS.warning.text)} />
          </div>
          <div>
            <h4 className={TYPOGRAPHY.h2}>Token Budget</h4>
            <p className="text-sm text-slate-400">
              {metrics.usedTokens.toLocaleString()} / {metrics.availableTokens.toLocaleString()} tokens
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={cn('flex items-center gap-1', statusColors[metrics.status])}>
            {statusIcons[metrics.status]}
            <span className="text-sm">{Math.round(metrics.utilizationPercent)}%</span>
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Usage Bar */}
      <div className="p-3 pt-0">
        <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(metrics.utilizationPercent, 100)}%` }}
            transition={FM_TRANSITION.slow}
            className={cn(
              'h-full rounded-full transition-colors',
              metrics.status === 'good' && SEMANTIC_COLORS.success.dot,
              metrics.status === 'warning' && SEMANTIC_COLORS.warning.dot,
              metrics.status === 'critical' && SEMANTIC_COLORS.danger.dot
            )}
          />
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            {...FM_VARIANTS.collapse}
            transition={FM_TRANSITION.slow}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-6 border-t border-slate-700">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded bg-slate-900/50">
                  <div className="text-lg font-bold text-slate-200">
                    {budget.total.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-400">Total Budget</div>
                </div>
                <div className="text-center p-2 rounded bg-slate-900/50">
                  <div className={cn('text-lg font-bold', SEMANTIC_COLORS.success.text)}>
                    {metrics.remainingTokens.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-400">Remaining</div>
                </div>
                <div className="text-center p-2 rounded bg-slate-900/50">
                  <div className={cn('text-lg font-bold', SEMANTIC_COLORS.brand.text)}>
                    {budget.reserved.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-400">Reserved</div>
                </div>
              </div>

              {/* Compression Control */}
              {onCompressionChange && (
                <CompressionSelector
                  level={compressionLevel}
                  onChange={onCompressionChange}
                />
              )}

              {/* Type Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={cn(TYPOGRAPHY.h3, 'text-slate-400 flex items-center gap-1')}>
                    <BarChart3 className="w-3 h-3" />
                    Allocation by Type
                  </span>
                  {onBudgetChange && (
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="p-1 rounded hover:bg-slate-700 transition-colors"
                    >
                      <Settings className="w-3 h-3 text-slate-400" />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {activeTypes.map(type => (
                    <BudgetBar
                      key={type}
                      type={type}
                      allocated={budget.allocated[type]}
                      used={usage.byType[type]?.used || 0}
                      total={budget.total}
                    />
                  ))}
                </div>
              </div>

              {/* Settings Panel */}
              <AnimatePresence>
                {showSettings && onBudgetChange && (
                  <motion.div
                    {...FM_VARIANTS.collapse}
                    transition={FM_TRANSITION.slow}
                    className="space-y-3 pt-2 border-t border-slate-700"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Total Budget</span>
                      <div className="flex items-center gap-1">
                        {[2000, 4000, 8000, 16000].map(tokens => (
                          <button
                            key={tokens}
                            onClick={() => {
                              onBudgetChange(contextCompressor.createBudget(tokens, budget.reserved));
                            }}
                            className={cn(
                              'px-2 py-1 text-sm rounded transition-colors',
                              budget.total === tokens
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                            )}
                          >
                            {(tokens / 1000).toFixed(0)}k
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Reserved for Response</span>
                      <div className="flex items-center gap-1">
                        {[500, 1000, 2000].map(tokens => (
                          <button
                            key={tokens}
                            onClick={() => {
                              onBudgetChange(contextCompressor.createBudget(budget.total, tokens));
                            }}
                            className={cn(
                              'px-2 py-1 text-sm rounded transition-colors',
                              budget.reserved === tokens
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                            )}
                          >
                            {tokens}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onBudgetChange(contextCompressor.createBudget(8000, 1000));
                      }}
                      className="w-full text-sm"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Reset to Defaults
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Optimization Suggestions */}
              {metrics.status !== 'good' && (
                <div className={cn('p-2 rounded', SEMANTIC_COLORS.warning.bg, 'border', SEMANTIC_COLORS.warning.border)}>
                  <div className="flex items-start gap-2">
                    <Zap className={cn('w-3.5 h-3.5 mt-0.5 shrink-0', SEMANTIC_COLORS.warning.text)} />
                    <div className={cn('text-sm', SEMANTIC_COLORS.warning.text)}>
                      {metrics.status === 'critical' ? (
                        <>
                          Budget nearly exhausted. Consider increasing compression level or
                          reducing context scope.
                        </>
                      ) : (
                        <>
                          Budget usage is high. Monitor token usage or increase compression.
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TokenBudget;
