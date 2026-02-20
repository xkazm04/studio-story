'use client';

import React, { useCallback } from 'react';
import { useTerminalDockStore } from '../../store/terminalDockStore';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { useWorkspaceComposition } from '../../hooks/useWorkspaceComposition';
import { useCLIDataSync } from '../../hooks/useCLIDataSync';
import { cn } from '@/app/lib/utils';
import CompactTerminal from '@/cli/CompactTerminal';
import TerminalTabBar from './TerminalTabBar';
import TerminalDockEmpty from './TerminalDockEmpty';

/**
 * TerminalDock — Simplified for studio-story.
 *
 * Uses useWorkspaceComposition (LLM-driven) instead of useIntentDetection (regex).
 * The LLM reads panel manifests and calls compose_workspace directly.
 */
export default function TerminalDock() {
  const tabs = useTerminalDockStore((s) => s.tabs);
  const activeTabId = useTerminalDockStore((s) => s.activeTabId);
  const isCollapsed = useTerminalDockStore((s) => s.isCollapsed);
  const { selectedProject, selectedAct, selectedSceneId } = useProjectStore();
  const { handleToolUse: handleWorkspaceToolUse } = useWorkspaceComposition();
  const { trackToolUse, flush } = useCLIDataSync();

  const projectPath = selectedProject?.id || '';

  // Extend workspace tool handler to also track MCP tool calls for data sync
  const handleToolUse = useCallback(
    (toolName: string, toolInput: Record<string, unknown>) => {
      trackToolUse(toolName);
      return handleWorkspaceToolUse(toolName, toolInput);
    },
    [trackToolUse, handleWorkspaceToolUse]
  );

  // Flush accumulated query invalidations when CLI execution completes
  const handleExecutionComplete = useCallback(
    (success: boolean) => {
      if (success) flush();
    },
    [flush]
  );

  return (
    <div className="flex h-full min-h-0 flex-col border-t border-slate-800/60 bg-slate-950/95">
      {/* Horizontally centered dock */}
      <div className="mx-auto flex h-full min-h-0 w-full max-w-350 flex-col px-2 md:px-3">
        {/* Tab bar — always visible */}
        <TerminalTabBar />

        {/* Terminal content — hidden when collapsed */}
        {!isCollapsed && (
          <div className="flex-1 min-h-0 overflow-hidden">
            {tabs.length > 0 ? (
              tabs.map((tab) => (
                <div
                  key={tab.sessionId}
                  className={cn(
                    'h-full',
                    tab.id === activeTabId ? 'block' : 'hidden'
                  )}
                >
                  <CompactTerminal
                    instanceId={tab.sessionId}
                    projectPath={projectPath}
                    actId={selectedAct?.id}
                    sceneId={selectedSceneId || undefined}
                    title={tab.label}
                    className="h-full border-0 rounded-none"
                    onToolUse={handleToolUse}
                    onExecutionComplete={handleExecutionComplete}
                  />
                </div>
              ))
            ) : (
              <TerminalDockEmpty />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
