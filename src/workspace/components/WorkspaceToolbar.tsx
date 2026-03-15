'use client';

import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Plus, RotateCcw, X, Search, FileText, Users, BookOpen, Image, AudioLines, Bot } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { LAYOUT_TEMPLATES, LAYOUT_ORDER, getLayoutFitnesses, getAllowedLayouts } from '../engine/layoutEngine';
import { PANEL_REGISTRY } from '../engine/panelRegistry';
import { WORKSPACE_PRESETS } from '../config/workspacePresets';
import { getExplainedPresetRecommendations } from '../config/presetRecommendations';
import { useWorkflowHintStore } from '../store/workflowHintStore';
import type { WorkspacePanelType, WorkspaceLayout, SkillDomain } from '../types';
import type { PanelRegistryEntry } from '../engine/panelRegistry';
import type { LucideIcon } from 'lucide-react';

// ─── Domain Category Grouping ────────────────────────────────────────────────

interface DomainCategory {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Panels are assigned to the first matching category based on their domains */
  matchDomains: SkillDomain[];
  /** Catch-all for panels with empty domains */
  catchAllTypes?: WorkspacePanelType[];
}

const DOMAIN_CATEGORIES: DomainCategory[] = [
  { key: 'scene', label: 'Scene', icon: FileText, matchDomains: ['scene'] },
  { key: 'character', label: 'Character', icon: Users, matchDomains: ['character'] },
  { key: 'story', label: 'Story', icon: BookOpen, matchDomains: ['story'] },
  { key: 'image', label: 'Image', icon: Image, matchDomains: ['image'] },
  { key: 'audio', label: 'Audio', icon: AudioLines, matchDomains: ['utility', 'sound'] },
  { key: 'assistant', label: 'Assistant', icon: Bot, matchDomains: [], catchAllTypes: ['advisor'] },
];

function groupPanelsByDomain(panels: PanelRegistryEntry[]): { category: DomainCategory; panels: PanelRegistryEntry[] }[] {
  const assigned = new Set<string>();
  const groups: { category: DomainCategory; panels: PanelRegistryEntry[] }[] = [];

  for (const cat of DOMAIN_CATEGORIES) {
    const matching = panels.filter((p) => {
      if (assigned.has(p.type)) return false;
      if (cat.catchAllTypes?.includes(p.type)) return true;
      return p.domains.some((d) => cat.matchDomains.includes(d));
    });
    matching.forEach((p) => assigned.add(p.type));
    if (matching.length > 0) {
      groups.push({ category: cat, panels: matching });
    }
  }

  // Any remaining panels go into an "Other" group
  const remaining = panels.filter((p) => !assigned.has(p.type));
  if (remaining.length > 0) {
    groups.push({
      category: { key: 'other', label: 'Other', icon: Plus, matchDomains: [] },
      panels: remaining,
    });
  }

  return groups;
}

function getFitnessLabel(fitness: number): string {
  if (fitness >= 80) return 'Great fit';
  if (fitness >= 50) return 'Good fit';
  if (fitness >= 20) return 'Okay fit';
  if (fitness >= 0) return 'Poor fit';
  return 'Poor fit';
}

function getFitnessTooltip(label: string, fitness: number): string {
  const pct = Math.max(0, Math.round(fitness));
  const fitnessLabel = getFitnessLabel(fitness);
  if (fitness < 0) return `${label} — ${fitnessLabel} (${pct}%) – not enough slots`;
  if (fitness < 50) return `${label} — ${fitnessLabel} (${pct}%) – panels may not fit well`;
  return `${label} — ${fitnessLabel} (${pct}%)`;
}

