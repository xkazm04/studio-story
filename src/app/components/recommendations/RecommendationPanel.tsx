'use client';

/**
 * RecommendationPanel
 *
 * Unified UI component for displaying cross-feature AI recommendations.
 * Can be used as a sidebar, floating panel, or inline component.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Check,
  X,
  ChevronRight,
  Lightbulb,
  Loader2,
  User,
  FileText,
  Image,
  Link2,
  Zap,
  MapPin,
  Users,
  GitBranch,
  Palette,
  BookOpen,
  Filter,
  Settings,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, IconButton } from '@/app/components/UI/Button';
import type {
  Recommendation,
  RecommendationType,
  RecommendationPriority,
  RecommendationSource,
} from '@/lib/recommendations/types';

// ============================================================================
// Types
// ============================================================================

interface RecommendationPanelProps {
  recommendations: Recommendation[];
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
  variant?: 'sidebar' | 'floating' | 'inline';
  position?: 'left' | 'right';
  maxHeight?: string | number;
  showFilters?: boolean;
  showSettings?: boolean;
  onAccept?: (recommendation: Recommendation) => void;
  onDismiss?: (recommendation: Recommendation) => void;
  onExpand?: (recommendation: Recommendation) => void;
  onClose?: () => void;
  onFilterChange?: (types: RecommendationType[]) => void;
  className?: string;
}

// ============================================================================
// Icon Mapping
// ============================================================================

const TypeIcons: Record<RecommendationType, React.ComponentType<{ className?: string }>> = {
  character: User,
  scene: FileText,
  asset: Image,
  relationship: Link2,
  beat: Zap,
  faction: Users,
  location: MapPin,
  connection: GitBranch,
  style: Palette,
  narrative: BookOpen,
};

const TypeColors: Record<RecommendationType, string> = {
  character: 'text-cyan-400 bg-cyan-500/20',
  scene: 'text-emerald-400 bg-emerald-500/20',
  asset: 'text-purple-400 bg-purple-500/20',
  relationship: 'text-pink-400 bg-pink-500/20',
  beat: 'text-amber-400 bg-amber-500/20',
  faction: 'text-blue-400 bg-blue-500/20',
  location: 'text-orange-400 bg-orange-500/20',
  connection: 'text-indigo-400 bg-indigo-500/20',
  style: 'text-rose-400 bg-rose-500/20',
  narrative: 'text-teal-400 bg-teal-500/20',
};

const PriorityColors: Record<RecommendationPriority, string> = {
  high: 'border-amber-500/50 bg-amber-500/5',
  medium: 'border-slate-600',
  low: 'border-slate-700',
};

const SourceLabels: Record<RecommendationSource, string> = {
  context: 'Context-based',
  pattern: 'Pattern match',
  similarity: 'Similar content',
  gap: 'Missing element',
  learning: 'Learned preference',
  ai: 'AI suggestion',
};

// ============================================================================
// Sub-Components
// ============================================================================

interface RecommendationCardProps {
  recommendation: Recommendation;
  isExpanded: boolean;
  isAccepted: boolean;
  isDismissed: boolean;
  onToggle: () => void;
  onAccept: () => void;
  onDismiss: () => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  isExpanded,
  isAccepted,
  isDismissed,
  onToggle,
  onAccept,
  onDismiss,
}) => {
  const TypeIcon = TypeIcons[recommendation.type];
  const typeColor = TypeColors[recommendation.type];
  const priorityColor = PriorityColors[recommendation.priority];

  if (isDismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        'rounded-lg border overflow-hidden transition-all',
        priorityColor,
        isAccepted && 'opacity-60 bg-emerald-500/5 border-emerald-500/30'
      )}
    >
      {/* Card Header */}
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-start gap-2.5 text-left hover:bg-slate-800/30 transition-colors"
      >
        {/* Type Icon */}
        <div className={cn('w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0', typeColor)}>
          <TypeIcon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="text-xs font-semibold text-slate-100 truncate">
              {recommendation.title}
            </h4>
            {recommendation.priority === 'high' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">
                HIGH
              </span>
            )}
          </div>
          {!isExpanded && (
            <p className="text-[11px] text-slate-400 line-clamp-1">
              {recommendation.description}
            </p>
          )}
        </div>

        {/* Expand Icon */}
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          className="flex-shrink-0 text-slate-500"
        >
          <ChevronRight className="w-4 h-4" />
        </motion.div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 space-y-2.5 border-t border-slate-700/50">
              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed">
                {recommendation.description}
              </p>

              {/* Reason */}
              <div className="flex items-start gap-1.5">
                <Lightbulb className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-400 italic leading-relaxed">
                  {recommendation.reason}
                </p>
              </div>

              {/* Entity Preview */}
              {recommendation.entityPreview && (
                <div className="p-2 rounded bg-slate-800/50 border border-slate-700/50">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">
                    {recommendation.entityType}
                  </div>
                  <div className="text-xs text-slate-200 font-medium">
                    {recommendation.entityName}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {recommendation.entityPreview}
                  </p>
                </div>
              )}

              {/* Metadata Tags */}
              <div className="flex flex-wrap gap-1.5">
                <span className={cn(
                  'text-[9px] px-1.5 py-0.5 rounded font-medium',
                  typeColor
                )}>
                  {recommendation.type}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
                  {SourceLabels[recommendation.source]}
                </span>
                {recommendation.confidence >= 0.8 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                    High confidence
                  </span>
                )}
              </div>

              {/* Score Bar */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500">Relevance</span>
                <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${recommendation.score * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {Math.round(recommendation.score * 100)}%
                </span>
              </div>

              {/* Actions */}
              {!isAccepted && (
                <div className="flex gap-2 pt-1">
                  <Button
                    size="xs"
                    variant="primary"
                    icon={<Check className="w-3 h-3" />}
                    onClick={onAccept}
                    className="flex-1"
                  >
                    {recommendation.action?.label || 'Apply'}
                  </Button>
                  <IconButton
                    icon={<X className="w-3 h-3" />}
                    size="sm"
                    variant="ghost"
                    onClick={onDismiss}
                    aria-label="Dismiss"
                  />
                </div>
              )}

              {isAccepted && (
                <div className="flex items-center justify-center gap-1.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-400">
                  <Check className="w-3 h-3" />
                  Applied
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================================================
// Filter Dropdown
// ============================================================================

interface FilterDropdownProps {
  selectedTypes: RecommendationType[];
  onChange: (types: RecommendationType[]) => void;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({ selectedTypes, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const allTypes: RecommendationType[] = [
    'character', 'scene', 'asset', 'relationship', 'beat',
    'faction', 'location', 'connection', 'style', 'narrative'
  ];

  const toggleType = (type: RecommendationType) => {
    if (selectedTypes.includes(type)) {
      onChange(selectedTypes.filter(t => t !== type));
    } else {
      onChange([...selectedTypes, type]);
    }
  };

  return (
    <div className="relative">
      <IconButton
        icon={<Filter className="w-3.5 h-3.5" />}
        size="sm"
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Filter recommendations"
      />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute right-0 top-full mt-1 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 py-1"
          >
            {allTypes.map(type => {
              const TypeIcon = TypeIcons[type];
              const isSelected = selectedTypes.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={cn(
                    'w-full px-3 py-1.5 flex items-center gap-2 text-left text-xs transition-colors',
                    isSelected ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:bg-slate-800/50'
                  )}
                >
                  <TypeIcon className="w-3.5 h-3.5" />
                  <span className="capitalize flex-1">{type}</span>
                  {isSelected && <Check className="w-3 h-3 text-cyan-400" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  recommendations,
  isLoading = false,
  title = 'Suggestions',
  subtitle = 'Relevant recommendations',
  variant = 'sidebar',
  position = 'right',
  maxHeight = '100%',
  showFilters = true,
  showSettings = false,
  onAccept,
  onDismiss,
  onExpand,
  onClose,
  onFilterChange,
  className,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [filterTypes, setFilterTypes] = useState<RecommendationType[]>([]);

  // Filter recommendations
  const filteredRecommendations = useMemo(() => {
    let filtered = recommendations.filter(r => !dismissedIds.has(r.id));
    if (filterTypes.length > 0) {
      filtered = filtered.filter(r => filterTypes.includes(r.type));
    }
    return filtered;
  }, [recommendations, dismissedIds, filterTypes]);

  // Group by type for summary
  const typeCounts = useMemo(() => {
    const counts = new Map<RecommendationType, number>();
    filteredRecommendations.forEach(r => {
      counts.set(r.type, (counts.get(r.type) || 0) + 1);
    });
    return counts;
  }, [filteredRecommendations]);

  const handleToggle = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
    const rec = recommendations.find(r => r.id === id);
    if (rec && onExpand) {
      onExpand(rec);
    }
  }, [recommendations, onExpand]);

  const handleAccept = useCallback((recommendation: Recommendation) => {
    setAcceptedIds(prev => new Set([...prev, recommendation.id]));
    onAccept?.(recommendation);
    setTimeout(() => setExpandedId(null), 300);
  }, [onAccept]);

  const handleDismiss = useCallback((recommendation: Recommendation) => {
    setDismissedIds(prev => new Set([...prev, recommendation.id]));
    onDismiss?.(recommendation);
  }, [onDismiss]);

  const handleFilterChange = useCallback((types: RecommendationType[]) => {
    setFilterTypes(types);
    onFilterChange?.(types);
  }, [onFilterChange]);

  // Variant-specific styles
  const variantStyles = {
    sidebar: cn(
      'fixed top-0 h-full w-80 bg-slate-950/95 backdrop-blur-xl border-cyan-500/20 shadow-2xl z-40 flex flex-col',
      position === 'left' ? 'left-0 border-r' : 'right-0 border-l'
    ),
    floating: 'w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl flex flex-col',
    inline: 'w-full bg-slate-900/50 border border-slate-700/50 rounded-lg flex flex-col',
  };

  const containerAnimation = variant === 'sidebar' ? {
    initial: { x: position === 'left' ? -320 : 320, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: position === 'left' ? -320 : 320, opacity: 0 },
  } : {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  return (
    <motion.div
      {...containerAnimation}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(variantStyles[variant], className)}
      style={{ maxHeight }}
    >
      {/* Header */}
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
            <p className="text-[10px] text-slate-400">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {showFilters && (
            <FilterDropdown
              selectedTypes={filterTypes}
              onChange={handleFilterChange}
            />
          )}
          {showSettings && (
            <IconButton
              icon={<Settings className="w-3.5 h-3.5" />}
              size="sm"
              variant="ghost"
              aria-label="Settings"
            />
          )}
          {onClose && (
            <IconButton
              icon={<X className="w-4 h-4" />}
              size="sm"
              variant="ghost"
              onClick={onClose}
              aria-label="Close"
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Loading State */}
        {isLoading && filteredRecommendations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
            <p className="text-sm text-slate-400">Finding suggestions...</p>
          </div>
        )}

        {/* Type Summary */}
        {!isLoading && typeCounts.size > 0 && (
          <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-800/50">
            {Array.from(typeCounts.entries()).map(([type, count]) => {
              const TypeIcon = TypeIcons[type];
              return (
                <button
                  key={type}
                  onClick={() => handleFilterChange(
                    filterTypes.includes(type)
                      ? filterTypes.filter(t => t !== type)
                      : [...filterTypes, type]
                  )}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-full text-[10px] transition-colors',
                    filterTypes.includes(type)
                      ? TypeColors[type]
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                  )}
                >
                  <TypeIcon className="w-3 h-3" />
                  <span className="capitalize">{type}</span>
                  <span className="text-[9px] opacity-75">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Recommendations List */}
        <AnimatePresence mode="popLayout">
          {filteredRecommendations.map(rec => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              isExpanded={expandedId === rec.id}
              isAccepted={acceptedIds.has(rec.id)}
              isDismissed={dismissedIds.has(rec.id)}
              onToggle={() => handleToggle(rec.id)}
              onAccept={() => handleAccept(rec)}
              onDismiss={() => handleDismiss(rec)}
            />
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {!isLoading && filteredRecommendations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-slate-500" />
            </div>
            <h4 className="text-sm font-medium text-slate-400 text-center mb-1">
              No suggestions available
            </h4>
            <p className="text-xs text-slate-500 text-center">
              {filterTypes.length > 0
                ? 'Try adjusting your filters'
                : 'Suggestions will appear as you work'}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/30">
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-cyan-500" />
            <span>
              {filteredRecommendations.length} suggestion{filteredRecommendations.length !== 1 ? 's' : ''}
            </span>
          </div>
          {acceptedIds.size > 0 && (
            <span className="text-emerald-400">
              {acceptedIds.size} applied
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RecommendationPanel;
