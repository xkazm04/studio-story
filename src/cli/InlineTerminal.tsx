'use client';

/**
 * InlineTerminal — Lightweight embedded CLI terminal
 *
 * Simplified CompactTerminal for inline embedding in feature panels.
 * - Shows streaming log output + status indicator
 * - No manual input field (programmatic execution only via useCLIFeature)
 * - Collapsible with Framer Motion animations
 * - Skill name badge in header
 * - Result action bar (Copy/Insert) on completion
 * - Calls onResult with parsed data when execution completes
 *
 * Usage:
 *   const cli = useCLIFeature({ ... });
 *   <InlineTerminal {...cli.terminalProps} height={200} collapsible onResult={handleResult} />
 */

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import {
  Terminal,
  Bot,
  Wrench,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  Square,
  Copy,
  Check,
  Eye,
  EyeOff,
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
} from './protocol';
import type { LogEntry, ExecutionResult, InlineTerminalProps } from './types';
import { buildSkillsPrompt } from './skills';
import type { SkillId } from './skills';

// ============ Icon & Color Maps ============

const LOG_ICONS: Record<LogEntry['type'], React.ElementType> = {
  user: Terminal,
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

// ============ Extended Props (includes task queue integration) ============

interface InlineTerminalFullProps extends InlineTerminalProps {
  taskQueue?: import('./types').QueuedTask[];
  autoStart?: boolean;
  enabledSkills?: SkillId[];
  onTaskStart?: (taskId: string) => void;
  onTaskComplete?: (taskId: string, success: boolean) => void;
  onQueueEmpty?: () => void;
  currentExecutionId?: string | null;
  currentStoredTaskId?: string | null;
  onExecutionChange?: (executionId: string | null, taskId: string | null) => void;
  /** Currently running skill name for badge display */
  activeSkillId?: string | null;
  /** Callback for "Insert" action on result */
  onInsert?: (text: string) => void;
}

// ============ Component ============

export default function InlineTerminal({
  instanceId,
  projectPath,
  className,
  height = 200,
  collapsible = false,
  onResult,
  outputFormat = 'streaming',
  taskQueue,
  autoStart,
  enabledSkills = [],
  onTaskStart,
  onTaskComplete,
  onQueueEmpty,
  currentExecutionId: externalExecutionId,
  currentStoredTaskId: externalStoredTaskId,
  onExecutionChange,
  activeSkillId,
  onInsert,
}: InlineTerminalFullProps) {
  // State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ExecutionResult | null>(null);
  const [showDetails, setShowDetails] = useState(true);
  const [copied, setCopied] = useState(false);

  // Refs
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pendingLogsRef = useRef<LogEntry[]>([]);
  const rafIdRef = useRef<number | null>(null);
  const currentTaskRef = useRef<string | null>(null);
  const lastAssistantTextRef = useRef<string>('');

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

      // Track assistant text for result extraction
      if (entry.type === 'assistant') {
        lastAssistantTextRef.current += entry.content;
      }

      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(flushPendingLogs);
      }
    },
    [flushPendingLogs],
  );

  // ============ Auto-scroll ============

  useEffect(() => {
    if (logsEndRef.current && !collapsed) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, collapsed]);

  // ============ Result Parsing ============

  const parseAndEmitResult = useCallback(
    (success: boolean) => {
      if (!onResult || !success) return;

      const text = lastAssistantTextRef.current.trim();
      if (!text) return;

      if (outputFormat === 'json') {
        // Extract JSON from assistant output (may be wrapped in ```json blocks)
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ||
                          text.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            onResult(parsed);
          } catch {
            // Fall back to raw text
            onResult({ raw: text });
          }
        } else {
          onResult({ raw: text });
        }
      } else {
        onResult({ text });
      }
    },
    [onResult, outputFormat],
  );

  // ============ Task Finalization ============

  const finalizeTask = useCallback(
    (success: boolean) => {
      const taskId = currentTaskRef.current;
      if (taskId && onTaskComplete) {
        onTaskComplete(taskId, success);
      }
      currentTaskRef.current = null;
      parseAndEmitResult(success);
      lastAssistantTextRef.current = '';
    },
    [onTaskComplete, parseAndEmitResult],
  );

  // ============ SSE Connection ============

  const connectToStream = useCallback(
    (streamUrl: string) => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      setIsStreaming(true);
      lastAssistantTextRef.current = '';

      // Auto-expand on new execution
      if (collapsed) setCollapsed(false);

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
          addLog(toolUseToLog(event));
        },
        tool_result: (event) => {
          addLog(toolResultToLog(event));
        },
        result: (event) => {
          setLastResult(event.data);
          setIsStreaming(false);
          finalizeTask(true);
        },
        error: (event) => {
          addLog(errorToLog(event));
          setIsStreaming(false);
          finalizeTask(false);
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
    [addLog, finalizeTask, collapsed],
  );

  // ============ Task Execution ============

  const executeTask = useCallback(
    async (prompt: string) => {
      try {
        const skillsPrefix =
          enabledSkills.length > 0 ? buildSkillsPrompt(enabledSkills) : '';
        const fullPrompt = skillsPrefix + prompt;

        const response = await fetch('/api/claude-terminal/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectPath,
            prompt: fullPrompt,
            resumeSessionId: sessionId || undefined,
          }),
        });

        if (!response.ok) {
          setIsStreaming(false);
          return;
        }

        const { streamUrl, executionId } = await response.json();

        if (onExecutionChange) {
          onExecutionChange(executionId, currentTaskRef.current);
        }

        connectToStream(streamUrl);
      } catch {
        setIsStreaming(false);
      }
    },
    [projectPath, sessionId, enabledSkills, connectToStream, onExecutionChange],
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

  // ============ Abort ============

  const handleAbort = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // ============ Cleanup ============

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // ============ Copy to Clipboard ============

  const handleCopy = useCallback(() => {
    const text = lastAssistantTextRef.current.trim();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const handleInsert = useCallback(() => {
    if (!onInsert) return;
    const text = lastAssistantTextRef.current.trim();
    if (text) onInsert(text);
  }, [onInsert]);

  // ============ Skill Badge Label ============

  const skillLabel = activeSkillId
    ? activeSkillId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : null;

  // ============ Render ============

  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  // Don't render anything if no logs and not streaming
  const hasContent = logs.length > 0 || isStreaming;
  const isComplete = !isStreaming && lastResult && !lastResult.isError;
  const hasResultText = lastAssistantTextRef.current.trim().length > 0;

  if (!hasContent && !collapsed) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'flex flex-col bg-slate-950 border border-slate-800 rounded-lg overflow-hidden',
        className,
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-xs',
          collapsible && 'cursor-pointer select-none',
        )}
        onClick={collapsible ? () => setCollapsed(!collapsed) : undefined}
      >
        {collapsible && (
          <motion.div
            animate={{ rotate: collapsed ? 0 : 90 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronRight className="w-3 h-3 text-slate-500" />
          </motion.div>
        )}

        <Terminal className="w-3 h-3 text-slate-500" />
        <span className="text-slate-400 font-medium text-[11px]">CLI</span>

        {/* Skill Badge */}
        {skillLabel && isStreaming && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {skillLabel}
          </span>
        )}

        <div className="flex-1" />

        {/* Details Toggle */}
        {hasContent && !collapsed && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); }}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            title={showDetails ? 'Hide details' : 'Show details'}
          >
            {showDetails ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>
        )}

        {isStreaming && (
          <>
            <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
            <button
              onClick={(e) => { e.stopPropagation(); handleAbort(); }}
              className="text-red-400/70 hover:text-red-300 transition-colors"
              title="Stop generation"
            >
              <Square className="w-3 h-3" />
            </button>
          </>
        )}

        {isComplete && (
          <CheckCircle className="w-3 h-3 text-emerald-400/70" />
        )}

        {!isStreaming && lastResult?.isError && (
          <AlertCircle className="w-3 h-3 text-red-400/70" />
        )}
      </div>

      {/* Collapsible Body */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            {/* Log Area (toggleable via Show Details) */}
            {showDetails && (
              <div
                ref={logsContainerRef}
                className="overflow-y-auto px-3 py-1.5 space-y-0.5 font-mono text-[11px]"
                style={{ maxHeight: heightStyle }}
              >
                {logs.map((log) => {
                  const Icon = LOG_ICONS[log.type];
                  const color = LOG_COLORS[log.type];
                  return (
                    <div key={log.id} className="flex items-start gap-1.5 leading-relaxed">
                      <Icon className={cn('w-3 h-3 mt-0.5 shrink-0', color)} />
                      <span className={cn('break-all', color)}>
                        {log.toolName && (
                          <span className="text-amber-300 mr-1">{log.toolName}</span>
                        )}
                        {log.content.slice(0, 300)}
                        {log.content.length > 300 && (
                          <span className="text-slate-600">...</span>
                        )}
                      </span>
                    </div>
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
            )}

            {/* Result Action Bar */}
            {isComplete && hasResultText && (
              <div className="flex items-center gap-2 px-3 py-1.5 border-t border-slate-800/60 bg-slate-900/40">
                <span className="text-[10px] text-emerald-400/80 font-medium">Done</span>

                {lastResult?.usage && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    {lastResult.usage.inputTokens + lastResult.usage.outputTokens} tokens
                  </span>
                )}

                <div className="flex-1" />

                <button
                  onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                  className={cn(
                    'flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors',
                    copied
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700',
                  )}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>

                {onInsert && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleInsert(); }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                  >
                    Insert
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
