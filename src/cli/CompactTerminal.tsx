'use client';

/**
 * CompactTerminal — Inline CLI terminal component for Story features
 *
 * Renders a streaming terminal that connects to Claude Code CLI via SSE.
 * Used inline in feature panels (Simulator, Characters, Story, etc.)
 *
 * Features:
 * - SSE streaming with protocol-typed events
 * - RAF-batched log rendering for performance
 * - Virtualized scrolling for 50+ log entries
 * - File change tracking from tool_use events
 * - Session chaining via resumeSessionId
 * - Manual prompt input for interactive sessions
 */

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  Terminal,
  User,
  Bot,
  Wrench,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Send,
  Square,
  Loader2,
  Trash2,
  Copy,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import {
  createEventProtocol,
  decodeEvent,
  messageToLog,
  toolUseToLog,
  toolResultToLog,
  errorToLog,
  toolUseToFileChange,
} from './protocol';
import CLIMarkdown from './CLIMarkdown';
import type {
  CompactTerminalProps,
  LogEntry,
  FileChange,
  ExecutionResult,
} from './types';
import { buildSkillsPrompt, buildBaseSystemPrompt } from './skills';

// ============ Icon & Color Maps ============

const LOG_ICONS: Record<LogEntry['type'], React.ElementType> = {
  user: User,
  assistant: Bot,
  tool_use: Wrench,
  tool_result: CheckCircle,
  system: Terminal,
  error: AlertCircle,
};

const LOG_COLORS: Record<LogEntry['type'], string> = {
  user: 'text-blue-400',
  assistant: 'text-slate-200',
  tool_use: 'text-amber-400',
  tool_result: 'text-emerald-400',
  system: 'text-slate-500',
  error: 'text-red-400',
};

// ============ Component ============

