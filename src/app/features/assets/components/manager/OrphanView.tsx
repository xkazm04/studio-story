'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmptyState } from '@/app/components/UI';
import {
  AlertTriangle,
  Trash2,
  Search,
  Calendar,
  Package,
  CheckSquare,
  Square,
  RefreshCw,
  Filter,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useOrphanDetection, OrphanAsset } from '@/lib/assets';
import { Button, IconButton } from '@/app/components/UI/Button';
import type { Asset } from '@/app/types/Asset';

interface OrphanViewProps {
  assets: Asset[] | undefined;
  onDeleteAsset?: (assetId: string) => void;
  onDeleteMultiple?: (assetIds: string[]) => void;
  onSelectAsset?: (assetId: string) => void;
  className?: string;
}

type SortOption = 'name' | 'type' | 'age';
type FilterAge = 'all' | 'recent' | 'old' | 'very-old';

/**
 * OrphanView - Displays and manages orphaned assets
 *
 * Lists assets with no references, allows bulk selection,
 * and provides delete functionality with confirmation.
 */
export function OrphanView({
  assets,
  onDeleteAsset,
  onDeleteMultiple,
  onSelectAsset,
  className,
}: OrphanViewProps) {
  const { orphans, orphanCount, isLoading } = useOrphanDetection(assets);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('age');
  const [filterAge, setFilterAge] = useState<FilterAge>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Filter and sort orphans
  const filteredOrphans = useMemo(() => {
    let result = [...orphans];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        orphan =>
          orphan.assetName.toLowerCase().includes(query) ||
          orphan.assetType.toLowerCase().includes(query)
      );
    }

    // Apply age filter
    switch (filterAge) {
      case 'recent':
        result = result.filter(o => o.daysSinceCreation !== undefined && o.daysSinceCreation < 7);
        break;
      case 'old':
        result = result.filter(
          o =>
            o.daysSinceCreation !== undefined &&
            o.daysSinceCreation >= 7 &&
            o.daysSinceCreation < 30
        );
        break;
      case 'very-old':
        result = result.filter(
          o => o.daysSinceCreation !== undefined && o.daysSinceCreation >= 30
        );
        break;
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.assetName.localeCompare(b.assetName);
        case 'type':
          return a.assetType.localeCompare(b.assetType);
        case 'age':
          return (b.daysSinceCreation ?? 0) - (a.daysSinceCreation ?? 0);
        default:
          return 0;
      }
    });

    return result;
  }, [orphans, searchQuery, sortBy, filterAge]);

  const toggleSelect = (assetId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredOrphans.map(o => o.assetId)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = () => {
    if (onDeleteMultiple && selectedIds.size > 0) {
      onDeleteMultiple(Array.from(selectedIds));
      setSelectedIds(new Set());
      setShowDeleteConfirm(false);
    }
  };

  const formatAge = (days: number | undefined) => {
    if (days === undefined) return 'Unknown';
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    if (days < 7) return `${days} days`;
    if (days < 30) return `${Math.floor(days / 7)} weeks`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return `${Math.floor(days / 365)} years`;
  };

  const getAgeColor = (days: number | undefined) => {
    if (days === undefined) return 'text-slate-400';
    if (days < 7) return 'text-green-400';
    if (days < 30) return 'text-amber-400';
    return 'text-red-400';
  };

  if (isLoading) {
    return (
      <div className={clsx('flex items-center justify-center p-8', className)}>
        <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
        <span className="ml-2 text-slate-400">Scanning for orphans...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={clsx('flex flex-col h-full', className)}
    >
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-slate-800/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-slate-100">Orphan Assets</h2>
              <p className="text-xs text-slate-400">
                {orphanCount} unused asset{orphanCount !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>

          {selectedIds.size > 0 && (
            <Button
              size="sm"
              variant="danger"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete {selectedIds.size}
            </Button>
          )}
        </div>

        {/* Search and filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search orphans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={clsx(
                'w-full pl-10 pr-4 py-2 rounded-lg',
                'bg-slate-800/50 border border-slate-700/50',
                'text-sm text-slate-100 placeholder:text-slate-500',
                'focus:outline-none focus:ring-2 focus:ring-cyan-500/50'
              )}
            />
          </div>

          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className={clsx(
              'px-3 py-2 rounded-lg',
              'bg-slate-800/50 border border-slate-700/50',
              'text-sm text-slate-200',
              'focus:outline-none focus:ring-2 focus:ring-cyan-500/50'
            )}
          >
            <option value="age">Sort by Age</option>
            <option value="name">Sort by Name</option>
            <option value="type">Sort by Type</option>
          </select>
        </div>

        {/* Age filter chips */}
        <div className="flex gap-2 mt-3">
          {(['all', 'recent', 'old', 'very-old'] as FilterAge[]).map(age => (
            <button
              key={age}
              onClick={() => setFilterAge(age)}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                filterAge === age
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-slate-200'
              )}
            >
              {age === 'all' && 'All'}
              {age === 'recent' && '< 7 days'}
              {age === 'old' && '7-30 days'}
              {age === 'very-old' && '30+ days'}
            </button>
          ))}
        </div>

        {/* Selection controls */}
        {filteredOrphans.length > 0 && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-800/50">
            <button
              onClick={selectedIds.size === filteredOrphans.length ? deselectAll : selectAll}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              {selectedIds.size === filteredOrphans.length ? (
                <CheckSquare className="w-4 h-4 text-cyan-400" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {selectedIds.size === filteredOrphans.length ? 'Deselect All' : 'Select All'}
            </button>
            {selectedIds.size > 0 && (
              <span className="text-xs text-slate-500">
                {selectedIds.size} selected
              </span>
            )}
          </div>
        )}
      </div>

      {/* Orphan list */}
      <div className="flex-1 overflow-auto p-4">
        {filteredOrphans.length === 0 ? (
          <EmptyState
            icon={<Package />}
            title={orphanCount === 0 ? 'No orphan assets' : 'No matches found'}
            subtitle={orphanCount === 0 ? 'All assets are in use' : 'Try adjusting your search or filters'}
            variant="compact"
          />
        ) : (
          <div className="space-y-2">
            {filteredOrphans.map(orphan => (
              <motion.div
                key={orphan.assetId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx(
                  'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                  selectedIds.has(orphan.assetId)
                    ? 'bg-cyan-500/10 border-cyan-500/30'
                    : 'bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50'
                )}
              >
                {/* Selection checkbox */}
                <button
                  onClick={() => toggleSelect(orphan.assetId)}
                  className="shrink-0"
                >
                  {selectedIds.has(orphan.assetId) ? (
                    <CheckSquare className="w-5 h-5 text-cyan-400" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400 hover:text-slate-200" />
                  )}
                </button>

                {/* Asset info */}
                <button
                  className="flex-1 min-w-0 text-left"
                  onClick={() => onSelectAsset?.(orphan.assetId)}
                >
                  <p className="text-sm font-medium text-slate-100 truncate">
                    {orphan.assetName}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">{orphan.assetType}</span>
                    <span className="text-slate-600">•</span>
                    <span className={clsx('text-xs', getAgeColor(orphan.daysSinceCreation))}>
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {formatAge(orphan.daysSinceCreation)}
                    </span>
                  </div>
                </button>

                {/* Delete button */}
                {onDeleteAsset && (
                  <IconButton
                    icon={<Trash2 className="w-4 h-4" />}
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteAsset(orphan.assetId)}
                    aria-label="Delete asset"
                    className="text-slate-400 hover:text-red-400"
                  />
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 mx-4 bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    Delete {selectedIds.size} Asset{selectedIds.size !== 1 ? 's' : ''}?
                  </h3>
                  <p className="text-sm text-slate-400">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-300 mb-6">
                You are about to permanently delete {selectedIds.size} orphan asset
                {selectedIds.size !== 1 ? 's' : ''}. These assets have no references and
                are safe to remove.
              </p>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  icon={<Trash2 className="w-4 h-4" />}
                  onClick={handleDeleteSelected}
                >
                  Delete Assets
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default OrphanView;
