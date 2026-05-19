'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { slideInRight } from '@/lib/animations';
import { Grid3X3, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FacetOptionCard } from './FacetOptionCard';
import type { FacetOptionsListProps, FacetOption } from '../types';

/**
 * Generic options list for any faceted spec dimension.
 * Shows filtered option cards for the active dimension plus any custom value.
 */
export function FacetOptionsList({
  searchQuery,
  config,
  activeDimensionId,
  selections,
  onSelect,
  onClearCustom,
  renderIcon,
}: FacetOptionsListProps & {
  renderIcon?: (preview: string, size: number) => React.ReactNode;
}) {
  if (!activeDimensionId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-400 p-8">
        <Grid3X3 size={32} className="mb-3 opacity-50" />
        <p className="text-sm text-center">Select a category from the left panel</p>
      </div>
    );
  }

  const dimension = config.dimensions.find((d) => d.id === activeDimensionId);
  const options: FacetOption[] = config.options[activeDimensionId] || [];
  const currentSelection = selections[activeDimensionId]?.optionId ?? null;
  const sel = selections[activeDimensionId];
  const hasCustom = sel?.isCustom && !!sel.customPrompt;

  const filtered = searchQuery.trim()
    ? options.filter(
        (o) =>
          o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (o.description &&
            o.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;

  if (!dimension) return null;

  return (
    <motion.div
      key={activeDimensionId}
      variants={slideInRight}
      initial="initial"
      animate="animate"
      className="p-3"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm uppercase tracking-wider text-slate-400">
          {dimension.label} Options
        </span>
        <span className="text-sm text-slate-400">
          {filtered.length}
          {hasCustom ? ' + 1 custom' : ''} available
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {hasCustom && (
          <button
            type="button"
            onClick={() => onClearCustom(activeDimensionId)}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border-2 border-dashed transition-all text-left',
              'border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10'
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-amber-300 mb-0.5">
                Custom Value
              </p>
              <p className="text-xs text-slate-400 truncate">
                {sel?.customPrompt}
              </p>
            </div>
            <span className="text-xs text-slate-400 shrink-0">
              click to clear
            </span>
          </button>
        )}

        {filtered.map((option) => (
          <FacetOptionCard
            key={option.id}
            option={option}
            isSelected={!hasCustom && currentSelection === option.id}
            onSelect={() => onSelect(activeDimensionId, option.id)}
            renderIcon={renderIcon}
          />
        ))}
      </div>

      {filtered.length === 0 && !hasCustom && searchQuery && (
        <p className="text-sm text-slate-400 text-center py-8">
          No matching options
        </p>
      )}
    </motion.div>
  );
}
