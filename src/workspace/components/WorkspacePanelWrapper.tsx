'use client';

import React, { Suspense, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { getPanelEntry } from '../engine/panelRegistry';
import type { WorkspacePanelInstance } from '../types';
import { useWorkspaceStore } from '../store/workspaceStore';

interface WorkspacePanelWrapperProps {
  panel: WorkspacePanelInstance;
  onTriggerSkill?: (skillId: string, params?: Record<string, unknown>) => void;
  onTriggerPrompt?: (text: string, label?: string) => void;
}

const PanelSkeleton = () => (
  <div className="flex flex-col h-full bg-slate-950/90 border border-slate-800/60 rounded-lg overflow-hidden">
    <div className="h-7 bg-slate-900/80 border-b border-slate-800/50 flex items-center px-3">
      <div className="w-20 h-2.5 bg-slate-800/60 rounded animate-pulse" />
    </div>
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
    </div>
  </div>
);

export default function WorkspacePanelWrapper({
  panel,
  onTriggerSkill,
  onTriggerPrompt,
}: WorkspacePanelWrapperProps) {
  const hidePanels = useWorkspaceStore((s) => s.hidePanels);
  const entry = getPanelEntry(panel.type);

  const LazyComponent = useMemo(() => {
    if (!entry) return null;
    return React.lazy(entry.importFn);
  }, [entry]);

  if (!entry || !LazyComponent) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-950/90 border border-slate-800/60 rounded-lg text-slate-500 text-xs">
        Unknown panel: {panel.type}
      </div>
    );
  }

  const panelProps = {
    ...panel.props,
    onTriggerSkill,
    onTriggerPrompt,
    onClose: () => hidePanels([panel.type]),
  };

  return (
    <Suspense fallback={<PanelSkeleton />}>
      <LazyComponent {...panelProps} />
    </Suspense>
  );
}
