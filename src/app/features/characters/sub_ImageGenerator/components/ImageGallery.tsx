/**
 * ImageGallery - Character image gallery (max 10)
 * Design: Clean Manuscript style with cyan accents
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Images, Trash2, Star, X, Download } from 'lucide-react';
import { cn } from '@/app/lib/utils';

export interface GalleryImage {
  id: string;
  url: string;
  prompt?: string;
  createdAt: string;
  isPrimary?: boolean;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  maxImages?: number;
  onDeleteImage: (imageId: string) => void;
  onSetPrimary: (imageId: string) => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  maxImages = 10,
  onDeleteImage,
  onSetPrimary,
}) => {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  if (images.length === 0) {
    return (
      <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
        <div className="flex items-center gap-2 mb-4">
          <Images className="w-4 h-4 text-slate-500" />
          <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
            image_gallery
          </h3>
          <span className="font-mono text-[10px] text-slate-600">
            0/{maxImages}
          </span>
        </div>
        <div className="py-8 text-center">
          <Images className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <span className="font-mono text-xs text-slate-500">
            // no_images_saved_yet
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Images className="w-4 h-4 text-cyan-400" />
            <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
              image_gallery
            </h3>
            <span className={cn(
              'font-mono text-[10px] px-1.5 py-0.5 rounded',
              images.length >= maxImages
                ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                : 'text-slate-500'
            )}>
              {images.length}/{maxImages}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          <AnimatePresence mode="popLayout">
            {images.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                className="relative group aspect-square"
              >
                <button
                  onClick={() => setSelectedImage(image)}
                  className={cn(
                    'w-full h-full rounded-md overflow-hidden border-2 transition-all duration-200',
                    image.isPrimary
                      ? 'border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                      : 'border-slate-700/50 hover:border-slate-600'
                  )}
                >
                  <img
                    src={image.url}
                    alt={`Gallery image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>

                {/* Primary indicator */}
                {image.isPrimary && (
                  <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                    <Star className="w-2.5 h-2.5 text-white fill-white" />
                  </div>
                )}

                {/* Hover actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  {!image.isPrimary && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetPrimary(image.id);
                      }}
                      className="p-1.5 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 transition-colors"
                      title="Set as primary"
                    >
                      <Star className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteImage(image.id);
                    }}
                    className="p-1.5 rounded bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors"
                    title="Delete image"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {images.length >= maxImages && (
          <p className="mt-3 font-mono text-[10px] text-amber-400/80 text-center">
            // gallery_full_delete_images_to_add_more
          </p>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage.url}
                alt="Selected image"
                className="max-w-full max-h-[80vh] rounded-lg border border-slate-700"
              />

              {/* Close button */}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-800 border border-slate-700
                           flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Actions */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/90 backdrop-blur rounded-lg p-2 border border-slate-700">
                {!selectedImage.isPrimary && (
                  <button
                    onClick={() => {
                      onSetPrimary(selectedImage.id);
                      setSelectedImage(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs uppercase tracking-wide
                               bg-amber-600 hover:bg-amber-500 text-white transition-all"
                  >
                    <Star className="w-3 h-3" />
                    set_primary
                  </button>
                )}
                <a
                  href={selectedImage.url}
                  download={`character-${selectedImage.id}.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs uppercase tracking-wide
                             bg-slate-700 hover:bg-slate-600 text-slate-200 transition-all"
                >
                  <Download className="w-3 h-3" />
                  download
                </a>
                <button
                  onClick={() => {
                    onDeleteImage(selectedImage.id);
                    setSelectedImage(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs uppercase tracking-wide
                             bg-red-600/80 hover:bg-red-600 text-white transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                  delete
                </button>
              </div>

              {/* Prompt display */}
              {selectedImage.prompt && (
                <div className="absolute -bottom-16 left-0 right-0 p-2 bg-slate-900/80 rounded-lg border border-slate-700">
                  <p className="font-mono text-[10px] text-slate-400 line-clamp-2">
                    {selectedImage.prompt}
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ImageGallery;
