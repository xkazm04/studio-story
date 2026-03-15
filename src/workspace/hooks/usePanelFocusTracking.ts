/**
 * usePanelFocusTracking — Tracks which workspace panel has user focus.
 *
 * Listens for focusin events on [data-panel-frame] elements and updates
 * the workspace store with the focused panel ID. This feeds into the
 * advisor's spatial awareness so it can suggest density changes for
 * non-focused panels.
 */

import { useEffect } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';

export function usePanelFocusTracking() {
  const setFocusedPanel = useWorkspaceStore((s) => s.setFocusedPanel);

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Walk up to find the nearest panel wrapper (section[aria-label] wrapping a PanelFrame)
      const panelSection = target.closest('section[aria-label]');
      if (!panelSection) {
        // Focus moved outside panels (e.g., command bar, header)
        setFocusedPanel(null);
        return;
      }

      // Find the panel frame inside this section
      const panelFrame = panelSection.querySelector('[data-panel-frame]');
      if (!panelFrame) return;

      // The panel ID is on the motion.div parent in WorkspaceGrid via layoutId
      // We can find it by matching the section's aria-label to a panel type
      const panelWrapper = panelSection.parentElement;
      if (panelWrapper) {
        // motion.div has the panel.id as key/layoutId — stored on the DOM element
        // We extract it from the id attribute pattern "panel-{type}"
        const panelId = panelWrapper.getAttribute('data-layout-id');
        if (panelId) {
          setFocusedPanel(panelId);
          return;
        }
      }

      // Fallback: use aria-label to find panel in store
      const label = panelSection.getAttribute('aria-label');
      if (label) {
        const panels = useWorkspaceStore.getState().panels;
        // Match by finding a panel whose registry label matches
        const match = panels.find((_p, i) => {
          const section = document.querySelectorAll('section[aria-label]')[i];
          return section?.getAttribute('aria-label') === label;
        });
        if (match) {
          setFocusedPanel(match.id);
          return;
        }
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, [setFocusedPanel]);
}
