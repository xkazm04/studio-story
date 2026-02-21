'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ProjectCardSkeletonProps {
  index: number;
}

const ProjectCardSkeleton: React.FC<ProjectCardSkeletonProps> = ({ index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 overflow-hidden"
      data-testid={`project-card-skeleton-${index}`}
    >
      {/* Shimmer effect overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <div className="flex items-start gap-4">
        {/* Icon skeleton */}
        <div className="p-3 bg-gray-700/50 rounded-lg animate-pulse">
          <div className="w-6 h-6 bg-gray-600/50 rounded" />
        </div>

        <div className="flex-1 space-y-3">
          {/* Title skeleton */}
          <div className="h-5 bg-gray-700/50 rounded animate-pulse w-3/4" />

          {/* Description skeleton - two lines */}
          <div className="space-y-2">
            <div className="h-3 bg-gray-700/30 rounded animate-pulse w-full" />
            <div className="h-3 bg-gray-700/30 rounded animate-pulse w-5/6" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCardSkeleton;
