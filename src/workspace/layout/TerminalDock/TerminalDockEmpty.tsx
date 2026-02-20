'use client';

import React from 'react';
import { Terminal, Plus } from 'lucide-react';
import { useTerminalDockStore } from '../../store/terminalDockStore';

export default function TerminalDockEmpty() {
  const createTab = useTerminalDockStore((s) => s.createTab);

  return (
    <div className="flex-1 flex items-center justify-center">
      <button
        onClick={() => createTab()}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/60 border border-slate-800/50 text-slate-400 hover:text-slate-200 hover:border-slate-700/60 transition-colors"
      >
        <Terminal className="w-4 h-4" />
        <span className="text-xs font-medium">Open Terminal</span>
        <Plus className="w-3 h-3 text-slate-500" />
      </button>
    </div>
  );
}
