'use client';

import React from 'react';
import PanelFrame from './PanelFrame';
import { Info } from 'lucide-react';

export default function SceneMetadataPanel(props: Record<string, unknown>) {
  return (
    <PanelFrame title="Scene Details" icon={Info} onClose={props.onClose as (() => void) | undefined} headerAccent="amber">
      <div className="p-4 text-slate-500 text-xs">
        <p>Scene Details panel — coming soon</p>
      </div>
    </PanelFrame>
  );
}
