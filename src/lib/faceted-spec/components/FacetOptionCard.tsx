'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { FacetOptionCardProps } from '../types';

/**
 * Generic option card for any faceted spec dimension.
 * Renders an option with optional icon/preview, name, description, and selection state.
 *
 * For custom icon rendering (e.g., SVG registry icons), wrap this component
 * and pass a renderIcon prop, or compose with your own icon component.
 */
export function FacetOptionCard({
  option,
  isSelected,
  onSelect,
  renderIcon,
}: FacetOptionCardProps & {
  renderIcon?: (preview: string, size: number) => React.ReactNode;
}) {
  const isEmpty = option.promptValue === '';

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
        ${
          isSelected
            ? 'border-amber-500 bg-amber-500/[0.08] shadow-[0_0_12px_rgba(245,158,11,0.15)]'
            : isEmpty
              ? 'border-white/5 opacity-60 hover:opacity-100 hover:border-white/15 bg-white/[0.02]'
              : 'border-white/5 hover:border-white/15 bg-white/[0.02]'
        }`}
    >
      {option.preview && (
        <div className="w-12 h-12 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
          {renderIcon ? (
            renderIcon(option.preview, 32)
          ) : (
            <span className="text-xs text-slate-400 truncate max-w-[48px]">
              {option.preview}
            </span>
          )}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-slate-200 block truncate">
          {option.name}
        </span>
        {option.description && (
          <span className="text-sm text-slate-400 block truncate">
            {option.description}
          </span>
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
