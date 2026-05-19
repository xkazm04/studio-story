'use client';

import { useWorkspaceKeyboard } from './hooks/useWorkspaceKeyboard';
import { useResponsiveLayout } from './hooks/useResponsiveLayout';
import { usePanelFocusTracking } from './hooks/usePanelFocusTracking';
import { useOperationSubscribers } from './hooks/useOperationSubscribers';
import { useAutoCompaction } from './hooks/useAutoCompaction';
import PanelPalette from './components/PanelPalette';
import { usePanelPaletteStore } from './store/panelPaletteStore';

/**
 * V2Provider — Initialization component for the workspace.
 *
 * - Activates keyboard shortcuts
 * - Enforces responsive layout constraints
 * - Tracks panel focus for spatial intelligence
 * - Panel quick-swap palette (Ctrl+K)
 * - No tab management — CommandBar handles its own single session
 */
export default function V2Provider({ children }: { children: React.ReactNode }) {
  useWorkspaceKeyboard();
  useResponsiveLayout();
  usePanelFocusTracking();
  useOperationSubscribers();
  useAutoCompaction();

  const paletteOpen = usePanelPaletteStore((s) => s.open);
  const paletteTarget = usePanelPaletteStore((s) => s.targetPanelId);
  const closePalette = usePanelPaletteStore((s) => s.closePalette);

  return (
    <>
      {children}
      <PanelPalette
        open={paletteOpen}
        onClose={closePalette}
        targetPanelId={paletteTarget ?? undefined}
      />
    </>
  );
}
