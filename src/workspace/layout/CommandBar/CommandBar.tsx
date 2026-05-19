'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { extractData } from '@/app/utils/api';
import { useCommandBarStore } from '../../store/commandBarStore';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { extractBaseName, useCLIDataSync } from '../../hooks/useCLIDataSync';
import { operationBus } from '../../operationBus';
import { useDropdown } from '../../hooks/useDropdown';
import CompactTerminal from '@/cli/CompactTerminal';
import TemplateSuggestions from './TemplateSuggestions';

/**
 * CommandBar — Minimized CLI bar that expands on demand.
 *
 * Collapsed: 36px input bar at the bottom of the workspace.
 * Expanded: Slides up to show streaming terminal output (~40% height).
 * Single session — no tabs, no tab management.
 */
export default function CommandBar() {
  const sessionId = useCommandBarStore((s) => s.sessionId);
  const isExpanded = useCommandBarStore((s) => s.isExpanded);
  const expand = useCommandBarStore((s) => s.expand);
  const collapse = useCommandBarStore((s) => s.collapse);
  const toggle = useCommandBarStore((s) => s.toggle);

  const { selectedProject, selectedAct, selectedSceneId } = useProjectStore();
  const { flush } = useCLIDataSync();

  const projectPath = selectedProject?.id || '';
  const terminalRef = useRef<HTMLDivElement>(null);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [unresolvedHasHigh, setUnresolvedHasHigh] = useState(false);

  // Fetch unresolved pattern count for collapsed badge
  const fetchPatternCount = useCallback(async () => {
    try {
      const res = await fetch('/api/claude-terminal/improve');
      if (!res.ok) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = extractData(await res.json());
      if (data.success && Array.isArray(data.patterns)) {
        setUnresolvedCount(data.patterns.length);
        setUnresolvedHasHigh(
          data.patterns.some((p: { severity: string }) => p.severity === 'high')
        );
      } else {
        setUnresolvedCount(0);
        setUnresolvedHasHigh(false);
      }
    } catch {
      // Non-critical
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchPatternCount();
  }, [fetchPatternCount]);

  // Outside-click and Escape to collapse (with 100ms delay to avoid click-that-opened)
  useDropdown({
    contentRef: terminalRef,
    isOpen: isExpanded,
    onClose: collapse,
    closeDelay: 100,
  });

  // Auto-expand when terminal gets focus
  const handleInputFocus = useCallback(() => {
    if (!isExpanded) expand();
  }, [isExpanded, expand]);

  // Handle tool use from CLI — emit to OperationBus for decoupled fan-out
  const handleToolUse = useCallback(
    (toolName: string, toolInput: Record<string, unknown>) => {
      const baseName = extractBaseName(toolName);
      return operationBus.emit({ toolName, baseName, toolInput });
    },
    []
  );

  // Template selection — inject filled prompt into terminal input
  const handleTemplateSelect = useCallback(
    (filledContent: string, _templateName: string) => {
      setPendingPrompt(filledContent);
      if (!isExpanded) expand();
    },
    [isExpanded, expand]
  );

  const handlePendingPromptConsumed = useCallback(() => {
    setPendingPrompt(null);
  }, []);

  // Flush query invalidations when CLI completes + refresh signal count
  const handleExecutionComplete = useCallback(
    (success: boolean) => {
      if (success) flush();
      // Refresh pattern count after a short delay (signals flush is async)
      setTimeout(fetchPatternCount, 1500);
    },
    [flush, fetchPatternCount]
  );

  const springTransition = { type: 'spring' as const, stiffness: 300, damping: 30 };

  return (
    <motion.div
      ref={terminalRef}
      data-command-bar
      animate={{ height: isExpanded ? '40vh' : 36 }}
      transition={springTransition}
      className={cn(
        'relative flex flex-col border-t border-[var(--ms-border-subtle)]/60 bg-[var(--ms-bg-base)]/95',
        isExpanded && 'min-h-[200px] max-h-[60vh]',
        !isExpanded && 'shrink-0'
      )}
      style={{ overflow: 'hidden' }}
    >
      {/* Highlight line at the top of expanded bar */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="highlight-line"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            transition={springTransition}
            className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--ms-accent)]/60 origin-left z-10"
          />
        )}
      </AnimatePresence>

      {/* Collapsed bar — always visible */}
      <div
        className={cn(
          'flex h-9 shrink-0 items-center gap-2 px-3',
          'border-b border-[var(--ms-border-subtle)]/40',
          isExpanded ? 'bg-[var(--ms-bg-surface)]/60' : 'bg-[var(--ms-bg-base)]/95 cursor-pointer hover:bg-[var(--ms-bg-surface)]/40'
        )}
        onClick={!isExpanded ? expand : undefined}
      >
        <Terminal className="w-3.5 h-3.5 text-[var(--ms-text-dim)]" />

        {/* Unresolved patterns badge (visible when collapsed) */}
        {!isExpanded && unresolvedCount > 0 && (
          <span
            className={cn(
              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
              unresolvedHasHigh
                ? 'bg-red-500/15 text-red-400'
                : 'bg-amber-500/15 text-amber-400'
            )}
            title={`${unresolvedCount} unresolved signal${unresolvedCount !== 1 ? 's' : ''}`}
          >
            <AlertCircle className="w-2.5 h-2.5" />
            {unresolvedCount}
          </span>
        )}

        {!isExpanded && (
          <span
            data-command-bar-input
            tabIndex={0}
            role="button"
            aria-label="Open terminal"
            onFocus={handleInputFocus}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                expand();
              }
            }}
            className="flex-1 text-sm text-[var(--ms-text-dim)] truncate select-none"
          >
            Ask or command...
          </span>
        )}

        {isExpanded && (
          <span className="text-xs font-medium text-[var(--ms-text-muted)] uppercase tracking-wider">
            Terminal
          </span>
        )}

        <div className="flex-1" />

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggle(); }}
          className="flex items-center justify-center w-6 h-6 rounded text-[var(--ms-text-muted)] hover:text-[var(--ms-text-secondary)] hover:bg-[var(--ms-bg-elevated)]/50 transition-colors"
          title={isExpanded ? 'Collapse' : 'Expand terminal'}
          aria-label={isExpanded ? 'Collapse terminal' : 'Expand terminal'}
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Expanded content — fades in with opacity 0.6→1 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="expanded-content"
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.6 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col flex-1 min-h-0"
          >
            {/* Template suggestions */}
            <TemplateSuggestions
              context={{
                projectId: selectedProject?.id,
                projectName: selectedProject?.name,
                sceneId: selectedSceneId || undefined,
                actId: selectedAct?.id,
              }}
              onSelect={handleTemplateSelect}
            />

            {/* Terminal content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <CompactTerminal
                instanceId={sessionId}
                projectPath={projectPath}
                actId={selectedAct?.id}
                sceneId={selectedSceneId || undefined}
                title="Terminal"
                className="h-full border-0 rounded-none"
                currentExecutionId={null}
                currentStoredTaskId={null}
                onToolUse={handleToolUse}
                onExecutionComplete={handleExecutionComplete}
                pendingPrompt={pendingPrompt}
                onPendingPromptConsumed={handlePendingPromptConsumed}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
