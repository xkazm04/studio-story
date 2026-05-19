'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { PANEL_REGISTRY, type WorkspacePanelType, type PanelRegistryEntry } from '../engine/panelRegistry';
import { useWorkspaceStore } from '../store/workspaceStore';
import type { SkillDomain } from '../types';

// ---------------------------------------------------------------------------
// Domain display config
// ---------------------------------------------------------------------------

const DOMAIN_LABELS: Record<string, { label: string; order: number }> = {
  scene: { label: 'Scene', order: 0 },
  character: { label: 'Character', order: 1 },
  story: { label: 'Story', order: 2 },
  image: { label: 'Image', order: 3 },
  sound: { label: 'Voice & Audio', order: 4 },
  utility: { label: 'Utility', order: 5 },
  faction: { label: 'Faction', order: 6 },
  simulator: { label: 'Simulator', order: 7 },
  other: { label: 'Other', order: 8 },
};

// ---------------------------------------------------------------------------
// Fuzzy matching
// ---------------------------------------------------------------------------

function fuzzyScore(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 60;

  // Subsequence match with gap penalty
  let qi = 0;
  let score = 0;
  let lastMatchIdx = -1;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += 10;
      if (lastMatchIdx >= 0 && ti === lastMatchIdx + 1) score += 5; // consecutive bonus
      lastMatchIdx = ti;
      qi++;
    }
  }
  return qi === q.length ? score : 0;
}

// ---------------------------------------------------------------------------
// Search index entry
// ---------------------------------------------------------------------------

interface PanelSearchEntry {
  type: WorkspacePanelType;
  entry: PanelRegistryEntry;
  searchText: string;
  primaryDomain: string;
  description: string;
  companions: string[];
}

function buildSearchIndex(): PanelSearchEntry[] {
  return (Object.keys(PANEL_REGISTRY) as WorkspacePanelType[])
    .filter((type) => type !== 'empty-welcome')
    .map((type) => {
      const entry = PANEL_REGISTRY[type];
      const manifest = entry.manifest;
      const domains = entry.domains as SkillDomain[];
      const primaryDomain = domains[0] ?? 'other';
      const description = manifest?.description ?? '';
      const capabilities = manifest?.capabilities?.join(' ') ?? '';
      const companions = manifest?.suggestedCompanions ?? [];

      return {
        type,
        entry,
        searchText: `${entry.label} ${type} ${description} ${capabilities} ${domains.join(' ')}`.toLowerCase(),
        primaryDomain,
        description,
        companions,
      };
    });
}

// ---------------------------------------------------------------------------
// Grouped results
// ---------------------------------------------------------------------------

interface GroupedResults {
  domain: string;
  label: string;
  items: PanelSearchEntry[];
}

function groupByDomain(items: PanelSearchEntry[]): GroupedResults[] {
  const map = new Map<string, PanelSearchEntry[]>();
  for (const item of items) {
    const d = item.primaryDomain;
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(item);
  }
  return Array.from(map.entries())
    .map(([domain, entries]) => ({
      domain,
      label: DOMAIN_LABELS[domain]?.label ?? domain,
      items: entries,
    }))
    .sort((a, b) => (DOMAIN_LABELS[a.domain]?.order ?? 99) - (DOMAIN_LABELS[b.domain]?.order ?? 99));
}

// ---------------------------------------------------------------------------
// PanelPalette component
// ---------------------------------------------------------------------------

interface PanelPaletteProps {
  open: boolean;
  onClose: () => void;
  /** If set, swap this panel. Otherwise swap the focused panel. */
  targetPanelId?: string;
}