function LayoutIcon({ variant, size = 16 }: { variant: WorkspaceLayout; size?: number }) {
  const s = size;
  const g = 1;
  const r = 1;
  const common = { rx: r, className: 'fill-current' } as const;

  switch (variant) {
    case 'stack':
      return (<svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><rect x={0} y={0} width={s} height={s * 0.3 - g / 2} {...common} /><rect x={0} y={s * 0.35} width={s} height={s * 0.3 - g / 2} {...common} /><rect x={0} y={s * 0.7} width={s} height={s * 0.3} {...common} /></svg>);
    case 'single':
      return (<svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><rect x={0} y={0} width={s} height={s} {...common} /></svg>);
    case 'split-2':
      return (<svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><rect x={0} y={0} width={s * 0.58 - g / 2} height={s} {...common} /><rect x={s * 0.58 + g / 2} y={0} width={s * 0.42 - g / 2} height={s} {...common} /></svg>);
    case 'split-3':
      return (<svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><rect x={0} y={0} width={s * 0.58 - g / 2} height={s} {...common} /><rect x={s * 0.58 + g / 2} y={0} width={s * 0.42 - g / 2} height={s * 0.5 - g / 2} {...common} /><rect x={s * 0.58 + g / 2} y={s * 0.5 + g / 2} width={s * 0.42 - g / 2} height={s * 0.5 - g / 2} {...common} /></svg>);
    case 'grid-4':
      return (<svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><rect x={0} y={0} width={s * 0.5 - g / 2} height={s * 0.5 - g / 2} {...common} /><rect x={s * 0.5 + g / 2} y={0} width={s * 0.5 - g / 2} height={s * 0.5 - g / 2} {...common} /><rect x={0} y={s * 0.5 + g / 2} width={s * 0.5 - g / 2} height={s * 0.5 - g / 2} {...common} /><rect x={s * 0.5 + g / 2} y={s * 0.5 + g / 2} width={s * 0.5 - g / 2} height={s * 0.5 - g / 2} {...common} /></svg>);
    case 'primary-sidebar':
      return (<svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><rect x={0} y={0} width={s * 0.7 - g / 2} height={s} {...common} /><rect x={s * 0.7 + g / 2} y={0} width={s * 0.3 - g / 2} height={s} {...common} /></svg>);
    case 'triptych':
      return (<svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><rect x={0} y={0} width={s * 0.25 - g / 2} height={s} {...common} /><rect x={s * 0.25 + g / 2} y={0} width={s * 0.5 - g} height={s} {...common} /><rect x={s * 0.75 + g / 2} y={0} width={s * 0.25 - g / 2} height={s} {...common} /></svg>);
    case 'studio':
      return (<svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><rect x={0} y={0} width={s} height={s * 0.15} {...common} /><rect x={0} y={s * 0.15 + g} width={s * 0.22} height={s * 0.63 - g} {...common} /><rect x={s * 0.22 + g} y={s * 0.15 + g} width={s * 0.56 - g * 2} height={s * 0.63 - g} {...common} /><rect x={s * 0.78 + g} y={s * 0.15 + g} width={s * 0.22 - g} height={s * 0.63 - g} {...common} /><rect x={0} y={s * 0.78 + g} width={s} height={s * 0.22 - g} {...common} /></svg>);
  }
}

