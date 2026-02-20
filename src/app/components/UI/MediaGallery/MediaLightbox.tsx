'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon, Video } from 'lucide-react';
import { MediaItem } from './types';
import { colorClasses } from './constants';

interface MediaLightboxProps {
  media: MediaItem | null;
  allMedia: MediaItem[];
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  color: string;
}

const MediaLightbox: React.FC<MediaLightboxProps> = ({
  media,
  allMedia,
  onClose,
  onNavigate,
  color,
}) => {
  if (!media) return null;

  const currentIndex = allMedia.findIndex(m => m.id === media.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allMedia.length - 1;

  const gradientClass = colorClasses[color as keyof typeof colorClasses]?.gradient || colorClasses.gray.gradient;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Media lightbox"
        data-testid="media-lightbox"
      >
        {/* Navigation Arrows */}
        {hasPrev && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('prev');
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-gray-900/80 hover:bg-gray-800 text-white rounded-full transition-colors z-10"
            aria-label="Previous media"
            data-testid="lightbox-prev-btn"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {hasNext && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('next');
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-gray-900/80 hover:bg-gray-800 text-white rounded-full transition-colors z-10"
            aria-label="Next media"
            data-testid="lightbox-next-btn"
          >
            <ChevronRight size={24} />
          </button>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-3 bg-gray-900/80 hover:bg-gray-800 text-white rounded-full transition-colors z-10"
          aria-label="Close lightbox"
          data-testid="lightbox-close-btn"
        >
          <X size={24} />
        </button>

        {/* Media Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-900 rounded-lg border border-gray-800 max-w-5xl w-full max-h-[90vh] overflow-auto relative"
        >
          {/* Colored Borders */}
          <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r ${gradientClass}`} />
          <div className={`absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r ${gradientClass} opacity-60`} />
          <div className={`absolute top-0 left-0 h-full w-[1px] bg-gradient-to-b ${gradientClass}`} />
          <div className={`absolute top-0 right-0 h-full w-[1px] bg-gradient-to-b ${gradientClass} opacity-60`} />

          <div className="relative p-6">
            {/* Header */}
            {(media.description || media.alt) && (
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white mb-2">
                  {media.description || media.alt}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    {media.type === 'image' ? <ImageIcon size={14} /> : <Video size={14} />}
                    {media.type}
                  </span>
                  {allMedia.length > 1 && (
                    <span>
                      {currentIndex + 1} of {allMedia.length}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Media Display */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              {media.type === 'image' ? (
                <img
                  src={media.url}
                  alt={media.alt || media.description || 'Media'}
                  className="w-full max-h-[70vh] object-contain"
                />
              ) : (
                <video
                  src={media.url}
                  controls
                  autoPlay
                  className="w-full max-h-[70vh] object-contain"
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MediaLightbox;
