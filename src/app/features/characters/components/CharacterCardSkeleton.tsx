'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CharacterCardSkeletonProps {
  index?: number;
}

/**
 * Skeleton loader that mirrors CharacterCard layout
 * Features:
 * - Glass-morphism effect with backdrop-blur
 * - Shimmer animation for modern feel
 * - Staggered fade-in animation
 * - Matches CharacterCard structure: avatar circle, name, type badge
 */
const CharacterCardSkeleton: React.FC<CharacterCardSkeletonProps> = ({ index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.4, 0, 0.2, 1],
      }}
      className="relative bg-gray-900 rounded-lg overflow-hidden border border-gray-800"
      data-testid={`character-skeleton-${index}`}
    >
      {/* Shimmer effect overlay */}
      <div className="absolute inset-0 -translate-x-full">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent backdrop-blur-sm"
          animate={{
            translateX: ['0%', '200%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      {/* Avatar Skeleton - matches aspect-square */}
      <div className="aspect-square relative bg-gray-800">
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gray-700 animate-pulse" />
        </div>
      </div>

      {/* Character Info Skeleton - matches p-4 */}
      <div className="p-4 space-y-2">
        {/* Name skeleton - matches h3 */}
        <div className="h-5 bg-gray-800 rounded-md w-3/4 animate-pulse" />

        {/* Type badge skeleton - matches badge size */}
        <div className="h-6 bg-gray-700 rounded w-20 animate-pulse" />
      </div>
    </motion.div>
  );
};

/**
 * Grid wrapper for multiple character card skeletons
 */
export const CharacterCardSkeletonGrid: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <CharacterCardSkeleton key={index} index={index} />
      ))}
    </div>
  );
};

export default CharacterCardSkeleton;
