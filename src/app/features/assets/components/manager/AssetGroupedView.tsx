'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Sword,
  Shirt,
  Image,
  Film,
  Box,
  MapPin,
  Gem,
  ChevronRight,
} from 'lucide-react';
import { useAssetFiltersStore } from '../../store/assetFiltersStore';
import type { Asset, AssetType } from '@/app/types/Asset';

interface AssetGroupedViewProps {
  assets: Asset[];
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  Body: User,
  Equipment: Sword,
  Clothing: Shirt,
  Accessories: Gem,
  Background: Image,
  Scene: Film,
  Props: Box,
  Location: MapPin,
};

const TYPE_COLORS: Record<string, string> = {
  Body: 'text-blue-400',
  Equipment: 'text-red-400',
  Clothing: 'text-green-400',
  Accessories: 'text-pink-400',
  Background: 'text-purple-400',
  Scene: 'text-amber-400',
  Props: 'text-orange-400',
  Location: 'text-teal-400',
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
};

export default function AssetGroupedView({ assets }: AssetGroupedViewProps) {
  const { setAssetType } = useAssetFiltersStore();

  // Group assets by type
  const groupedAssets = useMemo(() => {
    const groups: Record<string, Asset[]> = {};

    assets.forEach((asset) => {
      const type = asset.type || 'Unknown';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(asset);
    });

    // Sort groups by type name and sort items within each group by name
    const sortedGroups = Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([type, items]) => ({
        type,
        items: items.sort((a, b) => a.name.localeCompare(b.name)),
      }));

    return sortedGroups;
  }, [assets]);

  const handleGroupClick = (type: string) => {
    setAssetType(type as AssetType);
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {groupedAssets.map(({ type, items }) => {
        const Icon = TYPE_ICONS[type] || Box;
        const colorClass = TYPE_COLORS[type] || 'text-slate-400';

        return (
          <motion.div
            key={type}
            variants={item}
            className="bg-slate-900/40 rounded-lg border border-slate-800/50 overflow-hidden"
          >
            {/* Group header - clickable to filter */}
            <button
              onClick={() => handleGroupClick(type)}
              className="w-full flex items-center justify-between p-3 hover:bg-slate-800/40
                transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${colorClass}`} />
                <span className="text-sm font-medium text-slate-200">{type}</span>
                <span className="text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400
                group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Item list - title only */}
            <div className="px-3 pb-3">
              <div className="flex flex-wrap gap-1.5">
                {items.slice(0, 12).map((asset) => (
                  <span
                    key={asset._id}
                    className="text-xs text-slate-400 bg-slate-800/40 px-2 py-1 rounded
                      hover:text-slate-200 hover:bg-slate-700/40 cursor-default
                      transition-colors truncate max-w-[150px]"
                    title={asset.name}
                  >
                    {asset.name}
                  </span>
                ))}
                {items.length > 12 && (
                  <button
                    onClick={() => handleGroupClick(type)}
                    className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded
                      hover:bg-cyan-500/20 transition-colors"
                  >
                    +{items.length - 12} more
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}

      {groupedAssets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <Box className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm">No assets to display</p>
        </div>
      )}
    </motion.div>
  );
}
