/**
 * ImageGenerator - Main orchestrator for character image generation
 * Design: Clean Manuscript style with cyan accents
 */

'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, XCircle, Sparkles, RefreshCw } from 'lucide-react';
import { Appearance } from '@/app/types/Character';
import { useImageGenerator, GeneratedImage } from '../hooks/useImageGenerator';
import SelectionPanel from './components/SelectionPanel';
import PromptPreview from './components/PromptPreview';
import SketchGrid from './components/SketchGrid';
import FinalPreview from './components/FinalPreview';
import ImageGallery, { GalleryImage } from './components/ImageGallery';

interface ImageGeneratorProps {
  characterId: string;
  characterName: string;
  appearance: Appearance;
  artStyle?: string;
  existingImages?: GalleryImage[];
  onSaveImage?: (image: GeneratedImage) => Promise<void>;
  onDeleteImage?: (imageId: string) => Promise<void>;
  onSetPrimaryImage?: (imageId: string) => Promise<void>;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({
  characterId,
  characterName,
  appearance,
  artStyle,
  existingImages = [],
  onSaveImage,
  onDeleteImage,
  onSetPrimaryImage,
}) => {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(existingImages);

  const {
    selections,
    composedPrompt,
    sketches,
    selectedSketch,
    finalImage,
    isComposing,
    isGeneratingSketches,
    isGeneratingFinal,
    error,
    updateSelection,
    composePrompt,
    generateSketches,
    selectSketch,
    generateFinal,
    reset,
    cancel,
  } = useImageGenerator({
    characterId,
    appearance,
    artStyle,
  });

  const isLoading = isComposing || isGeneratingSketches || isGeneratingFinal;

  // Handle adding to gallery
  const handleAddToGallery = useCallback(async (image: GeneratedImage) => {
    if (galleryImages.length >= 10) {
      return;
    }

    const galleryImage: GalleryImage = {
      id: image.id,
      url: image.url,
      prompt: image.prompt,
      createdAt: image.createdAt,
      isPrimary: galleryImages.length === 0,
    };

    setGalleryImages(prev => [...prev, galleryImage]);

    if (onSaveImage) {
      await onSaveImage(image);
    }
  }, [galleryImages.length, onSaveImage]);

  // Handle deleting from gallery
  const handleDeleteImage = useCallback(async (imageId: string) => {
    setGalleryImages(prev => {
      const filtered = prev.filter(img => img.id !== imageId);
      // If deleted image was primary, make first remaining image primary
      if (filtered.length > 0 && !filtered.some(img => img.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });

    if (onDeleteImage) {
      await onDeleteImage(imageId);
    }
  }, [onDeleteImage]);

  // Handle setting primary image
  const handleSetPrimary = useCallback(async (imageId: string) => {
    setGalleryImages(prev =>
      prev.map(img => ({
        ...img,
        isPrimary: img.id === imageId,
      }))
    );

    if (onSetPrimaryImage) {
      await onSetPrimaryImage(imageId);
    }
  }, [onSetPrimaryImage]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-sm uppercase tracking-wide text-slate-300">
            // image_generator
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            generate character illustrations for {characterName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isLoading && (
            <button
              onClick={cancel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs uppercase tracking-wide
                         bg-red-600/80 hover:bg-red-600 text-white transition-all"
            >
              <XCircle className="w-3.5 h-3.5" />
              cancel
            </button>
          )}
          <button
            onClick={reset}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs uppercase tracking-wide
                       bg-slate-700 hover:bg-slate-600 text-slate-200 transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            reset
          </button>
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="font-mono text-xs text-red-400">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Options & Prompt */}
        <div className="space-y-4">
          <SelectionPanel
            selections={selections}
            onUpdateSelection={updateSelection}
            disabled={isLoading}
          />

          <PromptPreview
            prompt={composedPrompt}
            artStyle={artStyle}
            isComposing={isComposing}
            onRecompose={composePrompt}
          />

          {/* Generate Sketches Button */}
          <button
            onClick={generateSketches}
            disabled={isLoading || galleryImages.length >= 10}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-mono text-sm uppercase tracking-wide
                       bg-cyan-600 hover:bg-cyan-500 text-white
                       transition-all duration-200 shadow-lg hover:shadow-cyan-500/20
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <Sparkles className="w-4 h-4" />
            {isGeneratingSketches ? 'generating_sketches...' : 'generate_sketches'}
          </button>
        </div>

        {/* Right Column: Sketches & Final */}
        <div className="space-y-4">
          <SketchGrid
            sketches={sketches}
            selectedSketch={selectedSketch}
            onSelectSketch={selectSketch}
            isLoading={isGeneratingSketches}
          />

          <FinalPreview
            finalImage={finalImage}
            selectedSketch={selectedSketch}
            isGenerating={isGeneratingFinal}
            onGenerate={generateFinal}
            onAddToGallery={handleAddToGallery}
            canGenerate={!!selectedSketch && !isLoading && galleryImages.length < 10}
          />
        </div>
      </div>

      {/* Image Gallery */}
      <ImageGallery
        images={galleryImages}
        maxImages={10}
        onDeleteImage={handleDeleteImage}
        onSetPrimary={handleSetPrimary}
      />
    </div>
  );
};

export default ImageGenerator;
