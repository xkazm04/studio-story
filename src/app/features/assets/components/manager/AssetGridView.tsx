'use client';

import { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import AssetGridItem from './AssetGridItem';
import type { Asset } from '@/app/types/Asset';

interface AssetGridViewProps {
  assets: Asset[];
  viewMode: 'grid' | 'list';
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    },
  },
};

export default function AssetGridView({
  assets,
  viewMode,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: AssetGridViewProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !isLoadingMore) {
        onLoadMore();
      }
    },
    [hasMore, isLoadingMore, onLoadMore]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0,
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  const gridClasses =
    viewMode === 'grid'
      ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3'
      : 'flex flex-col gap-2';

  return (
    <>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className={gridClasses}
      >
        {assets.map((asset, index) => (
          <AssetGridItem
            key={asset._id}
            asset={asset}
            viewMode={viewMode}
            index={index}
          />
        ))}
      </motion.div>

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="h-4" />
    </>
  );
}
