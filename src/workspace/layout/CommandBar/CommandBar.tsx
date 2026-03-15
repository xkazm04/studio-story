'use client';

import React, { useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ChevronUp, ChevronDown, X } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useCommandBarStore } from '../../store/commandBarStore';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useWorkflowHintStore } from '../../store/workflowHintStore';
import { useAgentStore } from '@/agents/store/agentStore';
import { useWorkspaceComposition } from '../../hooks/useWorkspaceComposition';
import { extractBaseName, useCLIDataSync } from '../../hooks/useCLIDataSync';
import { TOOL_PANEL_HINTS } from '../../config/workflowHints';
import CompactTerminal from '@/cli/CompactTerminal';

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
  const showPanels = useWorkspaceStore((s) => s.showPanels);
  const getPanelByType = useWorkspaceStore((s) => s.getPanelByType);
  const recordTool = useWorkflowHintStore((s) => s.recordTool);
  const recordToolEvent = useAgentStore((s) => s.recordToolEvent);
  const { handleToolUse: handleWorkspaceToolUse } = useWorkspaceComposition();
  const { trackToolUse, flush } = useCLIDataSync();

  const projectPath = selectedProject?.id || '';
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-expand when terminal gets focus
  const handleInputFocus = useCallback(() => {
    if (!isExpanded) expand();
  }, [isExpanded, expand]);

  // Click outside to collapse (only when expanded)
  useEffect(() => {
    if (!isExpanded) return;
    const handler = (e: MouseEvent) => {
      if (terminalRef.current && !terminalRef.current.contains(e.target as Node)) {
        collapse();
      }
    };
    // Delay to prevent immediate collapse from the click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [isExpanded, collapse]);

  // Handle tool use from CLI — trigger panel hints + advisor
  const handleToolUse = useCallback(
    (toolName: string, toolInput: Record<string, unknown>) => {
      trackToolUse(toolName);

      const baseName = extractBaseName(toolName);
      recordTool(baseName);
      recordToolEvent(baseName, toolInput);

      const hintedPanels = TOOL_PANEL_HINTS[baseName];
      if (hintedPanels?.length) {
        const missingPanels = hintedPanels.filter(
          (directive) => !getPanelByType(directive.type)
        );
        if (missingPanels.length > 0) {
          showPanels(missingPanels);
        }
      }

      return handleWorkspaceToolUse(toolName, toolInput);
    },
    [trackToolUse, recordTool, recordToolEvent, getPanelByType, showPanels, handleWorkspaceToolUse]
  );

  // Flush query invalidations when CLI completes
  const handleExecutionComplete = useCallback(
    (success: boolean) => {
      if (success) flush();
    },
    [flush]
  );

  return (
    <div
      ref={terminalRef}
      data-command-bar
      className={cn(
        'relative flex flex-col border-t border-slate-800/60 bg-slate-950/95',
        isExpanded ? 'h-[40vh] min-h-[200px] max-h-[60vh]' : 'h-9 shrink-0',
        'transition-[height] duration-300 ease-[cubic-bezier(0.19,1,0.22,1)]'
      )}
    >
      {/* Collapsed bar — always visible */}
      <div
        className={cn(
          'flex h-9 shrink-0 items-center gap-2 px-3',
          'border-b border-slate-800/40',
          isExpanded ? 'bg-slate-900/60' : 'bg-slate-950/95 cursor-pointer hover:bg-slate-900/40'
        )}
        onClick={!isExpanded ? expand : undefined}
      >
        <Terminal className="w-3.5 h-3.5 text-slate-500" />

        {!isExpanded && (
          <span
            data-command-bar-input
            tabIndex={0}
            role="button"
            onFocus={handleInputFocus}
            className="flex-1 text-sm text-slate-500 truncate select-none"
          >
            Ask or command...
          </span>
        )}

        {isExpanded && (
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Terminal
          </span>
        )}

        <div className="flex-1" />

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggle(); }}
          className="flex items-center justify-center w-6 h-6 rounded text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 transition-colors"
          title={isExpanded ? 'Collapse' : 'Expand terminal'}
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Expanded terminal content */}
      {isExpanded && (
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
          />
        </div>
      )}
    </div>
  );
}
