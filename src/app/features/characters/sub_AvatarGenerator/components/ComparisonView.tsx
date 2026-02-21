/**
 * ComparisonView - Side-by-side avatar comparison component
 * Design: Clean Manuscript style with cyan accents
 *
 * Supports before/after, slider, and multi-panel comparison modes
 */

'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Columns,
  Rows,
  SplitSquareHorizontal,
  GalleryVerticalEnd,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  Image,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type { AvatarHistoryEntry } from '@/app/hooks/integration/useAvatarTimeline';

// ============================================================================
// Types
// ============================================================================

export type ComparisonMode = 'side-by-side' | 'slider' | 'stack' | 'carousel';

export interface ComparisonPair {
  before: AvatarHistoryEntry;
  after: AvatarHistoryEntry;
  label?: string;
}

export interface ComparisonViewProps {
  entries: AvatarHistoryEntry[];
  selectedPair?: ComparisonPair | null;
  onSelectPair?: (pair: ComparisonPair | null) => void;
  mode?: ComparisonMode;
  onModeChange?: (mode: ComparisonMode) => void;
  disabled?: boolean;
  compact?: boolean;
}

// ============================================================================
// Subcomponents
// ============================================================================

interface SliderComparisonProps {
  before: AvatarHistoryEntry;
  after: AvatarHistoryEntry;
  disabled?: boolean;
}

