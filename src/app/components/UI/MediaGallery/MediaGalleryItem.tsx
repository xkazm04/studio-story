'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Video, AlertCircle } from 'lucide-react';
import { MediaItem } from './types';
import { colorClasses } from './constants';

interface MediaGalleryItemProps {
  item: MediaItem;
  index: number;
  color: string;
  onClick: () => void;
  renderActions?: (item: MediaItem) => React.ReactNode;
}

const MediaGalleryItem: React.FC<MediaGalleryItemProps> = ({
  item,
  index,
  color,
  onClick,
  renderActions,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Lazy loading with IntersectionObserver
  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px', // Start loading 100px before item is visible
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  const hoverClass = colorClasses[color as keyof typeof colorClasses]?.hover || colorClasses.gray.hover;

  return (
    <motion.div
      ref={imgRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="relative group cursor-pointer"
      data-testid={`media-item-${item.id}`}
    >
      <div
        className={`relative bg-gray-900 rounded-lg border border-gray-800 overflow-hidden aspect-square ${hoverClass} transition-colors`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={item.alt || item.description || 'View media'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {/* Skeleton Loading State */}
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800"
              animate={{
                translateX: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            {item.type === 'image' ? (
              <ImageIcon size={48} className="text-gray-600 relative z-10" />
            ) : (
              <Video size={48} className="text-gray-600 relative z-10" />
            )}
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center">
            <AlertCircle size={48} className="text-red-500 mb-2" />
            <p className="text-gray-400 text-sm">Failed to load</p>
          </div>
        )}

        {/* Media Content (lazy loaded) */}
        {isInView && !hasError && (
          <>
            {item.type === 'image' ? (
              <img
                src={item.url}
                alt={item.alt || item.description || 'Media item'}
                className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setIsLoaded(true)}
                onError={() => {
                  setHasError(true);
                  setIsLoaded(false);
                }}
                loading="lazy"
              />
            ) : (
              <video
                src={item.url}
                className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoadedData={() => setIsLoaded(true)}
                onError={() => {
                  setHasError(true);
                  setIsLoaded(false);
                }}
                muted
                loop
                playsInline
              />
            )}
          </>
        )}

        {/* Hover Overlay */}
        {isLoaded && (
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm p-4 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs px-2 py-1 bg-white/10 text-white rounded-full backdrop-blur-sm">
                {item.type}
              </span>
              {renderActions && (
                <div onClick={(e) => e.stopPropagation()}>
                  {renderActions(item)}
                </div>
              )}
            </div>
            {item.description && (
              <div>
                <p className="text-white text-sm font-medium line-clamp-2">
                  {item.description}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default MediaGalleryItem;
