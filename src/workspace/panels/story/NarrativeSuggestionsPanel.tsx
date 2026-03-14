'use client';

import React from 'react';
import { Sparkles, X, Zap } from 'lucide-react';
import PanelFrame from '../shared/PanelFrame';
import { useAgentStore } from '@/agents/store/agentStore';
import { useWorkspaceStore } from '@/workspace/store/workspaceStore';
import type { PanelDensity } from '@/workspace/types';
import type { MuseInsight, MuseInsightCategory } from '@/agents/types';

interface NarrativeSuggestionsPanelProps {
  onClose?: () => void;
  density?: PanelDensity;
}

const CATEGORY_COLORS: Record<MuseInsightCategory, string> = {
  character: 'bg-cyan-500/20 text-cyan-400',
  plot: 'bg-violet-500/20 text-violet-400',
  pacing: 'bg-amber-500/20 text-amber-400',
  continuity: 'bg-emerald-500/20 text-emerald-400',
};

const PRIORITY_DOTS: Record<MuseInsight['priority'], string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-slate-500',
};

export default function NarrativeSuggestionsPanel({ onClose, density }: NarrativeSuggestionsPanelProps) {
  const museInsights = useAgentStore(s => s.museInsights);
  const dismissMuseInsight = useAgentStore(s => s.dismissMuseInsight);
  const replaceAllPanels = useWorkspaceStore(s => s.replaceAllPanels);

  const visibleInsights = (museInsights ?? [])
    .filter(i => !i.dismissed)
    .slice(0, 5);

  const handleApply = (insight: MuseInsight) => {
    if (insight.action?.payload) {
      const payload = insight.action.payload as { layout?: string; panels?: Array<{ type: string }> };
      const layout = (payload.layout ?? 'split-2') as Parameters<typeof replaceAllPanels>[1];
      const panels = (payload.panels ?? []) as Parameters<typeof replaceAllPanels>[0];
      replaceAllPanels(panels, layout);
    }
    dismissMuseInsight(insight.id);
  };

  if (density === 'micro') {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs text-slate-300">{visibleInsights.length}</span>
      </div>
    );
  }

  return (
    <PanelFrame
      title="Narrative Suggestions"
      icon={Sparkles}
      headerAccent="amber"
      onClose={onClose}
      density={density}
    >
      <div className="flex flex-col gap-2 p-3 overflow-y-auto h-full">
        {visibleInsights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Sparkles className="w-8 h-8 text-slate-600 mb-3" />
            <p className="text-sm text-slate-400">
              No suggestions right now. Keep writing -- ideas will surface as your story develops.
            </p>
          </div>
        ) : (
          visibleInsights.map(insight => (
            <div
              key={insight.id}
              className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-3 hover:border-slate-600/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${CATEGORY_COLORS[insight.category]}`}>
                    {insight.category}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${PRIORITY_DOTS[insight.priority]}`} />
                </div>
                <button
                  onClick={() => dismissMuseInsight(insight.id)}
                  className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                  aria-label="Dismiss suggestion"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <h4 className="text-sm font-semibold text-slate-200 mb-1">{insight.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-2">{insight.description}</p>
              {insight.action && (
                <button
                  onClick={() => handleApply(insight)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
                >
                  <Zap className="w-3 h-3" />
                  Apply
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </PanelFrame>
  );
}
