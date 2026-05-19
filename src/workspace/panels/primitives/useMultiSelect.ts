'use client';

import { useState, useCallback, useRef } from 'react';

export interface UseMultiSelectOptions {
  /** Extract a stable string id from an item */
  getId: (item: object) => string;
}

export interface UseMultiSelectReturn {
  selectedIds: Set<string>;
  /**
   * Call from onClick — handles Shift/Ctrl/Meta modifiers automatically.
   * Returns `true` if the click was consumed by multi-select logic,
   * `false` if it was a plain click that should delegate to normal onSelect.
   */
  handleClick: (id: string, index: number, e: React.MouseEvent) => boolean;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  isMultiActive: boolean;
}

/**
 * Manages multi-selection state with Shift+click range select and Ctrl/Cmd+click toggle.
 *
 * - Plain click: clears multi-selection (delegates to normal onSelect).
 * - Ctrl/Cmd+click: toggles the clicked item in/out of selection.
 * - Shift+click: selects the range from the last-clicked item to the current.
 */
export function useMultiSelect(allIds: string[]): UseMultiSelectReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastClickedIndex = useRef<number | null>(null);

  const handleClick = useCallback(
    (id: string, index: number, e: React.MouseEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;

      if (isShift && lastClickedIndex.current != null) {
        // Range select
        const start = Math.min(lastClickedIndex.current, index);
        const end = Math.max(lastClickedIndex.current, index);
        const rangeIds = allIds.slice(start, end + 1);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          for (const rid of rangeIds) next.add(rid);
          return next;
        });
      } else if (isCtrl) {
        // Toggle single
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return next;
        });
        lastClickedIndex.current = index;
      } else {
        // Plain click — clear multi-select, let caller handle normal selection
        setSelectedIds(new Set());
        lastClickedIndex.current = index;
        return false; // signal: not consumed, delegate to normal onSelect
      }

      return true; // signal: consumed by multi-select
    },
    [allIds],
  );

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    lastClickedIndex.current = null;
  }, []);

  return {
    selectedIds,
    handleClick,
    selectAll,
    clearSelection,
    isMultiActive: selectedIds.size > 0,
  };
}