export default function CompactTerminal({
  instanceId,
  projectPath,
  actId,
  sceneId,
  title,
  className,
  taskQueue,
  onTaskStart,
  onTaskComplete,
  onQueueEmpty,
  autoStart,
  enabledSkills = [],
  currentExecutionId: externalExecutionId,
  currentStoredTaskId: externalStoredTaskId,
  onExecutionChange,
  onToolUse,
  onPromptSubmit,
  onExecutionComplete,
}: CompactTerminalProps) {
  // State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [fileChanges, setFileChanges] = useState<FileChange[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ExecutionResult | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);

  // Refs
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pendingLogsRef = useRef<LogEntry[]>([]);
  const rafIdRef = useRef<number | null>(null);
  const currentTaskRef = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ============ RAF-Batched Log Adding ============

  const flushPendingLogs = useCallback(() => {
    if (pendingLogsRef.current.length > 0) {
      const batch = [...pendingLogsRef.current];
      pendingLogsRef.current = [];
      setLogs((prev) => [...prev, ...batch]);
    }
    rafIdRef.current = null;
  }, []);

  const addLog = useCallback(
    (entry: LogEntry | null) => {
      if (!entry) return;
      pendingLogsRef.current.push(entry);
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(flushPendingLogs);
      }
    },
    [flushPendingLogs]
  );

  const addFileChange = useCallback((fc: FileChange | null) => {
    if (!fc) return;
    setFileChanges((prev) => [...prev, fc]);
  }, []);

  // ============ Auto-scroll ============

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleScroll = useCallback(() => {
    const container = logsContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  }, []);

  // ============ Textarea Auto-resize ============

  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
  }, []);

  // ============ SSE Connection ============

  const connectToStream = useCallback(
    (streamUrl: string) => {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      setIsStreaming(true);
      setError(null);

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
          // V2 workspace interception
          const intercepted = onToolUse?.(event.data.toolName, event.data.toolInput);
          if (intercepted) {
            addLog({
              id: `ws-${Date.now()}`,
              type: 'system',
              content: `[workspace] ${event.data.toolName}`,
              timestamp: event.timestamp,
              toolName: event.data.toolName,
            });
            return;
          }
          addLog(toolUseToLog(event));
          addFileChange(toolUseToFileChange(event, instanceId));
        },
        tool_result: (event) => {
          addLog(toolResultToLog(event));
        },
        result: (event) => {
          setLastResult(event.data);
          setIsStreaming(false);
          finalizeTask(true);
          onExecutionComplete?.(true);

          // Check for detected patterns after execution
          fetch('/api/claude-terminal/improve')
            .then(r => r.json())
            .then(data => {
              if (data.success && data.patterns?.length > 0) {
                const count = data.patterns.length;
                const highCount = data.patterns.filter(
                  (p: { severity: string }) => p.severity === 'high'
                ).length;
                const summary = data.patterns
                  .slice(0, 3)
                  .map((p: { type: string; toolName?: string }) =>
                    `${p.type}${p.toolName ? ` (${p.toolName})` : ''}`
                  )
                  .join(', ');
                addLog({
                  id: `signal-${Date.now()}`,
                  type: 'system',
                  content: `[signals] ${count} issue${count > 1 ? 's' : ''} detected${highCount ? ` (${highCount} high)` : ''}: ${summary}. Type /fix to resolve.`,
                  timestamp: Date.now(),
                });
              }
            })
            .catch(() => {}); // Non-critical
        },
        error: (event) => {
          setError(event.data.error);
          addLog(errorToLog(event));
          setIsStreaming(false);
          finalizeTask(false);
          onExecutionComplete?.(false);
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
    [instanceId, addLog, addFileChange] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ============ Task Execution ============

  const finalizeTask = useCallback(
    (success: boolean) => {
      const taskId = currentTaskRef.current;
      if (taskId && onTaskComplete) {
        onTaskComplete(taskId, success);
      }
      currentTaskRef.current = null;
    },
    [onTaskComplete]
  );

  const executeTask = useCallback(
    async (prompt: string) => {
      try {
        // Build full prompt with base system instructions + context + skills prefix
        const basePrompt = buildBaseSystemPrompt(projectPath || undefined);
        const contextLines: string[] = [];
        if (actId) contextLines.push(`- Active act ID: \`${actId}\``);
        if (sceneId) contextLines.push(`- Active scene ID: \`${sceneId}\``);
        const contextBlock = contextLines.length
          ? `\n## Current Selection\n${contextLines.join('\n')}\n\nUse these IDs for get_scene, list_beats(actId), etc. When the user says "this scene" or "this act", they mean these.\n\n`
          : '';
        const skillsPrefix =
          enabledSkills.length > 0 ? buildSkillsPrompt(enabledSkills) : '';
        const fullPrompt = basePrompt + contextBlock + skillsPrefix + prompt;

        const response = await fetch('/api/claude-terminal/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectPath,
            projectId: projectPath || undefined, // projectPath carries the Story project ID
            prompt: fullPrompt,
            resumeSessionId: sessionId || undefined,
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          setError(err.error || 'Failed to start execution');
          return;
        }

        const { streamUrl, executionId } = await response.json();

        if (onExecutionChange) {
          onExecutionChange(executionId, currentTaskRef.current);
        }

        connectToStream(streamUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsStreaming(false);
      }
    },
    [
      projectPath,
      sessionId,
      enabledSkills,
      connectToStream,
      onExecutionChange,
    ]
  );

  // ============ Queue Processing ============

  useEffect(() => {
    if (!autoStart || !taskQueue || taskQueue.length === 0 || isStreaming) return;

    const nextTask = taskQueue.find((t) => t.status === 'pending');
    if (!nextTask) {
      if (onQueueEmpty) onQueueEmpty();
      return;
    }

    currentTaskRef.current = nextTask.id;
    if (onTaskStart) onTaskStart(nextTask.id);

    const prompt = nextTask.directPrompt || `Execute skill: ${nextTask.skillId}`;
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

  // ============ Self-Improvement (/fix) ============

  const executeImprovement = useCallback(async () => {
    try {
      // Fetch current patterns
      const res = await fetch('/api/claude-terminal/improve');
      const data = await res.json();
      if (!data.success || !data.patterns?.length) {
        addLog({
          id: `system-${Date.now()}`,
          type: 'system',
          content: '[signals] No unresolved patterns to fix.',
          timestamp: Date.now(),
        });
        return;
      }

      // Build improvement prompt
      const { buildImprovementPrompt } = await import(
        '@/lib/claude-terminal/signals/improvement-prompt'
      );
      const improvementPrompt = buildImprovementPrompt(data.patterns);

      // Send via normal query route — resumeSessionId preserves context
      const response = await fetch('/api/claude-terminal/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath,
          projectId: projectPath || undefined,
          prompt: improvementPrompt,
          resumeSessionId: sessionId || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        setError(err.error || 'Failed to start improvement');
        return;
      }

      const { streamUrl, executionId } = await response.json();
      if (onExecutionChange) onExecutionChange(executionId, null);
      connectToStream(streamUrl);

      // Mark patterns as resolved (optimistic)
      fetch('/api/claude-terminal/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patternFingerprints: data.patterns.map(
            (p: { fingerprint: string }) => p.fingerprint
          ),
        }),
      }).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Improvement failed');
      setIsStreaming(false);
    }
  }, [projectPath, sessionId, addLog, connectToStream, onExecutionChange]); // eslint-disable-line react-hooks/exhaustive-deps

  // ============ Manual Input ============

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim() || isStreaming) return;

    const prompt = inputValue.trim();

    // Notify parent before execution (V2 workspace intent detection)
    onPromptSubmit?.(prompt);

    addLog({
      id: `user-${Date.now()}`,
      type: 'user',
      content: prompt,
      timestamp: Date.now(),
    });

    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Handle /fix command — resume session to fix detected issues
    if (prompt === '/fix') {
      executeImprovement();
    } else {
      executeTask(prompt);
    }
  }, [inputValue, isStreaming, executeTask, executeImprovement, addLog, onPromptSubmit]);

  const handleAbort = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const handleClear = useCallback(() => {
    setLogs([]);
    setFileChanges([]);
    setError(null);
    setLastResult(null);
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

  // ============ Computed Values ============

  const fileChangeStats = useMemo(() => {
    const edits = fileChanges.filter((f) => f.changeType === 'edit').length;
    const writes = fileChanges.filter((f) => f.changeType === 'write').length;
    return { edits, writes };
  }, [fileChanges]);

  const tokenDisplay = useMemo(() => {
    if (!lastResult?.usage) return null;
    const { inputTokens, outputTokens } = lastResult.usage;
    const formatK = (n: number) =>
      n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
    return `${formatK(inputTokens)}/${formatK(outputTokens)}`;
  }, [lastResult]);

  // ============ Copy Last Output ============

  const handleCopyOutput = useCallback(() => {
    const assistantLogs = logs.filter((l) => l.type === 'assistant');
    const lastOutput = assistantLogs.length > 0
      ? assistantLogs.map((l) => l.content).join('\n')
      : '';
    if (!lastOutput) return;
    navigator.clipboard.writeText(lastOutput).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [logs]);

  // ============ Render ============

  return (
    <div
      className={cn(
        'flex flex-col bg-slate-950 border border-slate-800 rounded-lg overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-xs">
        <Terminal className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-slate-400 font-medium">
          {title || 'CLI Terminal'}
        </span>

        {sessionId && (
          <span className="text-purple-400/70 font-mono text-[10px]">
            {sessionId.slice(0, 6)}
          </span>
        )}

        {fileChangeStats.edits > 0 && (
          <span className="text-amber-400/70 font-mono text-[10px]">
            {fileChangeStats.edits}E
          </span>
        )}
        {fileChangeStats.writes > 0 && (
          <span className="text-emerald-400/70 font-mono text-[10px]">
            {fileChangeStats.writes}W
          </span>
        )}

        <div className="flex-1" />

        {tokenDisplay && (
          <span className="text-slate-500 font-mono text-[10px]">
            {tokenDisplay}
          </span>
        )}

        {isStreaming && (
          <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
        )}

        {!isStreaming && logs.some((l) => l.type === 'assistant') && (
          <button
            onClick={handleCopyOutput}
            className={cn(
              'transition-colors',
              copied ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400',
            )}
            title={copied ? 'Copied!' : 'Copy output'}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        )}

        <button
          onClick={handleClear}
          className="text-slate-600 hover:text-slate-400 transition-colors"
          title="Clear logs"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Log Area */}
      <div
        ref={logsContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 min-h-[100px] max-h-[400px] font-mono text-xs"
      >
        {logs.length === 0 && !isStreaming && (
          <div className="flex items-center justify-center h-full text-slate-600 text-xs">
            Ready. Type a prompt or queue a skill.
          </div>
        )}

        {logs.map((log) => {
          const Icon = LOG_ICONS[log.type];
          const color = LOG_COLORS[log.type];
          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-start gap-1.5 leading-relaxed"
            >
              <Icon className={cn('w-3 h-3 mt-0.5 shrink-0', color)} />
              <span className={cn('break-words whitespace-pre-wrap', color)}>
                {log.toolName && (
                  <span className="text-amber-300 mr-1">{log.toolName}</span>
                )}
                {log.type === 'assistant'
                  ? <CLIMarkdown content={log.content} />
                  : log.type === 'user'
                    ? log.content
                    : log.content.slice(0, 500)}
                {log.type !== 'user' && log.type !== 'assistant' && log.content.length > 500 && (
                  <span className="text-slate-600">...</span>
                )}
              </span>
            </motion.div>
          );
        })}

        {isStreaming && (
          <div className="flex items-center gap-1.5 text-blue-400/60">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Working...</span>
          </div>
        )}

        <div ref={logsEndRef} />
      </div>

      {/* Scroll-to-bottom button */}
      {!autoScroll && (
        <button
          onClick={() => {
            setAutoScroll(true);
            logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="absolute bottom-12 right-4 bg-slate-800 rounded-full p-1 shadow-lg border border-slate-700 text-slate-400 hover:text-slate-200"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Input */}
      <div className="flex items-end gap-2 px-3 py-1.5 border-t border-slate-800 bg-slate-900/50">
        <span className="text-emerald-500 text-xs font-bold select-none pb-0.5">
          {'>'}
        </span>
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            adjustTextareaHeight();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={isStreaming ? 'Working...' : 'Type a prompt...'}
          disabled={isStreaming}
          rows={1}
          className={cn(
            'flex-1 bg-transparent text-slate-200 text-xs outline-none',
            'placeholder-slate-600 disabled:opacity-50',
            'resize-none overflow-y-auto leading-relaxed'
          )}
        />

        {isStreaming ? (
          <button
            onClick={handleAbort}
            className="text-red-400 hover:text-red-300 transition-colors pb-0.5"
            title="Stop"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim()}
            className="text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-30 pb-0.5"
            title="Send"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
