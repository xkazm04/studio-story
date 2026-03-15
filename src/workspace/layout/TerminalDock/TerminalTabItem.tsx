'use client';

import React from 'react';
import { X, Pin, Loader2, Bot } from 'lucide-react';
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
    <div
      role="tab"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
      className={cn(
        'group flex items-center gap-1.5 whitespace-nowrap rounded-t-md px-2.5 py-1 text-sm transition-colors cursor-pointer',
        'border border-b-0',
        isActive
          ? 'bg-slate-950 text-slate-50 border-slate-700/70'
          : 'bg-slate-900/40 text-slate-400 border-slate-800/40 hover:bg-slate-900/60 hover:text-slate-300',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40'
      )}
    >
      {/* Domain color dot */}
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor)} />

      {/* Agent badge */}
      {tab.isAgentSpawned && (
        <span className="shrink-0" aria-label="Agent-spawned session">
          <Bot className="w-3 h-3 text-emerald-400" />
        </span>
      )}

      {/* Running spinner */}
      {isRunning && <Loader2 className="w-3 h-3 text-blue-400 animate-spin shrink-0" />}

      {/* Label */}
      <span className="max-w-35 truncate">{tab.label}</span>

      {/* Pin indicator */}
      {tab.isPinned && (
        <Pin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
      )}

      {/* Close button */}
      {!tab.isPinned && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="ml-0.5 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-500/40"
          title="Close terminal tab"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
