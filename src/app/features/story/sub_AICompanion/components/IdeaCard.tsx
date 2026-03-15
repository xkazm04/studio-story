/**
 * IdeaCard Component
 *
 * Displays a single generated idea with actions for saving,
 * exploring, and rating.
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Lightbulb,
  Star,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Zap,
  GitBranch,
  Sparkles,
  MessageSquare,
  Users,
  Map,
  Heart,
  Compass,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TYPOGRAPHY, SEMANTIC_COLORS, FM_VARIANTS, FM_TRANSITION } from '@/workspace/theme/tokens';
import type { GeneratedIdea, IdeaType, IdeaImpact } from '@/lib/brainstorm';

// ============================================================================
// Types
// ============================================================================

interface IdeaCardProps {
  idea: GeneratedIdea;
  onSave?: (id: string) => void;
  onUnsave?: (id: string) => void;
  onExplore?: (id: string) => void;
  onRate?: (id: string, rating: 1 | 2 | 3 | 4 | 5) => void;
  compact?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const TYPE_ICONS: Record<IdeaType, React.ReactNode> = {
  'plot-direction': <GitBranch className="w-3.5 h-3.5" />,
  'character-decision': <Users className="w-3.5 h-3.5" />,
  'conflict-escalation': <Zap className="w-3.5 h-3.5" />,
  'twist': <Sparkles className="w-3.5 h-3.5" />,
  'what-if': <MessageSquare className="w-3.5 h-3.5" />,
  'theme-exploration': <Compass className="w-3.5 h-3.5" />,
  'setting-change': <Map className="w-3.5 h-3.5" />,
  'relationship-shift': <Heart className="w-3.5 h-3.5" />,
};

const TYPE_COLORS: Record<IdeaType, string> = {
  'plot-direction': 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
  'character-decision': 'text-amber-400 bg-amber-500/15 border-amber-500/30',
  'conflict-escalation': 'text-red-400 bg-red-500/15 border-red-500/30',
  'twist': 'text-purple-400 bg-purple-500/15 border-purple-500/30',
  'what-if': 'text-blue-400 bg-blue-500/15 border-blue-500/30',
  'theme-exploration': 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
  'setting-change': 'text-orange-400 bg-orange-500/15 border-orange-500/30',
  'relationship-shift': 'text-pink-400 bg-pink-500/15 border-pink-500/30',
};

const IMPACT_COLORS: Record<IdeaImpact, string> = {
  minor: 'bg-slate-500',
  moderate: 'bg-amber-500',
  major: 'bg-orange-500',
  transformative: 'bg-purple-500',
};

const TYPE_LABELS: Record<IdeaType, string> = {
  'plot-direction': 'Plot',
  'character-decision': 'Decision',
  'conflict-escalation': 'Conflict',
  'twist': 'Twist',
  'what-if': 'What If',
  'theme-exploration': 'Theme',
  'setting-change': 'Setting',
  'relationship-shift': 'Relationship',
};

// ============================================================================
// Main Component
// ============================================================================

export function IdeaCard({
  idea,
  onSave,
  onUnsave,
  onExplore,
  onRate,
  compact = false,
}: IdeaCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleSaveToggle = () => {
    if (idea.saved) {
      onUnsave?.(idea.id);
    } else {
      onSave?.(idea.id);
    }
  };

  const handleRating = (rating: 1 | 2 | 3 | 4 | 5) => {
    onRate?.(idea.id, rating);
  };

  if (compact) {
    return (
      <motion.div
        {...FM_VARIANTS.fadeIn}
        transition={FM_TRANSITION.normal}
        className={cn(
          'p-2.5 rounded-lg border transition-all cursor-pointer',
          idea.explored
            ? 'border-slate-700/50 bg-slate-800/30'
            : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800',
          idea.saved && SEMANTIC_COLORS.warning.border
        )}
        onClick={() => onExplore?.(idea.id)}
      >
        <div className="flex items-start gap-2">
          <span className={cn('p-1 rounded', TYPE_COLORS[idea.type])}>
            {TYPE_ICONS[idea.type]}
          </span>
          <div className="flex-1 min-w-0">
            <h4 className={cn(TYPOGRAPHY.h3, 'truncate')}>{idea.title}</h4>
            <p className="text-sm text-slate-400 line-clamp-1">{idea.description}</p>
          </div>
          {idea.saved && <BookmarkCheck className={cn('w-3.5 h-3.5 shrink-0', SEMANTIC_COLORS.warning.text)} />}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      {...FM_VARIANTS.fadeIn}
      transition={FM_TRANSITION.normal}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'rounded-lg border transition-all',
        idea.explored
          ? 'border-slate-700/50 bg-slate-800/30'
          : 'border-slate-700 bg-slate-800/50',
        idea.saved && cn(SEMANTIC_COLORS.warning.border, 'bg-amber-500/5')
      )}
    >
      {/* Header */}
      <div className="p-3">
        <div className="flex items-start gap-3">
          {/* Type Badge */}
          <span className={cn('p-1.5 rounded shrink-0', TYPE_COLORS[idea.type])}>
            {TYPE_ICONS[idea.type]}
          </span>

          {/* Title & Description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className={cn(TYPOGRAPHY.h3, 'truncate')}>{idea.title}</h4>
              <span
                className={cn(
                  'w-2 h-2 rounded-full shrink-0',
                  IMPACT_COLORS[idea.impact]
                )}
                title={`Impact: ${idea.impact}`}
              />
            </div>
            <p className="text-sm text-slate-400 line-clamp-2">{idea.description}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleSaveToggle}
              className={cn(
                'p-1.5 rounded transition-colors',
                idea.saved
                  ? cn(SEMANTIC_COLORS.warning.text, SEMANTIC_COLORS.warning.bg, SEMANTIC_COLORS.warning.hover)
                  : cn('text-slate-400', 'hover:text-amber-400 hover:bg-slate-700')
              )}
              title={idea.saved ? 'Unsave' : 'Save idea'}
            >
              {idea.saved ? (
                <BookmarkCheck className="w-3.5 h-3.5" />
              ) : (
                <Bookmark className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded text-slate-400 hover:text-slate-300 hover:bg-slate-700"
            >
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2 mt-2">
          <span className={cn('px-1.5 py-0.5 text-sm rounded', TYPE_COLORS[idea.type])}>
            {TYPE_LABELS[idea.type]}
          </span>
          <span className="text-sm text-slate-400 capitalize">{idea.tone}</span>
          {idea.relevantCharacters && idea.relevantCharacters.length > 0 && (
            <span className="text-sm text-slate-400">
              • {idea.relevantCharacters.slice(0, 2).join(', ')}
            </span>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <motion.div
          {...FM_VARIANTS.collapse}
          transition={FM_TRANSITION.slow}
          className="border-t border-slate-700/50"
        >
          <div className="p-3 space-y-3">
            {/* Potential Consequences */}
            {idea.potentialConsequences && idea.potentialConsequences.length > 0 && (
              <div>
                <h5 className={cn(TYPOGRAPHY.h3, 'mb-1.5')}>
                  Potential Consequences
                </h5>
                <ul className="space-y-1">
                  {idea.potentialConsequences.map((consequence, i) => (
                    <li key={i} className="text-sm text-slate-400 flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                      {consequence}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Follow-up Questions */}
            {idea.followUpQuestions && idea.followUpQuestions.length > 0 && (
              <div>
                <h5 className={cn(TYPOGRAPHY.h3, 'mb-1.5')}>
                  Questions to Explore
                </h5>
                <ul className="space-y-1">
                  {idea.followUpQuestions.map((question, i) => (
                    <li key={i} className="text-sm text-cyan-400/80 flex items-start gap-1.5">
                      <span className="shrink-0">?</span>
                      {question}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Rating */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
              <span className="text-sm text-slate-400">Rate this idea:</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleRating(rating as 1 | 2 | 3 | 4 | 5)}
                    className={cn(
                      'p-1 rounded transition-colors',
                      idea.rating && idea.rating >= rating
                        ? 'text-amber-400'
                        : 'text-slate-400 hover:text-amber-400/50'
                    )}
                  >
                    <Star className="w-3 h-3" fill={idea.rating && idea.rating >= rating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </div>

            {/* Explore Button */}
            {onExplore && (
              <button
                onClick={() => onExplore(idea.id)}
                className={cn(
                  'w-full flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors',
                  SEMANTIC_COLORS.brand.bg, SEMANTIC_COLORS.brand.text, SEMANTIC_COLORS.brand.hover
                )}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                Explore This Idea
              </button>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
