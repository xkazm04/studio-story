/**
 * Execution Entity Types — First-class execution lifecycle model.
 *
 * An Execution is the join key between the event stream, signal system,
 * and SSE transport. This module defines the entity shape and summary
 * projections consumed by API routes and the advisor agent.
 */

import type { ChildProcess } from 'child_process';
import type { EventEmitter } from 'events';
import type { CLIExecutionEvent } from './cli-service';
import type { Signal, IntentSignal } from './signals/signal-types';

// ============ Status ============

export type ExecutionStatus = 'running' | 'completed' | 'error' | 'aborted';

// ============ Usage ============

export interface ExecutionUsage {
  inputTokens: number;
  outputTokens: number;
  totalCostUsd?: number;
}

// ============ Execution Entity ============

/**
 * First-class Execution entity that aggregates the full lifecycle:
 * event stream, signals, intent signals, session, usage, and timing.
 */
export interface Execution {
  id: string;
  projectPath: string;
  prompt: string;
  process: ChildProcess | null;
  sessionId?: string;
  status: ExecutionStatus;
  startTime: number;
  endTime?: number;
  durationMs?: number;

  /** Full event stream for this execution */
  events: CLIExecutionEvent[];

  /** Signals emitted during this execution */
  signals: Signal[];

  /** Intent signals (successful tool chains) captured during this execution */
  intentSignals: IntentSignal[];

  /** Aggregated token/cost usage from result events */
  usage?: ExecutionUsage;

  /** Path to the on-disk log file */
  logFilePath?: string;

  /** Internal event emitter for real-time subscriptions */
  emitter: EventEmitter;
}

// ============ Summary (API projection) ============

/**
 * Lightweight projection of an Execution for API responses.
 * Excludes process handle, emitter, and full event/signal arrays.
 */
export interface ExecutionSummary {
  id: string;
  projectPath: string;
  prompt: string;
  sessionId?: string;
  status: ExecutionStatus;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  eventCount: number;
  signalCount: number;
  intentSignalCount: number;
  usage?: ExecutionUsage;
  logFilePath?: string;
}

/**
 * Project an Execution into a lightweight summary for API responses.
 */
export function toExecutionSummary(exec: Execution): ExecutionSummary {
  return {
    id: exec.id,
    projectPath: exec.projectPath,
    prompt: exec.prompt,
    sessionId: exec.sessionId,
    status: exec.status,
    startTime: exec.startTime,
    endTime: exec.endTime,
    durationMs: exec.durationMs,
    eventCount: exec.events.length,
    signalCount: exec.signals.length,
    intentSignalCount: exec.intentSignals.length,
    usage: exec.usage,
    logFilePath: exec.logFilePath,
  };
}
