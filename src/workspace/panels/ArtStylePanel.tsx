'use client';

import React from 'react';
import PanelFrame from './PanelFrame';
import { Palette } from 'lucide-react';

export default function ArtStylePanel(props: Record<string, unknown>) {
  return (
    <PanelFrame title="Art Style" icon={Palette} onClose={props.onClose as (() => void) | undefined} headerAccent="emerald">
      <div className="p-4 text-slate-500 text-xs">
        <p>Art Style panel — coming soon</p>
      </div>
    </PanelFrame>
  );
}
