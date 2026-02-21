'use client';

import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2, X, CheckSquare, Square, Trash2,
  ZoomIn, AlertCircle, Save, CheckCheck, XCircle,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import {
  useCreatorImageStore,
  selectGenerationProgress,
  selectSelectedImages,
  selectUnselectedImages,
  type GeneratedImage,
  type ImageTab,
} from '../store/creatorImageStore';
import { useCreatorCharacterStore, selectComposedPrompt } from '../store/creatorCharacterStore';
import { useCreatorUIStore } from '../store/creatorUIStore';

interface ImageGenerationViewProps {
  tab: ImageTab;
  onImageSaved?: (imageUrls: string[]) => void;
}

// ─── Image Thumbnail ─────────────────────────────────────

function ImageThumbnail({
  image,
  selectable,
  onToggleSelect,
  onDelete,
  onZoom,
}: {
  image: GeneratedImage;
  selectable: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  onZoom: () => void;
}) {
  return (
    <div
      className={cn(
        'relative rounded-lg border overflow-hidden group',
        image.tab === 'avatar' ? 'aspect-square' : 'aspect-[3/4]',
        image.status === 'complete'
          ? image.selected
            ? 'border-amber-500 ring-2 ring-amber-500/30'
            : 'border-slate-700 hover:border-slate-500'
          : image.status === 'failed'
            ? 'border-red-600/30 bg-red-900/10'
            : 'border-slate-800 bg-slate-900/50'
      )}
    >
      {image.status === 'complete' && image.imageUrl ? (
        <>
          <img
            src={image.imageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
            <button
              onClick={onZoom}
              className="p-1.5 bg-black/60 rounded-lg hover:bg-black/80 transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5 text-white" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 bg-black/60 rounded-lg hover:bg-red-900/80 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>
          {/* Selection checkbox */}
          {selectable && (
            <button
              onClick={onToggleSelect}
              className="absolute top-1.5 left-1.5 p-0.5"
            >
              {image.selected ? (
                <CheckSquare className="w-4 h-4 text-amber-400 drop-shadow" />
              ) : (
                <Square className="w-4 h-4 text-slate-400 drop-shadow" />
              )}
            </button>
          )}
        </>
      ) : image.status === 'failed' ? (
        <div className="flex flex-col items-center justify-center h-full gap-1">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-[9px] text-red-400 px-2 text-center">
            {image.error || 'Failed'}
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
        </div>
      )}
    </div>
  );
}

// ─── Zoom Modal ──────────────────────────────────────────

function ZoomModal({
  image,
  onClose,
}: {
  image: GeneratedImage;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-full max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={image.imageUrl}
          alt=""
          className={cn(
            'max-h-[80vh] rounded-lg border border-slate-700',
            image.tab === 'avatar' ? 'aspect-square' : 'aspect-[3/4]'
          )}
        />
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 p-1 bg-slate-800 rounded-full border border-slate-700"
        >
          <X className="w-3.5 h-3.5 text-slate-300" />
        </button>
        <div className="mt-2 px-1">
          <p className="text-[10px] text-slate-500 line-clamp-2">{image.prompt}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────

export default function ImageGenerationView({
  tab,
  onImageSaved,
}: ImageGenerationViewProps) {
  const images = useCreatorImageStore((s) => s.images);
  const viewMode = useCreatorImageStore((s) => s.viewMode);
  const isGenerating = useCreatorImageStore((s) => s.isGenerating);
  const imageCount = useCreatorImageStore((s) => s.imageCount);
  const error = useCreatorImageStore((s) => s.error);
  const progress = useCreatorImageStore(selectGenerationProgress);
  const selectedImages = useCreatorImageStore(selectSelectedImages);
  const unselectedImages = useCreatorImageStore(selectUnselectedImages);

  const composedPrompt = useCreatorCharacterStore(selectComposedPrompt);

  const [zoomedImage, setZoomedImage] = useState<GeneratedImage | null>(null);

  const tabImages = images.filter((img) => img.tab === tab);

  // ─── Generation Flow ──────────────────────────────────

  const pollGeneration = useCallback(
    async (generationId: string, promptId: string) => {
      const maxAttempts = 60;
      let attempts = 0;

      const poll = async (): Promise<void> => {
        attempts++;
        if (attempts > maxAttempts) {
          useCreatorImageStore.getState().updateImageStatus(promptId, {
            status: 'failed',
            error: 'Timeout',
          });
          checkAllDone();
          return;
        }

        try {
          const res = await fetch(
            `/api/ai/generate-images?generationId=${generationId}`
          );
          const data = await res.json();

          if (data.status === 'COMPLETE' && data.images?.[0]) {
            useCreatorImageStore.getState().updateImageStatus(promptId, {
              status: 'complete',
              imageUrl: data.images[0].url,
            });
            checkAllDone();
          } else if (data.status === 'FAILED') {
            useCreatorImageStore.getState().updateImageStatus(promptId, {
              status: 'failed',
              error: 'Generation failed',
            });
            checkAllDone();
          } else {
            await new Promise((r) => setTimeout(r, 2000));
            await poll();
          }
        } catch {
          useCreatorImageStore.getState().updateImageStatus(promptId, {
            status: 'failed',
            error: 'Polling error',
          });
          checkAllDone();
        }
      };

      await poll();
    },
    []
  );

  const checkAllDone = useCallback(() => {
    const { images: all } = useCreatorImageStore.getState();
    const allDone =
      all.length > 0 &&
      all.every((img) => img.status === 'complete' || img.status === 'failed');
    if (allDone) {
      useCreatorImageStore.getState().setViewMode('selection');
    }
  }, []);

  const handleStartGeneration = useCallback(async () => {
    const store = useCreatorImageStore.getState();
    store.startGeneration();
    store.setViewMode('multi-generate');

    const framingPrefix =
      tab === 'avatar'
        ? 'Close-up portrait headshot, face focus, 1:1 square format, detailed facial features. '
        : 'Full body character pose, 3:4 vertical format, full outfit visible, environmental context. ';

    const fullPrompt = framingPrefix + composedPrompt;

    try {
      // Step 1: Get prompt variations
      const varRes = await fetch('/api/ai/dataset-sketch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basePrompt: fullPrompt,
          type: 'character',
          count: imageCount,
          enhance: true,
        }),
      });
      const varData = await varRes.json();
      if (!varData.success)
        throw new Error(varData.error || 'Failed to generate variations');

      const variations: { id: string; text: string }[] = varData.prompts;

      // Step 2: Create placeholder images
      const placeholders: GeneratedImage[] = variations.map((v) => ({
        id: v.id,
        promptId: v.id,
        generationId: '',
        imageUrl: '',
        prompt: v.text,
        tab,
        status: 'pending' as const,
        selected: false,
      }));
      store.addImages(placeholders);

      // Step 3: Start Leonardo generations
      const genRes = await fetch('/api/ai/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompts: variations,
          width: 768,
          height: tab === 'avatar' ? 768 : 1024,
        }),
      });
      const genData = await genRes.json();
      if (!genData.success)
        throw new Error(genData.error || 'Failed to start generation');

      // Step 4: Update with generation IDs, start polling
      for (const gen of genData.generations) {
        if (gen.status === 'failed') {
          store.updateImageStatus(gen.promptId, {
            status: 'failed',
            error: gen.error || 'Generation failed',
          });
        } else {
          store.updateImageStatus(gen.promptId, {
            generationId: gen.generationId,
            status: 'polling',
          });
          pollGeneration(gen.generationId, gen.promptId);
        }
      }
    } catch (err) {
      store.setError(
        err instanceof Error ? err.message : 'Generation failed'
      );
    } finally {
      store.finishGeneration();
    }
  }, [tab, composedPrompt, imageCount, pollGeneration]);

  // ─── Delete Single Image ──────────────────────────────

  const handleDeleteSingle = useCallback(async (imageId: string) => {
    const image = useCreatorImageStore
      .getState()
      .images.find((i) => i.id === imageId);
    if (!image) return;

    useCreatorImageStore.getState().removeImage(imageId);

    if (image.generationId) {
      try {
        await fetch('/api/ai/generate-images', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ generationIds: [image.generationId] }),
        });
      } catch {
        // best-effort
      }
    }

    const remaining = useCreatorImageStore.getState().images;
    if (remaining.length === 0) {
      useCreatorImageStore.getState().setViewMode('single');
    }
  }, []);

  // ─── Save Selected + Delete Rest ──────────────────────

  const handleSaveSelectedAndDeleteRest = useCallback(async () => {
    const selected = selectSelectedImages(useCreatorImageStore.getState());
    const unselected = selectUnselectedImages(useCreatorImageStore.getState());

    if (selected.length === 0) return;

    const confirmed = window.confirm(
      `Save ${selected.length} image(s) and delete ${unselected.length} from Leonardo?`
    );
    if (!confirmed) return;

    // Delete unselected from Leonardo
    const idsToDelete = unselected
      .map((img) => img.generationId)
      .filter(Boolean);

    if (idsToDelete.length > 0) {
      try {
        await fetch('/api/ai/generate-images', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ generationIds: idsToDelete }),
        });
      } catch {
        // best-effort
      }
    }

    const savedUrls = selected.map((img) => img.imageUrl);
    onImageSaved?.(savedUrls);

    if (savedUrls[0]) {
      useCreatorUIStore.getState().setGeneratedImage(savedUrls[0]);
    }

    useCreatorImageStore.getState().clearImages();
  }, [onImageSaved]);

  // ─── Auto-start generation on mount if in multi-generate mode ──

  const hasStarted = React.useRef(false);
  React.useEffect(() => {
    if (viewMode === 'multi-generate' && !isGenerating && tabImages.length === 0 && !hasStarted.current) {
      hasStarted.current = true;
      handleStartGeneration();
    }
  }, [viewMode, isGenerating, tabImages.length, handleStartGeneration]);

  // Reset ref when going back to single
  React.useEffect(() => {
    if (viewMode === 'single') {
      hasStarted.current = false;
    }
  }, [viewMode]);

  // ─── Render ───────────────────────────────────────────

  const gridCols =
    tabImages.length <= 4
      ? 'grid-cols-2'
      : tabImages.length <= 9
        ? 'grid-cols-3'
        : 'grid-cols-4';

  return (
    <div className="flex-1 flex flex-col min-w-0 relative">
      {/* Progress bar */}
      {(viewMode === 'multi-generate' || isGenerating) && (
        <div className="px-3 py-2 border-b border-slate-800/40 shrink-0">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-slate-400">Generating images...</span>
            <span className="text-slate-500">
              {progress.completed}/{progress.total} complete
              {progress.failed > 0 && `, ${progress.failed} failed`}
            </span>
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-amber-500 rounded-full"
              animate={{
                width: `${
                  progress.total > 0
                    ? ((progress.completed + progress.failed) / progress.total) *
                      100
                    : 0
                }%`,
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Selection toolbar */}
      {viewMode === 'selection' && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-800/40 shrink-0">
          <button
            onClick={() => useCreatorImageStore.getState().selectAll()}
            className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors"
          >
            <CheckCheck className="w-3 h-3" />
            All
          </button>
          <button
            onClick={() => useCreatorImageStore.getState().deselectAll()}
            className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded transition-colors"
          >
            <XCircle className="w-3 h-3" />
            None
          </button>
          <span className="text-[10px] text-slate-600 flex-1 text-right">
            {selectedImages.length} selected
          </span>
          <button
            onClick={handleSaveSelectedAndDeleteRest}
            disabled={selectedImages.length === 0}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors',
              selectedImages.length > 0
                ? 'bg-amber-600/80 text-white hover:bg-amber-500'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            )}
          >
            <Save className="w-3 h-3" />
            Save Selected
          </button>
          <button
            onClick={() => useCreatorImageStore.getState().clearImages()}
            className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
          >
            <X className="w-3 h-3" />
            Discard All
          </button>
        </div>
      )}

      {/* Image grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {tabImages.length > 0 ? (
          <div className={cn('grid gap-2', gridCols)}>
            {tabImages.map((img) => (
              <ImageThumbnail
                key={img.id}
                image={img}
                selectable={viewMode === 'selection'}
                onToggleSelect={() =>
                  useCreatorImageStore.getState().toggleSelected(img.id)
                }
                onDelete={() => handleDeleteSingle(img.id)}
                onZoom={() => setZoomedImage(img)}
              />
            ))}
          </div>
        ) : !isGenerating ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <AlertCircle className="w-6 h-6 text-slate-600 mb-2" />
            <p className="text-xs text-slate-500">No images generated yet</p>
          </div>
        ) : null}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-3 mb-2 px-3 py-2 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-xs shrink-0">
          {error}
          <button
            onClick={() => useCreatorImageStore.getState().setError(null)}
            className="ml-2 text-red-500 hover:text-red-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Zoom modal */}
      {zoomedImage && (
        <ZoomModal image={zoomedImage} onClose={() => setZoomedImage(null)} />
      )}
    </div>
  );
}
