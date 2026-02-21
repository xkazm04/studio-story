'use client';

import { useState, useCallback, useRef } from 'react';

const MAX_HISTORY = 50;

/**
 * Generic hook that wraps useState with undo/redo history.
 *
 * - `setState` updates live state (for drag/resize visual feedback) without pushing to history.
 * - `commit()` snapshots the current state onto the undo stack.
 * - Call `commit()` on mouseup, drop, delete — any finalized mutation.
 */
export function useUndoableState<T>(initial: T) {
  const [state, setStateRaw] = useState<T>(initial);
  const undoStack = useRef<T[]>([]);
  const redoStack = useRef<T[]>([]);
  const stateRef = useRef<T>(initial);

  // Keep ref in sync for commit snapshots
  const setState = useCallback((action: T | ((prev: T) => T)) => {
    setStateRaw((prev) => {
      const next = typeof action === 'function' ? (action as (p: T) => T)(prev) : action;
      stateRef.current = next;
      return next;
    });
  }, []);

  /** Push current state to undo stack (call after finalized edits) */
  const commit = useCallback(() => {
    const snapshot = structuredClone(stateRef.current);
    undoStack.current.push(snapshot);
    if (undoStack.current.length > MAX_HISTORY) {
      undoStack.current.shift();
    }
    redoStack.current = [];
  }, []);

  /** Snapshot initial state on first commit-worthy action */
  const commitBefore = useCallback(() => {
    if (undoStack.current.length === 0) {
      // Ensure we can undo back to the initial state
      undoStack.current.push(structuredClone(stateRef.current));
    }
  }, []);

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    const prev = undoStack.current.pop()!;
    redoStack.current.push(structuredClone(stateRef.current));
    stateRef.current = prev;
    setStateRaw(prev);
  }, []);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    const next = redoStack.current.pop()!;
    undoStack.current.push(structuredClone(stateRef.current));
    stateRef.current = next;
    setStateRaw(next);
  }, []);

  return {
    state,
    setState,
    commit,
    commitBefore,
    undo,
    redo,
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
  };
}
