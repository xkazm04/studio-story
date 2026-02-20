'use client';

import React from 'react';
import PanelFrame from './PanelFrame';
import { Users } from 'lucide-react';

export default function VoiceCastingPanel(props: Record<string, unknown>) {
  return (
    <PanelFrame title="Voice Casting" icon={Users} onClose={props.onClose as (() => void) | undefined} headerAccent="rose">
      <div className="p-4 text-slate-500 text-xs">
        <p>Voice Casting panel — coming soon</p>
      </div>
    </PanelFrame>
  );
}
