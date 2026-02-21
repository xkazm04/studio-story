'use client';

import React from 'react';
import { Image, Sparkles } from 'lucide-react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { sceneApi } from '@/app/hooks/integration/useScenes';
import PanelFrame from '../shared/PanelFrame';

interface ImageCanvasPanelProps {
  sceneId?: string;
  imageUrl?: string;
  onTriggerSkill?: (skillId: string, params?: Record<string, unknown>) => void;
  onClose?: () => void;
}

export default function ImageCanvasPanel({
  sceneId: propSceneId,
  imageUrl: propImageUrl,
  onTriggerSkill,
  onClose,
}: ImageCanvasPanelProps) {
  const { selectedScene } = useProjectStore();
  const resolvedSceneId = propSceneId || selectedScene?.id || '';
  const { data: scene } = sceneApi.useScene(resolvedSceneId, !!resolvedSceneId);

  const imageUrl = propImageUrl || scene?.image_url;

  return (
    <PanelFrame
      title="Image Canvas"
      icon={Image}
      onClose={onClose}
      headerAccent="rose"
      actions={
        onTriggerSkill ? (
          <button
            onClick={() =>
              onTriggerSkill('image-prompt-compose', { sceneId: resolvedSceneId })
            }
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-emerald-300 bg-emerald-600/15 hover:bg-emerald-600/25 transition-colors"
          >
            <Sparkles className="w-2.5 h-2.5" />
            Generate
          </button>
        ) : undefined
      }
    >
      <div className="flex items-center justify-center h-full p-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={scene?.name || 'Scene image'}
            className="max-w-full max-h-full object-contain rounded-lg border border-slate-800/50"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-slate-600">
            <div className="w-16 h-16 rounded-xl bg-slate-900/60 border border-slate-800/50 flex items-center justify-center">
              <Image className="w-8 h-8 text-slate-700" />
            </div>
            <p className="text-xs">No image for this scene</p>
            {onTriggerSkill && (
              <button
                onClick={() =>
                  onTriggerSkill('image-prompt-compose', { sceneId: resolvedSceneId })
                }
                className="px-3 py-1.5 rounded-md text-xs bg-slate-900/60 border border-slate-800/50 text-slate-400 hover:text-slate-200 hover:border-slate-700/50 transition-colors"
              >
                Generate Image
              </button>
            )}
          </div>
        )}
      </div>
    </PanelFrame>
  );
}
