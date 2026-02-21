'use client';

import { cn } from '@/app/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface MiniPanelProps {
  title: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPad?: boolean;
}

export default function MiniPanel({ title, icon: Icon, actions, children, className, noPad }: MiniPanelProps) {
  return (
    <div
      className={cn(
        'flex flex-col h-full bg-slate-950/90 border border-slate-700/50 rounded-lg overflow-hidden',
        className
      )}
    >
      {/* Header — 32px */}
      <div className="flex items-center gap-2 h-8 px-3 bg-slate-900/60 border-b border-slate-700/40 shrink-0">
        {Icon && <Icon className="w-3.5 h-3.5 text-orange-400/80" />}
        <span className="text-xs font-semibold text-slate-200 truncate">{title}</span>
        {actions && <div className="flex items-center gap-1.5 ml-auto">{actions}</div>}
      </div>

      {/* Content */}
      <div className={cn('flex-1 overflow-auto', !noPad && 'p-0')}>{children}</div>
    </div>
  );
}
