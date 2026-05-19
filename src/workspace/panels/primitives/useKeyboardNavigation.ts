import { useCallback, type RefObject } from 'react';

type NavigationMode = 'grid' | 'list' | 'tree';

interface UseKeyboardNavigationOptions {
  /** CSS selector for focusable items within the container */
  selector: string;
  /** Navigation mode determines which arrow keys move forward/backward */
  mode: NavigationMode;
}

/**
 * Shared keyboard navigation hook for primitives (CardGrid, DataList, TreeView).
 *
 * Handles ArrowUp/Down/Left/Right, Home/End, Enter/Space based on mode:
 * - **list**: ArrowDown/Up navigate, Left/Right ignored
 * - **grid**: All four arrows navigate (Right/Down = next, Left/Up = prev)
 * - **tree**: Down/Up navigate, Right expands or enters child, Left collapses or goes to parent
 */
export function useKeyboardNavigation(
  containerRef: RefObject<HTMLElement | null>,
  { selector, mode }: UseKeyboardNavigationOptions,
) {
  return useCallback(
    (e: React.KeyboardEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const items = Array.from(
        container.querySelectorAll<HTMLElement>(selector),
      );
      const currentIndex = items.indexOf(
        document.activeElement as HTMLElement,
      );
      if (currentIndex === -1) return;

      const current = items[currentIndex];
      const last = items.length - 1;

      // ── Activation ───────────────────────────────────
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        current.click();
        return;
      }

      // ── Home / End ───────────────────────────────────
      if (e.key === 'Home') {
        e.preventDefault();
        items[0]?.focus();
        return;
      }
      if (e.key === 'End') {
        e.preventDefault();
        items[last]?.focus();
        return;
      }

      // ── Arrow keys (mode-dependent) ──────────────────
      let nextIndex = -1;

      if (mode === 'tree') {
        if (e.key === 'ArrowDown') {
          nextIndex = Math.min(currentIndex + 1, last);
        } else if (e.key === 'ArrowUp') {
          nextIndex = Math.max(currentIndex - 1, 0);
        } else if (e.key === 'ArrowRight') {
          const expanded = current.getAttribute('aria-expanded');
          if (expanded === 'false') {
            // Collapsed branch → expand it
            e.preventDefault();
            current.click();
            return;
          }
          if (expanded === 'true') {
            // Expanded branch → move to first child
            nextIndex = Math.min(currentIndex + 1, last);
          }
          // Leaf nodes (no aria-expanded) → do nothing
        } else if (e.key === 'ArrowLeft') {
          const expanded = current.getAttribute('aria-expanded');
          if (expanded === 'true') {
            // Expanded branch → collapse it
            e.preventDefault();
            current.click();
            return;
          }
          // Collapsed or leaf → move toward parent
          nextIndex = Math.max(currentIndex - 1, 0);
        }
      } else if (mode === 'grid') {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          nextIndex = Math.min(currentIndex + 1, last);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          nextIndex = Math.max(currentIndex - 1, 0);
        }
      } else {
        // list
        if (e.key === 'ArrowDown') {
          nextIndex = Math.min(currentIndex + 1, last);
        } else if (e.key === 'ArrowUp') {
          nextIndex = Math.max(currentIndex - 1, 0);
        }
      }

      if (nextIndex >= 0 && nextIndex !== currentIndex) {
        e.preventDefault();
        items[nextIndex].focus();
      }
    },
    [containerRef, selector, mode],
  );
}
