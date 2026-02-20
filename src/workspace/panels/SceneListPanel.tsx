'use client';

import React from 'react';
import PanelFrame from './PanelFrame';
import { FileText } from 'lucide-react';

export default function SceneListPanel(props: Record<string, unknown>) {
  return (
    <PanelFrame title="Scene List" icon={FileText} onClose={props.onClose as (() => void) | undefined} headerAccent="amber">
      <div className="p-4 text-slate-500 text-xs">
        <p>Scene List panel — coming soon</p>
      </div>
    </PanelFrame>
  );
}
