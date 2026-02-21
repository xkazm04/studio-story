'use client';

/**
 * AssetLeftPanel
 *
 * Navigation panel for assets - shows type groups with counts.
 * Communicates with ManagerPanel via Zustand store for filtering.
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  User,
  BookOpen,
  Shirt,
  Sword,
  PersonStanding,
  Mountain,
  MapPin,
  Box,
  Film,
  Image,
  Gem,
  Layers,
} from 'lucide-react';
import { useAssetManagerStore } from '../../store/assetManagerStore';
import { useAssetFiltersStore } from '../../store/assetFiltersStore';
import type { AssetType } from '@/app/types/Asset';

// Asset navigation structure with icons
const ASSET_GROUPS: {
  id: string;
  label: string;
  icon: React.ElementType;
  types: { id: AssetType; label: string; icon: React.ElementType }[];
}[] = [
  {
    id: 'character',
    label: 'Character Assets',
    icon: User,
    types: [
      { id: 'Body', label: 'Body', icon: PersonStanding },
      { id: 'Equipment', label: 'Equipment', icon: Sword },
      { id: 'Clothing', label: 'Clothing', icon: Shirt },
      { id: 'Accessories', label: 'Accessories', icon: Gem },
    ],
  },
  {
    id: 'story',
    label: 'Story Assets',
    icon: BookOpen,
    types: [
      { id: 'Background', label: 'Background', icon: Mountain },
      { id: 'Scene', label: 'Scene', icon: Film },
      { id: 'Props', label: 'Props', icon: Box },
      { id: 'Location', label: 'Location', icon: MapPin },
    ],
  },
];

export default function AssetLeftPanel() {
  const { expandedGroups, toggleGroup, navCollapsed } = useAssetManagerStore();
  const { assetType, setAssetType } = useAssetFiltersStore();

  // Handle selecting a specific type
  const handleTypeSelect = (type: AssetType) => {
    setAssetType(type);
  };

  // Handle "All Assets" selection
  const handleAllAssets = () => {
    setAssetType(null);
  };

  if (navCollapsed) {
    return (
      <div className="h-full flex flex-col items-center py-4 gap-3">
        <button
          onClick={handleAllAssets}
          className={`p-2 rounded-lg transition-colors ${
            !assetType
              ? 'bg-cyan-500/20 text-cyan-400'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
          }`}
          title="All Assets"
        >
          <Layers className="w-4 h-4" />
        </button>
        {ASSET_GROUPS.map((group) => {
          const Icon = group.icon;
          const isActive = group.types.some(t => t.id === assetType);
          return (
            <button
              key={group.id}
              onClick={() => toggleGroup(group.id)}
              className={`p-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
              title={group.label}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800/70">
        <Folder className="w-4 h-4 text-cyan-400" />
        <span className="text-sm font-medium text-slate-200">Asset Library</span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-2">
        {/* All Assets */}
        <button
          onClick={handleAllAssets}
          className={`w-full flex items-center gap-2 px-4 py-2 text-left text-sm transition-all duration-150 ${
            !assetType
              ? 'bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-l-2 border-transparent'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>All Assets</span>
        </button>

        {/* Type Groups */}
        {ASSET_GROUPS.map((group) => {
          const isExpanded = expandedGroups.includes(group.id);
          const GroupIcon = group.icon;
          const hasActiveType = group.types.some(t => t.id === assetType);

          return (
            <div key={group.id} className="mt-1">
              {/* Group Header */}
              <div className="flex items-center">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`flex-1 flex items-center gap-2 py-2 pr-4 text-left text-sm font-medium transition-all duration-150 ${
                    hasActiveType
                      ? 'text-cyan-400'
                      : 'text-slate-300 hover:text-slate-100'
                  }`}
                >
                  <GroupIcon className="w-4 h-4" />
                  <span>{group.label}</span>
                </button>
              </div>

              {/* Group Items */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {group.types.map((type) => {
                      const TypeIcon = type.icon;
                      const isTypeActive = assetType === type.id;

                      return (
                        <button
                          key={type.id}
                          onClick={() => handleTypeSelect(type.id)}
                          className={`w-full flex items-center gap-2 pl-10 pr-4 py-1.5 text-left text-xs transition-all duration-150 ${
                            isTypeActive
                              ? 'bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-500'
                              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30 border-l-2 border-transparent'
                          }`}
                        >
                          <TypeIcon className="w-3.5 h-3.5" />
                          <span>{type.label}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Footer Stats */}
      <div className="px-4 py-3 border-t border-slate-800/70 bg-slate-900/30">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>MongoDB Connected</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>
      </div>
    </div>
  );
}
