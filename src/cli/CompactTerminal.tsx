'use client';

/**
 * CompactTerminal — Inline CLI terminal component for Story features
 *
 * Renders a streaming terminal that connects to Claude Code CLI via SSE.
 * Uses useExecutionStream for SSE connection, protocol parsing, and log state.
 *
 * Features:
 * - SSE streaming with protocol-typed events
 * - RAF-batched log rendering for performance
 * - File change tracking from tool_use events
 * - Session chaining via resumeSessionId
 * - Manual prompt input for interactive sessions
 * - Signal pattern detection + /fix command
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
import CLIMarkdown from './CLIMarkdown';
import { MCPConnectionIndicator } from './MCPConnectionIndicator';
import type {
  CompactTerminalProps,
  LogEntry,
  SignalPatternSummary,
} from './types';
import { buildSkillsPrompt, buildBaseSystemPrompt } from './skills';
import { extractData } from '@/app/utils/api';
import SignalNotificationCard from './SignalNotificationCard';
import { useExecutionStream } from './useExecutionStream';
import { LOG_ICONS, LOG_COLORS } from './logMaps';

// ============ Animation Config ============

const LOG_ANIMATION = {
  /** Standard per-entry slide-in for normal interaction pace */
  normal: {
    initial: { opacity: 0, x: -4 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.15 },
  },
  /** Fast fade-only for burst streaming (>5 entries batched) */
  burst: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.05 },
  },
} as const;

