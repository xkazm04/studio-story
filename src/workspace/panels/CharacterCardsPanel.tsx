'use client';

import React from 'react';
import PanelFrame from './PanelFrame';
import { Users } from 'lucide-react';

export default function CharacterCardsPanel(props: Record<string, unknown>) {
  return (
    <PanelFrame title="Characters" icon={Users} onClose={props.onClose as (() => void) | undefined} headerAccent="violet">
      <div className="p-4 text-slate-500 text-xs">
        <p>Characters panel — coming soon</p>
      </div>
    </PanelFrame>
  );
}
