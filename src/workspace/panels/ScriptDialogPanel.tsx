'use client';

import React from 'react';
import PanelFrame from './PanelFrame';
import { BookOpen } from 'lucide-react';

export default function ScriptDialogPanel(props: Record<string, unknown>) {
  return (
    <PanelFrame title="Script & Dialog" icon={BookOpen} onClose={props.onClose as (() => void) | undefined} headerAccent="rose">
      <div className="p-4 text-slate-500 text-xs">
        <p>Script & Dialog panel — coming soon</p>
      </div>
    </PanelFrame>
  );
}
