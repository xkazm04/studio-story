'use client';

import { useRef, useCallback, useState } from 'react';
import {
  initResizeState,
  computeResize,
  acquireUserLock,
  releaseUserLock,
  useIntent,
  type ResizeState,
  type PanelDefinition,
  type PanelDensity,
  type Intent,
} from '@dzin/core';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ResizeEdge = 'right' | 'bottom';

interface UseResizeHandleOptions {
  panelId: string;
  panelDef: PanelDefinition;
  currentDensity: PanelDensity;
}

interface UseResizeHandleReturn {
  /** Attach to resize handle's onPointerDown. */
  onPointerDown: (edge: ResizeEdge, e: React.PointerEvent) => void;
  /** Whether a resize drag is currently in progress. */
  isResizing: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Data attribute on the grid container used to find it for dimension reads. */
const GRID_SELECTOR = '[data-dzin-workspace-grid]';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseGridFractions(template: string): number[] {
  // Parse CSS grid-template-columns/rows like "3fr 2fr" into [0.6, 0.4]
  const parts = template.trim().split(/\s+/);
  const values: number[] = [];
  for (const part of parts) {
    const match = part.match(/^([\d.]+)fr$/);
    if (match) {
      values.push(parseFloat(match[1]));
    } else {
      // For non-fr values (clamp, px, etc.), treat as 1fr equivalent
      values.push(1);
    }
  }
  const total = values.reduce((sum, v) => sum + v, 0);
  if (total === 0) return values;
  return values.map((v) => v / total);
}

function getTrackIndex(slotIndex: number, edge: ResizeEdge, columns: number): number {
  // For a right edge, the track index is the column index of the panel
  if (edge === 'right') {
    return slotIndex % columns;
  }
  // For a bottom edge, the track index is the row index
  return Math.floor(slotIndex / columns);
}

function createIntent(panelId: string, width: number, height: number, density: PanelDensity): Intent<'manipulate'> {
  return {
    id: crypto.randomUUID(),
    type: 'manipulate',
    payload: {
      action: 'resize',
      panelId,
      width,
      height,
      density,
    },
    source: 'drag',
    timestamp: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// useResizeHandle
// ---------------------------------------------------------------------------

/**
 * Hook that provides pointer-event-based panel edge resize.
 *
 * During drag:
 * - acquireUserLock to prevent LLM patches on the resizing panel
 * - computeResize on every pointermove (no re-renders -- state in ref)
 * - Apply inline CSS to grid container for visual feedback
 *
 * On pointerup:
 * - Dispatch manipulate intent with final dimensions
 * - releaseUserLock
 * - Reset resize state
 *
 * Density is only committed on pointerup to avoid thrashing (per research pitfall #2).
 */
export function useResizeHandle({
  panelId,
  panelDef,
  currentDensity,
}: UseResizeHandleOptions): UseResizeHandleReturn {
  const { dispatch } = useIntent();
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<ResizeState | null>(null);
  const gridRef = useRef<HTMLElement | null>(null);

  const onPointerDown = useCallback(
    (edge: ResizeEdge, e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);

      // Find the grid container
      const grid = document.querySelector(GRID_SELECTOR) as HTMLElement | null;
      if (!grid) return;
      gridRef.current = grid;

      // Determine column count from grid computed style
      const computedCols = getComputedStyle(grid).gridTemplateColumns;
      const computedRows = getComputedStyle(grid).gridTemplateRows;

      const colFractions = parseGridFractions(computedCols);
      const rowFractions = parseGridFractions(computedRows);

      const fractions = edge === 'right' ? colFractions : rowFractions;

      // Find panel's slot index by walking grid children
      const panelEl = target.closest('[data-panel-id]') as HTMLElement | null;
      const slotIndex = panelEl
        ? Array.from(grid.children).indexOf(panelEl.parentElement ?? panelEl)
        : 0;

      const trackIndex = getTrackIndex(slotIndex, edge, colFractions.length);

      // Acquire user lock
      const lockPath = `/panels/${panelId}`;
      acquireUserLock(lockPath);

      // Initialize resize state
      const state = initResizeState(
        panelId,
        edge,
        e.clientX,
        e.clientY,
        fractions,
        trackIndex,
        panelDef,
        currentDensity,
      );

      resizeRef.current = state;
      setIsResizing(true);

      // Pointer event handlers (attached to target for pointer capture)
      const handleMove = (moveEvent: PointerEvent) => {
        const rs = resizeRef.current;
        if (!rs || !gridRef.current) return;

        const containerRect = gridRef.current.getBoundingClientRect();
        const deltaX = moveEvent.clientX - rs.startX;
        const deltaY = moveEvent.clientY - rs.startY;

        const result = computeResize(
          rs,
          deltaX,
          deltaY,
          containerRect.width,
          containerRect.height,
        );

        // Apply inline CSS for visual feedback (no React re-renders)
        if (edge === 'right') {
          gridRef.current.style.gridTemplateColumns = result.fractions
            .map((f) => `${f}fr`)
            .join(' ');
        } else {
          gridRef.current.style.gridTemplateRows = result.fractions
            .map((f) => `${f}fr`)
            .join(' ');
        }

        // Update density tracking on resize state (mutable ref, no re-render)
        if (result.density !== rs.lastDensity) {
          rs.lastDensity = result.density;
          rs.densityChangePx = edge === 'right' ? result.widthPx : result.heightPx;
        }
      };

      const handleUp = (upEvent: PointerEvent) => {
        target.removeEventListener('pointermove', handleMove);
        target.removeEventListener('pointerup', handleUp);
        target.releasePointerCapture(upEvent.pointerId);

        const rs = resizeRef.current;
        if (rs && gridRef.current) {
          const containerRect = gridRef.current.getBoundingClientRect();
          const deltaX = upEvent.clientX - rs.startX;
          const deltaY = upEvent.clientY - rs.startY;

          const result = computeResize(
            rs,
            deltaX,
            deltaY,
            containerRect.width,
            containerRect.height,
          );

          // Dispatch manipulate intent with final dimensions
          const intent = createIntent(panelId, result.widthPx, result.heightPx, result.density);
          dispatch(intent);

          // Clear inline styles so grid returns to template-driven layout
          if (edge === 'right') {
            gridRef.current.style.gridTemplateColumns = '';
          } else {
            gridRef.current.style.gridTemplateRows = '';
          }
        }

        // Release user lock
        releaseUserLock(`/panels/${panelId}`);

        resizeRef.current = null;
        gridRef.current = null;
        setIsResizing(false);
      };

      target.addEventListener('pointermove', handleMove);
      target.addEventListener('pointerup', handleUp);
    },
    [panelId, panelDef, currentDensity, dispatch],
  );

  return { onPointerDown, isResizing };
}
