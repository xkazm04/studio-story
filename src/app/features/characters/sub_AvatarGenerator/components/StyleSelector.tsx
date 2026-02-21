/**
 * StyleSelector - Avatar style picker (7 styles)
 * Design: Clean Manuscript style with cyan accents
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { AVATAR_STYLES } from '../../lib/promptComposer';

interface StyleSelectorProps {
  selectedStyle: string;
  onSelectStyle: (style: string) => void;
  disabled?: boolean;
}

const StyleSelector: React.FC<StyleSelectorProps> = ({
  selectedStyle,
  onSelectStyle,
  disabled = false,
}) => {
  return (
    <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
          avatar_style
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {AVATAR_STYLES.map((style) => {
          const isSelected = selectedStyle === style.id;
          return (
            <motion.button
              key={style.id}
              onClick={() => onSelectStyle(style.id)}
              disabled={disabled}
              whileHover={{ scale: disabled ? 1 : 1.02 }}
              whileTap={{ scale: disabled ? 1 : 0.98 }}
              className={cn(
                'p-3 rounded-lg border transition-all duration-200 text-left',
                isSelected
                  ? 'bg-cyan-500/15 border-cyan-500/40'
                  : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/60',
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              )}
            >
              <div className={cn(
                'font-mono text-xs uppercase tracking-wide mb-1',
                isSelected ? 'text-cyan-400' : 'text-slate-300'
              )}>
                {style.label}
              </div>
              <div className="font-mono text-[10px] text-slate-500 leading-relaxed">
                {style.description}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default StyleSelector;
