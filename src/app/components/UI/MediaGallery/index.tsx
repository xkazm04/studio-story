'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { MediaGalleryProps, MediaItem } from './types';
import { gridColsClasses, gapClasses } from './constants';
import MediaGalleryItem from './MediaGalleryItem';
import MediaLightbox from './MediaLightbox';

/**
 * MediaGallery Component
 *
 * A reusable media gallery with:
 * - Responsive grid layout
 * - Lazy loading via IntersectionObserver
 * - Skeleton loading states
 * - Image and video support
 * - Modal lightbox view
 * - Pagination controls
 * - Dark mode support
 * - Accessibility features
 */
const MediaGallery: React.FC<MediaGalleryProps> = ({
  media,
  columns = 3,
  spacing = 4,
  pagination = false,
  itemsPerPage = 12,
  color = 'purple',
  renderActions,
  onMediaClick,
  emptyMessage = 'No media available',
  keyboardNavigation = true,
  className = '',
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  // Pagination logic
  const totalPages = pagination ? Math.ceil(media.length / itemsPerPage) : 1;
  const startIndex = pagination ? (currentPage - 1) * itemsPerPage : 0;
  const endIndex = pagination ? startIndex + itemsPerPage : media.length;
  const paginatedMedia = media.slice(startIndex, endIndex);

  // Keyboard navigation for modal
  useEffect(() => {
    if (!keyboardNavigation || !selectedMedia) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = media.findIndex(m => m.id === selectedMedia.id);

      if (e.key === 'Escape') {
        setSelectedMedia(null);
      } else if (e.key === 'ArrowRight' && currentIndex < media.length - 1) {
        setSelectedMedia(media[currentIndex + 1]);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setSelectedMedia(media[currentIndex - 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMedia, media, keyboardNavigation]);

  const handleMediaClick = (item: MediaItem) => {
    if (onMediaClick) {
      onMediaClick(item);
    } else {
      setSelectedMedia(item);
    }
  };

  const handleNavigateModal = (direction: 'prev' | 'next') => {
    if (!selectedMedia) return;
    const currentIndex = media.findIndex(m => m.id === selectedMedia.id);

    if (direction === 'next' && currentIndex < media.length - 1) {
      setSelectedMedia(media[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      setSelectedMedia(media[currentIndex - 1]);
    }
  };

  if (media.length === 0) {
    return (
      <div className={`relative bg-gray-900 rounded-lg border border-gray-800 p-12 ${className}`}>
        <div className="text-center text-gray-400">
          <ImageIcon size={48} className="mx-auto mb-4 opacity-30" />
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Media Grid */}
      <div className={`grid ${gridColsClasses[columns]} ${gapClasses[spacing]}`}>
        {paginatedMedia.map((item, index) => (
          <MediaGalleryItem
            key={item.id}
            item={item}
            index={index}
            color={color}
            onClick={() => handleMediaClick(item)}
            renderActions={renderActions}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            aria-label="Previous page"
            data-testid="media-gallery-prev-page"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="text-gray-400 text-sm px-4">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            aria-label="Next page"
            data-testid="media-gallery-next-page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Modal Lightbox */}
      <MediaLightbox
        media={selectedMedia}
        allMedia={media}
        onClose={() => setSelectedMedia(null)}
        onNavigate={handleNavigateModal}
        color={color}
      />
    </div>
  );
};

export default MediaGallery;

// Re-export types
export type { MediaItem, MediaGalleryProps } from './types';
