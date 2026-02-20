'use client';

import React from 'react';
import { X, Pin, Loader2 } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type { TerminalTab } from '../../types';
import { DOMAIN_COLORS } from '../../types';

interface TerminalTabItemProps {
  tab: TerminalTab;
  isActive: boolean;
  isRunning?: boolean;
  onSelect: () => void;
  onClose: () => void;
}

const DOMAIN_DOT_COLORS: Record<string, string> = {
  amber: 'bg-amber-500',
  purple: 'bg-purple-500',
  cyan: 'bg-cyan-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  blue: 'bg-blue-500',
  slate: 'bg-slate-500',
};

export default function TerminalTabItem({
  tab,
  isActive,
  isRunning,
  onSelect,
  onClose,
}: TerminalTabItemProps) {
  const colorName = DOMAIN_COLORS[tab.domain] ?? 'slate';
  const dotColor = DOMAIN_DOT_COLORS[colorName] ?? 'bg-slate-500';

  return (
    <button
      onClick={onSelect}
      className={cn(
        'group flex items-center gap-1.5 px-2.5 py-1 rounded-t-md text-xs transition-colors whitespace-nowrap',
        'border border-b-0',
        isActive
          ? 'bg-slate-950 text-slate-50 border-slate-700/60'
          : 'bg-slate-900/40 text-slate-400 border-slate-800/40 hover:bg-slate-900/60 hover:text-slate-300'
      )}
    >
      {/* Domain color dot */}
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor)} />

      {/* Running spinner */}
      {isRunning && <Loader2 className="w-3 h-3 text-blue-400 animate-spin shrink-0" />}

      {/* Label */}
      <span className="max-w-[120px] truncate">{tab.label}</span>

      {/* Pin indicator */}
      {tab.isPinned && (
        <Pin className="w-2.5 h-2.5 text-slate-500 shrink-0" />
      )}

      {/* Close button */}
      {!tab.isPinned && (
        <span
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-slate-300"
        >
          <X className="w-3 h-3" />
        </span>
      )}
    </button>
  );
}
