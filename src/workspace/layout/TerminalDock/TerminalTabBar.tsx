'use client';

import React from 'react';
import { Plus, ChevronsDown, ChevronsUp } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useTerminalDockStore } from '../../store/terminalDockStore';
import TerminalTabItem from './TerminalTabItem';

export default function TerminalTabBar() {
  const tabs = useTerminalDockStore((s) => s.tabs);
  const activeTabId = useTerminalDockStore((s) => s.activeTabId);
  const isCollapsed = useTerminalDockStore((s) => s.isCollapsed);
  const createTab = useTerminalDockStore((s) => s.createTab);
  const closeTab = useTerminalDockStore((s) => s.closeTab);
  const setActiveTab = useTerminalDockStore((s) => s.setActiveTab);
  const toggleCollapsed = useTerminalDockStore((s) => s.toggleCollapsed);

  return (
    <div className="flex items-end gap-0.5 px-2 pt-1.5 bg-slate-900/50 border-b border-slate-800/60 overflow-x-auto scrollbar-none">
      {/* Tabs */}
      {tabs.map((tab) => (
        <TerminalTabItem
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTabId}
          onSelect={() => setActiveTab(tab.id)}
          onClose={() => closeTab(tab.id)}
        />
      ))}

      {/* New tab button */}
      <button
        onClick={() => createTab()}
        className={cn(
          'flex items-center justify-center w-7 h-7 rounded-t-md',
          'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-colors'
        )}
        title="New terminal tab"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Collapse/expand button */}
      <button
        onClick={toggleCollapsed}
        className={cn(
          'flex items-center justify-center w-7 h-7 rounded-md mb-0.5',
          'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-colors'
        )}
        title={isCollapsed ? 'Expand terminal' : 'Collapse terminal'}
      >
        {isCollapsed ? (
          <ChevronsUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronsDown className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}
