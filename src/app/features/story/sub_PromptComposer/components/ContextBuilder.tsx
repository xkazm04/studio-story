/**
 * ContextBuilder Component
 *
 * Interactive context selection and compression interface.
 * Allows users to select, prioritize, and compress context elements
 * for LLM prompts with real-time token budget visualization.
 */

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  User,
  Heart,
  Map,
  Theater,
  Sparkles,
  ChevronDown,
  ChevronRight,
  GripVertical,
  X,
  Plus,
  Search,
  Filter,
  Copy,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  BarChart2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/UI/Button';
import { TokenBudget } from './TokenBudget';
import {
  relevanceScorer,
  contextCompressor,
  type ContextElement,
  type ScoredContext,
  type ContextType,
  type RelevanceLevel,
  type TokenBudget as TokenBudgetType,
  type BudgetUsage,
  type CompressionLevel,
  type ScoringConfig,
  type CompressedContext,
} from '@/lib/context';

// ============================================================================
// Types
// ============================================================================

interface ContextBuilderProps {
  elements: ContextElement[];
  focusSceneId?: string;
  focusCharacterIds?: string[];
  currentContent?: string;
  onContextGenerated?: (context: CompressedContext) => void;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const TYPE_ICONS: Record<ContextType, React.ReactNode> = {
  project: <FileText className="w-3.5 h-3.5" />,
  scene: <Theater className="w-3.5 h-3.5" />,
  character: <User className="w-3.5 h-3.5" />,
  relationship: <Heart className="w-3.5 h-3.5" />,
  faction: <User className="w-3.5 h-3.5" />,
  beat: <Sparkles className="w-3.5 h-3.5" />,
  act: <Theater className="w-3.5 h-3.5" />,
  theme: <FileText className="w-3.5 h-3.5" />,
  visual: <Eye className="w-3.5 h-3.5" />,
  dialogue: <FileText className="w-3.5 h-3.5" />,
  location: <Map className="w-3.5 h-3.5" />,
};

const TYPE_LABELS: Record<ContextType, string> = {
  project: 'Project',
  scene: 'Scene',
  character: 'Character',
  relationship: 'Relationship',
  faction: 'Faction',
  beat: 'Beat',
  act: 'Act',
  theme: 'Theme',
  visual: 'Visual',
  dialogue: 'Dialogue',
  location: 'Location',
};

const RELEVANCE_COLORS: Record<RelevanceLevel, { text: string; bg: string; border: string }> = {
  critical: { text: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  high: { text: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
  medium: { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
  low: { text: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
  minimal: { text: 'text-slate-500', bg: 'bg-slate-500/20', border: 'border-slate-500/30' },
};

// ============================================================================
// Sub-Components
// ============================================================================

interface ContextElementCardProps {
  scored: ScoredContext;
  isSelected: boolean;
  onToggle: () => void;
  showDetails: boolean;
  onToggleDetails: () => void;
}

function ContextElementCard({
  scored,
  isSelected,
  onToggle,
  showDetails,
  onToggleDetails,
}: ContextElementCardProps) {
  const { element, score, relevanceLevel, factors, tokenEstimate } = scored;
  const colors = RELEVANCE_COLORS[relevanceLevel];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'rounded-lg border transition-all',
        isSelected ? `${colors.border} ${colors.bg}` : 'border-slate-700 bg-slate-800/50',
        isSelected && 'ring-1 ring-purple-500/50'
      )}
    >
      <div className="flex items-start gap-2 p-3">
        {/* Selection Checkbox */}
        <button
          onClick={onToggle}
          className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors',
            isSelected
              ? 'bg-purple-600 border-purple-600 text-white'
              : 'border-slate-600 hover:border-purple-500'
          )}
        >
          {isSelected && <Check className="w-3 h-3" />}
        </button>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('p-1 rounded', colors.bg)}>
              {TYPE_ICONS[element.type]}
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-medium text-slate-200 truncate">{element.name}</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] text-slate-500">{TYPE_LABELS[element.type]}</span>
                <span className="text-[9px] text-slate-600">|</span>
                <span className={cn('text-[9px]', colors.text)}>
                  {relevanceLevel} ({Math.round(score * 100)}%)
                </span>
                <span className="text-[9px] text-slate-600">|</span>
                <span className="text-[9px] text-slate-500">{tokenEstimate} tokens</span>
              </div>
            </div>
          </div>

