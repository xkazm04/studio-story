/**
 * ValidationPanel
 * UI component for displaying narrative logic validation errors and warnings
 */

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Lightbulb,
  ArrowRight,
  Link2,
  Unlink2,
  Clock,
  Target,
  Zap,
  Shield,
  Info,
  X,
} from 'lucide-react';
import {
  type ValidationError,
  type ImpactAnalysis,
  DependencyManager,
  type Dependency,
} from '@/lib/beats/DependencyManager';

// Beat summary for display
interface BeatSummary {
  id: string;
  title: string;
  order: number;
  type?: string;
  sceneId?: string;
  sceneName?: string;
}

interface ValidationPanelProps {
  beats: BeatSummary[];
  dependencies: Dependency[];
  onSelectBeat?: (beatId: string) => void;
  onFixSuggestion?: (suggestion: FixSuggestion) => void;
  compact?: boolean;
}

// Fix suggestion types
interface FixSuggestion {
  type: 'reorder' | 'remove_dependency' | 'add_dependency';
  description: string;
  beatIds?: string[];
  dependencyId?: string;
  newOrder?: number;
}

// Validation error type for display
type ValidationErrorType = ValidationError['type'];

// Error type metadata
const ERROR_TYPE_INFO: Record<ValidationErrorType, {
  label: string;
  icon: typeof AlertTriangle;
  color: string;
  description: string;
}> = {
  cycle: {
    label: 'Circular Dependency',
    icon: RefreshCw,
    color: '#ef4444',
    description: 'Beats form a circular chain where A requires B requires C requires A',
  },
  missing_prerequisite: {
    label: 'Missing Prerequisite',
    icon: Link2,
    color: '#f59e0b',
    description: 'A required beat dependency is not present in the story',
  },
  order_violation: {
    label: 'Order Violation',
    icon: Clock,
    color: '#f97316',
    description: 'A beat appears before one of its prerequisites',
  },
  orphan: {
    label: 'Orphan Reference',
    icon: Unlink2,
    color: '#3b82f6',
    description: 'Dependency references a beat that does not exist',
  },
  strength_mismatch: {
    label: 'Strength Mismatch',
    icon: AlertCircle,
    color: '#8b5cf6',
    description: 'Dependency strength does not match the relationship type',
  },
};

