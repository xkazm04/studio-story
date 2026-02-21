'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Grid3X3, Sparkles } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useCreatorUIStore } from '../../store/creatorUIStore';
import { useCreatorCharacterStore } from '../../store/creatorCharacterStore';
import { getOptionsForCategory, getCategoryById } from '../../constants';
import { OptionCard } from './OptionCard';

interface OptionsListProps {
  searchQuery: string;
}

export function OptionsList({ searchQuery }: OptionsListProps) {
  const activeCategory = useCreatorUIStore((s) => s.activeCategory);
  const selections = useCreatorCharacterStore((s) => s.selections);
  const setSelection = useCreatorCharacterStore((s) => s.setSelection);

  if (!activeCategory) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-600 p-8">
        <Grid3X3 size={32} className="mb-3 opacity-50" />
        <p className="text-sm text-center">Select a category from the left panel</p>
      </div>
    );
  }

  const clearCustomPrompt = useCreatorCharacterStore((s) => s.clearCustomPrompt);

  const category = getCategoryById(activeCategory);
  const options = getOptionsForCategory(activeCategory);
  const currentSelection = selections[activeCategory]?.optionId ?? null;
  const sel = selections[activeCategory];
  const hasCustom = sel?.isCustom && !!sel.customPrompt;

  const filtered = searchQuery.trim()
    ? options.filter(
        (o) =>
          o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (o.description && o.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;

  if (!category) return null;

  return (
    <motion.div
      key={activeCategory}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-3"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-slate-500">
          {category.label} Options
        </span>
        <span className="text-xs text-slate-600">{filtered.length}{hasCustom ? ' + 1 custom' : ''} available</span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {/* Custom card — appears when CLI or user set a custom prompt */}
        {hasCustom && (
          <button
            type="button"
            onClick={() => clearCustomPrompt(activeCategory)}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border-2 border-dashed transition-all text-left',
              'border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10'
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-amber-300 mb-0.5">Custom Value</p>
              <p className="text-[10px] text-slate-400 truncate">{sel.customPrompt}</p>
            </div>
            <span className="text-[9px] text-slate-600 shrink-0">click to clear</span>
          </button>
        )}

        {filtered.map((option) => (
          <OptionCard
            key={option.id}
            option={option}
            isSelected={!hasCustom && currentSelection === option.id}
            onSelect={() => setSelection(activeCategory, option.id)}
          />
        ))}
      </div>

      {filtered.length === 0 && !hasCustom && searchQuery && (
        <p className="text-sm text-slate-600 text-center py-8">No matching options</p>
      )}
    </motion.div>
  );
}
