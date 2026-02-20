'use client';

import React from 'react';
import PanelFrame from './PanelFrame';
import { ImagePlus } from 'lucide-react';

export default function ImageGeneratorPanel(props: Record<string, unknown>) {
  return (
    <PanelFrame title="Image Generator" icon={ImagePlus} onClose={props.onClose as (() => void) | undefined} headerAccent="emerald">
      <div className="p-4 text-slate-500 text-xs">
        <p>Image Generator panel — coming soon</p>
      </div>
    </PanelFrame>
  );
}
