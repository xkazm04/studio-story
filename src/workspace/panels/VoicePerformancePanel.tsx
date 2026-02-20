'use client';

import React from 'react';
import PanelFrame from './PanelFrame';
import { SlidersHorizontal } from 'lucide-react';

export default function VoicePerformancePanel(props: Record<string, unknown>) {
  return (
    <PanelFrame title="Voice Performance" icon={SlidersHorizontal} onClose={props.onClose as (() => void) | undefined} headerAccent="rose">
      <div className="p-4 text-slate-500 text-xs">
        <p>Voice Performance panel — coming soon</p>
      </div>
    </PanelFrame>
  );
}
