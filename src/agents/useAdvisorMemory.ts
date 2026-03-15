'use client';

/**
 * useAdvisorMemory — Tracks user behavior signals for advisor personalization.
 *
 * Observes:
 * - Workspace panel changes (layout preferences)
 * - Suggestion accept/dismiss actions
 * - Panel domain transitions (workflow patterns)
 * - Density changes
 *
 * Stores signals in advisorMemoryStore (persisted to localStorage).
 */

import { useEffect, useRef } from 'react';
import { useWorkspaceStore } from '@/workspace/store/workspaceStore';
import { useAdvisorMemoryStore } from './store/advisorMemoryStore';

/** Extract the domain from a panel type string */
function panelDomain(type: string): string {
  if (type.startsWith('scene-') || type === 'dialogue-view') return 'scene';
  if (type.startsWith('character-') || type === 'cast-sidebar') return 'character';
  if (type.startsWith('story-') || type.startsWith('beats-') || type === 'script-editor' || type === 'theme-manager' || type === 'writing-desk') return 'story';
  if (type.startsWith('image-') || type === 'art-style' || type === 'storyboard') return 'image';
  if (type.startsWith('voice-') || type === 'narration' || type === 'script-dialog' || type === 'audio-toolbar') return 'voice';
  return 'other';
}

export function useAdvisorMemory() {
  const recordLayoutUsage = useAdvisorMemoryStore((s) => s.recordLayoutUsage);
  const recordWorkflowTransition = useAdvisorMemoryStore((s) => s.recordWorkflowTransition);
  const recordDensityPreference = useAdvisorMemoryStore((s) => s.recordDensityPreference);

  const prevDomainRef = useRef<string | null>(null);
  const layoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Subscribe to workspace store changes
    const unsub = useWorkspaceStore.subscribe((state, prevState) => {
      // Skip if panels didn't change
      if (state.panels === prevState.panels && state.layout === prevState.layout) return;

      const panelTypes = state.panels.map((p) => p.type);
      if (panelTypes.length === 0) return;

      // Record layout usage after 10s stability (user kept it)
      if (layoutTimerRef.current) clearTimeout(layoutTimerRef.current);
      layoutTimerRef.current = setTimeout(() => {
        const current = useWorkspaceStore.getState();
        const currentPanels = current.panels.map((p) => p.type);
        if (currentPanels.length > 0) {
          recordLayoutUsage(current.layout, currentPanels);
        }
      }, 10_000);

      // Track domain transitions
      const primaryPanel = state.panels.find((p) => p.role === 'primary');
      const currentDomain = primaryPanel ? panelDomain(primaryPanel.type) : null;
      if (currentDomain && prevDomainRef.current && currentDomain !== prevDomainRef.current) {
        recordWorkflowTransition(prevDomainRef.current, currentDomain);
      }
      if (currentDomain) prevDomainRef.current = currentDomain;

      // Track density preferences
      for (const panel of state.panels) {
        if (panel.density && panel.density !== 'full') {
          const prev = prevState.panels.find((p) => p.type === panel.type);
          if (!prev || prev.density !== panel.density) {
            recordDensityPreference(panel.type, panel.density);
          }
        }
      }
    });

    return () => {
      unsub();
      if (layoutTimerRef.current) clearTimeout(layoutTimerRef.current);
    };
  }, [recordLayoutUsage, recordWorkflowTransition, recordDensityPreference]);
}
