'use client';

import React from 'react';
import PanelFrame from './PanelFrame';
import { FileText } from 'lucide-react';

export default function WritingDeskPanel(props: Record<string, unknown>) {
  return (
    <PanelFrame title="Writing Desk" icon={FileText} onClose={props.onClose as (() => void) | undefined} headerAccent="amber">
      <div className="p-4 text-slate-500 text-xs">
        <p>Writing Desk panel — coming soon</p>
      </div>
    </PanelFrame>
  );
}
