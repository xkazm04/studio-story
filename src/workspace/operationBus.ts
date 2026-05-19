/**
 * OperationBus — Decoupled pub/sub for CLI tool-use events.
 *
 * Replaces the imperative fan-out in CommandBar where handleToolUse
 * directly called 5 independent consumers. Any subsystem can now
 * subscribe to tool operations without modifying the producer.
 *
 * Two subscription types:
 * - **Listeners**: Fire-and-forget, called for every operation.
 * - **Interceptors**: Return `true` to signal the operation was handled
 *   (e.g., compose_workspace suppresses default CLI logging).
 *
 * Usage:
 *   // Subscribe (returns unsubscribe function)
 *   const unsub = operationBus.subscribe((op) => { ... });
 *
 *   // Intercept (only one interceptor active at a time)
 *   const unsub = operationBus.intercept((op) => { return true; });
 *
 *   // Emit (returns true if any interceptor handled the event)
 *   const handled = operationBus.emit({ toolName, baseName, toolInput });
 */

export interface ToolOperation {
  /** Original tool name (e.g., mcp__story__create_character) */
  toolName: string;
  /** Extracted base name (e.g., create_character) */
  baseName: string;
  /** Tool input payload */
  toolInput: Record<string, unknown>;
}

type OperationListener = (op: ToolOperation) => void;
type OperationInterceptor = (op: ToolOperation) => boolean;

const listeners = new Set<OperationListener>();
const interceptors = new Set<OperationInterceptor>();

export const operationBus = {
  /**
   * Subscribe a passive listener. Called for every operation, return value ignored.
   * @returns Unsubscribe function.
   */
  subscribe(fn: OperationListener): () => void {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },

  /**
   * Register an interceptor. Interceptors run after listeners and can
   * return `true` to signal the operation was handled (e.g., suppress CLI logging).
   * @returns Unsubscribe function.
   */
  intercept(fn: OperationInterceptor): () => void {
    interceptors.add(fn);
    return () => { interceptors.delete(fn); };
  },

  /**
   * Emit a tool operation to all subscribers.
   * @returns `true` if any interceptor handled the operation.
   */
  emit(op: ToolOperation): boolean {
    // Notify all passive listeners first
    for (const listener of listeners) {
      try {
        listener(op);
      } catch (err) {
        console.error('[operation-bus] listener error:', err);
      }
    }

    // Check interceptors — any returning true means "handled"
    for (const interceptor of interceptors) {
      try {
        if (interceptor(op)) return true;
      } catch (err) {
        console.error('[operation-bus] interceptor error:', err);
      }
    }

    return false;
  },

  /** Number of active listeners (for testing/debugging). */
  get listenerCount(): number {
    return listeners.size;
  },

  /** Number of active interceptors (for testing/debugging). */
  get interceptorCount(): number {
    return interceptors.size;
  },

  /** Remove all subscribers. Primarily for testing. */
  _reset(): void {
    listeners.clear();
    interceptors.clear();
  },
};
