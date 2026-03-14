'use client';

import React, { useMemo } from 'react';
import { Terminal, Loader2, ChevronRight } from 'lucide-react';
import { useCLISessionStore } from '@/cli/store/cliSessionStore';
import { useTerminalDockStore } from '@/workspace/store/terminalDockStore';
import { Tooltip } from '@/app/components/UI/Tooltip';
import ProjectSelector from './ProjectSelector';
import ActSelector from './ActSelector';
import SceneSelector from './SceneSelector';
import LayoutPicker from './LayoutPicker';
import type { LLMTransportStatus } from '@dzin/core';
import AdvisorOverlay from '@/agents/AdvisorOverlay';
import LLMStatusDot from './LLMStatusDot';

export interface WorkspaceHeaderProps {
  llmStatus?: LLMTransportStatus;
}

const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({ llmStatus = 'disconnected' }) => {
  const sessions = useCLISessionStore((s) => s.sessions);
  const expandAndFocus = useTerminalDockStore((s) => s.expandAndFocus);

  const activeSessions = useMemo(() => {
    return Object.values(sessions).filter(
      (session) => session.isRunning || session.queue.some((t) => t.status === 'running')
    );
  }, [sessions]);

  const activeCount = activeSessions.length;
  const isAnyRunning = activeSessions.some((s) => s.isRunning);

  const tooltipContent = useMemo(() => {
    if (activeSessions.length === 0) return '';
    return activeSessions.map((s) => s.id).join(', ');
  }, [activeSessions]);

  return (
    <div className="flex items-center justify-between px-3 py-1 bg-slate-950/95 border-b border-slate-800/60 backdrop-blur-sm shrink-0">
      {/* Left side — Project / Act / Scene selectors */}
      <div className="flex items-center gap-1.5">
        <ProjectSelector />

        <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
        <ActSelector />

        <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
        <SceneSelector />

        <div className="mx-1 h-4 w-px bg-slate-700/40" />
        <LayoutPicker />
      </div>

      {/* Center — Advisor */}
      <div className="flex items-center">
        <AdvisorOverlay />
      </div>

      {/* Right side — LLM status + CLI indicator */}
      <div className="flex items-center gap-2">
        <LLMStatusDot status={llmStatus} />
        {activeCount > 0 && (
          <Tooltip content={tooltipContent} position="bottom">
            <button
              onClick={expandAndFocus}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900/60 border border-slate-800/50 hover:bg-slate-800/60 hover:border-slate-700/60 transition-colors cursor-pointer"
            >
              {isAnyRunning ? (
                <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              ) : (
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="text-sm font-mono text-slate-400">
                {activeCount}
              </span>
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default WorkspaceHeader;