const SliderComparison: React.FC<SliderComparisonProps> = ({
  before,
  after,
  disabled = false,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = () => {
    if (disabled) return;
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current || !containerRef.current || disabled) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    },
    [disabled]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!containerRef.current || disabled) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    },
    [disabled]
  );

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
      className="relative w-full aspect-square overflow-hidden rounded-lg cursor-ew-resize bg-slate-800"
    >
      {/* After Image (Full width behind) */}
      <div className="absolute inset-0">
        {after.avatar_url ? (
          <img
            src={after.avatar_url}
            alt="After"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <Image size={48} />
          </div>
        )}
      </div>

      {/* Before Image (Clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        {before.avatar_url ? (
          <img
            src={before.avatar_url}
            alt="Before"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <Image size={48} />
          </div>
        )}
      </div>

      {/* Slider Line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg cursor-ew-resize"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        {/* Slider Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
          <ArrowLeftRight size={16} className="text-slate-800" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-[10px] font-mono text-white">
        Before
      </div>
      <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded text-[10px] font-mono text-white">
        After
      </div>
    </div>
  );
};

interface ImagePanelProps {
  entry: AvatarHistoryEntry;
  label: string;
  isSelected?: boolean;
  onClick?: () => void;
}

const ImagePanel: React.FC<ImagePanelProps> = ({
  entry,
  label,
  isSelected = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-lg bg-slate-800 transition-all',
        onClick && 'cursor-pointer',
        isSelected && 'ring-2 ring-cyan-500'
      )}
    >
      <div className="aspect-square">
        {entry.avatar_url ? (
          <img
            src={entry.avatar_url}
            alt={label}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <Image size={32} />
          </div>
        )}
      </div>

      {/* Label */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
        <span className="font-mono text-[10px] text-white">{label}</span>
        {entry.transformation_trigger && (
          <p className="font-mono text-[8px] text-slate-300 truncate">
            {entry.transformation_trigger}
          </p>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const ComparisonView: React.FC<ComparisonViewProps> = ({
  entries,
  selectedPair,
  onSelectPair,
  mode = 'side-by-side',
  onModeChange,
  disabled = false,
  compact = false,
}) => {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedBefore, setSelectedBefore] = useState<AvatarHistoryEntry | null>(null);
  const [selectedAfter, setSelectedAfter] = useState<AvatarHistoryEntry | null>(null);
  const [zoom, setZoom] = useState(1);

  // Generate comparison pairs from consecutive entries
  const availablePairs = useMemo((): ComparisonPair[] => {
    const pairs: ComparisonPair[] = [];
    for (let i = 0; i < entries.length - 1; i++) {
      pairs.push({
        before: entries[i],
        after: entries[i + 1],
        label: `${entries[i].transformation_type} → ${entries[i + 1].transformation_type}`,
      });
    }
    return pairs;
  }, [entries]);

  // Current pair for display
  const currentPair = useMemo((): ComparisonPair | null => {
    if (selectedPair) return selectedPair;
    if (selectedBefore && selectedAfter) {
      return { before: selectedBefore, after: selectedAfter };
    }
    if (availablePairs.length > 0) {
      return availablePairs[carouselIndex % availablePairs.length];
    }
    return null;
  }, [selectedPair, selectedBefore, selectedAfter, availablePairs, carouselIndex]);

  // Navigate carousel
  const navigateCarousel = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCarouselIndex((i) => (i - 1 + availablePairs.length) % availablePairs.length);
    } else {
      setCarouselIndex((i) => (i + 1) % availablePairs.length);
    }
  };

  // Handle entry selection for custom comparison
  const handleEntrySelect = (entry: AvatarHistoryEntry, position: 'before' | 'after') => {
    if (position === 'before') {
      setSelectedBefore(entry);
    } else {
      setSelectedAfter(entry);
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedBefore(null);
    setSelectedAfter(null);
    onSelectPair?.(null);
  };

  const MODE_OPTIONS: { mode: ComparisonMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'side-by-side', icon: <Columns size={14} />, label: 'Side by Side' },
    { mode: 'slider', icon: <SplitSquareHorizontal size={14} />, label: 'Slider' },
    { mode: 'stack', icon: <Rows size={14} />, label: 'Stack' },
    { mode: 'carousel', icon: <GalleryVerticalEnd size={14} />, label: 'Carousel' },
  ];

  if (compact) {
    if (!currentPair) {
      return (
        <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <h3 className="font-mono text-xs uppercase tracking-wide text-slate-300">
              compare
            </h3>
          </div>
          <p className="font-mono text-[10px] text-slate-600">
            Need at least 2 entries to compare
          </p>
        </div>
      );
    }

    return (
      <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <h3 className="font-mono text-xs uppercase tracking-wide text-slate-300">
              compare
            </h3>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => navigateCarousel('prev')}
              disabled={disabled || availablePairs.length <= 1}
              className="p-1 rounded bg-slate-800/40 hover:bg-slate-700/60 text-slate-400 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={12} />
            </button>
            <button
              onClick={() => navigateCarousel('next')}
              disabled={disabled || availablePairs.length <= 1}
              className="p-1 rounded bg-slate-800/40 hover:bg-slate-700/60 text-slate-400 disabled:opacity-50 transition-colors"
            >
              <ChevronRight size={12} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="aspect-square rounded overflow-hidden bg-slate-800">
            {currentPair.before.avatar_url ? (
              <img
                src={currentPair.before.thumbnail_url || currentPair.before.avatar_url}
                alt="Before"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-600">
                <Image size={20} />
              </div>
            )}
          </div>
          <div className="aspect-square rounded overflow-hidden bg-slate-800">
            {currentPair.after.avatar_url ? (
              <img
                src={currentPair.after.thumbnail_url || currentPair.after.avatar_url}
                alt="After"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-600">
                <Image size={20} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
            comparison_view
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode selector */}
          {onModeChange && (
            <div className="flex bg-slate-800/40 rounded-lg p-0.5">
              {MODE_OPTIONS.map((option) => (
                <button
                  key={option.mode}
                  onClick={() => onModeChange(option.mode)}
                  disabled={disabled}
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    mode === option.mode
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-slate-500 hover:text-slate-300'
                  )}
                  title={option.label}
                >
                  {option.icon}
                </button>
              ))}
            </div>
          )}

          {/* Zoom controls */}
          {mode !== 'carousel' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                disabled={disabled || zoom <= 0.5}
                className="p-1.5 rounded bg-slate-800/40 hover:bg-slate-700/60 text-slate-400 disabled:opacity-50 transition-colors"
              >
                <ZoomOut size={14} />
              </button>
              <span className="font-mono text-[10px] text-slate-500 w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
                disabled={disabled || zoom >= 2}
                className="p-1.5 rounded bg-slate-800/40 hover:bg-slate-700/60 text-slate-400 disabled:opacity-50 transition-colors"
              >
                <ZoomIn size={14} />
              </button>
            </div>
          )}

          {/* Clear selection */}
          {(selectedBefore || selectedAfter) && (
            <button
              onClick={clearSelection}
              className="p-1.5 rounded bg-slate-800/40 hover:bg-slate-700/60 text-slate-400 transition-colors"
              title="Clear selection"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Entry Selection (when no pair) */}
      {entries.length >= 2 && !currentPair && (
        <div className="mb-4">
          <p className="font-mono text-xs text-slate-500 mb-2">
            Select two entries to compare
          </p>
          <div className="grid grid-cols-4 gap-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  'relative aspect-square rounded overflow-hidden cursor-pointer transition-all',
                  'border-2',
                  selectedBefore?.id === entry.id
                    ? 'border-blue-500'
                    : selectedAfter?.id === entry.id
                    ? 'border-green-500'
                    : 'border-transparent hover:border-slate-600'
                )}
                onClick={() => {
                  if (!selectedBefore) {
                    handleEntrySelect(entry, 'before');
                  } else if (!selectedAfter && entry.id !== selectedBefore.id) {
                    handleEntrySelect(entry, 'after');
                  }
                }}
              >
                {entry.thumbnail_url || entry.avatar_url ? (
                  <img
                    src={entry.thumbnail_url || entry.avatar_url}
                    alt="Entry"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600">
                    <Image size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No entries */}
      {entries.length < 2 && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <Columns size={32} className="mb-3 opacity-50" />
          <p className="font-mono text-sm mb-1">Not enough entries</p>
          <p className="font-mono text-xs text-slate-600">
            Add at least 2 timeline entries to compare
          </p>
        </div>
      )}

      {/* Comparison Display */}
      {currentPair && (
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center top' }}
          className="transition-transform"
        >
          {/* Side by Side */}
          {mode === 'side-by-side' && (
            <div className="grid grid-cols-2 gap-4">
              <ImagePanel entry={currentPair.before} label="Before" />
              <ImagePanel entry={currentPair.after} label="After" />
            </div>
          )}

          {/* Slider */}
          {mode === 'slider' && (
            <SliderComparison
              before={currentPair.before}
              after={currentPair.after}
              disabled={disabled}
            />
          )}

          {/* Stack */}
          {mode === 'stack' && (
            <div className="space-y-4">
              <ImagePanel entry={currentPair.before} label="Before" />
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                  <ArrowLeftRight size={16} className="text-slate-500 rotate-90" />
                </div>
              </div>
              <ImagePanel entry={currentPair.after} label="After" />
            </div>
          )}

          {/* Carousel */}
          {mode === 'carousel' && (
            <div className="relative">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigateCarousel('prev')}
                  disabled={disabled || availablePairs.length <= 1}
                  className="p-2 rounded-lg bg-slate-800/40 hover:bg-slate-700/60 text-slate-400 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="flex-1 grid grid-cols-2 gap-4">
                  <ImagePanel entry={currentPair.before} label="Before" />
                  <ImagePanel entry={currentPair.after} label="After" />
                </div>

                <button
                  onClick={() => navigateCarousel('next')}
                  disabled={disabled || availablePairs.length <= 1}
                  className="p-2 rounded-lg bg-slate-800/40 hover:bg-slate-700/60 text-slate-400 disabled:opacity-50 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Pagination dots */}
              {availablePairs.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-4">
                  {availablePairs.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCarouselIndex(index)}
                      className={cn(
                        'w-2 h-2 rounded-full transition-colors',
                        index === carouselIndex % availablePairs.length
                          ? 'bg-cyan-400'
                          : 'bg-slate-700 hover:bg-slate-600'
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Comparison Details */}
      {currentPair && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <div className="grid grid-cols-2 gap-4">
            {/* Before Details */}
            <div>
              <span className="font-mono text-[10px] text-blue-400 uppercase block mb-1">
                before
              </span>
              <p className="font-mono text-xs text-slate-400">
                {currentPair.before.transformation_type}
              </p>
              {currentPair.before.transformation_trigger && (
                <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                  {currentPair.before.transformation_trigger}
                </p>
              )}
            </div>

            {/* After Details */}
            <div>
              <span className="font-mono text-[10px] text-green-400 uppercase block mb-1">
                after
              </span>
              <p className="font-mono text-xs text-slate-400">
                {currentPair.after.transformation_type}
              </p>
              {currentPair.after.transformation_trigger && (
                <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                  {currentPair.after.transformation_trigger}
                </p>
              )}
            </div>
          </div>

          {/* Visual changes in after */}
          {currentPair.after.visual_changes && currentPair.after.visual_changes.length > 0 && (
            <div className="mt-3">
              <span className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
                changes_recorded
              </span>
              <div className="flex flex-wrap gap-1">
                {currentPair.after.visual_changes.map((change, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-slate-800/60 rounded text-[10px] font-mono text-slate-400"
                  >
                    {change.attribute}: {change.from ? `${change.from} → ` : ''}{change.to}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ComparisonView;
