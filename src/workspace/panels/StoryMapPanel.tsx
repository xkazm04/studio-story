'use client';

import React from 'react';
import PanelFrame from './PanelFrame';
import { Map } from 'lucide-react';

export default function StoryMapPanel(props: Record<string, unknown>) {
  return (
    <PanelFrame title="Story Map" icon={Map} onClose={props.onClose as (() => void) | undefined} headerAccent="cyan">
      <div className="p-4 text-slate-500 text-xs">
        <p>Story Map panel — coming soon</p>
      </div>
    </PanelFrame>
  );
}
