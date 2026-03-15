'use client';

import React, { Suspense, lazy } from 'react';
import { Palette, Loader2 } from 'lucide-react';
import PanelFrame from '../shared/PanelFrame';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import type { PanelDensity } from '@/workspace/types';

const ArtStyleEditor = lazy(
  () => import('@/app/features/story/sub_StoryArtstyle/ArtStyleEditor')
);

interface ArtStylePanelProps {
  onClose?: () => void;
  density?: PanelDensity;
}

export default function ArtStylePanel({ onClose, density }: ArtStylePanelProps) {
  const { selectedProject } = useProjectStore();

  return (
    <PanelFrame title="Art Style" icon={Palette} onClose={onClose} headerAccent="rose" density={density}>
      {selectedProject?.id ? (
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          }
        >
          <ArtStyleEditor projectId={selectedProject.id} />
        </Suspense>
      ) : (
        <div className="flex items-center justify-center h-full text-sm text-slate-400">
          Select a project first
        </div>
      )}
    </PanelFrame>
  );
}
