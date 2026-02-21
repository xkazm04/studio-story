/**
 * MilestoneCard - Individual milestone display component
 * Design: Clean Manuscript style with cyan accents
 *
 * Displays a single appearance milestone with visual changes,
 * story position, and transformation details.
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Clock,
  Skull,
  Heart,
  Sparkles,
  Shirt,
  Zap,
  Shield,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  Check,
  Image,
  MapPin,
  Tag,
  Calendar,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type { AppearanceMilestone } from '@/lib/evolution/MilestoneManager';
import type { TransformationType, AgeStage } from '@/app/hooks/integration/useAvatarTimeline';

// ============================================================================
// Types
// ============================================================================

export interface MilestoneCardProps {
  milestone: AppearanceMilestone;
  isSelected?: boolean;
  isActive?: boolean;
  showDetails?: boolean;
  compact?: boolean;
  onSelect?: (milestone: AppearanceMilestone) => void;
  onEdit?: (milestone: AppearanceMilestone) => void;
  onDelete?: (milestoneId: string) => void;
  onSetActive?: (milestoneId: string) => void;
}

// ============================================================================
// Constants
// ============================================================================

const TRANSFORMATION_CONFIG: Record<TransformationType, {
  label: string;
  icon: React.ReactNode;
  color: string;
}> = {
  initial: {
    label: 'Initial',
    icon: <Star size={14} />,
    color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
  },
  natural_aging: {
    label: 'Aging',
    icon: <Clock size={14} />,
    color: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
  },
  injury: {
    label: 'Injury',
    icon: <Skull size={14} />,
    color: 'text-red-400 bg-red-500/20 border-red-500/30',
  },
  healing: {
    label: 'Healing',
    icon: <Heart size={14} />,
    color: 'text-green-400 bg-green-500/20 border-green-500/30',
  },
  magical: {
    label: 'Magical',
    icon: <Sparkles size={14} />,
    color: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
  },
  costume_change: {
    label: 'Costume',
    icon: <Shirt size={14} />,
    color: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
  },
  emotional: {
    label: 'Emotional',
    icon: <Zap size={14} />,
    color: 'text-pink-400 bg-pink-500/20 border-pink-500/30',
  },
  custom: {
    label: 'Custom',
    icon: <Shield size={14} />,
    color: 'text-slate-400 bg-slate-500/20 border-slate-500/30',
  },
};

const AGE_STAGE_LABELS: Record<AgeStage, string> = {
  child: 'Child',
  teen: 'Teen',
  young_adult: 'Young Adult',
  adult: 'Adult',
  middle_aged: 'Middle Aged',
  elderly: 'Elderly',
};

// ============================================================================
// Component
// ============================================================================

const MilestoneCard: React.FC<MilestoneCardProps> = ({
  milestone,
  isSelected = false,
  isActive = false,
  showDetails: initialShowDetails = false,
  compact = false,
  onSelect,
  onEdit,
  onDelete,
  onSetActive,
}) => {
  const [showDetails, setShowDetails] = useState(initialShowDetails);
  const config = TRANSFORMATION_CONFIG[milestone.transformation_type];

  const handleClick = () => {
    if (onSelect) {
      onSelect(milestone);
    } else {
      setShowDetails(!showDetails);
    }
  };

  // Compact view for filmstrip/timeline
  if (compact) {
    return (
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'relative group transition-all rounded-lg overflow-hidden border-2',
          isSelected
            ? 'border-cyan-500 ring-2 ring-cyan-500/30'
            : 'border-slate-700/50 hover:border-slate-600',
          isActive && 'ring-2 ring-green-500/30'
        )}
      >
        <div className="w-16 h-16 bg-slate-800">
          {milestone.thumbnail_url || milestone.avatar_url ? (
            <img
              src={milestone.thumbnail_url || milestone.avatar_url}
              alt={milestone.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600">
              <Image size={20} />
            </div>
          )}
        </div>

        {/* Active indicator */}
        {isActive && (
          <div className="absolute top-0.5 left-0.5 w-2 h-2 rounded-full bg-green-400" />
        )}

        {/* Type indicator */}
        <div className={cn(
          'absolute bottom-0 left-0 right-0 px-1 py-0.5 flex items-center justify-center',
          config.color.split(' ').slice(1).join(' ')
        )}>
          {config.icon}
        </div>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative rounded-lg border transition-all overflow-hidden',
        'bg-slate-800/40',
        isSelected
          ? 'border-cyan-500 ring-2 ring-cyan-500/20'
          : 'border-slate-700/50 hover:border-slate-600',
        isActive && 'ring-1 ring-green-500/30'
      )}
    >
      {/* Main content */}
      <div className="flex gap-3 p-3">
        {/* Avatar thumbnail */}
        <div
          onClick={handleClick}
          className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0 cursor-pointer group"
        >
          {milestone.avatar_url || milestone.thumbnail_url ? (
            <img
              src={milestone.thumbnail_url || milestone.avatar_url}
              alt={milestone.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600">
              <Image size={24} />
            </div>
          )}

          {/* Active badge */}
          {isActive && (
            <div className="absolute top-1 left-1 p-0.5 rounded-full bg-green-500/30 border border-green-500/50">
              <Check size={10} className="text-green-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Transformation type badge */}
              <span className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border',
                config.color
              )}>
                {config.icon}
                <span>{config.label}</span>
              </span>

              {/* Age stage */}
              <span className="px-1.5 py-0.5 bg-slate-700/50 rounded text-[10px] font-mono text-slate-400">
                {AGE_STAGE_LABELS[milestone.age_stage]}
                {milestone.estimated_age && ` (${milestone.estimated_age}y)`}
              </span>
            </div>

            {/* Expand toggle */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-1 rounded hover:bg-slate-700/50 text-slate-500 transition-colors"
            >
              {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* Name */}
          <h4 className="font-mono text-sm text-slate-200 truncate mb-1">
            {milestone.name}
          </h4>

          {/* Transformation trigger */}
          {milestone.transformation_trigger && (
            <p className="font-mono text-xs text-slate-400 line-clamp-1 mb-2">
              {milestone.transformation_trigger}
            </p>
          )}

          {/* Story position */}
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
            {milestone.story_position.act_title && (
              <span className="flex items-center gap-1">
                <MapPin size={10} />
                Act {milestone.story_position.act_number}: {milestone.story_position.act_title}
              </span>
            )}
            {milestone.story_position.scene_title && (
              <span className="text-cyan-500/70">
                Scene {milestone.story_position.scene_number}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-700/50 overflow-hidden"
          >
            <div className="p-3 space-y-3">
              {/* Description */}
              {milestone.description && (
                <div>
                  <span className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
                    description
                  </span>
                  <p className="font-mono text-xs text-slate-400">
                    {milestone.description}
                  </p>
                </div>
              )}

              {/* Visual changes */}
              {milestone.visual_changes.length > 0 && (
                <div>
                  <span className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
                    visual_changes
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {milestone.visual_changes.map((change, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-slate-700/50 rounded text-[10px] font-mono text-slate-400"
                        title={change.from ? `${change.from} → ${change.to}` : change.to}
                      >
                        {change.attribute}: {change.to}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {milestone.tags.length > 0 && (
                <div>
                  <span className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
                    tags
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {milestone.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-[10px] font-mono text-cyan-400"
                      >
                        <Tag size={8} />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {milestone.notes && (
                <div>
                  <span className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
                    notes
                  </span>
                  <p className="font-mono text-xs text-slate-500 italic">
                    {milestone.notes}
                  </p>
                </div>
              )}

              {/* Timestamps */}
              <div className="flex items-center gap-4 pt-2 border-t border-slate-700/30">
                <span className="flex items-center gap-1 text-[10px] font-mono text-slate-600">
                  <Calendar size={10} />
                  Created: {new Date(milestone.created_at).toLocaleDateString()}
                </span>
                {milestone.updated_at !== milestone.created_at && (
                  <span className="text-[10px] font-mono text-slate-600">
                    Updated: {new Date(milestone.updated_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Actions */}
              {(onEdit || onDelete || onSetActive) && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-700/30">
                  {onSetActive && !isActive && (
                    <button
                      onClick={() => onSetActive(milestone.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded
                                 bg-green-500/10 hover:bg-green-500/20 text-green-400
                                 font-mono text-[10px] transition-colors"
                    >
                      <Check size={12} />
                      <span>Set Active</span>
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(milestone)}
                      className="flex items-center gap-1 px-2 py-1 rounded
                                 bg-slate-700/40 hover:bg-slate-700/60 text-slate-400
                                 font-mono text-[10px] transition-colors"
                    >
                      <Edit3 size={12} />
                      <span>Edit</span>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(milestone.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded
                                 bg-red-500/10 hover:bg-red-500/20 text-red-400
                                 font-mono text-[10px] transition-colors"
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MilestoneCard;
