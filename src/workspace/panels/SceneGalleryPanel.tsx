'use client';

import React from 'react';
import PanelFrame from './PanelFrame';
import { Film } from 'lucide-react';

export default function SceneGalleryPanel(props: Record<string, unknown>) {
  return (
    <PanelFrame title="Scene Gallery" icon={Film} onClose={props.onClose as (() => void) | undefined} headerAccent="amber">
      <div className="p-4 text-slate-500 text-xs">
        <p>Scene Gallery panel — coming soon</p>
      </div>
    </PanelFrame>
  );
}
