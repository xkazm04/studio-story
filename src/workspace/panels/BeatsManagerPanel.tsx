'use client';

import React from 'react';
import PanelFrame from './PanelFrame';
import { ListChecks } from 'lucide-react';

export default function BeatsManagerPanel(props: Record<string, unknown>) {
  return (
    <PanelFrame title="Beats" icon={ListChecks} onClose={props.onClose as (() => void) | undefined} headerAccent="cyan">
      <div className="p-4 text-slate-500 text-xs">
        <p>Beats panel — coming soon</p>
      </div>
    </PanelFrame>
  );
}
