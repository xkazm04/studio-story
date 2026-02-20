'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  variant?: 'card' | 'list' | 'form' | 'details';
  color?: 'blue' | 'green' | 'purple';
  count?: number;
}

// Reusable color configuration
const colorClasses = {
  blue: {
    shimmer: 'from-blue-500/10 via-blue-400/30 to-blue-500/10',
    border: 'from-transparent via-blue-500/50 to-transparent',
    glow: 'shadow-blue-500/20',
  },
  green: {
    shimmer: 'from-green-500/10 via-green-400/30 to-green-500/10',
    border: 'from-transparent via-green-500/50 to-transparent',
    glow: 'shadow-green-500/20',
  },
  purple: {
    shimmer: 'from-purple-500/10 via-purple-400/30 to-purple-500/10',
    border: 'from-transparent via-purple-500/50 to-transparent',
    glow: 'shadow-purple-500/20',
  },
};

// Reusable shimmer animation component
const ShimmerAnimation: React.FC<{ shimmerClass: string; duration?: number }> = ({
  shimmerClass,
  duration = 2,
}) => (
  <div className="absolute inset-0 -translate-x-full">
    <motion.div
      className={`absolute inset-0 bg-gradient-to-r ${shimmerClass}`}
      animate={{
        translateX: ['0%', '200%'],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  </div>
);

// Reusable colored borders component
const ColoredBorders: React.FC<{ borderClass: string }> = ({ borderClass }) => (
  <>
    <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r ${borderClass}`} />
    <div className={`absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r ${borderClass} opacity-60`} />
    <div className={`absolute top-0 left-0 h-full w-[1px] bg-gradient-to-b ${borderClass}`} />
    <div className={`absolute top-0 right-0 h-full w-[1px] bg-gradient-to-b ${borderClass} opacity-60`} />
  </>
);

/**
 * SkeletonLoader component with shimmer animation matching ColoredBorder design pattern
 * Provides animated skeleton states for different UI patterns
 */
const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'card',
  color = 'blue',
  count = 1,
}) => {
  const colors = colorClasses[color];

  // Skeleton Card (for FactionCard, CharacterCard)
  const SkeletonCard = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative bg-gray-900 rounded-lg border border-gray-800 p-6 overflow-hidden"
    >
      <ShimmerAnimation shimmerClass={colors.shimmer} duration={2} />
      <ColoredBorders borderClass={colors.border} />

      {/* Content skeleton */}
      <div className="relative space-y-3">
        <div className="h-6 bg-gray-800 rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-gray-800 rounded w-1/2 animate-pulse" />
        <div className="space-y-2 mt-4">
          <div className="h-3 bg-gray-800 rounded w-full animate-pulse" />
          <div className="h-3 bg-gray-800 rounded w-5/6 animate-pulse" />
        </div>
      </div>
    </motion.div>
  );

  // Skeleton List Item (for character/faction lists)
  const SkeletonListItem = () => (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative bg-gray-900/50 rounded-lg border border-gray-800 p-4 overflow-hidden"
    >
      <ShimmerAnimation shimmerClass={colors.shimmer} duration={1.5} />

      <div className="relative flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-800 rounded-lg animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-800 rounded w-2/3 animate-pulse" />
          <div className="h-3 bg-gray-800 rounded w-1/3 animate-pulse" />
        </div>
      </div>
    </motion.div>
  );

  // Skeleton Form (for CreateFactionForm, CharacterCreateForm)
  const SkeletonForm = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gray-900 rounded-lg border border-gray-800 p-6 overflow-hidden"
    >
      <ShimmerAnimation shimmerClass={colors.shimmer} duration={2.5} />

      <div className="relative space-y-4">
        {/* Form title */}
        <div className="h-6 bg-gray-800 rounded w-1/2 animate-pulse" />

        {/* Form fields */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-gray-800 rounded w-1/4 animate-pulse" />
            <div className="h-10 bg-gray-800 rounded w-full animate-pulse" />
          </div>
        ))}

        {/* Action buttons */}
        <div className="flex gap-3 pt-4">
          <div className="h-10 bg-gray-800 rounded flex-1 animate-pulse" />
          <div className="h-10 bg-gray-800 rounded w-24 animate-pulse" />
        </div>
      </div>
    </motion.div>
  );

  // Skeleton Details (for CharacterDetails)
  const SkeletonDetails = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Header Card */}
      <div className="relative bg-gray-900 rounded-lg border border-gray-800 p-6 overflow-hidden">
        <ShimmerAnimation shimmerClass={colors.shimmer} duration={2} />
        <ColoredBorders borderClass={colors.border} />

        <div className="relative flex gap-6">
          {/* Avatar skeleton */}
          <div className="w-32 h-32 bg-gray-800 rounded-lg animate-pulse flex-shrink-0" />

          {/* Info skeleton */}
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-gray-800 rounded w-1/2 animate-pulse" />
            <div className="h-6 bg-gray-800 rounded w-1/4 animate-pulse" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-4 bg-gray-800 rounded animate-pulse" />
              <div className="h-4 bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2 p-2 bg-gray-900/50 rounded-lg border border-gray-800">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 bg-gray-800 rounded-lg flex-1 animate-pulse" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="relative bg-gray-900 rounded-lg border border-gray-800 p-6 overflow-hidden">
        <ShimmerAnimation shimmerClass={colors.shimmer} duration={2} />

        <div className="relative space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-gray-800 rounded animate-pulse" style={{ width: `${100 - i * 10}%` }} />
          ))}
        </div>
      </div>
    </motion.div>
  );

  // Render based on variant
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return <SkeletonCard />;
      case 'list':
        return <SkeletonListItem />;
      case 'form':
        return <SkeletonForm />;
      case 'details':
        return <SkeletonDetails />;
      default:
        return <SkeletonCard />;
    }
  };

  // Render multiple instances if count > 1
  if (variant === 'details') {
    return renderSkeleton();
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </>
  );
};

export default SkeletonLoader;
