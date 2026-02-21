'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { CreatorIcon } from '../../icons';
import type { CategoryOption } from '../../types';

interface OptionCardProps {
  option: CategoryOption;
  isSelected: boolean;
  onSelect: () => void;
}

export function OptionCard({ option, isSelected, onSelect }: OptionCardProps) {
  const isEmpty = option.promptValue === '';

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
        ${isSelected
          ? 'border-amber-500 bg-amber-500/[0.08] shadow-[0_0_12px_rgba(245,158,11,0.15)]'
          : isEmpty
            ? 'border-white/5 opacity-60 hover:opacity-100 hover:border-white/15 bg-white/[0.02]'
            : 'border-white/5 hover:border-white/15 bg-white/[0.02]'
        }`}
    >
      <div className="w-12 h-12 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
        <CreatorIcon name={option.preview || ''} size={32} />
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-slate-200 block truncate">
          {option.name}
        </span>
        {option.description && (
          <span className="text-xs text-slate-500 block truncate">{option.description}</span>
        )}
      </div>

      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shrink-0"
        >
          <Check size={10} className="text-white" />
        </motion.div>
      )}
    </motion.button>
  );
}
