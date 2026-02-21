/**
 * StyleImageCard Component
 * Individual art style preview card with selection indicator, loading state, and tooltip
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';

interface StyleImageCardProps {
  imageUrl: string;
  label: string;
  description?: string;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  className?: string;
}

export function StyleImageCard({
  imageUrl,
  label,
  description,
  isSelected,
  onSelect,
  disabled = false,
  className,
}: StyleImageCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      title={description || label}
      className={cn(
        'group relative rounded-lg overflow-hidden border-2 transition-all',
        'hover:shadow-lg hover:shadow-cyan-500/10',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
        isSelected
          ? 'border-cyan-500 shadow-[0_0_0_2px_rgba(6,182,212,0.3)]'
          : 'border-slate-700 hover:border-cyan-500/50',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full bg-slate-800">
        {/* Loading skeleton */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800 animate-pulse">
            <Loader2 className="w-6 h-6 text-slate-600 animate-spin" />
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
            <span className="text-xs text-slate-500">Failed to load</span>
          </div>
        )}

        <Image
          src={imageUrl}
          alt={label}
          fill
          className={cn(
            'object-cover transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 150px"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 bg-cyan-500 text-white rounded-full p-1 shadow-lg">
            <Check className="w-3 h-3" />
          </div>
        )}

        {/* Hover tooltip preview */}
        {description && (
          <div className={cn(
            'absolute bottom-0 left-0 right-0 p-2',
            'bg-gradient-to-t from-black/90 to-transparent',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'pointer-events-none'
          )}>
            <p className="text-[10px] text-slate-300 line-clamp-2">
              {description}
            </p>
          </div>
        )}
      </div>

      {/* Label below image */}
      <div className="bg-slate-900 p-2 text-center border-t border-slate-800">
        <p
          className={cn(
            'font-medium text-xs truncate',
            isSelected ? 'text-cyan-400' : 'text-slate-200'
          )}
        >
          {label}
        </p>
      </div>
    </button>
  );
}
