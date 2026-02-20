'use client';

import React from 'react';
import PanelFrame from './PanelFrame';
import { Sparkles } from 'lucide-react';

export default function ThemeManagerPanel(props: Record<string, unknown>) {
  return (
    <PanelFrame title="Themes" icon={Sparkles} onClose={props.onClose as (() => void) | undefined} headerAccent="cyan">
      <div className="p-4 text-slate-500 text-xs">
        <p>Themes panel — coming soon</p>
      </div>
    </PanelFrame>
  );
}
