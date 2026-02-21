/**
 * BeatClassifier
 * AI-assisted beat classification component with category, subtype,
 * emotional markers, and function tags
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Wand2,
  Check,
  ChevronDown,
  Tag,
  Zap,
  Target,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Info,
} from 'lucide-react';
import {
  type BeatCategory,
  type BeatSubtype,
  type FunctionTag,
  type BeatClassification,
  type EmotionalMarker,
  BEAT_TYPES,
  FUNCTIONS,
  getBeatTypesForCategory,
  getCategories,
  classifyBeatContent,
  analyzeEmotions,
  suggestFunctions,
} from '@/lib/beats/TaxonomyLibrary';
import EmotionalMarkers, { EmotionalMarkersCompact } from './EmotionalMarkers';

// Category icons
const CATEGORY_ICONS: Record<BeatCategory, string> = {
  action: '⚡',
  revelation: '💡',
  decision: '⚖️',
  emotional: '❤️',
  dialogue: '💬',
  transition: '🔄',
  setup: '🎯',
  payoff: '🎆',
};

interface BeatClassifierProps {
  beatId: string;
  beatName: string;
  beatDescription?: string;
  classification?: BeatClassification;
  onClassificationChange?: (classification: BeatClassification) => void;
  position?: number; // 0-1 position in story
  totalBeats?: number;
  readonly?: boolean;
  compact?: boolean;
}

// Category selector
function CategorySelector({
  selected,
  onSelect,
  suggestions,
}: {
  selected: BeatCategory | null;
  onSelect: (category: BeatCategory) => void;
  suggestions: { category: BeatCategory; confidence: number }[];
}) {
  const categories = getCategories();
  const suggestedCategories = suggestions.map(s => s.category);

  return (
    <div className="grid grid-cols-4 gap-2">
      {categories.map((category) => {
        const isSuggested = suggestedCategories.includes(category);
        const suggestion = suggestions.find(s => s.category === category);

        return (
          <button
            key={category}
            onClick={() => onSelect(category)}
            className={cn(
              'relative flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all',
              'text-xs font-medium capitalize',
              selected === category
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                : isSuggested
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
            )}
          >
            <span className="text-lg">{CATEGORY_ICONS[category]}</span>
            <span>{category}</span>
            {suggestion && (
              <span className="absolute -top-1 -right-1 px-1 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-400">
                {Math.round(suggestion.confidence * 100)}%
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Subtype selector
function SubtypeSelector({
  category,
  selected,
  onSelect,
  suggestions,
}: {
  category: BeatCategory;
  selected: BeatSubtype | null;
  onSelect: (subtype: BeatSubtype) => void;
  suggestions: { subtype: BeatSubtype; confidence: number }[];
}) {
  const subtypes = getBeatTypesForCategory(category);
  const suggestedSubtypes = suggestions.map(s => s.subtype);

  return (
    <div className="space-y-2">
      <div className="text-xs text-slate-400 font-medium">Select Type</div>
      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
        {subtypes.map((type) => {
          const isSuggested = suggestedSubtypes.includes(type.subtype);
          const suggestion = suggestions.find(s => s.subtype === type.subtype);

          return (
            <button
              key={type.subtype}
              onClick={() => onSelect(type.subtype)}
              className={cn(
                'relative flex items-start gap-2 p-2 rounded-lg border transition-all text-left',
                selected === type.subtype
                  ? 'bg-cyan-500/20 border-cyan-500/50'
                  : isSuggested
                    ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'
                    : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50'
              )}
            >
              <span className="text-base">{type.icon}</span>
              <div className="flex-1 min-w-0">
                <div className={cn(
                  'text-xs font-medium',
                  selected === type.subtype ? 'text-cyan-400' : 'text-slate-200'
                )}>
                  {type.label}
                </div>
                <div className="text-[10px] text-slate-500 line-clamp-2">
                  {type.description}
                </div>
              </div>
              {suggestion && (
                <span className="absolute -top-1 -right-1 px-1 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-400">
                  {Math.round(suggestion.confidence * 100)}%
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Function tag selector
function FunctionTagSelector({
  selected,
  onToggle,
  suggestions,
}: {
  selected: FunctionTag[];
  onToggle: (tag: FunctionTag) => void;
  suggestions: FunctionTag[];
}) {
  const [showAll, setShowAll] = useState(false);
  const displayedFunctions = showAll ? FUNCTIONS : FUNCTIONS.slice(0, 12);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-400 font-medium">Function Tags</div>
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-[10px] text-cyan-400 hover:text-cyan-300"
        >
          {showAll ? 'Show less' : 'Show all'}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {displayedFunctions.map((func) => {
          const isSelected = selected.includes(func.tag);
          const isSuggested = suggestions.includes(func.tag);

          return (
            <button
              key={func.tag}
              onClick={() => onToggle(func.tag)}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all',
                'border',
                isSelected
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                  : isSuggested
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                    : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-700/50'
              )}
              title={func.description}
            >
              <Tag className="w-2.5 h-2.5" />
              {func.label}
              {isSelected && <Check className="w-2.5 h-2.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// AI suggestion panel
function AISuggestionPanel({
  onApply,
  suggestions,
  isAnalyzing,
}: {
  onApply: () => void;
  suggestions: {
    categories: { category: BeatCategory; subtype: BeatSubtype; confidence: number }[];
    emotions: EmotionalMarker[];
    functions: FunctionTag[];
  };
  isAnalyzing: boolean;
}) {
  if (isAnalyzing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg"
      >
        <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
        <span className="text-xs text-amber-400">Analyzing beat content...</span>
      </motion.div>
    );
  }

  if (suggestions.categories.length === 0) {
    return null;
  }

  const topSuggestion = suggestions.categories[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 bg-gradient-to-r from-amber-500/10 to-cyan-500/10 border border-amber-500/30 rounded-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Wand2 className="w-4 h-4 text-amber-400 mt-0.5" />
          <div>
            <div className="text-xs font-medium text-slate-200">
              AI Suggestion
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Suggested: <span className="text-amber-400 capitalize">{topSuggestion.category}</span>
              {' → '}
              <span className="text-cyan-400">{topSuggestion.subtype.replace('_', ' ')}</span>
              <span className="text-slate-500 ml-1">
                ({Math.round(topSuggestion.confidence * 100)}% confidence)
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onApply}
          className="flex items-center gap-1 px-2 py-1 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-medium hover:bg-cyan-500/30 transition-colors"
        >
          <Sparkles className="w-3 h-3" />
          Apply All
        </button>
      </div>
    </motion.div>
  );
}

export default function BeatClassifier({
  beatId,
  beatName,
  beatDescription = '',
  classification,
  onClassificationChange,
  position = 0.5,
  totalBeats = 10,
  readonly = false,
  compact = false,
}: BeatClassifierProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // AI suggestions
  const suggestions = useMemo(() => {
    const content = `${beatName} ${beatDescription}`;
    return {
      categories: classifyBeatContent(content, beatName),
      emotions: analyzeEmotions(content),
      functions: suggestFunctions(content, position, totalBeats),
    };
  }, [beatName, beatDescription, position, totalBeats]);

  // Current values
  const category = classification?.category || null;
  const subtype = classification?.subtype || null;
  const emotionalMarkers = classification?.emotionalMarkers || [];
  const functionTags = classification?.functionTags || [];

  // Handlers
  const handleCategorySelect = useCallback((newCategory: BeatCategory) => {
    if (!onClassificationChange || readonly) return;

    // If category changes, reset subtype
    const subtypes = getBeatTypesForCategory(newCategory);
    const newSubtype = subtypes.length > 0 ? subtypes[0].subtype : (null as unknown as BeatSubtype);

    onClassificationChange({
      beatId,
      category: newCategory,
      subtype: newSubtype,
      confidence: 1,
      emotionalMarkers,
      functionTags,
    });
  }, [beatId, emotionalMarkers, functionTags, onClassificationChange, readonly]);

  const handleSubtypeSelect = useCallback((newSubtype: BeatSubtype) => {
    if (!onClassificationChange || readonly || !category) return;

    onClassificationChange({
      beatId,
      category,
      subtype: newSubtype,
      confidence: 1,
      emotionalMarkers,
      functionTags,
    });
  }, [beatId, category, emotionalMarkers, functionTags, onClassificationChange, readonly]);

  const handleEmotionsChange = useCallback((markers: EmotionalMarker[]) => {
    if (!onClassificationChange || readonly) return;

    onClassificationChange({
      beatId,
      category: category || 'action',
      subtype: subtype || 'confrontation',
      confidence: classification?.confidence || 1,
      emotionalMarkers: markers,
      functionTags,
    });
  }, [beatId, category, subtype, classification?.confidence, functionTags, onClassificationChange, readonly]);

  const handleFunctionToggle = useCallback((tag: FunctionTag) => {
    if (!onClassificationChange || readonly) return;

    const newTags = functionTags.includes(tag)
      ? functionTags.filter(t => t !== tag)
      : [...functionTags, tag];

    onClassificationChange({
      beatId,
      category: category || 'action',
      subtype: subtype || 'confrontation',
      confidence: classification?.confidence || 1,
      emotionalMarkers,
      functionTags: newTags,
    });
  }, [beatId, category, subtype, classification?.confidence, emotionalMarkers, functionTags, onClassificationChange, readonly]);

  const handleApplyAISuggestions = useCallback(() => {
    if (!onClassificationChange || readonly) return;

    setIsAnalyzing(true);

    setTimeout(() => {
      const topCategory = suggestions.categories[0];

      onClassificationChange({
        beatId,
        category: topCategory?.category || 'action',
        subtype: topCategory?.subtype || 'confrontation',
        confidence: topCategory?.confidence || 0.5,
        emotionalMarkers: suggestions.emotions,
        functionTags: suggestions.functions,
      });

      setIsAnalyzing(false);
    }, 500);
  }, [beatId, onClassificationChange, readonly, suggestions]);

  // Compact view
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {category && subtype && (
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800/50 text-xs">
            <span>{CATEGORY_ICONS[category]}</span>
            <span className="text-slate-300 capitalize">{subtype.replace('_', ' ')}</span>
          </div>
        )}
        <EmotionalMarkersCompact markers={emotionalMarkers} />
        {functionTags.length > 0 && (
          <div className="flex items-center gap-0.5">
            <Tag className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] text-slate-400">{functionTags.length}</span>
          </div>
        )}
        {!readonly && !category && (
          <button
            onClick={() => setIsExpanded(true)}
            className="text-[10px] text-cyan-400 hover:text-cyan-300"
          >
            + Classify
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-slate-200">Beat Classification</span>
        </div>
        {!readonly && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
            <ChevronDown className={cn(
              'w-3.5 h-3.5 transition-transform',
              isExpanded && 'rotate-180'
            )} />
          </button>
        )}
      </div>

      {/* AI Suggestions */}
      {!readonly && suggestions.categories.length > 0 && (
        <AISuggestionPanel
          onApply={handleApplyAISuggestions}
          suggestions={suggestions}
          isAnalyzing={isAnalyzing}
        />
      )}

      {/* Current classification summary */}
      {category && subtype && !isExpanded && (
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{CATEGORY_ICONS[category]}</span>
            <div>
              <div className="text-sm font-medium text-slate-200 capitalize">
                {category} → {subtype.replace('_', ' ')}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <EmotionalMarkersCompact markers={emotionalMarkers} />
                {functionTags.length > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Tag className="w-3 h-3" />
                    {functionTags.length} tags
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded editor */}
      <AnimatePresence>
        {(isExpanded || !category) && !readonly && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Category selector */}
            <div className="space-y-2">
              <div className="text-xs text-slate-400 font-medium">Category</div>
              <CategorySelector
                selected={category}
                onSelect={handleCategorySelect}
                suggestions={suggestions.categories}
              />
            </div>

            {/* Subtype selector */}
            {category && (
              <SubtypeSelector
                category={category}
                selected={subtype}
                onSelect={handleSubtypeSelect}
                suggestions={suggestions.categories.filter(s => s.category === category)}
              />
            )}

            {/* Emotional markers */}
            <div className="space-y-2">
              <div className="text-xs text-slate-400 font-medium">Emotional Markers</div>
              <EmotionalMarkers
                markers={emotionalMarkers}
                onMarkersChange={handleEmotionsChange}
                readonly={readonly}
              />
            </div>

            {/* Function tags */}
            {category && subtype && (
              <FunctionTagSelector
                selected={functionTags}
                onToggle={handleFunctionToggle}
                suggestions={suggestions.functions}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info for unclassified */}
      {!category && readonly && (
        <div className="flex items-center gap-2 p-3 bg-slate-800/30 rounded-lg text-xs text-slate-500">
          <Info className="w-4 h-4" />
          <span>This beat has not been classified yet.</span>
        </div>
      )}
    </div>
  );
}

// Export compact classifier for tables
export function BeatClassifierCompact({
  category,
  subtype,
  emotionalMarkers,
  functionTags,
}: {
  category?: BeatCategory;
  subtype?: BeatSubtype;
  emotionalMarkers?: EmotionalMarker[];
  functionTags?: FunctionTag[];
}) {
  if (!category || !subtype) {
    return (
      <span className="text-[10px] text-slate-500 italic">Unclassified</span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-800/50"
        title={`${category} - ${subtype}`}
      >
        <span>{CATEGORY_ICONS[category]}</span>
        <span className="text-slate-300 capitalize max-w-16 truncate">
          {subtype.replace('_', ' ')}
        </span>
      </div>
      {emotionalMarkers && emotionalMarkers.length > 0 && (
        <EmotionalMarkersCompact markers={emotionalMarkers} />
      )}
      {functionTags && functionTags.length > 0 && (
        <div className="flex items-center text-[10px] text-slate-500">
          <Tag className="w-2.5 h-2.5 mr-0.5" />
          {functionTags.length}
        </div>
      )}
    </div>
  );
}
