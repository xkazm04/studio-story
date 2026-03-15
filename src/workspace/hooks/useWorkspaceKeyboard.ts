/**
 * Workspace Keyboard Shortcuts
 *
 * Ctrl+`       → Toggle command bar expand/collapse
 * Ctrl+Shift+L → Cycle workspace layout
 * Ctrl+1..4    → Focus panel by slot position (brief cyan ring flash)
 * Escape       → Focus command bar input
 */

import { useEffect } from 'react';
import { useCommandBarStore } from '../store/commandBarStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { getNextLayout } from '../engine/layoutEngine';

const FOCUSABLE_SELECTOR = 'input:not([disabled]), button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Find the nth panel frame in the workspace grid and focus the first
 * focusable element inside it, flashing a cyan ring for 200ms.
 */
function focusPanelBySlot(slotIndex: number) {
  const panelFrames = document.querySelectorAll<HTMLElement>('[data-panel-frame]');
  const target = panelFrames[slotIndex];
  if (!target) return;

  const focusable = target.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
  if (focusable) {
    focusable.focus();
  }

  target.style.animation = 'panelFocusFlash 200ms ease-out';
  const onEnd = () => {
    target.style.animation = '';
    target.removeEventListener('animationend', onEnd);
  };
  target.addEventListener('animationend', onEnd);
}

/**
 * Focus the command bar input.
 */
function focusCommandBar() {
  const commandBar = document.querySelector('[data-command-bar]');
  if (commandBar) {
    const input = commandBar.querySelector<HTMLElement>('textarea, input, [data-command-bar-input]');
    if (input) {
      input.focus();
      return;
    }
  }
  // Expand and focus
  useCommandBarStore.getState().expand();
  useCommandBarStore.getState().focusInput();
}

export function useWorkspaceKeyboard() {
  const toggle = useCommandBarStore((s) => s.toggle);
  const setLayout = useWorkspaceStore((s) => s.setLayout);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;

      // Ctrl+` — toggle command bar
      if (isCtrl && e.key === '`') {
        e.preventDefault();
        toggle();
        return;
      }

      // Ctrl+Shift+L — cycle layout
      if (isCtrl && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        const { layout } = useWorkspaceStore.getState();
        const next = getNextLayout(layout);
        setLayout(next);
        window.dispatchEvent(new CustomEvent('workspace-layout-switched', { detail: { layout: next } }));
        return;
      }

      // Ctrl+1..4 — focus panel by slot position
      if (isCtrl && !e.shiftKey && !e.altKey && e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        const slotIndex = parseInt(e.key, 10) - 1;
        focusPanelBySlot(slotIndex);
        return;
      }

      // Escape — focus command bar input (only when not in modal/dropdown)
      if (e.key === 'Escape') {
        const active = document.activeElement;
        if (active?.closest('[role="dialog"]') || active?.closest('[data-radix-popper-content-wrapper]')) return;
        focusCommandBar();
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle, setLayout]);
}
