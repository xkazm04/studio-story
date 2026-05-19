'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/app/lib/utils';

// ─── Types ────────────────────────────────────────────────

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  /** Danger items render in red */
  variant?: 'default' | 'danger';
  disabled?: boolean;
  /** Visual separator before this item */
  separator?: boolean;
}

export type ContextMenuItemsProvider<T> = (entity: T) => ContextMenuItem[];

// ─── Hook: useContextMenu ─────────────────────────────────

interface ContextMenuState<T> {
  position: { x: number; y: number } | null;
  entity: T | null;
}

export function useContextMenu<T>() {
  const [state, setState] = useState<ContextMenuState<T>>({
    position: null,
    entity: null,
  });

  const open = useCallback((e: React.MouseEvent, entity: T) => {
    e.preventDefault();
    e.stopPropagation();
    setState({ position: { x: e.clientX, y: e.clientY }, entity });
  }, []);

  const close = useCallback(() => {
    setState({ position: null, entity: null });
  }, []);

  return { ...state, open, close };
}

// ─── Component: ContextMenu ───────────────────────────────

interface ContextMenuProps {
  position: { x: number; y: number };
  items: ContextMenuItem[];
  onAction: (actionId: string) => void;
  onClose: () => void;
}

export default function ContextMenu({ position, items, onAction, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay adding click listener to avoid immediate close from the contextmenu event
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 0);
    document.addEventListener('keydown', handleKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  // Adjust position to keep menu within viewport
  const [adjusted, setAdjusted] = useState(position);
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let { x, y } = position;
    if (x + rect.width > vw - 8) x = vw - rect.width - 8;
    if (y + rect.height > vh - 8) y = vh - rect.height - 8;
    if (x < 8) x = 8;
    if (y < 8) y = 8;
    setAdjusted({ x, y });
  }, [position]);

  if (items.length === 0) return null;

  const menu = (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Context menu"
      className={cn(
        'fixed z-[9999] min-w-[160px] max-w-[240px] rounded-lg py-1',
        'bg-slate-900/95 backdrop-blur-md border border-white/[0.08]',
        'shadow-xl shadow-black/40',
        'animate-in fade-in zoom-in-95 duration-100',
      )}
      style={{ left: adjusted.x, top: adjusted.y }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <React.Fragment key={item.id}>
            {item.separator && (
              <div className="mx-2 my-1 h-px bg-slate-700/60" role="separator" />
            )}
            <button
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                if (!item.disabled) {
                  onAction(item.id);
                  onClose();
                }
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors',
                'focus-visible:outline-none',
                item.disabled && 'opacity-40 cursor-not-allowed',
                item.variant === 'danger'
                  ? 'text-rose-300 hover:bg-rose-500/15 focus-visible:bg-rose-500/15'
                  : 'text-slate-300 hover:bg-white/[0.06] focus-visible:bg-white/[0.06]',
              )}
            >
              {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
              <span className="truncate">{item.label}</span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );

  return createPortal(menu, document.body);
}
