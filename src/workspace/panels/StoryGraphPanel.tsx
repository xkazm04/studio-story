'use client';

import React from 'react';
import PanelFrame from './PanelFrame';
import { GitBranch } from 'lucide-react';

export default function StoryGraphPanel(props: Record<string, unknown>) {
  return (
    <PanelFrame title="Story Graph" icon={GitBranch} onClose={props.onClose as (() => void) | undefined} headerAccent="cyan">
      <div className="p-4 text-slate-500 text-xs">
        <p>Story Graph panel — coming soon</p>
      </div>
    </PanelFrame>
  );
}
