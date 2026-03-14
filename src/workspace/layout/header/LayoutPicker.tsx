'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LayoutGrid } from 'lucide-react';
import { useIntent, LAYOUT_ORDER, type LayoutTemplateId, type Intent } from '@dzin/core';
import { useWorkspaceStore } from '@/workspace/store/workspaceStore';

// ---------------------------------------------------------------------------
// Layout template thumbnail SVGs
// ---------------------------------------------------------------------------

const TEMPLATE_THUMBNAILS: Record<
  LayoutTemplateId,
  { label: string; svg: React.ReactNode }
> = {
  single: {
    label: 'Single',
    svg: (
      <svg viewBox="0 0 40 30" className="w-10 h-[30px]">
        <rect x="1" y="1" width="38" height="28" rx="2" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="0.5" />
      </svg>
    ),
  },
  'split-2': {
    label: 'Split',
    svg: (
      <svg viewBox="0 0 40 30" className="w-10 h-[30px]">
        <rect x="1" y="1" width="22" height="28" rx="2" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="0.5" />
        <rect x="25" y="1" width="14" height="28" rx="2" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="0.5" />
      </svg>
    ),
  },
  'split-3': {
    label: 'Triple',
    svg: (
      <svg viewBox="0 0 40 30" className="w-10 h-[30px]">
        <rect x="1" y="1" width="22" height="28" rx="2" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="0.5" />
        <rect x="25" y="1" width="14" height="13" rx="2" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="0.5" />
        <rect x="25" y="16" width="14" height="13" rx="2" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="0.5" />
      </svg>
    ),
  },
  'grid-4': {
    label: 'Grid',
    svg: (
      <svg viewBox="0 0 40 30" className="w-10 h-[30px]">
        <rect x="1" y="1" width="18" height="13" rx="2" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="0.5" />
        <rect x="21" y="1" width="18" height="13" rx="2" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="0.5" />
        <rect x="1" y="16" width="18" height="13" rx="2" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="0.5" />
        <rect x="21" y="16" width="18" height="13" rx="2" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="0.5" />
      </svg>
    ),
  },
  'primary-sidebar': {
    label: 'Sidebar',
    svg: (
      <svg viewBox="0 0 40 30" className="w-10 h-[30px]">
        <rect x="1" y="1" width="28" height="28" rx="2" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="0.5" />
        <rect x="31" y="1" width="8" height="28" rx="2" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="0.5" />
      </svg>
    ),
  },
  triptych: {
    label: 'Triptych',
    svg: (
      <svg viewBox="0 0 40 30" className="w-10 h-[30px]">
        <rect x="1" y="1" width="8" height="28" rx="2" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="0.5" />
        <rect x="11" y="1" width="18" height="28" rx="2" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="0.5" />
        <rect x="31" y="1" width="8" height="28" rx="2" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="0.5" />
      </svg>
    ),
  },
  studio: {
    label: 'Studio',
    svg: (
      <svg viewBox="0 0 40 30" className="w-10 h-[30px]">
        <rect x="1" y="1" width="38" height="4" rx="1" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="0.5" />
        <rect x="1" y="7" width="8" height="16" rx="2" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="0.5" />
        <rect x="11" y="7" width="18" height="16" rx="2" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="0.5" />
        <rect x="31" y="7" width="8" height="16" rx="2" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="0.5" />
        <rect x="1" y="25" width="38" height="4" rx="1" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="0.5" />
      </svg>
    ),
  },
  // stack excluded -- mobile-only fallback
  stack: { label: 'Stack', svg: null },
};

// Selectable layouts: exclude 'stack' (mobile fallback)
const SELECTABLE_LAYOUTS = LAYOUT_ORDER.filter(
  (id): id is Exclude<LayoutTemplateId, 'stack'> => id !== 'stack',
);

// Keyboard shortcut index (Ctrl+1 = first selectable, etc.)
const KEYBOARD_MAP: Record<string, LayoutTemplateId> = {};
SELECTABLE_LAYOUTS.forEach((id, i) => {
  KEYBOARD_MAP[String(i + 1)] = id;
});

// ---------------------------------------------------------------------------
// LayoutPicker Component
// ---------------------------------------------------------------------------

export function LayoutPicker() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentLayout = useWorkspaceStore((s) => s.layout);
  const setLayout = useWorkspaceStore((s) => s.setLayout);
  const { dispatch } = useIntent();

  // Dispatch a compose set-layout intent and also update workspace store
  const selectTemplate = useCallback(
    (template: LayoutTemplateId) => {
      const intent: Intent<'compose'> = {
        id: crypto.randomUUID(),
        type: 'compose',
        payload: { action: 'set-layout', template },
        source: open ? 'menu' : 'keyboard',
        timestamp: Date.now(),
      };
      dispatch(intent);
      setLayout(template);
      setOpen(false);
    },
    [dispatch, setLayout, open],
  );

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Keyboard shortcuts: Ctrl+1 through Ctrl+7
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) return;
      const template = KEYBOARD_MAP[e.key];
      if (template) {
        e.preventDefault();
        selectTemplate(template);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selectTemplate]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Layout templates (Ctrl+1-7)"
        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40"
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 z-50 mt-1 rounded-lg border border-slate-700/60 bg-slate-800/95 p-2 shadow-xl backdrop-blur-sm"
          style={{ minWidth: '240px' }}
        >
          <div className="mb-1.5 px-1 text-xs font-medium text-slate-400">
            Layout Templates
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {SELECTABLE_LAYOUTS.map((id, i) => {
              const info = TEMPLATE_THUMBNAILS[id];
              if (!info.svg) return null;
              const isActive = currentLayout === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectTemplate(id)}
                  className={`flex flex-col items-center gap-1 rounded-md px-2 py-1.5 text-xs transition-colors ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/40'
                      : 'text-slate-400 hover:bg-slate-700/60 hover:text-slate-200'
                  }`}
                >
                  {info.svg}
                  <span className="flex items-center gap-1">
                    {info.label}
                    <kbd className="hidden text-[9px] text-slate-500 sm:inline">
                      {i + 1}
                    </kbd>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default LayoutPicker;
