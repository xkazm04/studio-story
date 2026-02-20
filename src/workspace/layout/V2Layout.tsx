'use client';

import React from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/app/components/UI/resizable';
import { useTerminalDockStore } from '../store/terminalDockStore';
import V2Provider from '../V2Provider';
import WorkspaceHeader from './header/WorkspaceHeader';
import WorkspaceArea from './WorkspaceArea';
import TerminalDock from './TerminalDock/TerminalDock';

/**
 * V2Layout — Main container for the dynamic workspace.
 *
 * Vertical split: workspace area (top) + terminal dock (bottom).
 * Terminal dock is resizable and collapsible.
 * V2Provider handles initialization and keyboard shortcuts.
 */
export default function V2Layout() {
  const isCollapsed = useTerminalDockStore((s) => s.isCollapsed);

  return (
    <V2Provider>
      <div className="flex h-full min-h-0 flex-col bg-slate-950">
        <WorkspaceHeader />
        <ResizablePanelGroup
          direction="vertical"
          className="flex-1 min-h-0"
          autoSaveId="v2-layout-panels"
        >
          {/* Workspace area — panels appear here */}
          <ResizablePanel
            defaultSize={72}
            minSize={25}
            className="min-h-0 bg-slate-950/40"
          >
            <WorkspaceArea />
          </ResizablePanel>

          {/* Resize handle */}
          <ResizableHandle withHandle className="ms-transition bg-slate-900/40" />

          {/* Terminal dock */}
          <ResizablePanel
            defaultSize={28}
            minSize={isCollapsed ? 4 : 14}
            maxSize={62}
            collapsible={true}
            collapsedSize={4}
            className="min-h-0"
          >
            <TerminalDock />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </V2Provider>
  );
}
