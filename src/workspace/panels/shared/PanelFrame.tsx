'use client';

import React from 'react';
import { X, Minus, Loader2 } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { PanelSizeProvider } from './PanelSizeContext';
import { getAccent, type AccentColor } from '@/workspace/theme/tokens';
import type { PanelDensity } from '@/workspace/types';

export type HeaderAccent = AccentColor;

interface PanelFrameProps {
  title: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  onClose?: () => void;
  onMinimize?: () => void;
  children: React.ReactNode;
  className?: string;
  headerAccent?: HeaderAccent;
  /** Shows a spinner in the header bar to indicate loading */
  isLoading?: boolean;
  /** Density mode — micro hides header, compact shrinks it */
  density?: PanelDensity;
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
  isLoading,
  density = 'full',
}: PanelFrameProps) {
  const accent = headerAccent ? getAccent(headerAccent) : null;

  const handleCloseWithFocusFallback = () => {
    onClose?.();
    requestAnimationFrame(() => {
      const panelFrames = Array.from(document.querySelectorAll<HTMLElement>('[data-panel-frame]'));
      const targetHeader = panelFrames.find((frame) => frame.querySelector('button[aria-label="Close panel"]'));
      if (targetHeader) {
        const closeBtn = targetHeader.querySelector<HTMLElement>('button[aria-label="Close panel"]');
        const minimizeBtn = targetHeader.querySelector<HTMLElement>('button[aria-label="Minimize panel"]');
        (closeBtn ?? minimizeBtn)?.focus();
        return;
      }
      const addPanelButton = document.getElementById('workspace-add-panel-button') as HTMLElement | null;
      addPanelButton?.focus();
    });
  };

  // Micro density — no frame, just content with a minimal overlay
  if (density === 'micro') {
    return (
      <div
        data-panel-frame
        data-density="micro"
        className={cn(
          'group/micro relative flex h-full min-h-0 items-center overflow-hidden rounded-lg',
          'border border-slate-800/60 ring-1 ring-slate-800/20',
          'bg-slate-950/90',
          className
        )}
      >
        <div className="flex-1 min-h-0 min-w-0 overflow-hidden px-2 py-1">
          {children}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={handleCloseWithFocusFallback}
            aria-label="Close panel"
            className="absolute top-0.5 right-0.5 rounded p-0.5 text-slate-500 opacity-0 transition-opacity hover:bg-slate-800/40 hover:text-slate-300 group-hover/micro:opacity-100"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    );
  }

  const isCompactDensity = density === 'compact';

  return (
    <div
      data-panel-frame
      data-density={density}
      className={cn(
        'flex h-full min-h-0 flex-col overflow-hidden rounded-lg',
        'border border-slate-800/60 ring-1 ring-slate-800/20',
        'bg-slate-950/90 shadow-lg shadow-black/20',
        className
      )}
    >
      <div className={cn(
        'relative flex shrink-0 items-center gap-2 border-b border-slate-800/50 px-3',
        isCompactDensity ? 'h-6' : 'h-7',
        accent
          ? `${accent.headerBg} border-l-2 ${accent.leftBorder}`
          : 'bg-slate-900/80',
        accent && 'before:absolute before:top-0 before:left-0 before:h-[3px] before:w-8 before:rounded-br-sm before:opacity-40',
        accent && accent.headerGlow,
      )}>
        {Icon && <Icon className={cn(
          isCompactDensity ? 'w-3 h-3' : 'w-3.5 h-3.5',
          accent ? accent.headerIcon : 'text-slate-400'
        )} />}
        <span className={cn(
          'truncate font-sans font-semibold text-slate-200',
          isCompactDensity ? 'text-xs' : 'text-sm'
        )}>
          {title}
        </span>
        {isLoading && <Loader2 className={cn('animate-spin text-slate-400 flex-shrink-0', isCompactDensity ? 'w-2.5 h-2.5' : 'w-3 h-3')} />}

        {actions && <div className="flex items-center gap-1 ml-auto">{actions}</div>}
        {!actions && <div className="flex-1" />}

        {onMinimize && !isCompactDensity && (
          <button
            type="button"
            onClick={onMinimize}
            aria-label="Minimize panel"
            className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-800/40 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-500/40"
            title="Minimize panel"
          >
            <Minus className="w-3 h-3" />
          </button>
        )}

        {onClose && (
          <button
            type="button"
            onClick={handleCloseWithFocusFallback}
            aria-label="Close panel"
            className={cn(
              'rounded text-slate-400 transition-colors hover:bg-slate-800/40 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-500/40',
              isCompactDensity ? 'p-1' : 'p-1.5'
            )}
            title="Close panel"
          >
            <X className={isCompactDensity ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
          </button>
        )}
      </div>

      <PanelSizeProvider>
        <div className="relative flex-1 min-h-0 overflow-auto">
          {children}
          {!isCompactDensity && (
            <div className="pointer-events-none sticky bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-slate-950/90 to-transparent" />
          )}
        </div>
      </PanelSizeProvider>
    </div>
  );
}
