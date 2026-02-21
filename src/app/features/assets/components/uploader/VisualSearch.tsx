'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  Eye,
  Sparkles,
  Palette,
  Layers,
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  useVisualSearch,
  useStyleGroups,
  type SimilarityMatch,
  type StyleGroup,
} from '@/lib/similarity';
import { Button, IconButton } from '@/app/components/UI/Button';
import type { Asset } from '@/app/types/Asset';

interface VisualSearchProps {
  assets: Asset[];
  onSelectAsset?: (assetId: string) => void;
  className?: string;
}

// Match type colors and labels
const matchTypeConfig: Record<string, { color: string; label: string; iconName: string }> = {
  'exact': { color: 'red', label: 'Exact Match', iconName: 'layers' },
  'near-duplicate': { color: 'amber', label: 'Near Duplicate', iconName: 'layers' },
  'similar': { color: 'cyan', label: 'Similar', iconName: 'eye' },
  'style-match': { color: 'purple', label: 'Style Match', iconName: 'sparkles' },
};

const getMatchIcon = (iconName: string) => {
  switch (iconName) {
    case 'layers': return Layers;
    case 'eye': return Eye;
    case 'sparkles': return Sparkles;
    default: return Eye;
  }
};

export default function VisualSearch({
  assets,
  onSelectAsset,
  className = '',
}: VisualSearchProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [queryImage, setQueryImage] = useState<File | null>(null);
  const [queryPreview, setQueryPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'styles'>('search');

  const { search, isSearching, matches, clear } = useVisualSearch();
  const { groups: styleGroups, isLoading: isLoadingStyles, cluster } = useStyleGroups();

  const handleFileSelect = useCallback(async (file: File) => {
    setQueryImage(file);
    setQueryPreview(URL.createObjectURL(file));
    await search(file, { maxResults: 20, threshold: 0.5 });
  }, [search]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleClear = useCallback(() => {
    setQueryImage(null);
    if (queryPreview) {
      URL.revokeObjectURL(queryPreview);
    }
    setQueryPreview(null);
    clear();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [queryPreview, clear]);

  const handleRefreshStyles = useCallback(async () => {
    await cluster({ numClusters: 6, minClusterSize: 2 });
  }, [cluster]);

  // Get asset details from ID
  const getAsset = (assetId: string): Asset | undefined => {
    return assets.find(a => a._id === assetId);
  };

  return (
    <div className={clsx('flex flex-col h-full', className)}>
      {/* Tab navigation */}
      <div className="flex gap-1 p-1 bg-slate-900/40 rounded-lg border border-slate-800/50 mb-4">
        <button
          onClick={() => setActiveTab('search')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
            activeTab === 'search'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          <Search className="w-4 h-4" />
          Visual Search
        </button>
        <button
          onClick={() => setActiveTab('styles')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
            activeTab === 'styles'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          <Palette className="w-4 h-4" />
          Style Groups
        </button>
      </div>

      {/* Visual Search Tab */}
      {activeTab === 'search' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Query image dropzone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={clsx(
              'relative rounded-lg border-2 border-dashed transition-colors',
              queryPreview
                ? 'border-cyan-500/30 bg-cyan-500/5'
                : 'border-slate-700 hover:border-slate-600 bg-slate-900/30'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />

            {queryPreview ? (
              <div className="p-4 flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                  <img
                    src={queryPreview}
                    alt="Query image"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {queryImage?.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {matches.length} similar images found
                  </p>
                </div>
                <IconButton
                  icon={<X className="w-4 h-4" />}
                  aria-label="Clear search"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="text-slate-500 hover:text-slate-300"
                />
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-300 mb-1">
                  Drop an image to search
                </p>
                <p className="text-xs text-slate-500">
                  Find visually similar images in your library
                </p>
              </div>
            )}
          </div>

          {/* Loading state */}
          {isSearching && (
            <div className="flex items-center justify-center gap-2 py-8">
              <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
              <span className="text-sm text-slate-400">Searching...</span>
            </div>
          )}

          {/* Results */}
          {!isSearching && matches.length > 0 && (
            <div className="flex-1 overflow-auto mt-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">
                Similar Images ({matches.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {matches.map((match) => {
                  const asset = getAsset(match.assetId);
                  if (!asset) return null;

                  const config = matchTypeConfig[match.matchType];
                  const MatchIcon = getMatchIcon(config.iconName);

                  return (
                    <motion.div
                      key={match.assetId}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => onSelectAsset?.(match.assetId)}
                      className="relative group cursor-pointer rounded-lg overflow-hidden bg-slate-900 border border-slate-800 hover:border-slate-700"
                    >
                      {/* Image */}
                      <div className="aspect-square bg-slate-800">
                        {asset.image_url ? (
                          <img
                            src={asset.image_url}
                            alt={asset.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-slate-600" />
                          </div>
                        )}
                      </div>

                      {/* Match badge */}
                      <div
                        className={clsx(
                          'absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                          `bg-${config.color}-500/20 text-${config.color}-400`
                        )}
                        style={{
                          backgroundColor: `var(--${config.color}-500-20, rgba(0,0,0,0.2))`,
                        }}
                      >
                        <MatchIcon className="w-3 h-3" />
                        {Math.round(match.score * 100)}%
                      </div>

                      {/* Info overlay */}
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-slate-900/90 to-transparent">
                        <p className="text-xs text-slate-200 truncate">
                          {asset.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {config.label}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!isSearching && queryPreview && matches.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center py-8">
                <ImageIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No similar images found</p>
                <p className="text-xs text-slate-500 mt-1">
                  Try uploading more images to your library
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Style Groups Tab */}
      {activeTab === 'styles' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-400">
              {styleGroups.length} style groups detected
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefreshStyles}
              disabled={isLoadingStyles}
            >
              {isLoadingStyles ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span className="ml-2">Reanalyze</span>
            </Button>
          </div>

          {/* Loading state */}
          {isLoadingStyles && (
            <div className="flex items-center justify-center gap-2 py-8">
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
              <span className="text-sm text-slate-400">Analyzing styles...</span>
            </div>
          )}

          {/* Style groups */}
          {!isLoadingStyles && styleGroups.length > 0 && (
            <div className="flex-1 overflow-auto space-y-4">
              {styleGroups.map((group) => (
                <StyleGroupCard
                  key={group.id}
                  group={group}
                  assets={assets}
                  onSelectAsset={onSelectAsset}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoadingStyles && styleGroups.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center py-8">
                <Palette className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No style groups yet</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Upload more images and click Reanalyze
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRefreshStyles}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Styles
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Style group card component
interface StyleGroupCardProps {
  group: StyleGroup;
  assets: Asset[];
  onSelectAsset?: (assetId: string) => void;
}

function StyleGroupCard({ group, assets, onSelectAsset }: StyleGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayAssets = isExpanded ? group.assetIds : group.assetIds.slice(0, 4);

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden">
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-800/30"
      >
        {/* Color swatch */}
        <div
          className="w-10 h-10 rounded-lg"
          style={{ backgroundColor: group.centroid.averageColor }}
        />

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-slate-200">{group.name}</h4>
          <p className="text-xs text-slate-400 truncate">{group.description}</p>
        </div>

        <span className="text-xs text-slate-500 px-2 py-1 bg-slate-800 rounded">
          {group.assetIds.length} images
        </span>
      </div>

      {/* Characteristics */}
      <div className="px-3 pb-2 flex flex-wrap gap-1">
        <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400">
          {group.characteristics.brightnessLevel}
        </span>
        <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400">
          {group.characteristics.aspectCategory}
        </span>
        {group.characteristics.dominantColors.slice(0, 3).map((color, i) => (
          <span
            key={i}
            className="px-2 py-0.5 rounded text-xs flex items-center gap-1"
            style={{ backgroundColor: `${color}20` }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
          </span>
        ))}
      </div>

      {/* Asset thumbnails */}
      <div className="px-3 pb-3">
        <div className="grid grid-cols-4 gap-2">
          {displayAssets.map((assetId) => {
            const asset = assets.find((a) => a._id === assetId);
            if (!asset) return null;

            return (
              <motion.div
                key={assetId}
                whileHover={{ scale: 1.05 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectAsset?.(assetId);
                }}
                className="aspect-square rounded overflow-hidden bg-slate-800 cursor-pointer"
              >
                {asset.image_url ? (
                  <img
                    src={asset.image_url}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-slate-600" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Show more/less */}
        {group.assetIds.length > 4 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-2 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            {isExpanded
              ? 'Show less'
              : `Show ${group.assetIds.length - 4} more`}
          </button>
        )}
      </div>
    </div>
  );
}
