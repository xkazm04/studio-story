'use client';

import React from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/app/components/UI/resizable';
import { useTerminalDockStore } from '../store/terminalDockStore';
import V2Provider from '../V2Provider';
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
      <ResizablePanelGroup
        direction="vertical"
        className="flex-1"
        autoSaveId="v2-layout-panels"
      >
        {/* Workspace area — panels appear here */}
        <ResizablePanel
          defaultSize={70}
          minSize={40}
          className="bg-slate-950/50"
        >
          <WorkspaceArea />
        </ResizablePanel>

        {/* Resize handle */}
        <ResizableHandle withHandle className="ms-transition" />

        {/* Terminal dock */}
        <ResizablePanel
          defaultSize={30}
          minSize={isCollapsed ? 3 : 10}
          maxSize={60}
          collapsible={true}
          collapsedSize={3}
        >
          <TerminalDock />
        </ResizablePanel>
      </ResizablePanelGroup>
    </V2Provider>
  );
}
