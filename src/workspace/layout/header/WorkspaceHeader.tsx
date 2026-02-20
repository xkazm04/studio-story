'use client';

import React from 'react';
import { Terminal, Loader2 } from 'lucide-react';
import { useCLISessionStore } from '@/cli/store/cliSessionStore';
import ProjectSelector from './ProjectSelector';
import ActSelector from './ActSelector';
import SceneSelector from './SceneSelector';

const WorkspaceHeader: React.FC = () => {
  const activeCount = useCLISessionStore((s) => {
    let count = 0;
    for (const session of Object.values(s.sessions)) {
      if (session.isRunning || session.queue.some((t) => t.status === 'running')) count++;
    }
    return count;
  });
  const isAnyRunning = useCLISessionStore((s) =>
    Object.values(s.sessions).some((session) => session.isRunning)
  );

  return (
    <div className="flex items-center justify-between px-3 py-1 bg-slate-950/95 border-b border-slate-800/60 backdrop-blur-sm shrink-0">
      {/* Left side — Project / Act / Scene selectors */}
      <div className="flex items-center gap-1.5">
        <ProjectSelector />

        <div className="h-3 w-px bg-slate-800/60" />
        <ActSelector />

        <SceneSelector />
      </div>

      {/* Right side — CLI indicator */}
      <div className="flex items-center gap-2">
        {activeCount > 0 && (
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900/60 border border-slate-800/50"
            title={`${activeCount} CLI session(s) active`}
          >
            {isAnyRunning ? (
              <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
            ) : (
              <Terminal className="w-3 h-3 text-slate-500" />
            )}
            <span className="text-[10px] font-mono text-slate-400">
              {activeCount}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceHeader;
