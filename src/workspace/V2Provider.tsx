'use client';

import { useEffect } from 'react';
import { useTerminalDockStore } from './store/terminalDockStore';
import { useWorkspaceKeyboard } from './hooks/useWorkspaceKeyboard';

/**
 * V2Provider — Initialization component for the workspace.
 *
 * - Auto-creates a "General" terminal tab if none exist
 * - Activates keyboard shortcuts
 * - Should be rendered inside V2Layout
 */
export default function V2Provider({ children }: { children: React.ReactNode }) {
  const tabs = useTerminalDockStore((s) => s.tabs);
  const createTab = useTerminalDockStore((s) => s.createTab);

  // Auto-create initial terminal tab
  useEffect(() => {
    if (tabs.length === 0) {
      createTab({ label: 'General', domain: 'general', isPinned: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Activate keyboard shortcuts
  useWorkspaceKeyboard();

  return <>{children}</>;
}
