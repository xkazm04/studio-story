/**
 * ExecutionStore — Single source of truth for CLI execution lifecycle.
 *
 * Replaces the raw `activeExecutions: Map<string, CLIExecution>` that was
 * scattered across cli-service.ts. All consumers (stream route, query route,
 * sessions route, signal-analyzer) read from this store.
 *
 * Persists across Next.js HMR reloads via globalThis.
 */

import { EventEmitter } from 'events';
import type { CLIExecutionEvent } from './cli-service';
import type { Execution, ExecutionStatus, ExecutionSummary, ExecutionUsage } from './execution-types';
import { toExecutionSummary } from './execution-types';
import type { Signal, IntentSignal } from './signals/signal-types';

// ============ Store singleton via globalThis ============

const GLOBAL_KEY = '__executionStore';

const globalRef = globalThis as unknown as {
  [GLOBAL_KEY]: ExecutionStore | undefined;
};

// ============ ExecutionStore ============

export class ExecutionStore {
  private executions = new Map<string, Execution>();

  // ---- Registration ----

  /**
   * Register a new execution. Called once at the start of startExecution().
   */
  register(init: {
    id: string;
    projectPath: string;
    prompt: string;
    logFilePath?: string;
  }): Execution {
    const execution: Execution = {
      id: init.id,
      projectPath: init.projectPath,
      prompt: init.prompt,
      process: null,
      status: 'running',
      startTime: Date.now(),
      events: [],
      signals: [],
      intentSignals: [],
      logFilePath: init.logFilePath,
      emitter: new EventEmitter(),
    };

    this.executions.set(init.id, execution);
    return execution;
  }

  // ---- Lookup ----

  get(executionId: string): Execution | undefined {
    return this.executions.get(executionId);
  }

  getAll(): Execution[] {
    return Array.from(this.executions.values());
  }

  getActive(): Execution[] {
    return this.getAll().filter(e => e.status === 'running');
  }

  has(executionId: string): boolean {
    return this.executions.has(executionId);
  }

  get size(): number {
    return this.executions.size;
  }

  // ---- Summaries ----

  getSummary(executionId: string): ExecutionSummary | undefined {
    const exec = this.executions.get(executionId);
    return exec ? toExecutionSummary(exec) : undefined;
  }

  getActiveSummaries(): ExecutionSummary[] {
    return this.getActive().map(toExecutionSummary);
  }

  getAllSummaries(): ExecutionSummary[] {
    return this.getAll().map(toExecutionSummary);
  }

  // ---- Events ----

  /**
   * Push an event into an execution's stream and notify subscribers.
   */
  pushEvent(executionId: string, event: CLIExecutionEvent): void {
    const exec = this.executions.get(executionId);
    if (!exec) return;

    exec.events.push(event);
    exec.emitter.emit('event', event);

    // Extract usage/cost from result events
    if (event.type === 'result' && event.data.usage) {
      exec.usage = {
        inputTokens: (exec.usage?.inputTokens ?? 0) + event.data.usage.input_tokens,
        outputTokens: (exec.usage?.outputTokens ?? 0) + event.data.usage.output_tokens,
        totalCostUsd: event.data.costUsd ?? exec.usage?.totalCostUsd,
      };
      if (event.data.durationMs) {
        exec.durationMs = event.data.durationMs;
      }
    }
  }

  /**
   * Subscribe to real-time events for an execution. Returns unsubscribe fn, or null if not found.
   */
  subscribe(
    executionId: string,
    listener: (event: CLIExecutionEvent) => void,
  ): (() => void) | null {
    const exec = this.executions.get(executionId);
    if (!exec) return null;
    exec.emitter.on('event', listener);
    return () => exec.emitter.off('event', listener);
  }

  // ---- Signals ----

  /**
   * Append a signal to the execution's signal list.
   * The signal is also persisted to the file-based signal store by the caller.
   */
  pushSignal(executionId: string, signal: Signal): void {
    const exec = this.executions.get(executionId);
    if (!exec) return;
    exec.signals.push(signal);
  }

  pushIntentSignal(executionId: string, intentSignal: IntentSignal): void {
    const exec = this.executions.get(executionId);
    if (!exec) return;
    exec.intentSignals.push(intentSignal);
  }

  /**
   * Get all signals for an execution.
   */
  getSignals(executionId: string): Signal[] {
    return this.executions.get(executionId)?.signals ?? [];
  }

  getIntentSignals(executionId: string): IntentSignal[] {
    return this.executions.get(executionId)?.intentSignals ?? [];
  }

  // ---- Lifecycle ----

  /**
   * Update execution status and optional fields.
   */
  updateStatus(executionId: string, status: ExecutionStatus, fields?: {
    endTime?: number;
    sessionId?: string;
    durationMs?: number;
    usage?: ExecutionUsage;
  }): void {
    const exec = this.executions.get(executionId);
    if (!exec) return;
    exec.status = status;
    if (fields?.endTime !== undefined) exec.endTime = fields.endTime;
    if (fields?.sessionId !== undefined) exec.sessionId = fields.sessionId;
    if (fields?.durationMs !== undefined) exec.durationMs = fields.durationMs;
    if (fields?.usage !== undefined) exec.usage = fields.usage;
  }

  /**
   * Abort an execution — kill the process and mark as aborted.
   */
  abort(executionId: string): boolean {
    const exec = this.executions.get(executionId);
    if (!exec || !exec.process) return false;

    exec.process.kill();
    exec.status = 'aborted';
    exec.endTime = Date.now();
    exec.durationMs = exec.endTime - exec.startTime;
    return true;
  }

  /**
   * Remove completed/errored/aborted executions older than maxAgeMs.
   */
  cleanup(maxAgeMs: number = 3600000): number {
    const now = Date.now();
    let removed = 0;
    for (const [id, exec] of this.executions) {
      if (exec.status !== 'running' && exec.endTime && now - exec.endTime > maxAgeMs) {
        this.executions.delete(id);
        removed++;
      }
    }
    return removed;
  }
}

// ============ Singleton accessor ============

/**
 * Get the global ExecutionStore singleton. Survives HMR reloads.
 */
export function getExecutionStore(): ExecutionStore {
  if (!globalRef[GLOBAL_KEY]) {
    globalRef[GLOBAL_KEY] = new ExecutionStore();
  }
  return globalRef[GLOBAL_KEY];
}
