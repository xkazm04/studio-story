'use client';

import React from 'react';
import { X, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import type { BulkAction } from './types';

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  actions: BulkAction[];
  onAction: (actionId: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}

export default function BulkActionBar({
  selectedCount,
  totalCount,
  actions,
  onAction,
  onSelectAll,
  onClear,
}: BulkActionBarProps) {
  const allSelected = selectedCount === totalCount;

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="sticky top-0 z-10 mx-1 mb-1 flex items-center gap-1.5 rounded-md border border-cyan-500/25 bg-slate-900/95 backdrop-blur-sm px-2 py-1 shadow-lg shadow-black/30"
        >
          {/* Count badge */}
          <span className="inline-flex items-center gap-1 text-xs font-medium text-cyan-300">
            <CheckSquare className="h-3 w-3" />
            {selectedCount}
          </span>

          {/* Select all / deselect toggle */}
          <button
            type="button"
            onClick={allSelected ? onClear : onSelectAll}
            className="rounded px-1.5 py-0.5 text-[11px] text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-200"
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>

          {/* Separator */}
          <div className="mx-0.5 h-3 w-px bg-slate-700/60" />

          {/* Action buttons */}
          {actions.map((action) => {
            const Icon = action.icon;
            const isDanger = action.variant === 'danger';
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => onAction(action.id)}
                className={cn(
                  'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors',
                  isDanger
                    ? 'text-rose-400 hover:bg-rose-500/15 hover:text-rose-300'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100',
                )}
              >
                {Icon && <Icon className="h-3 w-3" />}
                {action.label}
              </button>
            );
          })}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Clear selection */}
          <button
            type="button"
            onClick={onClear}
            className="rounded p-0.5 text-slate-500 transition-colors hover:bg-slate-800/60 hover:text-slate-300"
            aria-label="Clear selection"
          >
            <X className="h-3 w-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