          {/* Preview */}
          <p className="text-[10px] text-slate-500 line-clamp-2 mt-1.5">
            {element.content.slice(0, 150)}
            {element.content.length > 150 && '...'}
          </p>

          {/* Details Toggle */}
          <button
            onClick={onToggleDetails}
            className="flex items-center gap-1 mt-2 text-[10px] text-slate-500 hover:text-slate-300"
          >
            {showDetails ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            Show relevance factors
          </button>

          {/* Factor Details */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 pt-2 border-t border-slate-700/50 space-y-1">
                  {relevanceScorer.getFactorBreakdown(factors).map(({ label, value, weight }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-500 w-20">{label}</span>
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${value * 100}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-slate-500 w-8 text-right">
                        {Math.round(value * 100)}%
                      </span>
                      <span className="text-[8px] text-slate-600 w-6">
                        x{weight.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ContextBuilder({
  elements,
  focusSceneId,
  focusCharacterIds,
  currentContent,
  onContextGenerated,
  className,
}: ContextBuilderProps) {
  // State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('moderate');
  const [budget, setBudget] = useState<TokenBudgetType>(() => contextCompressor.createBudget(8000, 1000));
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ContextType | 'all'>('all');
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  // Scoring config
  const scoringConfig: ScoringConfig = useMemo(
    () => ({
      focusSceneId,
      focusCharacterIds,
      currentContent,
    }),
    [focusSceneId, focusCharacterIds, currentContent]
  );

  // Score all elements
  const scoredElements = useMemo(() => {
    return relevanceScorer.scoreElements(elements, scoringConfig);
  }, [elements, scoringConfig]);

  // Filter elements
  const filteredElements = useMemo(() => {
    return scoredElements.filter(scored => {
      // Type filter
      if (typeFilter !== 'all' && scored.element.type !== typeFilter) return false;
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          scored.element.name.toLowerCase().includes(query) ||
          scored.element.content.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [scoredElements, typeFilter, searchQuery]);

  // Get selected elements
  const selectedElements = useMemo(() => {
    return scoredElements.filter(scored => selectedIds.has(scored.element.id));
  }, [scoredElements, selectedIds]);

  // Compress selected context
  const compressedContext = useMemo(() => {
    if (selectedElements.length === 0) return null;

    const selectedContextElements = selectedElements.map(s => s.element);
    return contextCompressor.compress(selectedContextElements, {
      tokenBudget: budget,
      compressionLevel,
      preserveNames: true,
      preserveRelationships: true,
      scoringConfig,
    });
  }, [selectedElements, budget, compressionLevel, scoringConfig]);

  // Calculate current usage
  const usage: BudgetUsage = useMemo(() => {
    if (!compressedContext) {
      return {
        total: budget.total,
        used: budget.reserved,
        remaining: budget.total - budget.reserved,
        byType: Object.fromEntries(
          (Object.keys(budget.allocated) as ContextType[]).map(type => [
            type,
            { allocated: budget.allocated[type], used: 0 },
          ])
        ) as Record<ContextType, { allocated: number; used: number }>,
        utilizationPercent: 0,
      };
    }
    return compressedContext.budgetUsage;
  }, [compressedContext, budget]);

  // Auto-select high relevance elements initially
  useEffect(() => {
    const highRelevance = scoredElements
      .filter(s => s.relevanceLevel === 'critical' || s.relevanceLevel === 'high')
      .map(s => s.element.id);
    setSelectedIds(new Set(highRelevance));
  }, [scoredElements]);

  // Notify parent when context changes
  useEffect(() => {
    if (compressedContext && onContextGenerated) {
      onContextGenerated(compressedContext);
    }
  }, [compressedContext, onContextGenerated]);

  // Handlers
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleDetails = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredElements.map(s => s.element.id)));
  }, [filteredElements]);

  const selectNone = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectByRelevance = useCallback((level: RelevanceLevel) => {
    const ids = scoredElements
      .filter(s => s.relevanceLevel === level)
      .map(s => s.element.id);
    setSelectedIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
  }, [scoredElements]);

  const copyContext = useCallback(async () => {
    if (compressedContext) {
      await navigator.clipboard.writeText(compressedContext.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [compressedContext]);

  // Available types
  const availableTypes = useMemo(() => {
    const types = new Set(scoredElements.map(s => s.element.type));
    return Array.from(types);
  }, [scoredElements]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header with Budget */}
      <div className="shrink-0 p-4 border-b border-slate-800 space-y-3">
        <TokenBudget
          budget={budget}
          usage={usage}
          compressionLevel={compressionLevel}
          onBudgetChange={setBudget}
          onCompressionChange={setCompressionLevel}
        />

        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search context..."
              className={cn(
                'w-full pl-8 pr-3 py-1.5 text-xs rounded-md',
                'bg-slate-900/50 border border-slate-700',
                'text-slate-200 placeholder:text-slate-600',
                'focus:outline-none focus:ring-1 focus:ring-purple-500/50'
              )}
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ContextType | 'all')}
            className={cn(
              'px-2 py-1.5 text-xs rounded-md',
              'bg-slate-900/50 border border-slate-700',
              'text-slate-200',
              'focus:outline-none focus:ring-1 focus:ring-purple-500/50'
            )}
          >
            <option value="all">All Types</option>
            {availableTypes.map(type => (
              <option key={type} value={type}>{TYPE_LABELS[type]}</option>
            ))}
          </select>
        </div>

        {/* Selection Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500">Select:</span>
            <button
              onClick={selectAll}
              className="px-1.5 py-0.5 text-[9px] text-slate-400 hover:text-purple-400"
            >
              All
            </button>
            <span className="text-slate-600">/</span>
            <button
              onClick={selectNone}
              className="px-1.5 py-0.5 text-[9px] text-slate-400 hover:text-purple-400"
            >
              None
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => selectByRelevance('critical')}
              className="px-1.5 py-0.5 text-[9px] text-red-400 hover:text-red-300"
            >
              Critical
            </button>
            <button
              onClick={() => selectByRelevance('high')}
              className="px-1.5 py-0.5 text-[9px] text-amber-400 hover:text-amber-300"
            >
              High
            </button>
          </div>
          <span className="text-[10px] text-slate-500">
            {selectedIds.size} of {scoredElements.length} selected
          </span>
        </div>
      </div>

      {/* Elements List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredElements.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No context elements found</p>
            {searchQuery && (
              <p className="text-xs text-slate-600 mt-1">Try a different search term</p>
            )}
          </div>
        ) : (
          <AnimatePresence>
            {filteredElements.map(scored => (
              <ContextElementCard
                key={scored.element.id}
                scored={scored}
                isSelected={selectedIds.has(scored.element.id)}
                onToggle={() => toggleSelection(scored.element.id)}
                showDetails={expandedIds.has(scored.element.id)}
                onToggleDetails={() => toggleDetails(scored.element.id)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Preview Footer */}
      {compressedContext && (
        <div className="shrink-0 border-t border-slate-800">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="w-full flex items-center justify-between p-3 hover:bg-slate-800/50"
          >
            <div className="flex items-center gap-2">
              {showPreview ? (
                <EyeOff className="w-4 h-4 text-slate-500" />
              ) : (
                <Eye className="w-4 h-4 text-slate-500" />
              )}
              <span className="text-xs text-slate-400">
                {showPreview ? 'Hide' : 'Show'} Compressed Preview
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-400">
                {compressedContext.compressedTokens} tokens
              </span>
              <span className="text-[10px] text-slate-600">
                ({Math.round((1 - compressedContext.compressionRatio) * 100)}% saved)
              </span>
            </div>
          </button>

          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 border-t border-slate-700/50 max-h-48 overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-300">Compressed Context</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyContext}
                      className="h-6 text-[10px]"
                    >
                      {copied ? (
                        <Check className="w-3 h-3 mr-1 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 mr-1" />
                      )}
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <pre className="text-[10px] text-slate-400 whitespace-pre-wrap font-mono bg-slate-900/50 p-2 rounded">
                    {compressedContext.content}
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default ContextBuilder;
