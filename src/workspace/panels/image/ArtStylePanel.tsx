'use client';

import React, { Suspense, lazy } from 'react';
import { Palette, Loader2 } from 'lucide-react';
import PanelFrame from '../shared/PanelFrame';
import { useProjectStore } from '@/app/store/slices/projectSlice';

const ArtStyleEditor = lazy(
  () => import('@/app/features/story/sub_StoryArtstyle/ArtStyleEditor')
);

interface ArtStylePanelProps {
  onClose?: () => void;
}

export default function ArtStylePanel({ onClose }: ArtStylePanelProps) {
  const { selectedProject } = useProjectStore();

  return (
    <PanelFrame title="Art Style" icon={Palette} onClose={onClose} headerAccent="rose">
      {selectedProject?.id ? (
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
            </div>
          }
        >
          <ArtStyleEditor projectId={selectedProject.id} />
        </Suspense>
      ) : (
        <div className="flex items-center justify-center h-full text-xs text-slate-500">
          Select a project first
        </div>
      )}
    </PanelFrame>
  );
}
