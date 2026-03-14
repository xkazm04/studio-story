'use client';

import React from 'react';
import V2Provider from '../V2Provider';
import WorkspaceHeader from './header/WorkspaceHeader';
import WorkspaceArea from './WorkspaceArea';
import CommandBar from './CommandBar/CommandBar';
import { ConversationShell } from '../chat/ConversationShell';

/**
 * V2Layout — Main container for the dynamic workspace.
 *
 * Simple flex column: header (shrink) + workspace (grow) + command bar (shrink).
 * Command bar is 36px collapsed, expands to ~40vh on demand.
 * Panels get ~93% of viewport height when command bar is collapsed.
 */
export default function V2Layout() {
  return (
    <V2Provider>
      <div className="flex h-full min-h-0 flex-col bg-slate-950">
        <WorkspaceHeader />
        <div className="flex-1 min-h-0">
          <WorkspaceArea />
        </div>
        <CommandBar />
        <ConversationShell />
      </div>
    </V2Provider>
  );
}
