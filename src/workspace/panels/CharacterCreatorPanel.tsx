'use client';

import React from 'react';
import PanelFrame from './PanelFrame';
import { Paintbrush } from 'lucide-react';

export default function CharacterCreatorPanel(props: Record<string, unknown>) {
  return (
    <PanelFrame title="Character Creator" icon={Paintbrush} onClose={props.onClose as (() => void) | undefined} headerAccent="violet">
      <div className="p-4 text-slate-500 text-xs">
        <p>Character Creator panel — coming soon</p>
      </div>
    </PanelFrame>
  );
}
