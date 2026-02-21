'use client';

import React, { useMemo } from 'react';
import {
  RotateCcw,
  Terminal,
  X,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { WORKSPACE_PRESETS } from '../../config/workspacePresets';
import { getExplainedPresetRecommendations } from '../../config/presetRecommendations';
import { useWorkflowHintStore } from '../../store/workflowHintStore';
import { useProjectStore } from '@/app/store/slices/projectSlice';

export default function EmptyWelcomePanel() {
  const replaceAllPanels = useWorkspaceStore((s) => s.replaceAllPanels);
  const panels = useWorkspaceStore((s) => s.panels);
  const recentTools = useWorkflowHintStore((s) => s.recentTools);
  const presetFeedback = useWorkflowHintStore((s) => s.presetFeedback);
  const dismissedRecommendationIds = useWorkflowHintStore((s) => s.dismissedRecommendationIds);
  const markPresetHelpful = useWorkflowHintStore((s) => s.markPresetHelpful);
  const dismissRecommendation = useWorkflowHintStore((s) => s.dismissRecommendation);
  const resetRecommendationLearning = useWorkflowHintStore((s) => s.resetRecommendationLearning);
  const { selectedProject, selectedAct, selectedScene } = useProjectStore();

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

  return (
    <div className="flex flex-col items-center h-full p-6 overflow-auto select-none">
      {/* Header */}
      <div className="flex flex-col items-center mb-6 mt-2">
        <div className="relative mb-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900/60 border border-slate-800/50 flex items-center justify-center">
            <Terminal className="w-6 h-6 text-slate-500" />
          </div>
          <div className="absolute inset-0 w-12 h-12 rounded-xl border border-cyan-500/20 animate-pulse" />
        </div>
        <h2 className="text-sm font-semibold text-slate-200 mb-0.5">Studio Story</h2>
        <p className="text-[11px] text-slate-500 text-center max-w-[320px]">
          Pick a workspace to get started, or describe what you want in the terminal below.
          The AI will compose the perfect workspace for your task.
        </p>
      </div>

      {/* Adaptive recommendations */}
      {explainedRecommendations.length > 0 && (
        <div className="mb-3 w-full max-w-160">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Recommended now</p>
            <button
              type="button"
              onClick={resetRecommendationLearning}
              className="inline-flex items-center gap-1 rounded border border-slate-800/50 bg-slate-900/45 px-1.5 py-0.5 text-[9px] text-slate-500 transition-colors hover:border-slate-700/60 hover:text-slate-300"
              title="Reset recommendation learning"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {explainedRecommendations.map(({ preset, reasons }) => {
              const Icon = preset.icon;
              const topReason = reasons[0] ?? preset.description;
              return (
                <div
                  key={`recommended-${preset.id}`}
                  className="inline-flex items-start gap-1 rounded-md border border-slate-800/50 bg-slate-900/45 px-2 py-1 text-left text-[10px] text-slate-300"
                >
                  <button
                    type="button"
                    onClick={() => {
                      markPresetHelpful(preset.id);
                      replaceAllPanels(preset.panels, preset.layout);
                    }}
                    className="inline-flex flex-col items-start gap-0.5 rounded px-1 py-0.5 text-left text-[10px] text-slate-300 transition-colors hover:text-slate-100"
                    title={`${preset.description}\nReason: ${topReason}`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Icon className={cn('h-3 w-3', preset.color)} />
                      {preset.label}
                    </span>
                    <span className="text-[9px] text-slate-500">{topReason}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissRecommendation(preset.id)}
                    className="mt-0.5 rounded p-0.5 text-slate-600 transition-colors hover:bg-slate-800/60 hover:text-slate-300"
                    title="Not relevant"
                    aria-label={`Dismiss ${preset.label} recommendation`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Preset grid */}
      <div className="grid w-full max-w-160 grid-cols-1 gap-2.5 md:grid-cols-2">
        {WORKSPACE_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              markPresetHelpful(preset.id);
              replaceAllPanels(preset.panels, preset.layout);
            }}
            className={cn(
              'flex items-start gap-3 px-3.5 py-3 rounded-lg border transition-all cursor-pointer text-left group',
              preset.bg,
              preset.border
            )}
          >
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
              'bg-slate-900/60 border border-slate-800/40 group-hover:border-slate-700/60 transition-colors'
            )}>
              <preset.icon className={cn('w-4 h-4', preset.color)} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-200 mb-0.5">{preset.label}</p>
              <p className="text-[10px] text-slate-500 leading-relaxed">{preset.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
