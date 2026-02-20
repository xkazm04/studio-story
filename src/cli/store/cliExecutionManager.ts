/**
 * CLI Execution Manager
 *
 * Manages CLI task execution with polling, recovery, and background processing.
 * Simplified from vibeman: no requirement files, no remote events, no git integration.
 * Story app uses skill-based execution with direct prompt delivery.
 */

import { useCLISessionStore, type CLISessionId } from './cliSessionStore';
import type { QueuedTask } from '../types';

// Polling state per session
interface PollingState {
  intervalId: NodeJS.Timeout;
  executionId: string;
  startedAt: number;
}

// Module-level tracking (survives component re-renders)
const activePolling: Map<CLISessionId, PollingState> = new Map();
const activeStreams: Map<string, EventSource> = new Map();

/**
 * Start CLI execution for a task
 */
export async function startCLIExecution(
  sessionId: CLISessionId,
  task: QueuedTask,
  resumeSessionId?: string | null
): Promise<{ success: boolean; streamUrl?: string; error?: string }> {
  const store = useCLISessionStore.getState();

  store.updateTaskStatus(sessionId, task.id, 'running');
  store.setRunning(sessionId, true);

  try {
    // Build prompt from skill or direct prompt
    const prompt = task.directPrompt || `Execute skill: ${task.skillId}`;

    const response = await fetch('/api/claude-terminal/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectPath: task.projectPath,
        prompt,
        resumeSessionId: resumeSessionId || undefined,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      store.updateTaskStatus(sessionId, task.id, 'failed');
      store.setRunning(sessionId, false);
      return { success: false, error: err.error || 'Failed to start execution' };
    }

    const { streamUrl, executionId } = await response.json();

    // Store execution info for recovery
    store.setCurrentExecution(sessionId, executionId, task.id);

    // Start monitoring the execution
    startExecutionMonitoring(sessionId, task, executionId, streamUrl);

    return { success: true, streamUrl };
  } catch (error) {
    store.updateTaskStatus(sessionId, task.id, 'failed');
    store.setRunning(sessionId, false);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Start monitoring a CLI execution via SSE
 */
function startExecutionMonitoring(
  sessionId: CLISessionId,
  task: QueuedTask,
  executionId: string,
  streamUrl: string
): void {
  const store = useCLISessionStore.getState();

  // Close any existing stream for this session
  const existingStream = activeStreams.get(sessionId);
  if (existingStream) {
    existingStream.close();
    activeStreams.delete(sessionId);
  }

  const eventSource = new EventSource(streamUrl);
  activeStreams.set(sessionId, eventSource);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      store.updateLastActivity(sessionId);

      if (data.type === 'result') {
        const claudeSessionId = data.data?.sessionId;
        if (claudeSessionId) {
          store.setClaudeSessionId(sessionId, claudeSessionId);
        }
        handleTaskComplete(sessionId, task, true);
        eventSource.close();
        activeStreams.delete(sessionId);
      } else if (data.type === 'error') {
        handleTaskComplete(sessionId, task, false);
        eventSource.close();
        activeStreams.delete(sessionId);
      }
    } catch (e) {
      console.error('[CLI] Failed to parse SSE:', e);
    }
  };

  eventSource.onerror = () => {
    eventSource.close();
    activeStreams.delete(sessionId);
    startPollingFallback(sessionId, task, executionId);
  };

  activePolling.set(sessionId, {
    intervalId: setTimeout(() => {}, 0),
    executionId,
    startedAt: Date.now(),
  });
}

/**
 * Fallback polling when SSE disconnects
 */
function startPollingFallback(
  sessionId: CLISessionId,
  task: QueuedTask,
  executionId: string
): void {
  const existing = activePolling.get(sessionId);
  if (existing && existing.intervalId) {
    clearInterval(existing.intervalId);
  }

  const intervalId = setInterval(async () => {
    try {
      const response = await fetch(
        `/api/claude-terminal/query?executionId=${executionId}`
      );

      if (!response.ok) return;

      const data = await response.json();

      if (data.execution?.status !== 'running') {
        clearInterval(intervalId);
        activePolling.delete(sessionId);
        handleTaskComplete(sessionId, task, data.execution?.status === 'completed');
      }
    } catch {
      // Continue polling on error
    }
  }, 10000);

  activePolling.set(sessionId, {
    intervalId,
    executionId,
    startedAt: Date.now(),
  });
}

/**
 * Handle task completion
 */
