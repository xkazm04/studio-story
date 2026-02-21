'use client';

import { useEffect } from 'react';

interface KeyboardShortcutActions {
  onPlayPause: () => void;
  onRewind: () => void;
  onDeleteSelected: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onSplit?: () => void;
  onAddMarker?: () => void;
  onToggleLoop?: () => void;
  onJumpNextMarker?: () => void;
  onJumpPrevMarker?: () => void;
  onSelectAll?: () => void;
  onPlayFromHere?: () => void;
}

/**
 * Hook for DAW-style keyboard shortcuts.
 * Ignores keypresses when focused on input/textarea elements.
 */
export function useKeyboardShortcuts(actions: KeyboardShortcutActions): void {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore when typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+Z → Undo
      if (ctrl && !e.shiftKey && e.code === 'KeyZ') {
        e.preventDefault();
        actions.onUndo?.();
        return;
      }

      // Ctrl+Shift+Z or Ctrl+Y → Redo
      if ((ctrl && e.shiftKey && e.code === 'KeyZ') || (ctrl && e.code === 'KeyY')) {
        e.preventDefault();
        actions.onRedo?.();
        return;
      }

      // Ctrl+C → Copy
      if (ctrl && e.code === 'KeyC') {
        e.preventDefault();
        actions.onCopy?.();
        return;
      }

      // Ctrl+V → Paste
      if (ctrl && e.code === 'KeyV') {
        e.preventDefault();
        actions.onPaste?.();
        return;
      }

      // Ctrl+A → Select All
      if (ctrl && e.code === 'KeyA') {
        e.preventDefault();
        actions.onSelectAll?.();
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          actions.onPlayPause();
          break;
        case 'Home':
          e.preventDefault();
          actions.onRewind();
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          actions.onDeleteSelected();
          break;
        case 'KeyS':
          // S (no modifier) → Split
          if (!ctrl && !e.shiftKey && !e.altKey) {
            e.preventDefault();
            actions.onSplit?.();
          }
          break;
        case 'KeyM':
          // M → Add marker at playhead
          if (!ctrl && !e.shiftKey && !e.altKey) {
            e.preventDefault();
            actions.onAddMarker?.();
          }
          break;
        case 'KeyL':
          // L → Toggle loop
          if (!ctrl && !e.shiftKey && !e.altKey) {
            e.preventDefault();
            actions.onToggleLoop?.();
          }
          break;
        case 'BracketRight':
          // ] → Jump to next marker
          if (!ctrl && !e.shiftKey && !e.altKey) {
            e.preventDefault();
            actions.onJumpNextMarker?.();
          }
          break;
        case 'BracketLeft':
          // [ → Jump to previous marker
          if (!ctrl && !e.shiftKey && !e.altKey) {
            e.preventDefault();
            actions.onJumpPrevMarker?.();
          }
          break;
        case 'KeyP':
          // P → Play from mouse cursor position
          if (!ctrl && !e.shiftKey && !e.altKey) {
            e.preventDefault();
            actions.onPlayFromHere?.();
          }
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions]);
}
