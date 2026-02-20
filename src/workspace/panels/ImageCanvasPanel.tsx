'use client';

import React from 'react';
import PanelFrame from './PanelFrame';
import { Image } from 'lucide-react';

export default function ImageCanvasPanel(props: Record<string, unknown>) {
  return (
    <PanelFrame title="Image Canvas" icon={Image} onClose={props.onClose as (() => void) | undefined} headerAccent="emerald">
      <div className="p-4 text-slate-500 text-xs">
        <p>Image Canvas panel — coming soon</p>
      </div>
    </PanelFrame>
  );
}
