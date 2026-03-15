'use client';

import React from 'react';
import { Image } from 'lucide-react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { sceneApi } from '@/app/hooks/integration/useScenes';
import MediaViewer from '../MediaViewer';

interface ImageCanvasAdapterProps {
  sceneId?: string;
  imageUrl?: string;
  onTriggerSkill?: (skillId: string, params?: Record<string, unknown>) => void;
  onClose?: () => void;
}

export default function ImageCanvasAdapter({
  sceneId: propSceneId,
  imageUrl: propImageUrl,
  onTriggerSkill,
  onClose,
}: ImageCanvasAdapterProps) {
  const { selectedScene } = useProjectStore();
  const resolvedSceneId = propSceneId || selectedScene?.id || '';
  const { data: scene, isError, error, refetch } = sceneApi.useScene(resolvedSceneId, !!resolvedSceneId);
  const imageUrl = propImageUrl || scene?.image_url;

  return (
    <MediaViewer
      title="Image Canvas"
      icon={Image}
      headerAccent="rose"
      onClose={onClose}
      isError={isError}
      errorMessage={error?.message}
      onRetry={() => refetch()}
      imageUrl={imageUrl}
      imageAlt={scene?.name || 'Scene image'}
      onGenerateAction={
        onTriggerSkill
          ? () => onTriggerSkill('image-prompt-compose', { sceneId: resolvedSceneId })
          : undefined
      }
      emptyTitle="No image for this scene"
      emptyDescription="Generate an image to visualize this scene."
    />
  );
}