const STREAMING_INDICATOR_ANIMATION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
} as const;

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
  currentExecutionId,
  currentStoredTaskId,
  onExecutionChange,
  onToolUse,
  onPromptSubmit,
  onExecutionComplete,
  pendingPrompt,
  onPendingPromptConsumed,
}: CompactTerminalProps) {
  // ============ Execution Stream Hook ============

  const stream = useExecutionStream({
    instanceId,
    projectPath,
    enabledSkills,
    taskQueue,
    autoStart,
    onTaskStart,
    onTaskComplete,
    onQueueEmpty,
    currentExecutionId,
    currentStoredTaskId,
    onExecutionChange,
    onExecutionComplete,
    trackFileChanges: true,
    buildPrompt: useCallback(
      (prompt: string) => {
        const basePrompt = buildBaseSystemPrompt(projectPath || undefined);
        const contextLines: string[] = [];
        if (actId) contextLines.push(`- Active act ID: \`${actId}\``);
        if (sceneId) contextLines.push(`- Active scene ID: \`${sceneId}\``);
        const contextBlock = contextLines.length
          ? `\n## Current Selection\n${contextLines.join('\n')}\n\nUse these IDs for get_scene, list_beats(actId), etc. When the user says "this scene" or "this act", they mean these.\n\n`
          : '';
        const skillsPrefix =
          enabledSkills.length > 0 ? buildSkillsPrompt(enabledSkills) : '';
        return basePrompt + contextBlock + skillsPrefix + prompt;
      },
      [projectPath, actId, sceneId, enabledSkills],
    ),
    onToolUse: useCallback(
      (event: import('./protocol').ToolUseEvent) => {
        const intercepted = onToolUse?.(event.data.toolName, event.data.toolInput);
        if (intercepted) {
          return {
            id: `ws-${Date.now()}`,
            type: 'system' as const,
            content: `[workspace] ${event.data.toolName}`,
            timestamp: event.timestamp,
            toolName: event.data.toolName,
          };
        }
        return undefined;
      },
      [onToolUse],
    ),
  });

  const {
    logs,
    fileChanges,
    isStreaming,
    sessionId,
    lastResult,
    lastBatchSize,
    addLog,
    executeTask,
    connectToStream,
    abort: handleAbort,
    clear: handleClear,
  } = stream;

  // ============ Local UI State ============

  const [inputValue, setInputValue] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isFixing, setIsFixing] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ============ Pending Prompt Injection ============

  useEffect(() => {
    if (pendingPrompt) {
      setInputValue(pendingPrompt);
      onPendingPromptConsumed?.();
      textareaRef.current?.focus();
    }
  }, [pendingPrompt, onPendingPromptConsumed]);

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

  // ============ Self-Improvement (/fix) ============

  const executeImprovement = useCallback(async () => {
    setIsFixing(true);
    try {
      const res = await fetch('/api/claude-terminal/improve');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = extractData(await res.json());
      if (!data.success || !data.patterns?.length) {
        addLog({
          id: `system-${Date.now()}`,
          type: 'system',
          content: '[signals] No unresolved patterns to fix.',
          timestamp: Date.now(),
        });
        setIsFixing(false);
        return;
      }

      const { buildImprovementPrompt } = await import(
        '@/lib/claude-terminal/signals/improvement-prompt'
      );
      const improvementPrompt = buildImprovementPrompt(data.patterns);

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
        setIsFixing(false);
        return;
      }

      const { streamUrl, executionId } = extractData<{ streamUrl: string; executionId: string }>(await response.json());
      onExecutionChange?.(executionId, null);
      connectToStream(streamUrl);

      fetch('/api/claude-terminal/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patternFingerprints: data.patterns.map(
            (p: { fingerprint: string }) => p.fingerprint,
          ),
        }),
      }).catch(() => {});
    } catch {
      // Non-critical
    } finally {
      setIsFixing(false);
    }
  }, [projectPath, sessionId, addLog, connectToStream, onExecutionChange]);

  // ============ Signal Detection (after result) ============

  useEffect(() => {
    if (!lastResult || lastResult.isError) return;
    // Check for detected patterns after execution completes
    fetch('/api/claude-terminal/improve')
      .then((r) => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((raw) => extractData<any>(raw))
      .then((data) => {
        if (data.success && data.patterns?.length > 0) {
          const signalPatterns: SignalPatternSummary[] = data.patterns.map(
            (p: SignalPatternSummary) => ({
              fingerprint: p.fingerprint,
              type: p.type,
              severity: p.severity,
              count: p.count,
              toolName: p.toolName,
              suggestedFix: p.suggestedFix,
            }),
          );
          addLog({
            id: `signal-${Date.now()}`,
            type: 'system',
            content: `[signals] ${signalPatterns.length} issue(s) detected`,
            timestamp: Date.now(),
            signalPatterns,
          });
        }
      })
      .catch(() => {});
  }, [lastResult, addLog]);

  // ============ Manual Input ============

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim() || isStreaming) return;

    const prompt = inputValue.trim();
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

    if (prompt === '/fix') {
      executeImprovement();
    } else {
      executeTask(prompt);
    }
  }, [inputValue, isStreaming, executeTask, executeImprovement, addLog, onPromptSubmit]);

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
        'flex flex-col border rounded-lg overflow-hidden',
        'bg-[var(--ms-bg-base)] border-[var(--ms-border-subtle)]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--ms-bg-surface)]/80 border-b border-[var(--ms-border-subtle)] text-xs">
        <Terminal className="w-3.5 h-3.5 text-[var(--ms-text-muted)]" />
        <span className="text-[var(--ms-text-muted)] font-medium">
          {title || 'CLI Terminal'}
        </span>

        <MCPConnectionIndicator />

        {sessionId && (
          <span className="text-[var(--ms-info)]/70 font-mono text-xs">
            {sessionId.slice(0, 6)}
          </span>
        )}

        {fileChangeStats.edits > 0 && (
          <span className="text-[var(--ms-warning)]/70 font-mono text-xs">
            {fileChangeStats.edits}E
          </span>
        )}
        {fileChangeStats.writes > 0 && (
          <span className="text-[var(--ms-success)]/70 font-mono text-xs">
            {fileChangeStats.writes}W
          </span>
        )}

        <div className="flex-1" />

        {tokenDisplay && (
          <span className="text-[var(--ms-text-muted)] font-mono text-xs">
            {tokenDisplay}
          </span>
        )}

        {isStreaming && (
          <Loader2 className="w-3 h-3 ms-log-user animate-spin" />
        )}

        {!isStreaming && logs.some((l) => l.type === 'assistant') && (
          <button
            onClick={handleCopyOutput}
            className={cn(
              'transition-colors',
              copied ? 'ms-log-result' : 'text-[var(--ms-text-muted)] hover:text-[var(--ms-text-secondary)]',
            )}
            title={copied ? 'Copied!' : 'Copy output'}
            aria-label={copied ? 'Copied!' : 'Copy output'}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        )}

        <button
          onClick={handleClear}
          className="text-[var(--ms-text-muted)] hover:text-[var(--ms-text-secondary)] transition-colors"
          title="Clear logs"
          aria-label="Clear logs"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Log Area */}
      <div
        ref={logsContainerRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        aria-label="Terminal output"
        className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 min-h-[100px] max-h-[400px] font-mono text-xs"
      >
        {logs.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-4">
            <Terminal className="w-8 h-8 text-slate-700" />
            <p className="text-sm text-slate-500">
              Ready. Type a prompt or queue a skill.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'Describe this scene in detail',
                'List all characters',
                'Summarize the story so far',
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setInputValue(prompt);
                    textareaRef.current?.focus();
                  }}
                  className="rounded-full bg-slate-800/50 px-3 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-600 space-x-3">
              <span><kbd className="text-slate-500">Enter</kbd> send</span>
              <span><kbd className="text-slate-500">Shift+Enter</kbd> newline</span>
              <span><kbd className="text-slate-500">/fix</kbd> resolve signals</span>
            </p>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {logs.map((log) => {
            if (log.signalPatterns && log.signalPatterns.length > 0) {
              return (
                <SignalNotificationCard
                  key={log.id}
                  patterns={log.signalPatterns}
                  onFix={executeImprovement}
                  isFixing={isFixing}
                />
              );
            }

            const Icon = LOG_ICONS[log.type];
            const color = LOG_COLORS[log.type];
            const anim = lastBatchSize > 5 ? LOG_ANIMATION.burst : LOG_ANIMATION.normal;
            return (
              <motion.div
                key={log.id}
                initial={anim.initial}
                animate={anim.animate}
                transition={anim.transition}
                className="flex items-start gap-1.5 leading-relaxed"
              >
                <Icon className={cn('w-3 h-3 mt-0.5 shrink-0', color)} />
                <span className={cn('break-words whitespace-pre-wrap', color)}>
                  {log.toolName && (
                    <span className="text-[var(--ms-warning)] mr-1">{log.toolName}</span>
                  )}
                  {log.type === 'assistant'
                    ? <CLIMarkdown content={log.content} />
                    : log.type === 'user'
                      ? log.content
                      : log.content.slice(0, 500)}
                  {log.type !== 'user' && log.type !== 'assistant' && log.content.length > 500 && (
                    <span className="text-[var(--ms-text-muted)]">...</span>
                  )}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <AnimatePresence>
          {isStreaming && (
            <motion.div
              key="streaming-indicator"
              initial={STREAMING_INDICATOR_ANIMATION.initial}
              animate={STREAMING_INDICATOR_ANIMATION.animate}
              exit={STREAMING_INDICATOR_ANIMATION.exit}
              transition={STREAMING_INDICATOR_ANIMATION.transition}
              className="flex items-center gap-1.5 ms-log-user opacity-60"
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Working...</span>
            </motion.div>
          )}
        </AnimatePresence>

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
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Input */}
      <div className="flex items-end gap-2 px-3 py-1.5 border-t border-[var(--ms-border-subtle)] bg-[var(--ms-bg-surface)]/50">
        <span className="text-[var(--ms-success)] text-xs font-bold select-none pb-0.5">
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
          aria-label="Terminal prompt input"
          className={cn(
            'flex-1 bg-transparent text-[var(--ms-text-primary)] text-xs outline-none',
            'placeholder-slate-600 disabled:opacity-50',
            'resize-none overflow-y-auto leading-relaxed'
          )}
        />

        {isStreaming ? (
          <button
            onClick={handleAbort}
            className="ms-log-error hover:opacity-80 transition-colors pb-0.5"
            title="Stop"
            aria-label="Stop execution"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim()}
            className="text-[var(--ms-text-muted)] hover:text-[var(--ms-text-secondary)] transition-colors disabled:opacity-30 pb-0.5"
            title="Send"
            aria-label="Send prompt"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