export default function WorkspaceToolbar() {
  const layout = useWorkspaceStore((s) => s.layout);
  const panels = useWorkspaceStore((s) => s.panels);
  const setLayout = useWorkspaceStore((s) => s.setLayout);
  const showPanels = useWorkspaceStore((s) => s.showPanels);
  const replaceAllPanels = useWorkspaceStore((s) => s.replaceAllPanels);
  const clearPanels = useWorkspaceStore((s) => s.clearPanels);
  const reopenLastClosedPanel = useWorkspaceStore((s) => s.reopenLastClosedPanel);
  const closedPanelHistory = useWorkspaceStore((s) => s.closedPanelHistory);
  const { selectedProject, selectedAct, selectedScene } = useProjectStore();
  const recentTools = useWorkflowHintStore((s) => s.recentTools);
  const presetFeedback = useWorkflowHintStore((s) => s.presetFeedback);
  const dismissedRecommendationIds = useWorkflowHintStore((s) => s.dismissedRecommendationIds);
  const markPresetHelpful = useWorkflowHintStore((s) => s.markPresetHelpful);
  const dismissRecommendation = useWorkflowHintStore((s) => s.dismissRecommendation);
  const resetRecommendationLearning = useWorkflowHintStore((s) => s.resetRecommendationLearning);

  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1920
  );

  useEffect(() => {
    let rafId: number;
    const onResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => setViewportWidth(window.innerWidth));
    };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(rafId); };
  }, []);

  const allowedLayouts = useMemo(() => getAllowedLayouts(viewportWidth), [viewportWidth]);

  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [panelSearch, setPanelSearch] = useState('');
  const addPanelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!addPanelOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (addPanelRef.current && !addPanelRef.current.contains(e.target as Node)) {
        setAddPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [addPanelOpen]);

  // Focus search input when dropdown opens, clear search when closing
  useEffect(() => {
    if (addPanelOpen) {
      requestAnimationFrame(() => searchInputRef.current?.focus());
    } else {
      setPanelSearch('');
    }
  }, [addPanelOpen]);

  const [layoutToast, setLayoutToast] = useState<string | null>(null);
  const layoutToastTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const handler = (e: Event) => {
      const layoutKey = (e as CustomEvent).detail?.layout as WorkspaceLayout | undefined;
      if (!layoutKey) return;
      const label = LAYOUT_TEMPLATES[layoutKey]?.label ?? layoutKey;
      setLayoutToast(`Switched to ${label}`);
      clearTimeout(layoutToastTimerRef.current);
      layoutToastTimerRef.current = setTimeout(() => setLayoutToast(null), 1800);
    };
    window.addEventListener('workspace-layout-switched', handler);
    return () => {
      window.removeEventListener('workspace-layout-switched', handler);
      clearTimeout(layoutToastTimerRef.current);
    };
  }, []);

  const existingTypes = new Set(panels.map((p) => p.type));

  const availablePanels = Object.values(PANEL_REGISTRY).filter(
    (entry) => entry.type !== 'empty-welcome' && !existingTypes.has(entry.type)
  );

  const groupedPanels = useMemo(() => {
    const query = panelSearch.toLowerCase().trim();
    const filtered = query
      ? availablePanels.filter((p) => p.label.toLowerCase().includes(query) || p.type.toLowerCase().includes(query))
      : availablePanels;
    return groupPanelsByDomain(filtered);
  }, [availablePanels, panelSearch]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPanelSearch(e.target.value);
  }, []);

  const explainedRecommendations = useMemo(
    () =>
      getExplainedPresetRecommendations({
        presets: WORKSPACE_PRESETS,
        activePanelTypes: panels.map((panel) => panel.type),
        recentTools,
        hasProject: Boolean(selectedProject?.id),
        hasAct: Boolean(selectedAct?.id),
        hasScene: Boolean(selectedScene?.id),
        presetFeedback,
        dismissedRecommendationIds,
        limit: 3,
      }),
    [panels, recentTools, selectedProject?.id, selectedAct?.id, selectedScene?.id, presetFeedback, dismissedRecommendationIds]
  );

  const handleAddPanel = (type: WorkspacePanelType) => {
    showPanels([{ type, role: PANEL_REGISTRY[type].defaultRole }]);
  };

  if (panels.length === 0) return null;

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-slate-800/40 bg-slate-950/70 px-3 py-1.5">
      {(() => {
        const fitnesses = getLayoutFitnesses(panels);
        return (
          <div className="flex items-center gap-0.5 rounded-md border border-slate-800/40 bg-slate-900/50 p-0.5">
            {LAYOUT_ORDER.map((variant) => {
              const tmpl = LAYOUT_TEMPLATES[variant];
              const isActive = layout === variant;
              const fitness = fitnesses[variant];
              const isGoodFit = fitness >= 50;
              const isPoorFit = fitness < 0;
              const isAllowed = allowedLayouts.has(variant);
              return (
                <button
                  type="button"
                  key={variant}
                  onClick={() => isAllowed && setLayout(variant)}
                  disabled={!isAllowed}
                  aria-label={`Switch to ${tmpl.label} layout`}
                  title={!isAllowed ? `${tmpl.label} — screen too narrow` : getFitnessTooltip(tmpl.label, fitness)}
                  className={cn(
                    'rounded p-1 transition-colors',
                    !isAllowed
                      ? 'text-slate-800 opacity-25 cursor-not-allowed'
                      : isActive
                        ? 'bg-slate-700/70 text-slate-100'
                        : isGoodFit
                          ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/40'
                          : isPoorFit
                            ? 'text-slate-800 opacity-40'
                            : 'text-slate-400 hover:text-slate-300',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40'
                  )}
                >
                  <LayoutIcon variant={variant} size={14} />
                </button>
              );
            })}
          </div>
        );
      })()}

      <kbd className="hidden items-center rounded border border-slate-700/50 bg-slate-800/40 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 lg:inline-flex"
        title="Cycle layout with keyboard shortcut"
      >Ctrl+Shift+L</kbd>

      <div className="hidden items-center gap-1 lg:flex">
        {explainedRecommendations.map(({ preset, reasons }) => {
          const Icon = preset.icon;
          const topReason = reasons[0] ?? preset.description;
          return (
            <div
              key={preset.id}
              className="inline-flex items-center gap-1 rounded-md border border-slate-800/50 bg-slate-900/40 px-1 py-0.5 text-xs text-slate-400"
            >
              <button
                type="button"
                onClick={() => {
                  markPresetHelpful(preset.id);
                  replaceAllPanels(preset.panels, preset.layout);
                }}
                className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs text-slate-400 transition-colors hover:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40"
                title={`${preset.description}\nReason: ${topReason}`}
              >
                <Icon className="h-3 w-3" />
                <span>{preset.label}</span>
              </button>
              <button
                type="button"
                onClick={() => dismissRecommendation(preset.id)}
                className="rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-500/40"
                title="Not relevant"
                aria-label={`Dismiss ${preset.label} recommendation`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex-1 min-w-4" />

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={resetRecommendationLearning}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-400 transition-colors hover:border-slate-700/60 hover:text-slate-300 hover:bg-slate-800/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-500/40"
          title="Reset recommendation learning"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset</span>
        </button>

        <button
          type="button"
          onClick={clearPanels}
          aria-label="Clear workspace"
          className={cn(
            'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium',
            'text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500/40'
          )}
          title="Clear workspace"
        >
          <X className="w-3 h-3" />
          <span>Clear</span>
        </button>

        {closedPanelHistory.length > 0 && (
          <button
            type="button"
            onClick={reopenLastClosedPanel}
            aria-label="Reopen last closed panel"
            className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20"
          >
            Reopen
          </button>
        )}

        {availablePanels.length > 0 && (
          <div className="relative" ref={addPanelRef}>
            <button
              id="workspace-add-panel-button"
              type="button"
              onClick={() => setAddPanelOpen((o) => !o)}
              aria-label="Add panel"
              className={cn(
                'flex items-center gap-1 rounded px-2 py-1 text-xs font-medium',
                'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 transition-colors',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-500/40',
                addPanelOpen && 'bg-slate-800/50 text-slate-300'
              )}
            >
              <Plus className="w-3 h-3" />
              <span>Add Panel</span>
            </button>

            {addPanelOpen && (
              <div className="absolute right-0 top-full z-[100] mt-1 max-h-96 min-w-56 overflow-hidden rounded-lg border border-slate-800/60 bg-slate-900 shadow-xl flex flex-col">
                {/* Search input */}
                <div className="flex items-center gap-2 border-b border-slate-800/40 px-3 py-2">
                  <Search className="h-3 w-3 text-slate-500 shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={panelSearch}
                    onChange={handleSearchChange}
                    placeholder="Search panels..."
                    className="w-full bg-transparent text-sm text-slate-300 placeholder:text-slate-600 outline-none"
                  />
                </div>

                {/* Grouped panel list */}
                <div className="overflow-y-auto py-1">
                  {groupedPanels.length === 0 && (
                    <div className="px-3 py-3 text-center text-xs text-slate-500">No panels found</div>
                  )}
                  {groupedPanels.map(({ category, panels: catPanels }) => {
                    const CatIcon = category.icon;
                    return (
                      <div key={category.key}>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          <CatIcon className="h-3 w-3" />
                          {category.label}
                        </div>
                        {catPanels.map((entry) => {
                          const Icon = entry.icon;
                          return (
                            <button
                              type="button"
                              key={entry.type}
                              onClick={() => { handleAddPanel(entry.type); setAddPanelOpen(false); }}
                              className="flex w-full items-center gap-2 px-3 py-1.5 pl-7 text-sm text-slate-300 transition-colors hover:bg-slate-800/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-500/40"
                            >
                              <Icon className="w-3 h-3 text-slate-400" />
                              {entry.label}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {layoutToast && (
        <div className="pointer-events-none fixed inset-x-0 top-10 z-50 flex justify-center">
          <div aria-live="polite" className="pointer-events-auto rounded-md border border-cyan-500/30 bg-slate-800/90 px-4 py-2 text-xs font-medium text-slate-200 shadow-lg backdrop-blur-md">
            {layoutToast}
          </div>
        </div>
      )}
    </div>
  );
}