// Individual error card
function ErrorCard({
  error,
  beatMap,
  onSelectBeat,
  onFix,
  expanded,
  onToggle,
}: {
  error: ValidationError;
  beatMap: Map<string, BeatSummary>;
  onSelectBeat?: (beatId: string) => void;
  onFix?: (suggestion: FixSuggestion) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const typeInfo = ERROR_TYPE_INFO[error.type];
  const Icon = typeInfo?.icon || AlertTriangle;

  // Generate fix suggestions based on error type
  const suggestions = useMemo((): FixSuggestion[] => {
    switch (error.type) {
      case 'cycle':
        return [{
          type: 'remove_dependency',
          description: 'Remove one dependency to break the cycle',
        }];
      case 'order_violation':
        if (error.affectedBeats.length >= 2) {
          const [prereq, dependent] = error.affectedBeats;
          const prereqBeat = beatMap.get(prereq);
          const dependentBeat = beatMap.get(dependent);
          if (prereqBeat && dependentBeat) {
            return [
              {
                type: 'reorder',
                description: `Move "${prereqBeat.title}" before "${dependentBeat.title}"`,
                beatIds: [prereq],
                newOrder: dependentBeat.order - 1,
              },
              {
                type: 'reorder',
                description: `Move "${dependentBeat.title}" after "${prereqBeat.title}"`,
                beatIds: [dependent],
                newOrder: prereqBeat.order + 1,
              },
            ];
          }
        }
        return [];
      case 'missing_prerequisite':
        return [{
          type: 'add_dependency',
          description: 'Add the missing prerequisite beat',
          beatIds: error.affectedBeats,
        }];
      default:
        return [];
    }
  }, [error, beatMap]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'rounded-lg border overflow-hidden',
        error.severity === 'error'
          ? 'bg-red-500/5 border-red-500/30'
          : error.severity === 'warning'
          ? 'bg-amber-500/5 border-amber-500/30'
          : 'bg-blue-500/5 border-blue-500/30'
      )}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition-colors"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${typeInfo?.color || '#64748b'}20` }}
        >
          <Icon className="w-4 h-4" style={{ color: typeInfo?.color || '#64748b' }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-200">{typeInfo?.label || error.type}</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded font-medium uppercase',
                error.severity === 'error'
                  ? 'bg-red-500/20 text-red-400'
                  : error.severity === 'warning'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-blue-500/20 text-blue-400'
              )}
            >
              {error.severity}
            </span>
          </div>
          <p className="text-xs text-slate-400 truncate">{error.message}</p>
        </div>

        <ChevronRight
          className={cn(
            'w-4 h-4 text-slate-400 transition-transform',
            expanded && 'rotate-90'
          )}
        />
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-700/50"
          >
            <div className="p-3 space-y-3">
              {/* Affected beats */}
              {error.affectedBeats.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs text-slate-500 font-medium">Affected Beats</span>
                  <div className="flex flex-wrap gap-1">
                    {error.affectedBeats.map((beatId) => {
                      const beat = beatMap.get(beatId);
                      return (
                        <button
                          key={beatId}
                          onClick={() => onSelectBeat?.(beatId)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs
                            bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-colors"
                        >
                          <span className="text-slate-500">{beat?.order}.</span>
                          {beat?.title || 'Unknown'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Description */}
              {typeInfo?.description && (
                <div className="text-xs text-slate-400 p-2 bg-slate-800/50 rounded border border-slate-700/50">
                  <Info className="w-3 h-3 inline-block mr-1 text-slate-500" />
                  {typeInfo.description}
                </div>
              )}

              {/* Suggestion */}
              {error.suggestion && (
                <div className="text-xs text-cyan-400 p-2 bg-cyan-500/10 rounded border border-cyan-500/30">
                  <Lightbulb className="w-3 h-3 inline-block mr-1" />
                  {error.suggestion}
                </div>
              )}

              {/* Fix suggestions */}
              {suggestions.length > 0 && onFix && (
                <div className="space-y-1.5">
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" />
                    Suggested Fixes
                  </span>
                  <div className="space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => onFix(suggestion)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs
                          bg-cyan-500/10 border border-cyan-500/20 text-cyan-400
                          hover:bg-cyan-500/20 transition-colors text-left"
                      >
                        <Zap className="w-3 h-3 flex-shrink-0" />
                        {suggestion.description}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Impact analysis display
function ImpactDisplay({
  impact,
  beatMap,
  onSelectBeat,
}: {
  impact: ImpactAnalysis;
  beatMap: Map<string, BeatSummary>;
  onSelectBeat?: (beatId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-slate-200">Impact Analysis</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded font-medium',
              impact.impactScore > 70
                ? 'bg-red-500/20 text-red-400'
                : impact.impactScore > 40
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-green-500/20 text-green-400'
            )}
          >
            {impact.impactScore}% impact
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-slate-400 transition-transform',
              expanded && 'rotate-180'
            )}
          />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 space-y-3 border-t border-slate-700/50 pt-3"
          >
            {/* Direct dependents */}
            {impact.directlyAffected.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs text-slate-500">Directly affected ({impact.directlyAffected.length})</span>
                <div className="flex flex-wrap gap-1">
                  {impact.directlyAffected.map((beatId) => {
                    const beat = beatMap.get(beatId);
                    return (
                      <button
                        key={beatId}
                        onClick={() => onSelectBeat?.(beatId)}
                        className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300
                          hover:bg-amber-500/30 transition-colors"
                      >
                        {beat?.title || beatId}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Indirect dependents */}
            {impact.transitivelyAffected.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs text-slate-500">Transitively affected ({impact.transitivelyAffected.length})</span>
                <div className="flex flex-wrap gap-1">
                  {impact.transitivelyAffected.slice(0, 10).map((beatId) => {
                    const beat = beatMap.get(beatId);
                    return (
                      <button
                        key={beatId}
                        onClick={() => onSelectBeat?.(beatId)}
                        className="text-xs px-2 py-0.5 rounded bg-slate-700/50 text-slate-300
                          hover:bg-slate-700 transition-colors"
                      >
                        {beat?.title || beatId}
                      </button>
                    );
                  })}
                  {impact.transitivelyAffected.length > 10 && (
                    <span className="text-xs text-slate-500">
                      +{impact.transitivelyAffected.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Warnings */}
            {impact.warnings.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs text-amber-400 font-medium">Warnings</span>
                <ul className="text-xs text-amber-300 space-y-0.5">
                  {impact.warnings.map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ValidationPanel({
  beats,
  dependencies,
  onSelectBeat,
  onFixSuggestion,
  compact = false,
}: ValidationPanelProps) {
  const [expandedError, setExpandedError] = useState<string | null>(null);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [selectedBeatForImpact, setSelectedBeatForImpact] = useState<string | null>(null);

  // Create dependency manager
  const manager = useMemo(() => {
    const m = new DependencyManager();
    const beatData = beats.map(b => ({ id: b.id, name: b.title, order: b.order }));
    m.initializeFromBeats(beatData, []);
    dependencies.forEach(d => m.addDependency(d));
    return m;
  }, [dependencies, beats]);

  // Get validation errors
  const validationErrors = useMemo(() => {
    const beatOrders = new Map(beats.map(b => [b.id, b.order]));
    return manager.validate(beatOrders);
  }, [manager, beats]);

  // Create beat lookup
  const beatMap = useMemo(() => new Map(beats.map(b => [b.id, b])), [beats]);

  // Filter errors
  const filteredErrors = useMemo(() => {
    if (showOnlyErrors) {
      return validationErrors.filter(e => e.severity === 'error');
    }
    return validationErrors;
  }, [validationErrors, showOnlyErrors]);

  // Get impact for selected beat
  const selectedImpact = useMemo(() => {
    if (!selectedBeatForImpact) return null;
    return manager.analyzeImpact(selectedBeatForImpact);
  }, [manager, selectedBeatForImpact]);

  // Get suggested order
  const suggestedOrder = useMemo(() => manager.suggestOptimalOrder(), [manager]);

  // Stats
  const errorCount = validationErrors.filter(e => e.severity === 'error').length;
  const warningCount = validationErrors.filter(e => e.severity === 'warning').length;

  if (compact) {
    return (
      <div className="space-y-2">
        {/* Compact summary */}
        <div className="flex items-center gap-2">
          {errorCount === 0 && warningCount === 0 ? (
            <div className="flex items-center gap-1 text-green-400 text-xs">
              <CheckCircle className="w-3.5 h-3.5" />
              All validations passed
            </div>
          ) : (
            <>
              {errorCount > 0 && (
                <div className="flex items-center gap-1 text-red-400 text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errorCount} error{errorCount !== 1 ? 's' : ''}
                </div>
              )}
              {warningCount > 0 && (
                <div className="flex items-center gap-1 text-amber-400 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {warningCount} warning{warningCount !== 1 ? 's' : ''}
                </div>
              )}
            </>
          )}
        </div>

        {/* First few errors */}
        {filteredErrors.slice(0, 2).map((error, index) => (
          <div
            key={index}
            className={cn(
              'text-xs p-2 rounded border',
              error.severity === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            )}
          >
            {error.message}
          </div>
        ))}
        {filteredErrors.length > 2 && (
          <div className="text-xs text-slate-500">+{filteredErrors.length - 2} more issues</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-slate-200">Validation</h3>
          <div className="flex items-center gap-2">
            {errorCount === 0 && warningCount === 0 ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs">
                <CheckCircle className="w-3 h-3" />
                Valid
              </span>
            ) : (
              <>
                {errorCount > 0 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    {errorCount}
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs">
                    <AlertTriangle className="w-3 h-3" />
                    {warningCount}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {validationErrors.length > 0 && (
          <button
            onClick={() => setShowOnlyErrors(!showOnlyErrors)}
            className={cn(
              'text-xs px-2 py-1 rounded transition-colors',
              showOnlyErrors
                ? 'bg-red-500/20 text-red-400'
                : 'bg-slate-700/50 text-slate-400 hover:text-slate-200'
            )}
          >
            {showOnlyErrors ? 'Show all' : 'Errors only'}
          </button>
        )}
      </div>

      {/* Errors list */}
      {filteredErrors.length > 0 ? (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredErrors.map((error, index) => (
              <ErrorCard
                key={`${error.type}-${index}`}
                error={error}
                beatMap={beatMap}
                onSelectBeat={onSelectBeat}
                onFix={onFixSuggestion}
                expanded={expandedError === `${error.type}-${index}`}
                onToggle={() =>
                  setExpandedError(
                    expandedError === `${error.type}-${index}` ? null : `${error.type}-${index}`
                  )
                }
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-400/50 mx-auto mb-2" />
          <p className="text-sm text-slate-400">All narrative logic validated</p>
          <p className="text-xs text-slate-500 mt-1">
            No circular dependencies, missing prerequisites, or order violations found
          </p>
        </div>
      )}

      {/* Impact analysis section */}
      {dependencies.length > 0 && (
        <div className="border-t border-slate-700/50 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-slate-300">Impact Analysis</h4>
            <select
              value={selectedBeatForImpact || ''}
              onChange={(e) => setSelectedBeatForImpact(e.target.value || null)}
              className="text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded
                text-slate-300 focus:outline-none focus:border-cyan-500/50"
            >
              <option value="">Select a beat...</option>
              {beats.map((beat) => (
                <option key={beat.id} value={beat.id}>
                  {beat.order}. {beat.title}
                </option>
              ))}
            </select>
          </div>

          {selectedImpact && (
            <ImpactDisplay
              impact={selectedImpact}
              beatMap={beatMap}
              onSelectBeat={onSelectBeat}
            />
          )}
        </div>
      )}

      {/* Suggested optimal order */}
      {suggestedOrder.length > 0 && validationErrors.some(e => e.type === 'order_violation') && (
        <div className="border-t border-slate-700/50 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-medium text-slate-300">Suggested Order</h4>
          </div>
          <div className="flex flex-wrap gap-1">
            {suggestedOrder.slice(0, 10).map((beatId, index) => {
              const beat = beatMap.get(beatId);
              return (
                <div
                  key={beatId}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800/50 border border-slate-700/50 text-xs"
                >
                  <span className="text-cyan-400">{index + 1}.</span>
                  <span className="text-slate-300">{beat?.title || beatId}</span>
                  {index < suggestedOrder.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-slate-500 ml-1" />
                  )}
                </div>
              );
            })}
            {suggestedOrder.length > 10 && (
              <span className="text-xs text-slate-500 py-1">+{suggestedOrder.length - 10} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Compact validation badge for beat cards
export function ValidationBadge({
  beatId,
  dependencies,
  beats,
}: {
  beatId: string;
  dependencies: Dependency[];
  beats: BeatSummary[];
}) {
  const manager = useMemo(() => {
    const m = new DependencyManager();
    const beatData = beats.map(b => ({ id: b.id, name: b.title, order: b.order }));
    m.initializeFromBeats(beatData, []);
    dependencies.forEach(d => m.addDependency(d));
    return m;
  }, [dependencies, beats]);

  const errors = useMemo(() => {
    const beatOrders = new Map(beats.map(b => [b.id, b.order]));
    return manager.validate(beatOrders).filter(e =>
      e.affectedBeats.includes(beatId)
    );
  }, [manager, beats, beatId]);

  if (errors.length === 0) return null;

  const hasError = errors.some(e => e.severity === 'error');

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]',
        hasError
          ? 'bg-red-500/20 text-red-400'
          : 'bg-amber-500/20 text-amber-400'
      )}
      title={errors.map(e => e.message).join('\n')}
    >
      {hasError ? (
        <AlertCircle className="w-2.5 h-2.5" />
      ) : (
        <AlertTriangle className="w-2.5 h-2.5" />
      )}
      {errors.length}
    </div>
  );
}
