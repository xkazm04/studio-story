'use client';

/**
 * InlineTerminal — Lightweight embedded CLI terminal
 *
 * Simplified CompactTerminal for inline embedding in feature panels.
 * Uses useExecutionStream for SSE connection, protocol parsing, and log state.
 *
 * - Shows streaming log output + status indicator
 * - No manual input field (programmatic execution only via useCLIFeature)
 * - Collapsible with Framer Motion animations
 * - Skill name badge in header
 * - Result action bar (Copy/Insert) on completion
 * - Calls onResult with parsed data when execution completes
 */

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import {
  Terminal,
  CheckCircle,
  AlertCircle,
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
import type { InlineTerminalProps } from './types';
import type { SkillId } from './skills';
import { MCPConnectionIndicator } from './MCPConnectionIndicator';
import { useExecutionStream } from './useExecutionStream';
import { LOG_ICONS, LOG_COLORS } from './logMaps';

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
  onTaskComplete: onTaskCompleteProp,
  onQueueEmpty,
  currentExecutionId,
  currentStoredTaskId,
  onExecutionChange,
  activeSkillId,
  onInsert,
}: InlineTerminalFullProps) {
  // ============ Result Parsing (wraps onTaskComplete) ============

  const lastAssistantTextRef = useRef('');
  const [collapsed, setCollapsed] = useState(false);

  const parseAndEmitResult = useCallback(
    (success: boolean) => {
      if (!onResult || !success) return;
      const text = lastAssistantTextRef.current.trim();
      if (!text) return;

      if (outputFormat === 'json') {
        const jsonMatch =
          text.match(/```json\s*([\s\S]*?)\s*```/) ||
          text.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            onResult(parsed);
          } catch {
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

  const handleTaskComplete = useCallback(
    (taskId: string, success: boolean) => {
      onTaskCompleteProp?.(taskId, success);
      parseAndEmitResult(success);
      lastAssistantTextRef.current = '';
    },
    [onTaskCompleteProp, parseAndEmitResult],
  );

  // ============ Execution Stream Hook ============

  const stream = useExecutionStream({
    instanceId,
    projectPath,
    enabledSkills,
    taskQueue,
    autoStart,
    onTaskStart,
    onTaskComplete: handleTaskComplete,
    onQueueEmpty,
    currentExecutionId,
    currentStoredTaskId,
    onExecutionChange,
    trackAssistantText: true,
  });

  const {
    logs,
    isStreaming,
    lastResult,
    lastAssistantText,
    abort: handleAbort,
  } = stream;

  // Sync assistant text to our ref for result parsing
  useEffect(() => {
    lastAssistantTextRef.current = lastAssistantText;
  }, [lastAssistantText]);

  // Auto-expand on new execution
  useEffect(() => {
    if (isStreaming && collapsed) {
      setCollapsed(false);
    }
  }, [isStreaming, collapsed]);

  // ============ Local UI State ============

  const [showDetails, setShowDetails] = useState(true);
  const [copied, setCopied] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // ============ Auto-scroll ============

  useEffect(() => {
    if (logsEndRef.current && !collapsed) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, collapsed]);

  // ============ Copy / Insert ============

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
        'flex flex-col border rounded-lg overflow-hidden',
        'bg-[var(--ms-bg-base)] border-[var(--ms-border-subtle)]',
        className,
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 bg-[var(--ms-bg-surface)]/80 border-b border-[var(--ms-border-subtle)] text-xs',
          collapsible && 'cursor-pointer select-none',
        )}
        onClick={collapsible ? () => setCollapsed(!collapsed) : undefined}
      >
        {collapsible && (
          <motion.div
            animate={{ rotate: collapsed ? 0 : 90 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronRight className="w-3 h-3 text-[var(--ms-text-muted)]" />
          </motion.div>
        )}

        <Terminal className="w-3 h-3 text-[var(--ms-text-muted)]" />
        <span className="text-[var(--ms-text-muted)] font-medium text-xs">CLI</span>

        <MCPConnectionIndicator />

        {/* Skill Badge */}
        {skillLabel && isStreaming && (
          <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {skillLabel}
          </span>
        )}

        <div className="flex-1" />

        {/* Details Toggle */}
        {hasContent && !collapsed && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); }}
            className="text-[var(--ms-text-muted)] hover:text-[var(--ms-text-secondary)] transition-colors"
            title={showDetails ? 'Hide details' : 'Show details'}
            aria-label={showDetails ? 'Hide details' : 'Show details'}
          >
            {showDetails ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>
        )}

        {isStreaming && (
          <>
            <Loader2 className="w-3 h-3 ms-log-user animate-spin" />
            <button
              onClick={(e) => { e.stopPropagation(); handleAbort(); }}
              className="ms-log-error opacity-70 hover:opacity-100 transition-colors"
              title="Stop generation"
              aria-label="Stop generation"
            >
              <Square className="w-3 h-3" />
            </button>
          </>
        )}

        {isComplete && (
          <CheckCircle className="w-3 h-3 ms-log-result opacity-70" />
        )}

        {!isStreaming && lastResult?.isError && (
          <AlertCircle className="w-3 h-3 ms-log-error opacity-70" />
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
                role="log"
                aria-live="polite"
                aria-label="Terminal output"
                className="overflow-y-auto px-3 py-1.5 space-y-0.5 font-mono text-xs"
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
                          <span className="text-[var(--ms-warning)] mr-1">{log.toolName}</span>
                        )}
                        {log.content.slice(0, 300)}
                        {log.content.length > 300 && (
                          <span className="text-[var(--ms-text-muted)]">...</span>
                        )}
                      </span>
                    </div>
                  );
                })}

                {isStreaming && (
                  <div className="flex items-center gap-1.5 ms-log-user opacity-60">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Working...</span>
                  </div>
                )}

                <div ref={logsEndRef} />
              </div>
            )}

            {/* Result Action Bar */}
            {isComplete && hasResultText && (
              <div className="flex items-center gap-2 px-3 py-1.5 border-t border-[var(--ms-border-subtle)]/60 bg-[var(--ms-bg-surface)]/40">
                <span className="text-xs ms-log-result opacity-80 font-medium">Done</span>

                {lastResult?.usage && (
                  <span className="text-xs text-[var(--ms-text-muted)] font-mono">
                    {lastResult.usage.inputTokens + lastResult.usage.outputTokens} tokens
                  </span>
                )}

                <div className="flex-1" />

                <button
                  onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                  className={cn(
                    'flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors',
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
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors"
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