export default function PanelPalette({ open, onClose, targetPanelId }: PanelPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const panels = useWorkspaceStore((s) => s.panels);
  const focusedPanelId = useWorkspaceStore((s) => s.focusedPanelId);
  const swapPanelById = useWorkspaceStore((s) => s.swapPanelById);

  const resolvedTargetId = targetPanelId ?? focusedPanelId;
  const targetPanel = panels.find((p) => p.id === resolvedTargetId);

  const searchIndex = useMemo(() => buildSearchIndex(), []);

  const filteredGroups = useMemo(() => {
    const q = query.trim();
    if (!q) return groupByDomain(searchIndex);

    const scored = searchIndex
      .map((item) => ({ item, score: fuzzyScore(q, item.searchText) }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    return groupByDomain(scored.map((s) => s.item));
  }, [query, searchIndex]);

  // Flat list for keyboard navigation
  const flatItems = useMemo(
    () => filteredGroups.flatMap((g) => g.items),
    [filteredGroups],
  );

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector('[data-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (type: WorkspacePanelType) => {
      if (!resolvedTargetId) {
        // No focused panel — fallback to showPanels
        useWorkspaceStore.getState().showPanels([{ type }]);
      } else {
        swapPanelById(resolvedTargetId, type);
      }
      onClose();
    },
    [resolvedTargetId, swapPanelById, onClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (flatItems[selectedIndex]) {
            handleSelect(flatItems[selectedIndex].type);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [flatItems, selectedIndex, handleSelect, onClose],
  );

  if (!open) return null;

  let flatIndex = -1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Palette */}
      <div
        className={cn(
          'relative z-10 w-full max-w-lg overflow-hidden rounded-xl',
          'border border-slate-700/60 bg-slate-900/95 shadow-2xl shadow-black/40',
          'ring-1 ring-slate-600/20',
        )}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 border-b border-slate-800/60 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              targetPanel
                ? `Replace "${PANEL_REGISTRY[targetPanel.type]?.label ?? targetPanel.type}"...`
                : 'Search panels...'
            }
            className={cn(
              'flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500',
              'outline-none',
            )}
          />
          <kbd className="hidden rounded border border-slate-700/60 bg-slate-800/60 px-1.5 py-0.5 text-[10px] text-slate-500 sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-1">
          {filteredGroups.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              No panels match &quot;{query}&quot;
            </div>
          )}

          {filteredGroups.map((group) => (
            <div key={group.domain}>
              <div className="sticky top-0 z-10 bg-slate-900/95 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {group.label}
              </div>
              {group.items.map((item) => {
                flatIndex++;
                const isSelected = flatIndex === selectedIndex;
                const isCurrent = targetPanel?.type === item.type;
                const Icon = item.entry.icon;
                const currentFlatIndex = flatIndex;

                return (
                  <button
                    key={item.type}
                    type="button"
                    data-selected={isSelected}
                    onClick={() => handleSelect(item.type)}
                    onMouseEnter={() => setSelectedIndex(currentFlatIndex)}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2 text-left transition-colors',
                      isSelected
                        ? 'bg-cyan-500/10 text-slate-100'
                        : 'text-slate-300 hover:bg-slate-800/40',
                      isCurrent && 'opacity-50',
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0',
                        isSelected ? 'text-cyan-400' : 'text-slate-500',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {item.entry.label}
                        </span>
                        {isCurrent && (
                          <span className="shrink-0 rounded bg-slate-700/60 px-1.5 py-0.5 text-[10px] text-slate-400">
                            current
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="truncate text-xs text-slate-500">
                          {item.description}
                        </p>
                      )}
                    </div>
                    {item.companions.length > 0 && isSelected && (
                      <div className="hidden shrink-0 items-center gap-1 text-[10px] text-slate-600 sm:flex">
                        <ArrowUpDown className="h-3 w-3" />
                        {item.companions.slice(0, 2).map((c) => (
                          <span key={c} className="rounded bg-slate-800/60 px-1 py-0.5">
                            {PANEL_REGISTRY[c as WorkspacePanelType]?.label ?? c}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-3 border-t border-slate-800/60 px-4 py-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-slate-700/60 bg-slate-800/60 px-1 py-0.5">&#8593;</kbd>
            <kbd className="rounded border border-slate-700/60 bg-slate-800/60 px-1 py-0.5">&#8595;</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-slate-700/60 bg-slate-800/60 px-1 py-0.5">&#9166;</kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-slate-700/60 bg-slate-800/60 px-1 py-0.5">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}
