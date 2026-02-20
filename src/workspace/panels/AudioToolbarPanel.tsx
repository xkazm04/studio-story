'use client';

import React from 'react';
import PanelFrame from './PanelFrame';
import { AudioLines } from 'lucide-react';

export default function AudioToolbarPanel(props: Record<string, unknown>) {
  return (
    <PanelFrame title="Audio" icon={AudioLines} onClose={props.onClose as (() => void) | undefined} headerAccent="rose">
      <div className="p-4 text-slate-500 text-xs">
        <p>Audio panel — coming soon</p>
      </div>
    </PanelFrame>
  );
}
