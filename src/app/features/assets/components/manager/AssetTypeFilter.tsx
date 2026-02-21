'use client';

import { motion } from 'framer-motion';
import {
  User,
  Sword,
  Shirt,
  Image,
  Film,
  Box,
  MapPin,
  Layers,
  Gem,
} from 'lucide-react';
import { useAssetFiltersStore } from '../../store/assetFiltersStore';
import type { AssetType } from '@/app/types/Asset';

interface TypeFilter {
  id: AssetType;
  label: string;
  icon: React.ElementType;
}

const TYPE_FILTERS: TypeFilter[] = [
  { id: 'Body', label: 'Body', icon: User },
  { id: 'Equipment', label: 'Equipment', icon: Sword },
  { id: 'Clothing', label: 'Clothing', icon: Shirt },
  { id: 'Accessories', label: 'Accessories', icon: Gem },
  { id: 'Background', label: 'Background', icon: Image },
  { id: 'Scene', label: 'Scene', icon: Film },
  { id: 'Props', label: 'Props', icon: Box },
  { id: 'Location', label: 'Location', icon: MapPin },
];

export default function AssetTypeFilter() {
  const { assetType, setAssetType } = useAssetFiltersStore();

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* All items button */}
      <button
        onClick={() => setAssetType(null)}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
          transition-all duration-200
          ${
            !assetType
              ? 'text-cyan-300'
              : 'text-slate-400 hover:text-slate-200'
          }
        `}
        data-testid="type-filter-all"
      >
        {!assetType && (
          <motion.div
            layoutId="typeIndicator"
            className="absolute inset-0 bg-cyan-500/20 border border-cyan-500/30 rounded-md"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        <Layers className="w-3.5 h-3.5 relative z-10" />
        <span className="relative z-10">All</span>
      </button>

      {/* Type buttons */}
      {TYPE_FILTERS.map((type) => {
        const Icon = type.icon;
        const isActive = assetType === type.id;

        return (
          <button
            key={type.id}
            onClick={() => setAssetType(isActive ? null : type.id)}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
              transition-all duration-200
              ${
                isActive
                  ? 'text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }
            `}
            data-testid={`type-filter-${type.id}`}
          >
            {isActive && (
              <motion.div
                layoutId="typeIndicator"
                className="absolute inset-0 bg-cyan-500/20 border border-cyan-500/30 rounded-md"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Icon className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">{type.label}</span>
          </button>
        );
      })}
    </div>
  );
}
