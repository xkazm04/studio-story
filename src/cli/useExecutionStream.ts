'use client';

/**
 * useExecutionStream — Shared hook for SSE CLI execution
 *
 * Encapsulates the common logic between CompactTerminal and InlineTerminal:
 * - SSE EventSource connection + event protocol parsing
 * - RAF-batched log accumulation
 * - Task lifecycle (execute, finalize, abort, cleanup)
 * - Queue processing + reconnection to existing executions
 * - Session tracking
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  createEventProtocol,
  decodeEvent,
  messageToLog,
  toolUseToLog,
  toolResultToLog,
  errorToLog,
  toolUseToFileChange,
} from './protocol';
import type {
  LogEntry,
  FileChange,
  ExecutionResult,
  QueuedTask,
} from './types';
import type { SkillId } from './skills';
import { buildSkillsPrompt } from './skills';
import { extractData } from '@/app/utils/api';
import type { ToolUseEvent } from './protocol';

// ============ Options ============

export interface UseExecutionStreamOptions {
  instanceId: string;
  projectPath: string;
  enabledSkills?: SkillId[];

  // Prompt building — lets the caller prepend system instructions, context, etc.
  buildPrompt?: (prompt: string) => string;

  // Task queue
  taskQueue?: QueuedTask[];
  autoStart?: boolean;
  onTaskStart?: (taskId: string) => void;
  onTaskComplete?: (taskId: string, success: boolean) => void;
  onQueueEmpty?: () => void;

  // Execution lifecycle
  currentExecutionId?: string | null;
  currentStoredTaskId?: string | null;
  onExecutionChange?: (executionId: string | null, taskId: string | null) => void;
  onExecutionComplete?: (success: boolean) => void;

  // Event interception (CompactTerminal intercepts tool_use for workspace)
  onToolUse?: (event: ToolUseEvent) => LogEntry | undefined;

  // Feature toggles
  trackFileChanges?: boolean;
  trackAssistantText?: boolean;
}

// ============ Return type ============

export interface UseExecutionStreamResult {
  logs: LogEntry[];
  fileChanges: FileChange[];
  isStreaming: boolean;
  error: string | null;
  sessionId: string | null;
  lastResult: ExecutionResult | null;
  lastBatchSize: number;
  lastAssistantText: string;

  addLog: (entry: LogEntry | null) => void;
  executeTask: (prompt: string) => Promise<void>;
  connectToStream: (streamUrl: string) => void;
  abort: () => void;
  clear: () => void;
}

// ============ Hook ============

export function useExecutionStream(
  options: UseExecutionStreamOptions,
): UseExecutionStreamResult {
  const {
    instanceId,
    projectPath,
    enabledSkills = [],
    buildPrompt,
    taskQueue,
    autoStart,
    onTaskStart,
    onTaskComplete,
    onQueueEmpty,
    currentExecutionId: externalExecutionId,
    currentStoredTaskId: externalStoredTaskId,
    onExecutionChange,
    onExecutionComplete,
    onToolUse,
    trackFileChanges = false,
    trackAssistantText = false,
  } = options;

  // State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [fileChanges, setFileChanges] = useState<FileChange[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ExecutionResult | null>(null);

  // Refs
  const eventSourceRef = useRef<EventSource | null>(null);
  const pendingLogsRef = useRef<LogEntry[]>([]);
  const lastBatchSizeRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const currentTaskRef = useRef<string | null>(null);
  const lastAssistantTextRef = useRef('');

  // Stable refs for callbacks that shouldn't trigger reconnects
  const onExecutionCompleteRef = useRef(onExecutionComplete);
  onExecutionCompleteRef.current = onExecutionComplete;
  const onToolUseRef = useRef(onToolUse);
  onToolUseRef.current = onToolUse;
  const onExecutionChangeRef = useRef(onExecutionChange);
  onExecutionChangeRef.current = onExecutionChange;

  // ============ RAF-Batched Log Adding ============

  const flushPendingLogs = useCallback(() => {
    if (pendingLogsRef.current.length > 0) {
      const batch = [...pendingLogsRef.current];
      pendingLogsRef.current = [];
      lastBatchSizeRef.current = batch.length;
      setLogs((prev) => [...prev, ...batch]);
    }
    rafIdRef.current = null;
  }, []);

  const addLog = useCallback(
    (entry: LogEntry | null) => {
      if (!entry) return;
      pendingLogsRef.current.push(entry);

      // Track assistant text if enabled
      if (trackAssistantText && entry.type === 'assistant') {
        lastAssistantTextRef.current += entry.content;
      }

      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(flushPendingLogs);
      }
    },
    [flushPendingLogs, trackAssistantText],
  );

  const addFileChange = useCallback(
    (fc: FileChange | null) => {
      if (!fc || !trackFileChanges) return;
      setFileChanges((prev) => [...prev, fc]);
    },
    [trackFileChanges],
  );

  // ============ Task Finalization ============

  const finalizeTask = useCallback(
    (success: boolean) => {
      const taskId = currentTaskRef.current;
      if (taskId && onTaskComplete) {
        onTaskComplete(taskId, success);
      }
      currentTaskRef.current = null;
    },
    [onTaskComplete],
  );

  // ============ SSE Connection ============

  const connectToStream = useCallback(
    (streamUrl: string) => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      setIsStreaming(true);
      setError(null);
      lastAssistantTextRef.current = '';

      const eventSource = new EventSource(streamUrl);
      eventSourceRef.current = eventSource;

      const protocol = createEventProtocol({
        connected: (event) => {
          if (event.data.sessionId) {
            setSessionId(event.data.sessionId);
          }
        },
        message: (event) => {
          addLog(messageToLog(event));
        },
        tool_use: (event) => {
          // Allow caller to intercept tool_use events
          const interceptHandler = onToolUseRef.current;
          if (interceptHandler) {
            const interceptedLog = interceptHandler(event);
            if (interceptedLog) {
              addLog(interceptedLog);
              return;
            }
          }
          addLog(toolUseToLog(event));
          if (trackFileChanges) {
            addFileChange(toolUseToFileChange(event, instanceId));
          }
        },
        tool_result: (event) => {
          addLog(toolResultToLog(event));
        },
        result: (event) => {
          setLastResult(event.data);
          setIsStreaming(false);
          finalizeTask(true);
          onExecutionCompleteRef.current?.(true);
        },
        error: (event) => {
          setError(event.data.error);
          addLog(errorToLog(event));
          setIsStreaming(false);
          finalizeTask(false);
          onExecutionCompleteRef.current?.(false);
        },
      });

      eventSource.onmessage = (raw) => {
        const event = decodeEvent(raw.data);
        if (event) protocol.handle(event);
      };

      eventSource.onerror = () => {
        setIsStreaming(false);
        eventSource.close();
        eventSourceRef.current = null;
      };
    },
    [instanceId, addLog, addFileChange, finalizeTask, trackFileChanges],
  );

  // ============ Task Execution ============

  const executeTask = useCallback(
    async (prompt: string) => {
      try {
        const skillsPrefix =
          enabledSkills.length > 0 ? buildSkillsPrompt(enabledSkills) : '';
        const basePrompt = buildPrompt
          ? buildPrompt(prompt)
          : skillsPrefix + prompt;
        // If buildPrompt is provided, it handles everything including skills
        const fullPrompt = buildPrompt ? basePrompt : basePrompt;

        const response = await fetch('/api/claude-terminal/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectPath,
            projectId: projectPath || undefined,
            prompt: fullPrompt,
            resumeSessionId: sessionId || undefined,
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          setError(err.error || 'Failed to start execution');
          setIsStreaming(false);
          return;
        }

        const { streamUrl, executionId } = extractData<{
          streamUrl: string;
          executionId: string;
        }>(await response.json());

        onExecutionChangeRef.current?.(executionId, currentTaskRef.current);

        connectToStream(streamUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsStreaming(false);
      }
    },
    [projectPath, sessionId, enabledSkills, buildPrompt, connectToStream],
  );

  // ============ Queue Processing ============

  useEffect(() => {
    if (!autoStart || !taskQueue || taskQueue.length === 0 || isStreaming)
      return;

    const nextTask = taskQueue.find((t) => t.status === 'pending');
    if (!nextTask) {
      if (onQueueEmpty) onQueueEmpty();
      return;
    }

    currentTaskRef.current = nextTask.id;
    if (onTaskStart) onTaskStart(nextTask.id);

    const prompt =
      nextTask.directPrompt || `Execute skill: ${nextTask.skillId}`;
    executeTask(prompt);
  }, [autoStart, taskQueue, isStreaming, executeTask, onTaskStart, onQueueEmpty]);

  // ============ Reconnect to existing execution ============

  useEffect(() => {
    if (externalExecutionId && !isStreaming) {
      const streamUrl = `/api/claude-terminal/stream?executionId=${externalExecutionId}`;
      currentTaskRef.current = externalStoredTaskId || null;
      connectToStream(streamUrl);
    }
  }, [externalExecutionId, externalStoredTaskId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ============ Abort ============

  const abort = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // ============ Clear ============

  const clear = useCallback(() => {
    setLogs([]);
    setFileChanges([]);
    setError(null);
    setLastResult(null);
    lastAssistantTextRef.current = '';
  }, []);

  // ============ Cleanup ============

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return {
    logs,
    fileChanges,
    isStreaming,
    error,
    sessionId,
    lastResult,
    lastBatchSize: lastBatchSizeRef.current,
    lastAssistantText: lastAssistantTextRef.current,
    addLog,
    executeTask,
    connectToStream,
    abort,
    clear,
  };
}
