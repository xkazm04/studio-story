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

const TYPE_COLORS: Record<ContextType, string> = {
  project: 'bg-purple-500',
  scene: 'bg-cyan-500',
  character: 'bg-amber-500',
  relationship: 'bg-pink-500',
  faction: 'bg-emerald-500',
  beat: 'bg-blue-500',
  act: 'bg-indigo-500',
  theme: 'bg-rose-500',
  visual: 'bg-orange-500',
  dialogue: 'bg-teal-500',
  location: 'bg-slate-500',
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
      <span className="text-[10px] text-slate-400 w-16 truncate">{TYPE_LABELS[type]}</span>
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
      <span className="text-[9px] text-slate-500 w-10 text-right">
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
        <span className="text-xs text-slate-400">Compression Level</span>
        <span className="text-[10px] text-purple-400">
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
              'flex-1 py-1.5 text-[9px] font-medium rounded transition-all',
              level === l
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300',
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
    good: 'text-emerald-400',
    warning: 'text-amber-400',
    critical: 'text-red-400',
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
          <div className="p-1.5 bg-amber-600/20 rounded-lg">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div>
            <h4 className="text-xs font-medium text-slate-200">Token Budget</h4>
            <p className="text-[10px] text-slate-500">
              {metrics.usedTokens.toLocaleString()} / {metrics.availableTokens.toLocaleString()} tokens
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={cn('flex items-center gap-1', statusColors[metrics.status])}>
            {statusIcons[metrics.status]}
            <span className="text-xs">{Math.round(metrics.utilizationPercent)}%</span>
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </button>

      {/* Usage Bar */}
      <div className="px-3 pb-3">
        <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(metrics.utilizationPercent, 100)}%` }}
            transition={{ duration: 0.3 }}
            className={cn(
              'h-full rounded-full transition-colors',
              metrics.status === 'good' && 'bg-emerald-500',
              metrics.status === 'warning' && 'bg-amber-500',
              metrics.status === 'critical' && 'bg-red-500'
            )}
          />
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-4 border-t border-slate-700 pt-3">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded bg-slate-900/50">
                  <div className="text-lg font-bold text-slate-200">
                    {budget.total.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-slate-500">Total Budget</div>
                </div>
                <div className="text-center p-2 rounded bg-slate-900/50">
                  <div className="text-lg font-bold text-emerald-400">
                    {metrics.remainingTokens.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-slate-500">Remaining</div>
                </div>
                <div className="text-center p-2 rounded bg-slate-900/50">
                  <div className="text-lg font-bold text-purple-400">
                    {budget.reserved.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-slate-500">Reserved</div>
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
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    Allocation by Type
                  </span>
                  {onBudgetChange && (
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="p-1 rounded hover:bg-slate-700 transition-colors"
                    >
                      <Settings className="w-3 h-3 text-slate-500" />
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
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-3 pt-2 border-t border-slate-700"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Total Budget</span>
                      <div className="flex items-center gap-1">
                        {[2000, 4000, 8000, 16000].map(tokens => (
                          <button
                            key={tokens}
                            onClick={() => {
                              onBudgetChange(contextCompressor.createBudget(tokens, budget.reserved));
                            }}
                            className={cn(
                              'px-2 py-1 text-[9px] rounded transition-colors',
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
                      <span className="text-xs text-slate-400">Reserved for Response</span>
                      <div className="flex items-center gap-1">
                        {[500, 1000, 2000].map(tokens => (
                          <button
                            key={tokens}
                            onClick={() => {
                              onBudgetChange(contextCompressor.createBudget(budget.total, tokens));
                            }}
                            className={cn(
                              'px-2 py-1 text-[9px] rounded transition-colors',
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
                      className="w-full text-[10px]"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Reset to Defaults
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Optimization Suggestions */}
              {metrics.status !== 'good' && (
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-start gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <div className="text-[10px] text-amber-400">
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
