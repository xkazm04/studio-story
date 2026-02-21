'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid,
  Columns,
  RefreshCw,
  Pin,
  PinOff,
  Download,
  Trash2,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Sparkles,
  Shuffle,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  realTimeEngine,
  type GenerationResult,
  type Variation,
  type StyleParameters,
} from '@/lib/sketch';
import { cn } from '@/app/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface VariationGalleryProps {
  baseResult?: GenerationResult | null;
  variations?: Variation[];
  onSelect?: (result: GenerationResult) => void;
  onGenerateMore?: () => void;
  className?: string;
}

type ViewMode = 'grid' | 'carousel' | 'comparison';
type GridSize = 2 | 3 | 4;

// ============================================================================
// Sub-components
// ============================================================================

interface VariationCardProps {
  variation: Variation;
  isSelected: boolean;
  viewMode: ViewMode;
  onSelect: () => void;
  onPin: () => void;
  onDownload: () => void;
  onRemove: () => void;
}

const VariationCard: React.FC<VariationCardProps> = ({
  variation,
  isSelected,
  viewMode,
  onSelect,
  onPin,
  onDownload,
  onRemove,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const result = variation.result;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        'relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer',
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/30'
          : 'border-slate-700 hover:border-slate-600',
        viewMode === 'carousel' && 'flex-shrink-0 w-48'
      )}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="aspect-square bg-slate-900">
        <img
          src={result.imageUrl}
          alt={variation.label || 'Variation'}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Label */}
      {variation.label && (
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/80 rounded text-[10px] text-slate-300">
          {variation.label}
        </div>
      )}

      {/* Pinned indicator */}
      {result.isPinned && (
        <div className="absolute top-2 right-2 p-1 bg-yellow-500/20 rounded">
          <Pin className="w-3 h-3 text-yellow-400" />
        </div>
      )}

      {/* Hover overlay */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent"
          >
            <div className="absolute bottom-0 left-0 right-0 p-2">
              {/* Stats */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-slate-300">
                  {Math.round(result.confidence * 100)}% confidence
                </span>
                <span className="text-[10px] text-slate-400">
                  {result.processingTime}ms
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPin();
                    }}
                    className={cn(
                      'p-1 rounded transition-colors',
                      result.isPinned
                        ? 'text-yellow-400 bg-yellow-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    )}
                    title={result.isPinned ? 'Unpin' : 'Pin'}
                  >
                    {result.isPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload();
                    }}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface ComparisonViewProps {
  variations: Variation[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({
  variations,
  selectedIndex,
  onSelectIndex,
}) => {
  const [zoom, setZoom] = useState(1);

  if (variations.length < 2) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-xs">
        Need at least 2 variations to compare
      </div>
    );
  }

  const leftIndex = selectedIndex;
  const rightIndex = (selectedIndex + 1) % variations.length;
  const leftVar = variations[leftIndex];
  const rightVar = variations[rightIndex];

  return (
    <div className="space-y-3">
      {/* Comparison area */}
      <div
        className="relative flex gap-2 h-64"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
      >
        {/* Left image */}
        <div className="flex-1 relative rounded-lg overflow-hidden border border-slate-700">
          <img
            src={leftVar.result.imageUrl}
            alt={leftVar.label || 'Left'}
            className="w-full h-full object-contain bg-slate-900"
          />
          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/80 rounded text-[10px] text-slate-300">
            {leftVar.label || `#${leftIndex + 1}`}
          </div>
        </div>

        {/* Right image */}
        <div className="flex-1 relative rounded-lg overflow-hidden border border-slate-700">
          <img
            src={rightVar.result.imageUrl}
            alt={rightVar.label || 'Right'}
            className="w-full h-full object-contain bg-slate-900"
          />
          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-slate-900/80 rounded text-[10px] text-slate-300">
            {rightVar.label || `#${rightIndex + 1}`}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onSelectIndex((selectedIndex - 1 + variations.length) % variations.length)}
          className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className="p-1 text-slate-400 hover:text-white"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-400 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
            className="p-1 text-slate-400 hover:text-white"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => onSelectIndex((selectedIndex + 1) % variations.length)}
          className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Thumbnails */}
      <div className="flex justify-center gap-1 overflow-x-auto py-1">
        {variations.map((v, i) => (
          <button
            key={v.id}
            onClick={() => onSelectIndex(i)}
            className={cn(
              'w-10 h-10 rounded overflow-hidden border-2 transition-all flex-shrink-0',
              i === leftIndex || i === rightIndex
                ? 'border-blue-500'
                : 'border-slate-700 hover:border-slate-500'
            )}
          >
            <img
              src={v.result.imageUrl}
              alt={v.label || `Variation ${i + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const VariationGallery: React.FC<VariationGalleryProps> = ({
  baseResult,
  variations: externalVariations,
  onSelect,
  onGenerateMore,
  className,
}) => {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [gridSize, setGridSize] = useState<GridSize>(2);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localVariations, setLocalVariations] = useState<Variation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [comparisonIndex, setComparisonIndex] = useState(0);

  // Use external variations if provided, else local
  const variations = externalVariations ?? localVariations;

  // Generate variations from base result
  const handleGenerateVariations = useCallback(async () => {
    if (!baseResult) return;

    setIsGenerating(true);
    try {
      const newVariations = await realTimeEngine.generateVariations(baseResult, 4);
      setLocalVariations((prev) => [...prev, ...newVariations]);
    } catch (error) {
      console.error('Failed to generate variations:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [baseResult]);

  // Handle selection
  const handleSelect = useCallback(
    (variation: Variation) => {
      setSelectedId(variation.id);
      onSelect?.(variation.result);
    },
    [onSelect]
  );

  // Handle pin toggle
  const handleTogglePin = useCallback((variation: Variation) => {
    const result = variation.result;
    if (result.isPinned) {
      realTimeEngine.unpinResult(result.id);
    } else {
      realTimeEngine.pinResult(result.id);
    }
    setLocalVariations((prev) =>
      prev.map((v) =>
        v.id === variation.id
          ? { ...v, result: { ...v.result, isPinned: !v.result.isPinned } }
          : v
      )
    );
  }, []);

  // Handle download
  const handleDownload = useCallback((variation: Variation) => {
    const link = document.createElement('a');
    link.download = `variation_${variation.id}.png`;
    link.href = variation.result.imageUrl;
    link.click();
  }, []);

  // Handle remove
  const handleRemove = useCallback((variation: Variation) => {
    setLocalVariations((prev) => prev.filter((v) => v.id !== variation.id));
    if (selectedId === variation.id) {
      setSelectedId(null);
    }
  }, [selectedId]);

  // Handle copy seed
  const handleCopySeed = useCallback((variation: Variation) => {
    const seed = variation.result.metadata?.seed;
    if (seed) {
      navigator.clipboard.writeText(String(seed));
      setCopiedId(variation.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  // Clear all variations
  const handleClearAll = useCallback(() => {
    setLocalVariations((prev) => prev.filter((v) => v.result.isPinned));
    setSelectedId(null);
  }, []);

  // Grid columns class
  const gridColsClass = useMemo(() => {
    switch (gridSize) {
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-3';
      case 4:
        return 'grid-cols-4';
      default:
        return 'grid-cols-2';
    }
  }, [gridSize]);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-medium text-slate-200">Variations</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 rounded-full text-slate-400">
            {variations.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* View mode toggles */}
          <div className="flex items-center bg-slate-800 rounded p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1 rounded transition-colors',
                viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              )}
              title="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('carousel')}
              className={cn(
                'p-1 rounded transition-colors',
                viewMode === 'carousel' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              )}
              title="Carousel view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('comparison')}
              className={cn(
                'p-1 rounded transition-colors',
                viewMode === 'comparison' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              )}
              title="Comparison view"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Grid size (only for grid view) */}
          {viewMode === 'grid' && (
            <div className="flex items-center bg-slate-800 rounded p-0.5 ml-1">
              {([2, 3, 4] as GridSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => setGridSize(size)}
                  className={cn(
                    'px-1.5 py-0.5 text-[10px] rounded transition-colors',
                    gridSize === size ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          )}

          {/* Clear button */}
          {variations.length > 0 && (
            <button
              onClick={handleClearAll}
              className="p-1.5 text-slate-400 hover:text-red-400 rounded transition-colors ml-1"
              title="Clear non-pinned"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Generate button (when no variations) */}
      {variations.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <Shuffle className="w-10 h-10 text-slate-700" />
          <p className="text-xs text-slate-500 text-center">
            {baseResult
              ? 'Generate multiple variations of your preview'
              : 'Select a preview to generate variations'}
          </p>
          {baseResult && (
            <button
              onClick={handleGenerateVariations}
              disabled={isGenerating}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors',
                'bg-purple-600 hover:bg-purple-500 text-white',
                isGenerating && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Generate Variations
            </button>
          )}
        </div>
      ) : viewMode === 'comparison' ? (
        <ComparisonView
          variations={variations}
          selectedIndex={comparisonIndex}
          onSelectIndex={setComparisonIndex}
        />
      ) : viewMode === 'carousel' ? (
        // Carousel view
        <div className="flex gap-2 overflow-x-auto pb-2">
          {variations.map((variation) => (
            <VariationCard
              key={variation.id}
              variation={variation}
              isSelected={selectedId === variation.id}
              viewMode="carousel"
              onSelect={() => handleSelect(variation)}
              onPin={() => handleTogglePin(variation)}
              onDownload={() => handleDownload(variation)}
              onRemove={() => handleRemove(variation)}
            />
          ))}
        </div>
      ) : (
        // Grid view
        <div className={cn('grid gap-2', gridColsClass)}>
          {variations.map((variation) => (
            <VariationCard
              key={variation.id}
              variation={variation}
              isSelected={selectedId === variation.id}
              viewMode="grid"
              onSelect={() => handleSelect(variation)}
              onPin={() => handleTogglePin(variation)}
              onDownload={() => handleDownload(variation)}
              onRemove={() => handleRemove(variation)}
            />
          ))}
        </div>
      )}

      {/* Generate more button */}
      {variations.length > 0 && (
        <button
          onClick={onGenerateMore ?? handleGenerateVariations}
          disabled={isGenerating || !baseResult}
          className={cn(
            'flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs transition-colors',
            'bg-slate-800 hover:bg-slate-700 text-slate-300',
            (isGenerating || !baseResult) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isGenerating ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Shuffle className="w-3.5 h-3.5" />
          )}
          Generate More
        </button>
      )}

      {/* Selected variation info */}
      {selectedId && (
        <div className="p-2 bg-slate-800/50 rounded-lg">
          {(() => {
            const selected = variations.find((v) => v.id === selectedId);
            if (!selected) return null;
            return (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-slate-400">Seed:</span>
                  <span className="font-mono text-slate-300">
                    {selected.result.metadata?.seed}
                  </span>
                </div>
                <button
                  onClick={() => handleCopySeed(selected)}
                  className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                  title="Copy seed"
                >
                  {copiedId === selected.id ? (
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default VariationGallery;
