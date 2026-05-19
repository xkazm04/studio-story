'use client';

import { useState, useCallback, useEffect, type RefObject } from 'react';

export interface UseDropdownOptions {
  /** Ref to the trigger element (button). Clicks on it won't count as "outside". */
  triggerRef?: RefObject<HTMLElement | null>;
  /** Ref to the dropdown content element. Clicks on it won't count as "outside". */
  contentRef: RefObject<HTMLElement | null>;
  /**
   * Controlled mode: pass external open state.
   * When provided, the hook won't manage its own state.
   */
  isOpen?: boolean;
  /** Called when the dropdown should close (outside click or Escape). */
  onClose?: () => void;
  /** Delay (ms) before registering the outside-click listener. Default: 0. */
  closeDelay?: number;
  /** Whether Escape key closes the dropdown. Default: true. */
  escapeClose?: boolean;
}

export interface UseDropdownReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Shared dropdown dismiss logic — outside-click and Escape key handling.
 *
 * Supports both uncontrolled mode (hook manages state) and controlled mode
 * (caller passes `isOpen` + `onClose`).
 */
export function useDropdown(options: UseDropdownOptions): UseDropdownReturn {
  const {
    triggerRef,
    contentRef,
    isOpen: controlledIsOpen,
    onClose,
    closeDelay = 0,
    escapeClose = true,
  } = options;

  const isControlled = controlledIsOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? controlledIsOpen : internalOpen;

  const close = useCallback(() => {
    if (!isControlled) setInternalOpen(false);
    onClose?.();
  }, [isControlled, onClose]);

  const open = useCallback(() => {
    if (!isControlled) setInternalOpen(true);
  }, [isControlled]);

  const toggle = useCallback(() => {
    if (isControlled) {
      if (controlledIsOpen) close();
    } else {
      setInternalOpen((prev) => {
        if (prev) onClose?.();
        return !prev;
      });
    }
  }, [isControlled, controlledIsOpen, close, onClose]);

  // Outside-click dismissal
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (contentRef.current && contentRef.current.contains(target)) return;
      if (triggerRef?.current && triggerRef.current.contains(target)) return;
      close();
    };

    if (closeDelay > 0) {
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handler);
      }, closeDelay);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handler);
      };
    }

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, contentRef, triggerRef, close, closeDelay]);

  // Escape key dismissal
  useEffect(() => {
    if (!isOpen || !escapeClose) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, escapeClose, close]);

  return { isOpen, open, close, toggle };
}
