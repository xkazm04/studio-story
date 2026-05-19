'use client';

import React, { useCallback } from 'react';
import { Image, Download, RefreshCw, Copy, Sparkles } from 'lucide-react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { sceneApi } from '@/app/hooks/integration/useScenes';
import type { BaseAdapterProps } from '../types';
import type { MediaViewerEntity } from '../MediaViewer';
import type { ContextMenuItem } from '../ContextMenu';
import MediaViewer from '../MediaViewer';

interface ImageCanvasAdapterProps extends BaseAdapterProps {
  sceneId?: string;
  imageUrl?: string;
}

export default function ImageCanvasAdapter({
  sceneId: propSceneId,
  imageUrl: propImageUrl,
  density,
  onTriggerSkill,
  onClose,
}: ImageCanvasAdapterProps) {
  const { selectedScene } = useProjectStore();
  const resolvedSceneId = propSceneId || selectedScene?.id || '';
  const { data: scene, isError, error, refetch } = sceneApi.useScene(resolvedSceneId, !!resolvedSceneId);
  const imageUrl = propImageUrl || scene?.image_url;

  const getContextMenuItems = useCallback((_entity: MediaViewerEntity): ContextMenuItem[] => [
    { id: 'regenerate', label: 'Regenerate', icon: RefreshCw },
    { id: 'variations', label: 'Generate Variations', icon: Sparkles },
    { id: 'copy-url', label: 'Copy Image URL', icon: Copy, separator: true },
    { id: 'download', label: 'Download Image', icon: Download },
  ], []);

  const handleContextMenuAction = useCallback((actionId: string, entity: MediaViewerEntity) => {
    switch (actionId) {
      case 'regenerate':
        onTriggerSkill?.('image-prompt-compose', { sceneId: resolvedSceneId });
        break;
      case 'variations':
        onTriggerSkill?.('image-variations', { sceneId: resolvedSceneId, imageUrl: entity.imageUrl });
        break;
      case 'copy-url':
        navigator.clipboard.writeText(entity.imageUrl);
        break;
      case 'download': {
        const a = document.createElement('a');
        a.href = entity.imageUrl;
        a.download = entity.imageAlt || 'image';
        a.click();
        break;
      }
    }
  }, [onTriggerSkill, resolvedSceneId]);

  return (
    <MediaViewer
      title="Image Canvas"
      icon={Image}
      headerAccent="rose"
      onClose={onClose}
      density={density}
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
      contextMenuItems={getContextMenuItems}
      onContextMenuAction={handleContextMenuAction}
    />
  );
}
