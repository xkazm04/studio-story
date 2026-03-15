'use client';

import { useWorkspaceKeyboard } from './hooks/useWorkspaceKeyboard';
import { useResponsiveLayout } from './hooks/useResponsiveLayout';
import { usePanelFocusTracking } from './hooks/usePanelFocusTracking';

/**
 * V2Provider — Initialization component for the workspace.
 *
 * - Activates keyboard shortcuts
 * - Enforces responsive layout constraints
 * - Tracks panel focus for spatial intelligence
 * - No tab management — CommandBar handles its own single session
 */
export default function V2Provider({ children }: { children: React.ReactNode }) {
  useWorkspaceKeyboard();
  useResponsiveLayout();
  usePanelFocusTracking();

  return <>{children}</>;
}
