/**
 * Workspace Keyboard Shortcuts
 *
 * Ctrl+`       → Toggle terminal dock collapse
 * Ctrl+T       → Create new terminal tab
 * Ctrl+W       → Close active tab (only when no input focused)
 * Ctrl+Tab     → Cycle through tabs
 * Ctrl+Shift+L → Cycle workspace layout
 */

import { useEffect } from 'react';
import { useTerminalDockStore } from '../store/terminalDockStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { getNextLayout } from '../engine/layoutEngine';

export function useWorkspaceKeyboard() {
  const toggleCollapsed = useTerminalDockStore((s) => s.toggleCollapsed);
  const createTab = useTerminalDockStore((s) => s.createTab);
  const closeTab = useTerminalDockStore((s) => s.closeTab);
  const setActiveTab = useTerminalDockStore((s) => s.setActiveTab);
  const setLayout = useWorkspaceStore((s) => s.setLayout);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;

      // Ctrl+` — toggle dock
      if (isCtrl && e.key === '`') {
        e.preventDefault();
        toggleCollapsed();
        return;
      }

      // Ctrl+T — new tab
      if (isCtrl && e.key === 't' && !e.shiftKey) {
        e.preventDefault();
        createTab();
        return;
      }

      // Ctrl+W — close active tab (only if no input focused)
      if (isCtrl && e.key === 'w' && !e.shiftKey) {
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
        e.preventDefault();
        const { activeTabId } = useTerminalDockStore.getState();
        if (activeTabId) closeTab(activeTabId);
        return;
      }

      // Ctrl+Tab — cycle tabs
      if (isCtrl && e.key === 'Tab') {
        e.preventDefault();
        const { tabs, activeTabId } = useTerminalDockStore.getState();
        if (tabs.length <= 1) return;
        const idx = tabs.findIndex((t) => t.id === activeTabId);
        const nextIdx = (idx + 1) % tabs.length;
        setActiveTab(tabs[nextIdx].id);
        return;
      }

      // Ctrl+Shift+L — cycle layout
      if (isCtrl && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        const { layout } = useWorkspaceStore.getState();
        setLayout(getNextLayout(layout));
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleCollapsed, createTab, closeTab, setActiveTab, setLayout]);
}
