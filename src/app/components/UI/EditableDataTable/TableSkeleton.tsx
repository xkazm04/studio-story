'use client';

import { clsx } from 'clsx';

interface TableSkeletonProps {
  columns: number;
  rows?: number;
  className?: string;
}

export function TableSkeleton({ columns, rows = 5, className }: TableSkeletonProps) {
  return (
    <div className={clsx('w-full overflow-hidden rounded-lg border border-gray-800', className)}>
      {/* Header Skeleton */}
      <div className="flex py-2 px-3 border-b bg-gray-900/50 border-gray-800">
        <div className="w-10" /> {/* Index */}
        {Array.from({ length: columns }).map((_, idx) => (
          <div key={idx} className="flex-1 px-2">
            <div className="h-4 bg-gray-800 rounded animate-pulse" />
          </div>
        ))}
        <div className="w-24" /> {/* Actions */}
      </div>

      {/* Body Skeleton */}
      <div className="bg-gray-950">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex items-center py-2 px-3 border-b border-gray-800/50">
            <div className="w-10 flex items-center justify-center">
              <div className="h-4 w-6 bg-gray-800 rounded animate-pulse" />
            </div>
            {Array.from({ length: columns }).map((_, colIdx) => (
              <div key={colIdx} className="flex-1 px-2">
                <div
                  className="h-4 bg-gray-800 rounded animate-pulse"
                  style={{ animationDelay: `${(rowIdx * columns + colIdx) * 50}ms` }}
                />
              </div>
            ))}
            <div className="w-24 flex justify-end gap-1">
              <div className="h-6 w-6 bg-gray-800 rounded animate-pulse" />
              <div className="h-6 w-6 bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
