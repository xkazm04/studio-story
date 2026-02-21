import { useEffect, useRef, useState } from 'react';

/**
 * Metadata for a tracked event listener
 */
export interface TrackedListener {
  /** Event type (e.g., 'click', 'resize', 'scroll') */
  eventType: string;
  /** Reference to the handler function */
  handler: EventListenerOrEventListenerObject;
  /** Target element or object the listener is attached to */
  target: EventTarget;
  /** Timestamp when the listener was added */
  addedAt: number;
  /** Whether the listener uses capture phase */
  capture: boolean;
  /** Optional options object */
  options?: AddEventListenerOptions | boolean;
  /** Unique identifier for this listener */
  id: string;
}

/**
 * Statistics about tracked listeners
 */
export interface ListenerStats {
  /** Total number of listeners currently tracked */
  active: number;
  /** Number of listeners that were added */
  totalAdded: number;
  /** Number of listeners that were removed */
  totalRemoved: number;
  /** Breakdown by event type */
  byEventType: Record<string, number>;
}

/**
 * Return type for useEventListenerGuard hook
 */
export interface EventListenerGuardResult {
  /** Current statistics about tracked listeners */
  stats: ListenerStats;
  /** Array of all currently tracked listeners */
  trackedListeners: TrackedListener[];
  /** Whether tracking is enabled */
  isEnabled: boolean;
}

/**
 * Custom React hook that automatically tracks all event listeners added within a component
 * and logs warnings if any listeners remain attached after unmount.
 *
 * This hook helps developers identify memory leaks early by comparing listeners added vs removed.
 * Only active in development mode (process.env.NODE_ENV !== 'production') for zero performance
 * impact in production.
 *
 * @param componentName - Optional name to identify the component in debug messages
 * @param options - Configuration options
 * @param options.enabled - Whether to enable tracking (default: true in development)
 * @param options.warnOnUnmount - Whether to log warnings on unmount (default: true)
 * @param options.trackGlobalListeners - Whether to track window/document listeners (default: true)
 *
 * @returns EventListenerGuardResult with stats and tracked listeners
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const listenerGuard = useEventListenerGuard('MyComponent');
 *
 *   useEffect(() => {
 *     const handler = () => console.log('resized');
 *     window.addEventListener('resize', handler);
 *     return () => window.removeEventListener('resize', handler);
 *   }, []);
 *
 *   // View stats in development
 *   console.log(listenerGuard.stats);
 * }
 * ```
 */
