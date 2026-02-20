'use client';

import React from 'react';
import PanelFrame from './PanelFrame';
import { FileText } from 'lucide-react';

export default function ScriptEditorPanel(props: Record<string, unknown>) {
  return (
    <PanelFrame title="Script" icon={FileText} onClose={props.onClose as (() => void) | undefined} headerAccent="cyan">
      <div className="p-4 text-slate-500 text-xs">
        <p>Script panel — coming soon</p>
      </div>
    </PanelFrame>
  );
}
