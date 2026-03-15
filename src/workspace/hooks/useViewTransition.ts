/**
 * useViewTransition — Wraps DOM updates in the View Transitions API
 * when supported, falling back to immediate execution otherwise.
 *
 * The View Transitions API delegates transition rendering to the browser's
 * compositor thread, eliminating main-thread JS layout work during panel
 * add/remove/resize in the workspace grid.
 */

import { useCallback, useRef } from 'react';

/** Check View Transitions API support (avoids SSR crashes) */
const supportsViewTransitions =
  typeof document !== 'undefined' &&
  'startViewTransition' in document;

export function useViewTransition() {
  const pendingRef = useRef<ViewTransition | null>(null);

  /**
   * Wrap a synchronous DOM-mutating callback in a view transition.
   * If the API is unsupported or another transition is in-flight,
   * the callback runs immediately (no-op fallback).
   */
  const startTransition = useCallback((update: () => void) => {
    if (!supportsViewTransitions) {
      update();
      return;
    }

    // Skip if a transition is already running to avoid conflicts
    if (pendingRef.current) {
      update();
      return;
    }

    const transition = document.startViewTransition(update);
    pendingRef.current = transition;
    transition.finished.finally(() => {
      pendingRef.current = null;
    });
  }, []);

  return { startTransition, supportsViewTransitions };
}
