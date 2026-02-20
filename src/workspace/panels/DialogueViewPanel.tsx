'use client';

import React from 'react';
import PanelFrame from './PanelFrame';
import { MessageCircle } from 'lucide-react';

export default function DialogueViewPanel(props: Record<string, unknown>) {
  return (
    <PanelFrame title="Dialogue" icon={MessageCircle} onClose={props.onClose as (() => void) | undefined} headerAccent="amber">
      <div className="p-4 text-slate-500 text-xs">
        <p>Dialogue panel — coming soon</p>
      </div>
    </PanelFrame>
  );
}
