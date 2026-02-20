'use client';

import React from 'react';
import PanelFrame from './PanelFrame';
import { User } from 'lucide-react';

export default function CharacterDetailPanel(props: Record<string, unknown>) {
  return (
    <PanelFrame title="Character Detail" icon={User} onClose={props.onClose as (() => void) | undefined} headerAccent="violet">
      <div className="p-4 text-slate-500 text-xs">
        <p>Character Detail panel — coming soon</p>
      </div>
    </PanelFrame>
  );
}
