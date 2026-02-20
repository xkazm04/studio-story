'use client';

import React from 'react';
import PanelFrame from './PanelFrame';
import { Mic } from 'lucide-react';

export default function VoiceManagerPanel(props: Record<string, unknown>) {
  return (
    <PanelFrame title="Voices" icon={Mic} onClose={props.onClose as (() => void) | undefined} headerAccent="rose">
      <div className="p-4 text-slate-500 text-xs">
        <p>Voices panel — coming soon</p>
      </div>
    </PanelFrame>
  );
}
