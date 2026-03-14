'use client';

import React, { Suspense, lazy } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import PanelFrame from '../shared/PanelFrame';
import type { PanelDensity, PanelDataSlice } from '@/workspace/types';

const ImageGenerator = lazy(
  () => import('@/app/features/image/generator/ImageGenerator')
);

interface ImageGeneratorPanelProps {
  onClose?: () => void;
  onTriggerSkill?: (skillId: string, params?: Record<string, unknown>) => void;
  density?: PanelDensity;
  dataSlice?: PanelDataSlice;
}

export default function ImageGeneratorPanel({ onClose, onTriggerSkill, density, dataSlice }: ImageGeneratorPanelProps) {
  // Extract sceneId from dataSlice for contextual composition (Jinn)
  const sceneId = dataSlice?.entityId;

  return (
    <PanelFrame
      title="Image Generator"
      icon={ImagePlus}
      onClose={onClose}
      headerAccent="rose"
      density={density}
      actions={
        onTriggerSkill ? (
          <button
            onClick={() => onTriggerSkill('image-prompt-compose')}
            className="text-xs px-1.5 py-0.5 text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
          >
            AI Compose
          </button>
        ) : undefined
      }
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          </div>
        }
      >
        <ImageGenerator sceneId={sceneId} />
      </Suspense>
    </PanelFrame>
  );
}
