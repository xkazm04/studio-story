'use client';

import React, { useMemo } from 'react';
import { Plus, RotateCcw, X } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { LAYOUT_TEMPLATES, LAYOUT_ORDER, getLayoutFitnesses } from '../engine/layoutEngine';
import { PANEL_REGISTRY } from '../engine/panelRegistry';
import { WORKSPACE_PRESETS } from '../config/workspacePresets';
import { getExplainedPresetRecommendations } from '../config/presetRecommendations';
import { useWorkflowHintStore } from '../store/workflowHintStore';
import type { WorkspacePanelType, WorkspaceLayout } from '../types';

function LayoutIcon({ variant, size = 16 }: { variant: WorkspaceLayout; size?: number }) {
  const s = size;
  const g = 1;
  const r = 1;
  const common = { rx: r, className: 'fill-current' } as const;

  switch (variant) {
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
  const { selectedProject, selectedAct, selectedScene } = useProjectStore();
  const recentTools = useWorkflowHintStore((s) => s.recentTools);
  const presetFeedback = useWorkflowHintStore((s) => s.presetFeedback);
  const dismissedRecommendationIds = useWorkflowHintStore((s) => s.dismissedRecommendationIds);
  const markPresetHelpful = useWorkflowHintStore((s) => s.markPresetHelpful);
  const dismissRecommendation = useWorkflowHintStore((s) => s.dismissRecommendation);
  const resetRecommendationLearning = useWorkflowHintStore((s) => s.resetRecommendationLearning);

  const existingTypes = new Set(panels.map((p) => p.type));

  const availablePanels = Object.values(PANEL_REGISTRY).filter(
    (entry) => entry.type !== 'empty-welcome' && !existingTypes.has(entry.type)
  );

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
    <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-slate-800/40 bg-slate-950/70 px-3 py-1.5">
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
              return (
                <button
                  type="button"
                  key={variant}
                  onClick={() => setLayout(variant)}
                  title={`${tmpl.label}${isPoorFit ? ' (panels may not fit)' : ''}`}
                  className={cn(
                    'rounded p-1 transition-colors',
                    isActive
                      ? 'bg-slate-700/70 text-slate-100'
                      : isGoodFit
                        ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/40'
                        : isPoorFit
                          ? 'text-slate-800 opacity-40'
                          : 'text-slate-600 hover:text-slate-500',
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

      <div className="hidden items-center gap-1 lg:flex">
        {explainedRecommendations.map(({ preset, reasons }) => {
          const Icon = preset.icon;
          const topReason = reasons[0] ?? preset.description;
          return (
            <div
              key={preset.id}
              className="inline-flex items-center gap-1 rounded-md border border-slate-800/50 bg-slate-900/40 px-1 py-0.5 text-[10px] text-slate-400"
            >
              <button
                type="button"
                onClick={() => {
                  markPresetHelpful(preset.id);
                  replaceAllPanels(preset.panels, preset.layout);
                }}
                className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-[10px] text-slate-400 transition-colors hover:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40"
                title={`${preset.description}\nReason: ${topReason}`}
              >
                <Icon className="h-3 w-3" />
                <span>{preset.label}</span>
                <span className="hidden text-[9px] text-slate-600 xl:inline">• {topReason}</span>
              </button>
              <button
                type="button"
                onClick={() => dismissRecommendation(preset.id)}
                className="rounded p-0.5 text-slate-600 transition-colors hover:bg-slate-800/60 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-500/40"
                title="Not relevant"
                aria-label={`Dismiss ${preset.label} recommendation`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={resetRecommendationLearning}
          className="inline-flex items-center gap-1 rounded-md border border-slate-800/50 bg-slate-900/40 px-2 py-0.5 text-[10px] text-slate-500 transition-colors hover:border-slate-700/60 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-500/40"
          title="Reset recommendation learning"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset</span>
        </button>
      </div>

      <div className="flex-1 min-w-4" />

      <button
        type="button"
        onClick={clearPanels}
        className={cn(
          'flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-medium',
          'text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500/40'
        )}
        title="Clear workspace"
      >
        <X className="w-3 h-3" />
        <span>Clear</span>
      </button>

      <div className="flex-1 min-w-4" />

      {availablePanels.length > 0 && (
        <div className="relative group">
          <button
            type="button"
            className={cn(
              'flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium',
              'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-colors',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-500/40'
            )}
          >
            <Plus className="w-3 h-3" />
            <span>Add Panel</span>
          </button>

          <div className="absolute right-0 top-full z-50 mt-1 min-w-40 rounded-lg border border-slate-800/60 bg-slate-900 py-1 shadow-xl opacity-0 invisible transition-all group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
            {availablePanels.map((entry) => {
              const Icon = entry.icon;
              return (
                <button
                  type="button"
                  key={entry.type}
                  onClick={() => handleAddPanel(entry.type)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] text-slate-300 transition-colors hover:bg-slate-800/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-500/40"
                >
                  <Icon className="w-3 h-3 text-slate-500" />
                  {entry.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