export function useEventListenerGuard(
  componentName: string = 'Component',
  options: {
    enabled?: boolean;
    warnOnUnmount?: boolean;
    trackGlobalListeners?: boolean;
  } = {}
): EventListenerGuardResult {
  const {
    enabled = process.env.NODE_ENV !== 'production',
    warnOnUnmount = true,
    trackGlobalListeners = true,
  } = options;

  // Store tracked listeners in a ref to avoid re-renders
  const listenersRef = useRef<Map<string, TrackedListener>>(new Map());
  const addCountRef = useRef<number>(0);
  const removeCountRef = useRef<number>(0);
  const originalAddRef = useRef<Map<EventTarget, typeof EventTarget.prototype.addEventListener>>(new Map());
  const originalRemoveRef = useRef<Map<EventTarget, typeof EventTarget.prototype.removeEventListener>>(new Map());

  // State for re-rendering when stats change (only used if consumers need reactivity)
  const [, forceUpdate] = useState({});

  // Generate unique ID for each listener
  const generateListenerId = (
    target: EventTarget,
    type: string,
    handler: EventListenerOrEventListenerObject
  ): string => {
    const targetId = target === window ? 'window' : target === document ? 'document' : 'element';
    const handlerName = typeof handler === 'function' ? handler.name || 'anonymous' : 'object';
    return `${targetId}-${type}-${handlerName}-${Date.now()}-${Math.random()}`;
  };

  // Setup tracking proxies
  useEffect(() => {
    if (!enabled) return;

    const targets: EventTarget[] = [];

    // Add window and document if tracking global listeners
    if (trackGlobalListeners && typeof window !== 'undefined') {
      targets.push(window);
      if (typeof document !== 'undefined') {
        targets.push(document);
      }
    }

    // Wrap addEventListener for each target
    targets.forEach((target) => {
      // Store original methods
      const originalAdd = target.addEventListener.bind(target);
      const originalRemove = target.removeEventListener.bind(target);

      originalAddRef.current.set(target, originalAdd);
      originalRemoveRef.current.set(target, originalRemove);

      // Override addEventListener
      target.addEventListener = function(
        this: EventTarget,
        type: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: AddEventListenerOptions | boolean
      ): void {
        if (listener) {
          const id = generateListenerId(this, type, listener);
          const capture = typeof options === 'boolean' ? options : options?.capture ?? false;

          const trackedListener: TrackedListener = {
            id,
            eventType: type,
            handler: listener,
            target: this,
            addedAt: Date.now(),
            capture,
            options: options ?? undefined,
          };

          listenersRef.current.set(id, trackedListener);
          addCountRef.current++;

          if (process.env.NODE_ENV !== 'production') {
            console.debug(
              `[${componentName}] Event listener added:`,
              type,
              `(Total: ${listenersRef.current.size})`
            );
          }
        }

        // Call original method
        originalAdd(type, listener, options);
      };

      // Override removeEventListener
      target.removeEventListener = function(
        this: EventTarget,
        type: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: EventListenerOptions | boolean
      ): void {
        if (listener) {
          // Find and remove the tracked listener
          let foundId: string | null = null;
          for (const [id, tracked] of listenersRef.current.entries()) {
            if (
              tracked.target === this &&
              tracked.eventType === type &&
              tracked.handler === listener
            ) {
              foundId = id;
              break;
            }
          }

          if (foundId) {
            listenersRef.current.delete(foundId);
            removeCountRef.current++;

            if (process.env.NODE_ENV !== 'production') {
              console.debug(
                `[${componentName}] Event listener removed:`,
                type,
                `(Total: ${listenersRef.current.size})`
              );
            }
          }
        }

        // Call original method
        originalRemove(type, listener, options);
      };
    });

    // Cleanup function to restore original methods and check for orphaned listeners
    return () => {
      // Generate comprehensive summary report in development mode
      if (process.env.NODE_ENV !== 'production') {
        const totalAdded = addCountRef.current;
        const totalRemoved = removeCountRef.current;
        const activeListeners = listenersRef.current.size;
        const cleanupPercentage = totalAdded > 0 ? ((totalRemoved / totalAdded) * 100).toFixed(1) : '100.0';

        console.groupCollapsed(
          `[${componentName}] 📊 Event Listener Summary Report`
        );
        console.log(`%c📈 Statistics`, 'font-weight: bold; color: #3b82f6');
        console.log(`  Total Added: ${totalAdded}`);
        console.log(`  Total Removed: ${totalRemoved}`);
        console.log(`  Active (Not Cleaned): ${activeListeners}`);
        console.log(`  Cleanup Percentage: ${cleanupPercentage}%`);

        if (activeListeners > 0) {
          const listenersByType: Record<string, number> = {};
          listenersRef.current.forEach((listener) => {
            listenersByType[listener.eventType] = (listenersByType[listener.eventType] || 0) + 1;
          });

          console.log(`%c⚠️ Problematic Listeners`, 'font-weight: bold; color: #ef4444');
          console.log(`  Orphaned listeners by type:`, listenersByType);
          console.log(`  Detailed orphaned listeners:`, Array.from(listenersRef.current.values()));

          console.log(`%c💡 Suggestions`, 'font-weight: bold; color: #f59e0b');
          console.log(`  • Ensure all addEventListener calls have matching removeEventListener in cleanup`);
          console.log(`  • Check useEffect cleanup functions are properly returning cleanup callbacks`);
          console.log(`  • Verify event listener references are stable (not recreated on each render)`);
        } else {
          console.log(`%c✓ Status: All listeners properly cleaned up`, 'font-weight: bold; color: #10b981');
        }
        console.groupEnd();
      }

      // Check for orphaned listeners before restoring
      if (warnOnUnmount && listenersRef.current.size > 0) {
        console.warn(
          `[${componentName}] ⚠️ ${listenersRef.current.size} event listener(s) were not removed before unmount!`
        );

        const listenersByType: Record<string, number> = {};
        listenersRef.current.forEach((listener) => {
          listenersByType[listener.eventType] = (listenersByType[listener.eventType] || 0) + 1;
        });

        console.warn(`[${componentName}] Orphaned listeners by type:`, listenersByType);
      }

      // Restore original methods
      targets.forEach((target) => {
        const originalAdd = originalAddRef.current.get(target);
        const originalRemove = originalRemoveRef.current.get(target);

        if (originalAdd) {
          target.addEventListener = originalAdd;
        }
        if (originalRemove) {
          target.removeEventListener = originalRemove;
        }
      });

      // Clear refs
      listenersRef.current.clear();
      originalAddRef.current.clear();
      originalRemoveRef.current.clear();
    };
  }, [enabled, componentName, warnOnUnmount, trackGlobalListeners]);

  // Calculate stats
  const stats: ListenerStats = {
    active: listenersRef.current.size,
    totalAdded: addCountRef.current,
    totalRemoved: removeCountRef.current,
    byEventType: {},
  };

  // Group by event type
  listenersRef.current.forEach((listener) => {
    stats.byEventType[listener.eventType] = (stats.byEventType[listener.eventType] || 0) + 1;
  });

  return {
    stats,
    trackedListeners: Array.from(listenersRef.current.values()),
    isEnabled: enabled,
  };
}

/**
 * Helper hook for quickly checking if a component has listener leaks
 * This is a simpler version that just logs without returning detailed stats
 *
 * @param componentName - Name of the component for logging
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useEventListenerLeakDetector('MyComponent');
 *   // ... rest of component
 * }
 * ```
 */
export function useEventListenerLeakDetector(componentName: string): void {
  useEventListenerGuard(componentName, {
    enabled: process.env.NODE_ENV !== 'production',
    warnOnUnmount: true,
    trackGlobalListeners: true,
  });
}
