'use client';

import React from 'react';
import { X, Minus } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type { LucideIcon } from 'lucide-react';

export type HeaderAccent = 'amber' | 'cyan' | 'violet' | 'emerald' | 'rose';

const ACCENT_STYLES: Record<HeaderAccent, { bg: string; border: string; icon: string }> = {
  amber:   { bg: 'bg-amber-500/[0.06]',   border: 'border-l-amber-500/40',   icon: 'text-amber-500/70' },
  cyan:    { bg: 'bg-cyan-500/[0.06]',     border: 'border-l-cyan-500/40',    icon: 'text-cyan-500/70' },
  violet:  { bg: 'bg-violet-500/[0.06]',   border: 'border-l-violet-500/40',  icon: 'text-violet-500/70' },
  emerald: { bg: 'bg-emerald-500/[0.06]',  border: 'border-l-emerald-500/40', icon: 'text-emerald-500/70' },
  rose:    { bg: 'bg-rose-500/[0.06]',     border: 'border-l-rose-500/40',    icon: 'text-rose-500/70' },
};

interface PanelFrameProps {
  title: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  onClose?: () => void;
  onMinimize?: () => void;
  children: React.ReactNode;
  className?: string;
  headerAccent?: HeaderAccent;
}

export default function PanelFrame({
  title,
  icon: Icon,
  actions,
  onClose,
  onMinimize,
  children,
  className,
  headerAccent,
}: PanelFrameProps) {
  const accent = headerAccent ? ACCENT_STYLES[headerAccent] : null;

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-slate-950/90 border border-slate-800/60 rounded-lg overflow-hidden',
        className
      )}
    >
      <div className={cn(
        'flex items-center gap-2 h-7 px-3 border-b border-slate-800/50 shrink-0',
        accent ? `${accent.bg} border-l-2 ${accent.border}` : 'bg-slate-900/80'
      )}>
        {Icon && <Icon className={cn('w-3.5 h-3.5', accent ? accent.icon : 'text-slate-500')} />}
        <span className="text-[11px] font-medium text-slate-300 truncate">{title}</span>

        {actions && <div className="flex items-center gap-1 ml-auto">{actions}</div>}
        {!actions && <div className="flex-1" />}

        {onMinimize && (
          <button onClick={onMinimize} className="text-slate-600 hover:text-slate-400 transition-colors">
            <Minus className="w-3 h-3" />
          </button>
        )}

        {onClose && (
          <button onClick={onClose} className="text-slate-600 hover:text-slate-400 transition-colors">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
