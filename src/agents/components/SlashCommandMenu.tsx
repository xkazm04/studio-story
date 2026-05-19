'use client';

/**
 * SlashCommandMenu — Autocomplete popup for slash commands.
 *
 * Renders above the input field, filtered by the typed query,
 * with arrow-key navigation and click-to-select.
 */

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid, Columns, Maximize2, X, Trash2, Undo2, Redo2,
  HelpCircle, Lightbulb, BarChart3, Sparkles, Slash,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type { SlashCommandDef } from '../slashCommands';

// ─── Icon map ────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutGrid,
  Columns,
  Maximize2,
  X,
  Trash2,
  Undo2,
  Redo2,
  HelpCircle,
  Lightbulb,
  BarChart3,
  Sparkles,
};

function CommandIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Slash;
  return <Icon className={className} />;
}

// ─── Props ───────────────────────────────────────

export interface SlashCommandMenuProps {
  commands: SlashCommandDef[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onHover: (index: number) => void;
  variant: 'overlay' | 'panel';
}

// ─── Component ───────────────────────────────────

export function SlashCommandMenu({
  commands,
  selectedIndex,
  onSelect,
  onHover,
  variant,
}: SlashCommandMenuProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector('[data-selected="true"]');
    selected?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (commands.length === 0) return null;

  const isOverlay = variant === 'overlay';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6, transition: { duration: 0.1 } }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className={cn(
          'absolute bottom-full left-0 right-0 mb-1 z-20',
          'bg-slate-900 border border-slate-700/60 rounded-lg shadow-xl',
          'max-h-[240px] overflow-y-auto overscroll-contain',
          isOverlay ? 'mx-3' : 'mx-0',
        )}
        role="listbox"
        aria-label="Slash commands"
        ref={listRef}
      >
        <div className="py-1">
          {/* Header */}
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 select-none">
            Commands
          </div>

          {commands.map((cmd, i) => {
            const isSelected = i === selectedIndex;
            return (
              <button
                key={cmd.name}
                role="option"
                aria-selected={isSelected}
                data-selected={isSelected}
                onClick={() => onSelect(i)}
                onMouseEnter={() => onHover(i)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors',
                  isSelected
                    ? 'bg-slate-800/80 text-slate-100'
                    : 'text-slate-300 hover:bg-slate-800/50',
                )}
              >
                <CommandIcon
                  name={cmd.icon}
                  className={cn(
                    'w-3.5 h-3.5 shrink-0',
                    cmd.mode === 'local' ? 'text-cyan-400' : 'text-violet-400',
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">/{cmd.name}</span>
                    {cmd.argHint && (
                      <span className="text-xs text-slate-500 truncate">
                        {cmd.argHint}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight truncate">
                    {cmd.description}
                  </p>
                </div>
                <span
                  className={cn(
                    'text-[9px] font-medium uppercase tracking-wider px-1 py-0.5 rounded shrink-0',
                    cmd.mode === 'local'
                      ? 'bg-cyan-500/10 text-cyan-400'
                      : 'bg-violet-500/10 text-violet-400',
                  )}
                >
                  {cmd.mode === 'local' ? 'instant' : 'ai'}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
