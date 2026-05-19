/**
 * Observation Bus — Unified pipeline for MCP tool call observations.
 *
 * Emits a canonical ToolObservation event for every tool invocation,
 * consumed by both the audit JSONL writer and the signal classifier.
 * This eliminates duplicate interception and enables cross-layer correlation
 * (linking an audit entry → signal → pattern).
 *
 * Single extension point: subscribe a new handler to observe all tool calls.
 */

// ============ Canonical Event ============

export interface ToolObservation {
  /** Unique observation ID — correlation key linking audit entry to signal */
  id: string;
  /** MCP tool name */
  toolName: string;
  /** Full input parameters passed to the tool */
  inputs: Record<string, unknown>;
  /** Raw output (may be truncated by consumers) */
  output: unknown;
  /** First text content from the tool result (convenience field) */
  outputText: string;
  /** Whether the tool call succeeded */
  success: boolean;
  /** Wall-clock duration in milliseconds */
  durationMs: number;
  /** Error message if the call failed */
  error?: string;
  /** Unix timestamp (ms) */
  timestamp: number;
  /** MCP server session ID (process start time) */
  sessionId: string;
}

// ============ Bus ============

export type ObservationHandler = (observation: ToolObservation) => void;

/**
 * Simple synchronous pub/sub bus for tool observations.
 * Handlers are called inline so every subscriber sees every event.
 * Individual handlers must swallow their own errors.
 */
export class ObservationBus {
  private handlers: ObservationHandler[] = [];

  subscribe(handler: ObservationHandler): () => void {
    this.handlers.push(handler);
    return () => {
      const idx = this.handlers.indexOf(handler);
      if (idx >= 0) this.handlers.splice(idx, 1);
    };
  }

  emit(observation: ToolObservation): void {
    for (const handler of this.handlers) {
      try {
        handler(observation);
      } catch {
        // Observers must not crash the pipeline
      }
    }
  }

  get subscriberCount(): number {
    return this.handlers.length;
  }
}

// ============ Singleton + ID generation ============

const SESSION_ID = new Date().toISOString().replace(/[:.]/g, '-');
let observationCounter = 0;

export function makeObservationId(): string {
  return `obs-${SESSION_ID}-${String(++observationCounter).padStart(5, '0')}`;
}

export function getObservationSessionId(): string {
  return SESSION_ID;
}

let _bus: ObservationBus | null = null;

/** Singleton bus shared across all tool registrations in one MCP server process. */
export function getObservationBus(): ObservationBus {
  if (!_bus) _bus = new ObservationBus();
  return _bus;
}
