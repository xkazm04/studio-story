'use client';

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Eye, Plus, Check, ImageOff, Link2 } from 'lucide-react';
import { useAssetManagerStore } from '../../store/assetManagerStore';
import { useReferenceCount } from '@/lib/assets';
import type { Asset } from '@/app/types/Asset';

interface AssetGridItemProps {
  asset: Asset;
  viewMode: 'grid' | 'list';
  index: number;
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const TYPE_COLORS: Record<string, string> = {
  Body: 'bg-blue-500',
  Equipment: 'bg-red-500',
  Clothing: 'bg-green-500',
  Accessories: 'bg-pink-500',
  Background: 'bg-purple-500',
  Scene: 'bg-amber-500',
  Props: 'bg-orange-500',
  Location: 'bg-teal-500',
};

function AssetGridItem({ asset, viewMode, index }: AssetGridItemProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { selectedAssetIds, selectionMode, toggleAssetSelection, openDetail } =
    useAssetManagerStore();

  // Usage tracking
  const referenceCount = useReferenceCount(asset._id);

  const isSelected = selectedAssetIds.includes(asset._id);
  const typeColor = TYPE_COLORS[asset.type] || 'bg-slate-500';

  const handleClick = () => {
    if (selectionMode) {
      toggleAssetSelection(asset._id);
    } else {
      // Pass full asset for immediate display in detail panel
      openDetail(asset._id, asset);
    }
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        variants={item}
        onClick={handleClick}
        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer
          transition-all duration-200 border
          ${
            isSelected
              ? 'bg-cyan-500/10 border-cyan-500/40'
              : 'bg-slate-900/40 border-slate-800/60 hover:border-slate-700'
          }
        `}
      >
        {/* Thumbnail */}
        <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-slate-800">
          {asset.image_url && !imageError ? (
            <Image
              src={asset.image_url}
              alt={asset.name}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              sizes="48px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageOff className="w-5 h-5 text-slate-600" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-200 truncate">{asset.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`w-2 h-2 rounded-full ${typeColor}`}
            />
            <span className="text-xs text-slate-500 capitalize">{asset.type}</span>
            {asset.subcategory && (
              <span className="text-xs text-slate-600">{asset.subcategory}</span>
            )}
          </div>
        </div>

        {/* Reference count badge */}
        {referenceCount > 0 && (
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20"
            title={`Used in ${referenceCount} place(s)`}
          >
            <Link2 className="w-3 h-3 text-cyan-400" />
            <span className="text-[10px] font-medium text-cyan-400">{referenceCount}</span>
          </div>
        )}

        {/* Selection indicator */}
        {isSelected && (
          <div className="p-1 rounded-full bg-cyan-500/20">
            <Check className="w-4 h-4 text-cyan-400" />
          </div>
        )}
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      variants={item}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      className={`group relative aspect-square rounded-lg overflow-hidden cursor-pointer
        transition-all duration-200 border
        ${
          isSelected
            ? 'border-cyan-500/60 ring-1 ring-cyan-500/40 shadow-lg shadow-cyan-500/10'
            : 'border-slate-800/60 hover:border-cyan-500/40'
        }
      `}
    >
      {/* Image */}
      <div className="absolute inset-0 bg-slate-900">
        {asset.image_url && !imageError ? (
          <Image
            src={asset.image_url}
            alt={asset.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff className="w-8 h-8 text-slate-700" />
          </div>
        )}
      </div>

      {/* Type indicator dot */}
      <div className={`absolute top-2 left-2 w-2 h-2 rounded-full ${typeColor}`} />

      {/* Reference count badge - always visible if has references */}
      {referenceCount > 0 && (
        <div
          className="absolute top-2 left-6 flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-slate-900/80 border border-cyan-500/30"
          title={`Used in ${referenceCount} place(s)`}
        >
          <Link2 className="w-2.5 h-2.5 text-cyan-400" />
          <span className="text-[9px] font-medium text-cyan-400">{referenceCount}</span>
        </div>
      )}

      {/* Selection checkbox */}
      {(selectionMode || isHovered) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`absolute top-2 right-2 w-5 h-5 rounded-md flex items-center justify-center
            transition-colors
            ${
              isSelected
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-900/80 border border-slate-600 text-transparent hover:border-cyan-500/50'
            }
          `}
          onClick={(e) => {
            e.stopPropagation();
            toggleAssetSelection(asset._id);
          }}
        >
          <Check className="w-3 h-3" />
        </motion.div>
      )}

      {/* Hover overlay with actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent
          flex items-end justify-between p-2"
      >
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-100 truncate">{asset.name}</p>
          <p className="text-[10px] text-slate-400 truncate capitalize">{asset.subcategory || asset.type}</p>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDetail(asset._id, asset);
            }}
            className="p-1.5 rounded-md bg-slate-800/80 text-slate-300 hover:text-white
              hover:bg-slate-700 transition-colors"
            title="View details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Add to project action
            }}
            className="p-1.5 rounded-md bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30
              transition-colors"
            title="Add to project"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default memo(AssetGridItem);
