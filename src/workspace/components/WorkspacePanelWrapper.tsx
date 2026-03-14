'use client';

import React, { Suspense, useMemo, useCallback } from 'react';
import { Loader2, MessageCircle, X } from 'lucide-react';
import { getPanelEntry } from '../engine/panelRegistry';
import type { WorkspacePanelInstance } from '../types';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useCommandBarStore } from '../store/commandBarStore';
import { useResizeHandle } from '../hooks/useResizeHandle';
import { useIntent, type PanelDefinition, type Intent } from '@dzin/core';

interface WorkspacePanelWrapperProps {
  panel: WorkspacePanelInstance;
  onTriggerSkill?: (skillId: string, params?: Record<string, unknown>) => void;
  onTriggerPrompt?: (text: string, label?: string) => void;
}

const PanelSkeleton = () => (
  <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-800/60 bg-slate-950/90">
    <div className="h-7 bg-slate-900/80 border-b border-slate-800/50 flex items-center px-3">
      <div className="w-20 h-2.5 bg-slate-800/60 rounded animate-pulse" />
    </div>
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
    </div>
  </div>
);

// Stub PanelDefinition for resize -- densityModes empty means
// assignSlotDensity will use FALLBACK_THRESHOLDS (per dzin/core convention)
function createStubPanelDef(type: string, label: string): PanelDefinition {
  return {
    type,
    label,
    defaultRole: 'primary',
    sizeClass: 'standard',
    complexity: 'medium',
    domains: [],
    description: label,
    capabilities: [],
    useCases: [],
    inputs: [],
    outputs: [],
    densityModes: {},
    component: () => null,
  };
}

export default function WorkspacePanelWrapper({
  panel,
  onTriggerSkill,
  onTriggerPrompt,
}: WorkspacePanelWrapperProps) {
  const closePanelById = useWorkspaceStore((s) => s.closePanelById);
  const expand = useCommandBarStore((s) => s.expand);
  const focusInput = useCommandBarStore((s) => s.focusInput);
  const entry = getPanelEntry(panel.type);

  // Stub PanelDefinition for resize handle
  const panelDef = useMemo(
    () => createStubPanelDef(panel.type, entry?.label ?? panel.type),
    [panel.type, entry?.label],
  );

  const { onPointerDown: onResizePointerDown, isResizing } = useResizeHandle({
    panelId: panel.id,
    panelDef,
    currentDensity: panel.density ?? 'full',
  });

  // Close panel via compose intent
  const { dispatch } = useIntent();
  const handleClose = useCallback(() => {
    const intent: Intent<'compose'> = {
      id: crypto.randomUUID(),
      type: 'compose',
      payload: { action: 'close', panelId: panel.id },
      source: 'click',
      timestamp: Date.now(),
    };
    dispatch(intent);
    // Also close in workspace store for immediate UI response
    closePanelById(panel.id);
  }, [dispatch, panel.id, closePanelById]);

  const LazyComponent = useMemo(() => {
    if (!entry) return null;
    return React.lazy(entry.importFn);
  }, [entry]);

  if (!entry || !LazyComponent) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center rounded-lg border border-slate-800/60 bg-slate-950/90 px-3 text-center text-sm text-slate-400">
        Unknown panel: {panel.type}
      </div>
    );
  }

  const panelProps = {
    ...panel.props,
    onTriggerSkill,
    onTriggerPrompt,
    onClose: handleClose,
    density: panel.density ?? 'full',
    dataSlice: panel.dataSlice,
  };

  return (
    <section
      aria-label={entry.label}
      data-panel-id={panel.id}
      className="relative h-full min-h-0 min-w-0 group/panel"
    >
      <Suspense fallback={<PanelSkeleton />}>
        <LazyComponent {...panelProps} />
      </Suspense>

      {/* Close button -- appears on panel hover */}
      <button
        type="button"
        onClick={handleClose}
        title="Close panel"
        className="absolute top-1 right-1 z-20 flex h-5 w-5 items-center justify-center rounded bg-slate-900/80 text-slate-400 opacity-0 transition-opacity hover:bg-slate-800 hover:text-slate-200 group-hover/panel:opacity-70 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40"
      >
        <X className="h-3 w-3" />
      </button>

      {/* Resize handle -- right edge */}
      <div
        data-dzin-resize-handle="right"
        onPointerDown={(e) => onResizePointerDown('right', e)}
        className="absolute top-0 right-0 z-10 h-full w-1 cursor-col-resize opacity-0 transition-opacity hover:opacity-100 hover:bg-cyan-500/30 group-hover/panel:opacity-40"
        style={{ touchAction: 'none' }}
      />

      {/* Resize handle -- bottom edge */}
      <div
        data-dzin-resize-handle="bottom"
        onPointerDown={(e) => onResizePointerDown('bottom', e)}
        className="absolute bottom-0 left-0 z-10 h-1 w-full cursor-row-resize opacity-0 transition-opacity hover:opacity-100 hover:bg-cyan-500/30 group-hover/panel:opacity-40"
        style={{ touchAction: 'none' }}
      />

      {/* Ask AI floating button -- expands terminal on click */}
      <button
        type="button"
        onClick={() => { expand(); focusInput(); }}
        title="Ask AI about this"
        className="absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-full border border-cyan-500/30 bg-slate-950/90 px-2 py-1 text-xs font-medium text-cyan-400/70 opacity-0 shadow-sm backdrop-blur-sm transition-all hover:border-cyan-500/60 hover:text-cyan-300 hover:opacity-100 group-hover/panel:opacity-60 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40"
      >
        <MessageCircle className="h-3 w-3" />
        <span>Ask AI</span>
      </button>
    </section>
  );
}
