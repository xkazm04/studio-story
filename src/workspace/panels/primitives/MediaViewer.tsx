'use client';

import React, { useMemo, useState } from 'react';
import { Image as ImageIcon, Sparkles, Loader2, ImageOff } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import PanelFrame from '../shared/PanelFrame';
import { PanelEmptyState, PanelErrorState, PanelSkeletonList } from '../shared/PanelPrimitives';
import type { BasePrimitiveProps } from './types';
import { MOTION } from '@/workspace/theme/tokens';

interface MediaViewerProps extends BasePrimitiveProps {
  imageUrl?: string;
  imageAlt?: string;
  onGenerateAction?: () => void;
  generateLabel?: string;
}

export default function MediaViewer({
  title,
  icon,
  headerAccent,
  onClose,
  actions,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  imageUrl,
  imageAlt,
  onGenerateAction,
  generateLabel,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  density,
}: MediaViewerProps) {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const resolvedImageUrl = useMemo(() => {
    if (!imageUrl) return '';
    const join = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${reloadToken > 0 ? `${join}t=${Date.now()}` : ''}`;
  }, [imageUrl, reloadToken]);

  const generateButton = onGenerateAction ? (
    <button
      type="button"
      onClick={onGenerateAction}
      aria-label="Generate image"
      className="flex items-center gap-1 rounded px-2 py-0.5 text-sm font-medium text-emerald-300 bg-emerald-600/15 hover:bg-emerald-600/25 transition-colors"
    >
      <Sparkles className="h-3 w-3" />
      {generateLabel ?? 'Generate'}
    </button>
  ) : null;

  return (
    <PanelFrame
      title={title}
      icon={icon}
      headerAccent={headerAccent}
      onClose={onClose}
      density={density}
      actions={
        (actions || generateButton) ? (
          <div className="flex items-center gap-1">
            {actions}
            {generateButton}
          </div>
        ) : undefined
      }
    >
      <div className="flex items-center justify-center h-full p-2">
        {isLoading ? (
          <PanelSkeletonList rows={3} />
        ) : isError ? (
          <PanelErrorState message={errorMessage} onRetry={onRetry} />
        ) : imageUrl ? (
          <div className="relative flex h-full w-full items-center justify-center">
            {!loaded && !hasError ? (
              <Loader2 className="absolute h-8 w-8 animate-spin text-cyan-300" />
            ) : null}
            {hasError ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-center">
                <ImageOff className="h-6 w-6 text-rose-300" />
                <p className="text-sm text-rose-200">Failed to load image</p>
                <button
                  type="button"
                  onClick={() => {
                    setHasError(false);
                    setLoaded(false);
                    setReloadToken((v) => v + 1);
                  }}
                  className="flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20"
                >
                  Retry
                </button>
              </div>
            ) : (
              <img
                src={resolvedImageUrl}
                alt={imageAlt ?? ''}
                onLoad={() => {
                  setHasError(false);
                  setLoaded(true);
                }}
                onError={() => {
                  setLoaded(false);
                  setHasError(true);
                }}
                className={cn(
                  'max-w-full max-h-full object-contain rounded-lg ring-1 ring-white/5 shadow-lg shadow-black/20',
                  `transition-opacity ${MOTION.fadeInDuration}`,
                  loaded ? 'opacity-100' : 'opacity-0',
                )}
              />
            )}
          </div>
        ) : (
          <PanelEmptyState
            icon={emptyIcon ?? ImageIcon}
            title={emptyTitle ?? 'No image'}
            description={emptyDescription}
            action={
              onGenerateAction ? (
                <button
                  type="button"
                  onClick={onGenerateAction}
                  aria-label="Generate image"
                  className="flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Generate Image
                </button>
              ) : undefined
            }
          />
        )}
      </div>
    </PanelFrame>
  );
}
