'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_WIDTH = 320;
const MAX_WIDTH = 600;
const MIN_HEIGHT = 400;
const MAX_HEIGHT = 800;
const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = 500;
const EDGE_MARGIN = 24;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OverlayState {
  x: number;
  y: number;
  width: number;
  height: number;
  isOpen: boolean;
}

export type ResizeEdge = 'top' | 'right' | 'bottom' | 'left';

export interface DragHandlers {
  onPointerDown: (e: React.PointerEvent) => void;
}

export interface ResizeHandlers {
  onPointerDown: (edge: ResizeEdge) => (e: React.PointerEvent) => void;
}

export interface ChatOverlay {
  state: OverlayState;
  toggle: () => void;
  dragHandlers: DragHandlers;
  resizeHandlers: ResizeHandlers;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Custom hook managing the chat overlay position, drag, and resize state
 * using raw Pointer Events for responsive interaction.
 */
export function useChatOverlay(): ChatOverlay {
  const [state, setState] = useState<OverlayState>({
    x: 0,
    y: 0,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    isOpen: false,
  });

  const hasPositioned = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, originX: 0, originY: 0 });
  const resizeStart = useRef({
    x: 0,
    y: 0,
    originX: 0,
    originY: 0,
    originW: 0,
    originH: 0,
    edge: 'right' as ResizeEdge,
  });

  // -------------------------------------------------------------------------
  // Toggle
  // -------------------------------------------------------------------------

  const toggle = useCallback(() => {
    setState((prev) => {
      if (!prev.isOpen && !hasPositioned.current) {
        // Auto-position to bottom-right on first open
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
        const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;
        hasPositioned.current = true;
        return {
          ...prev,
          x: vw - prev.width - EDGE_MARGIN,
          y: vh - prev.height - EDGE_MARGIN - 56, // 56px above FAB
          isOpen: true,
        };
      }
      return { ...prev, isOpen: !prev.isOpen };
    });
  }, []);

  // -------------------------------------------------------------------------
  // Drag Handlers
  // -------------------------------------------------------------------------

  const handleDragPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const el = e.currentTarget as HTMLElement;
      el.setPointerCapture(e.pointerId);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        originX: state.x,
        originY: state.y,
      };

      const handleMove = (me: PointerEvent) => {
        const dx = me.clientX - dragStart.current.x;
        const dy = me.clientY - dragStart.current.y;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        setState((prev) => ({
          ...prev,
          x: Math.max(0, Math.min(vw - prev.width, dragStart.current.originX + dx)),
          y: Math.max(0, Math.min(vh - prev.height, dragStart.current.originY + dy)),
        }));
      };

      const handleUp = () => {
        el.removeEventListener('pointermove', handleMove);
        el.removeEventListener('pointerup', handleUp);
      };

      el.addEventListener('pointermove', handleMove);
      el.addEventListener('pointerup', handleUp);
    },
    [state.x, state.y]
  );

  // -------------------------------------------------------------------------
  // Resize Handlers
  // -------------------------------------------------------------------------

  const handleResizePointerDown = useCallback(
    (edge: ResizeEdge) => (e: React.PointerEvent) => {
      e.stopPropagation();
      const el = e.currentTarget as HTMLElement;
      el.setPointerCapture(e.pointerId);

      resizeStart.current = {
        x: e.clientX,
        y: e.clientY,
        originX: state.x,
        originY: state.y,
        originW: state.width,
        originH: state.height,
        edge,
      };

      const handleMove = (me: PointerEvent) => {
        const start = resizeStart.current;
        const dx = me.clientX - start.x;
        const dy = me.clientY - start.y;

        setState((prev) => {
          let { x, y, width, height } = prev;

          switch (start.edge) {
            case 'right':
              width = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, start.originW + dx));
              break;
            case 'left':
              width = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, start.originW - dx));
              x = start.originX + (start.originW - width);
              break;
            case 'bottom':
              height = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, start.originH + dy));
              break;
            case 'top':
              height = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, start.originH - dy));
              y = start.originY + (start.originH - height);
              break;
          }

          return { ...prev, x, y, width, height };
        });
      };

      const handleUp = () => {
        el.removeEventListener('pointermove', handleMove);
        el.removeEventListener('pointerup', handleUp);
      };

      el.addEventListener('pointermove', handleMove);
      el.addEventListener('pointerup', handleUp);
    },
    [state.x, state.y, state.width, state.height]
  );

  // -------------------------------------------------------------------------
  // Keyboard Shortcut (Cmd/Ctrl+K)
  // -------------------------------------------------------------------------

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        // Don't intercept if user is in a panel input/contenteditable
        const active = document.activeElement;
        if (active) {
          const isEditable =
            active instanceof HTMLElement && active.isContentEditable;
          const isInPanelInput =
            (active instanceof HTMLInputElement ||
              active instanceof HTMLTextAreaElement) &&
            active.closest('[data-panel-frame]');
          if (isEditable || isInPanelInput) return;
        }

        e.preventDefault();
        toggle();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return {
    state,
    toggle,
    dragHandlers: { onPointerDown: handleDragPointerDown },
    resizeHandlers: { onPointerDown: handleResizePointerDown },
  };
}