async function handleTaskComplete(
  sessionId: CLISessionId,
  task: QueuedTask,
  success: boolean
): Promise<void> {
  const store = useCLISessionStore.getState();

  store.updateTaskStatus(sessionId, task.id, success ? 'completed' : 'failed');
  store.setCurrentExecution(sessionId, null, null);

  if (success) {
    // Remove task from queue after brief delay
    setTimeout(() => {
      store.removeTask(sessionId, task.id);
    }, 2000);
  }

  // Check for next task if autoStart is enabled
  setTimeout(() => {
    executeNextTask(sessionId);
  }, 3000);
}

/**
 * Execute next pending task in session queue
 */
export function executeNextTask(sessionId: CLISessionId): void {
  const store = useCLISessionStore.getState();
  const session = store.sessions[sessionId];

  if (!session?.autoStart) {
    store.setRunning(sessionId, false);
    return;
  }

  const nextTask = session.queue.find((t) => t.status === 'pending');

  if (!nextTask) {
    store.setRunning(sessionId, false);
    store.setAutoStart(sessionId, false);
    return;
  }

  startCLIExecution(sessionId, nextTask, session.claudeSessionId);
}

/**
 * Recover CLI sessions after page refresh
 */
export async function recoverCLISessions(): Promise<void> {
  const store = useCLISessionStore.getState();
  const sessionsToRecover = store.getSessionsNeedingRecovery();

  if (sessionsToRecover.length === 0) return;

  for (const session of sessionsToRecover) {
    const runningTask = session.queue.find((t) => t.status === 'running');

    if (runningTask) {
      // Check execution status on server
      if (session.currentExecutionId) {
        try {
          const response = await fetch(
            `/api/claude-terminal/query?executionId=${session.currentExecutionId}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.execution?.status === 'completed') {
              store.updateTaskStatus(session.id, runningTask.id, 'completed');
              setTimeout(() => store.removeTask(session.id, runningTask.id), 1000);
            } else if (data.execution?.status !== 'running') {
              store.updateTaskStatus(session.id, runningTask.id, 'failed');
            }
            // If still running, reconnect via polling
            else {
              startPollingFallback(session.id, runningTask, session.currentExecutionId);
              continue;
            }
          } else {
            // Execution not found — mark as failed
            store.updateTaskStatus(session.id, runningTask.id, 'pending');
          }
        } catch {
          store.updateTaskStatus(session.id, runningTask.id, 'pending');
        }
      } else {
        store.updateTaskStatus(session.id, runningTask.id, 'pending');
      }
    }

    // If autoStart and pending tasks, continue execution
    const updatedSession = store.sessions[session.id];
    const hasPendingTasks = updatedSession?.queue.some((t) => t.status === 'pending');

    if (session.autoStart && hasPendingTasks) {
      store.setRunning(session.id, true);
      setTimeout(() => executeNextTask(session.id), 1000);
    } else if (!hasPendingTasks) {
      store.setAutoStart(session.id, false);
      store.setRunning(session.id, false);
    }
  }
}

/**
 * Stop all polling for a session
 */
export function stopSessionPolling(sessionId: CLISessionId): void {
  const polling = activePolling.get(sessionId);
  if (polling) {
    clearInterval(polling.intervalId);
    activePolling.delete(sessionId);
  }

  const stream = activeStreams.get(sessionId);
  if (stream) {
    stream.close();
    activeStreams.delete(sessionId);
  }
}

/**
 * Abort a session's current execution
 */
export async function abortSessionExecution(sessionId: CLISessionId): Promise<boolean> {
  const store = useCLISessionStore.getState();
  const session = store.sessions[sessionId];

  stopSessionPolling(sessionId);

  if (session?.currentExecutionId) {
    try {
      await fetch(
        `/api/claude-terminal/query?executionId=${session.currentExecutionId}`,
        { method: 'DELETE' }
      );
    } catch (error) {
      console.error('[CLI] Error aborting execution:', error);
    }
  }

  store.clearSession(sessionId);
  return true;
}

/**
 * Cleanup all CLI sessions (on unmount)
 */
export function cleanupAllCLISessions(): void {
  for (const [sessionId] of activePolling) {
    stopSessionPolling(sessionId);
  }
}

/**
 * Get session execution status
 */
export function getSessionExecutionStatus(sessionId: CLISessionId): {
  isPolling: boolean;
  isStreaming: boolean;
  executionId?: string;
} {
  const polling = activePolling.get(sessionId);
  const stream = activeStreams.get(sessionId);

  return {
    isPolling: !!polling,
    isStreaming: !!stream,
    executionId: polling?.executionId,
  };
}
