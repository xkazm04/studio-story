/**
 * OutlineItem Component
 * Single scene item in the outline sidebar
 * Design: Clean Manuscript style with monospace accents
 */

'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Scene } from '@/app/types/Scene';
import { cn } from '@/lib/utils';
import { Play, AlertTriangle, GitBranch, FileText, Image, Type, XCircle } from 'lucide-react';

interface OutlineItemProps {
  scene: Scene;
  isSelected: boolean;
  isFirst: boolean;
  isOrphaned: boolean;
  isDeadEnd?: boolean;
  choiceCount: number;
  onClick: () => void;
  index?: number;
}

const item = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
};

const STATUS_COLORS = {
  first: {
    bg: 'bg-cyan-900/20',
    border: 'border-cyan-500/50',
    text: 'text-cyan-400',
    accent: 'bg-cyan-500',
  },
  orphan: {
    bg: 'bg-amber-900/20',
    border: 'border-amber-500/50',
    text: 'text-amber-400',
    accent: 'bg-amber-500',
  },
  deadend: {
    bg: 'bg-red-900/20',
    border: 'border-red-500/50',
    text: 'text-red-400',
    accent: 'bg-red-500',
  },
  normal: {
    bg: 'bg-slate-800/40',
    border: 'border-slate-700/50',
    text: 'text-slate-300',
    accent: 'bg-slate-600',
  },
  selected: {
    bg: 'bg-cyan-900/30',
    border: 'border-cyan-500/60',
    text: 'text-cyan-100',
    accent: 'bg-cyan-500',
  },
};

function OutlineItemComponent({
  scene,
  isSelected,
  isFirst,
  isOrphaned,
  isDeadEnd = false,
  choiceCount,
  onClick,
  index = 0,
}: OutlineItemProps) {
  const hasContent = !!(scene.content || scene.description);
  const hasImage = !!scene.image_url;
  const hasTitle = !!scene.name && scene.name !== 'Untitled scene';

  // Determine status colors (priority: selected > first > orphan > deadend > normal)
  const status = isSelected
    ? STATUS_COLORS.selected
    : isFirst
    ? STATUS_COLORS.first
    : isOrphaned
    ? STATUS_COLORS.orphan
    : isDeadEnd
    ? STATUS_COLORS.deadend
    : STATUS_COLORS.normal;

  return (
    <motion.button
      variants={item}
      initial="hidden"
      animate="show"
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left',
        'transition-all duration-200 group relative overflow-hidden',
        'border',
        status.bg,
        status.border,
        !isSelected && 'hover:bg-slate-800/60 hover:border-slate-600'
      )}
    >
      {/* Left accent bar */}
      <div
        className={cn(
          'absolute left-0 top-1 bottom-1 w-0.5 rounded-r transition-all',
          isSelected ? status.accent : 'bg-transparent group-hover:bg-slate-600'
        )}
      />

      {/* Status Icon */}
      <div className="shrink-0 ml-1">
        {isFirst ? (
          <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
        ) : isOrphaned ? (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        ) : isDeadEnd ? (
          <XCircle className="w-3.5 h-3.5 text-red-500" />
        ) : (
          <FileText
            className={cn(
              'w-3.5 h-3.5 transition-colors',
              hasContent ? 'text-slate-400' : 'text-slate-600',
              'group-hover:text-slate-300'
            )}
          />
        )}
      </div>

      {/* Scene Name */}
      <div className="flex-1 min-w-0">
        <span className={cn('truncate text-sm font-medium', status.text)}>
          {scene.name || 'Untitled scene'}
        </span>
      </div>

      {/* Content indicators */}
      <div className="flex items-center gap-1 shrink-0">
        <Type
          className={cn(
            'w-3 h-3 transition-colors',
            hasTitle ? 'text-emerald-400' : 'text-slate-600'
          )}
        />
        <Image
          className={cn(
            'w-3 h-3 transition-colors',
            hasImage ? 'text-emerald-400' : 'text-slate-600'
          )}
        />
      </div>

      {/* Choice Count Badge */}
      {choiceCount > 0 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            'flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-medium',
            'transition-colors border',
            isSelected
              ? 'bg-cyan-800/50 text-cyan-300 border-cyan-500/30'
              : choiceCount === 1
              ? 'bg-slate-700/80 text-slate-400 border-slate-600/50'
              : choiceCount === 2
              ? 'bg-cyan-900/50 text-cyan-400 border-cyan-500/30'
              : 'bg-purple-900/50 text-purple-400 border-purple-500/30'
          )}
        >
          <GitBranch className="w-2.5 h-2.5" />
          <span>{choiceCount}</span>
        </motion.div>
      )}

      {/* Status Badges */}
      <div className="shrink-0 flex items-center gap-1">
        {isFirst && (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wide bg-cyan-900/50 text-cyan-400 rounded-md border border-cyan-500/30"
          >
            Start
          </motion.span>
        )}
        {isOrphaned && (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wide bg-amber-900/50 text-amber-400 rounded-md border border-amber-500/30"
          >
            Orphan
          </motion.span>
        )}
        {isDeadEnd && !isFirst && (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wide bg-red-900/50 text-red-400 rounded-md border border-red-500/30"
          >
            End
          </motion.span>
        )}
      </div>
    </motion.button>
  );
}

export const OutlineItem = memo(OutlineItemComponent);
