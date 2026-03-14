'use client';

import React, { useRef, useLayoutEffect, useEffect, useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { getLayoutTemplate, assignPanelsToSlots } from '../engine/layoutEngine';
import { cn } from '@/app/lib/utils';
import { useViewTransition } from '../hooks/useViewTransition';
import WorkspacePanelWrapper from './WorkspacePanelWrapper';
import WorkspaceToolbar from './WorkspaceToolbar';
import EmptyWelcomePanel from '../panels/shared/EmptyWelcomePanel';
import { Plus } from 'lucide-react';
import type { WorkspacePanelInstance } from '../types';

const TRANSITION_DURATION = 0.35;

interface WorkspaceGridProps {
  onTriggerSkill?: (skillId: string, params?: Record<string, unknown>) => void;
  onTriggerPrompt?: (text: string, label?: string) => void;
}

export default function WorkspaceGrid({ onTriggerSkill, onTriggerPrompt }: WorkspaceGridProps) {
  const panels = useWorkspaceStore((s) => s.panels);
  const layout = useWorkspaceStore((s) => s.layout);
  const gridRef = useRef<HTMLDivElement>(null);
  const { startTransition, supportsViewTransitions } = useViewTransition();

  // Track previous panels/layout to detect changes for view transitions
  const prevPanelsRef = useRef<WorkspacePanelInstance[]>(panels);
  const prevLayoutRef = useRef(layout);
  const [renderPanels, setRenderPanels] = useState(panels);
  const [renderLayout, setRenderLayout] = useState(layout);

  // Animate CSS grid-template-* properties via inline style transitions.
  const hasRendered = useRef(false);
  useLayoutEffect(() => {
    if (!hasRendered.current) {
      hasRendered.current = true;
      return;
    }
  }, [layout]);

  // When panels or layout change, wrap the DOM update in a view transition
  useEffect(() => {
    const panelsChanged = prevPanelsRef.current !== panels;
    const layoutChanged = prevLayoutRef.current !== layout;

    if (!panelsChanged && !layoutChanged) return;

    prevPanelsRef.current = panels;
    prevLayoutRef.current = layout;

    if (supportsViewTransitions && hasRendered.current) {
      startTransition(() => {
        setRenderPanels(panels);
        setRenderLayout(layout);
      });
    } else {
      setRenderPanels(panels);
      setRenderLayout(layout);
    }
  }, [panels, layout, startTransition, supportsViewTransitions]);

  // Reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Empty state
  if (renderPanels.length === 0) {
    return (
      <div className="h-full p-4">
        <EmptyWelcomePanel />
      </div>
    );
  }

  const template = getLayoutTemplate(renderLayout);
  const assignedPanels = assignPanelsToSlots(renderPanels, renderLayout);
  const maxSlots = template.slots.length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <WorkspaceToolbar />
      <div
        ref={gridRef}
        data-dzin-workspace-grid
        className={cn(
          'flex-1 min-h-0 gap-3 p-3 pt-2',
          renderLayout === 'stack' ? 'overflow-y-auto' : 'overflow-hidden'
        )}
        style={{
          display: 'grid',
          gridTemplateRows: template.gridTemplateRows,
          gridTemplateColumns: template.gridTemplateColumns,
          gridAutoRows: renderLayout === 'stack' ? 'minmax(200px, 1fr)' : 'minmax(0, 1fr)',
          transition:
            hasRendered.current && !supportsViewTransitions
              ? `grid-template-rows ${TRANSITION_DURATION}s cubic-bezier(0.19,1,0.22,1), grid-template-columns ${TRANSITION_DURATION}s cubic-bezier(0.19,1,0.22,1)`
              : undefined,
        }}
      >
        {assignedPanels.map((panel) => {
          const slotIdx = assignedPanels.indexOf(panel);
          const slotStyle = template.slots[slotIdx]?.style ?? {};
          return (
            <div
              key={panel.id}
              style={{
                ...slotStyle,
                viewTransitionName: `panel-${panel.id}`,
              } as React.CSSProperties}
              className={cn(
                'min-h-0 min-w-0 overflow-hidden',
                !supportsViewTransitions && !prefersReducedMotion && 'animate-fade-in'
              )}
            >
              <WorkspacePanelWrapper
                panel={panel}
                onTriggerSkill={onTriggerSkill}
                onTriggerPrompt={onTriggerPrompt}
              />
            </div>
          );
        })}
        {Array.from({ length: Math.max(0, maxSlots - assignedPanels.length) }).map((_, i) => {
          const slotIndex = assignedPanels.length + i;
          const slotStyle = template.slots[slotIndex]?.style ?? {};
          return (
            <div
              key={`empty-slot-${slotIndex}`}
              style={slotStyle}
              className="min-h-0 min-w-0"
            >
              <button
                type="button"
                onClick={() => {
                  const addBtn = document.getElementById('workspace-add-panel-button');
                  addBtn?.click();
                }}
                className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700/30 bg-slate-900/20 text-slate-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm">Add Panel</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
