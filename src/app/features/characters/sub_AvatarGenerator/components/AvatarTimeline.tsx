/**
 * AvatarTimeline - Visual timeline showing character avatar evolution
 * Design: Clean Manuscript style with cyan accents
 *
 * Displays avatar changes throughout the story with transformation tracking
 */

'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  Star,
  Sparkles,
  Zap,
  Heart,
  Skull,
  Shield,
  Users,
  Eye,
  Plus,
  Search,
  X,
  Image,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type {
  AvatarHistoryEntry,
  TransformationType,
  AgeStage,
} from '@/app/hooks/integration/useAvatarTimeline';

// ============================================================================
// Types
// ============================================================================

export interface AvatarTimelineProps {
  entries: AvatarHistoryEntry[];
  isLoading?: boolean;
  selectedEntryId?: string | null;
  onSelectEntry?: (entry: AvatarHistoryEntry | null) => void;
  onAddEntry?: () => void;
  onDeleteEntry?: (entryId: string) => void;
  showFilters?: boolean;
  compact?: boolean;
}

type ViewMode = 'timeline' | 'grid' | 'filmstrip';

// ============================================================================
// Constants
// ============================================================================

const TRANSFORMATION_CONFIG: Record<TransformationType, {
  label: string;
  icon: React.ReactNode;
  color: string;
}> = {
  initial: {
    label: 'Initial',
    icon: <Star size={14} />,
    color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
  },
  natural_aging: {
    label: 'Aging',
    icon: <Clock size={14} />,
    color: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
  },
  injury: {
    label: 'Injury',
    icon: <Skull size={14} />,
    color: 'text-red-400 bg-red-500/20 border-red-500/30',
  },
  healing: {
    label: 'Healing',
    icon: <Heart size={14} />,
    color: 'text-green-400 bg-green-500/20 border-green-500/30',
  },
  magical: {
    label: 'Magical',
    icon: <Sparkles size={14} />,
    color: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
  },
  costume_change: {
    label: 'Costume',
    icon: <Users size={14} />,
    color: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
  },
  emotional: {
    label: 'Emotional',
    icon: <Zap size={14} />,
    color: 'text-pink-400 bg-pink-500/20 border-pink-500/30',
  },
  custom: {
    label: 'Custom',
    icon: <Shield size={14} />,
    color: 'text-slate-400 bg-slate-500/20 border-slate-500/30',
  },
};

const AGE_STAGE_CONFIG: Record<AgeStage, { label: string; order: number }> = {
  child: { label: 'Child', order: 0 },
  teen: { label: 'Teen', order: 1 },
  young_adult: { label: 'Young Adult', order: 2 },
  adult: { label: 'Adult', order: 3 },
  middle_aged: { label: 'Middle Aged', order: 4 },
  elderly: { label: 'Elderly', order: 5 },
};

// ============================================================================
// Subcomponents
// ============================================================================

interface TimelineEntryCardProps {
  entry: AvatarHistoryEntry;
  isSelected: boolean;
  onClick: () => void;
  compact?: boolean;
}

const TimelineEntryCard: React.FC<TimelineEntryCardProps> = ({
  entry,
  isSelected,
  onClick,
  compact = false,
}) => {
  const config = TRANSFORMATION_CONFIG[entry.transformation_type];
  const ageConfig = entry.age_stage ? AGE_STAGE_CONFIG[entry.age_stage] : null;

  if (compact) {
    return (
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'relative group transition-all rounded-lg overflow-hidden border-2',
          isSelected
            ? 'border-cyan-500 ring-2 ring-cyan-500/30'
            : 'border-slate-700/50 hover:border-slate-600'
        )}
      >
        <div className="w-16 h-16 bg-slate-800">
          {entry.thumbnail_url || entry.avatar_url ? (
            <img
              src={entry.thumbnail_url || entry.avatar_url}
              alt={entry.transformation_trigger || 'Avatar'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600">
              <Image size={20} />
            </div>
          )}
        </div>
        {entry.is_milestone && (
          <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-yellow-400" />
        )}
        <div className={cn(
          'absolute bottom-0 left-0 right-0 px-1 py-0.5 text-[8px] font-mono',
          config.color
        )}>
          {config.icon}
        </div>
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative group transition-all rounded-lg overflow-hidden border text-left',
        'bg-slate-800/40',
        isSelected
          ? 'border-cyan-500 ring-2 ring-cyan-500/20'
          : 'border-slate-700/50 hover:border-slate-600'
      )}
    >
      {/* Image */}
      <div className="aspect-square bg-slate-800 overflow-hidden">
        {entry.thumbnail_url || entry.avatar_url ? (
          <img
            src={entry.thumbnail_url || entry.avatar_url}
            alt={entry.transformation_trigger || 'Avatar'}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <Image size={32} />
          </div>
        )}
      </div>

      {/* Milestone badge */}
      {entry.is_milestone && (
        <div className="absolute top-2 right-2 p-1 rounded-full bg-yellow-500/20 border border-yellow-500/40">
          <Star size={12} className="text-yellow-400" />
        </div>
      )}

      {/* Info */}
      <div className="p-3">
        {/* Type badge */}
        <div className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border mb-2',
          config.color
        )}>
          {config.icon}
          <span>{config.label}</span>
        </div>

        {/* Trigger/Title */}
        {entry.transformation_trigger && (
          <p className="font-mono text-xs text-slate-300 line-clamp-1 mb-1">
            {entry.transformation_trigger}
          </p>
        )}

        {/* Age stage */}
        {ageConfig && (
          <p className="font-mono text-[10px] text-slate-500">
            {ageConfig.label}
            {entry.estimated_age && ` (${entry.estimated_age}y)`}
          </p>
        )}

        {/* Scene reference */}
        {entry.scene && (
          <p className="font-mono text-[10px] text-cyan-500/70 mt-1">
            Scene {entry.scene.scene_number}: {entry.scene.title}
          </p>
        )}
      </div>
    </motion.button>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const AvatarTimeline: React.FC<AvatarTimelineProps> = ({
  entries,
  isLoading = false,
  selectedEntryId,
  onSelectEntry,
  onAddEntry,
  onDeleteEntry,
  showFilters = true,
  compact = false,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TransformationType | 'all'>('all');
  const [filterMilestones, setFilterMilestones] = useState(false);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTrigger = entry.transformation_trigger?.toLowerCase().includes(query);
        const matchesNotes = entry.notes?.toLowerCase().includes(query);
        if (!matchesTrigger && !matchesNotes) return false;
      }
      if (filterType !== 'all' && entry.transformation_type !== filterType) {
        return false;
      }
      if (filterMilestones && !entry.is_milestone) {
        return false;
      }
      return true;
    });
  }, [entries, searchQuery, filterType, filterMilestones]);

  // Get selected entry
  const selectedEntry = useMemo(() => {
    if (!selectedEntryId) return null;
    return entries.find((e) => e.id === selectedEntryId) || null;
  }, [entries, selectedEntryId]);

  const handleEntryClick = (entry: AvatarHistoryEntry) => {
    if (onSelectEntry) {
      if (selectedEntryId === entry.id) {
        onSelectEntry(null);
      } else {
        onSelectEntry(entry);
      }
    }
  };

  // Compact filmstrip view
  if (compact) {
    return (
      <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <h3 className="font-mono text-xs uppercase tracking-wide text-slate-300">
              timeline
            </h3>
            <span className="px-1.5 py-0.5 bg-slate-800/60 rounded text-[10px] font-mono text-slate-500">
              {entries.length}
            </span>
          </div>
          {onAddEntry && (
            <button
              onClick={onAddEntry}
              className="p-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 transition-colors"
            >
              <Plus size={12} />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
          {filteredEntries.map((entry) => (
            <TimelineEntryCard
              key={entry.id}
              entry={entry}
              isSelected={selectedEntryId === entry.id}
              onClick={() => handleEntryClick(entry)}
              compact
            />
          ))}
          {filteredEntries.length === 0 && (
            <div className="flex-1 flex items-center justify-center py-4 text-slate-600">
              <span className="font-mono text-xs">No timeline entries</span>
            </div>
          )}
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
            avatar_timeline
          </h3>
          <span className="px-2 py-0.5 bg-slate-800/60 rounded text-xs font-mono text-slate-500">
            {filteredEntries.length} / {entries.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode buttons */}
          <div className="flex bg-slate-800/40 rounded-lg p-0.5">
            {(['timeline', 'grid', 'filmstrip'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'px-2 py-1 rounded font-mono text-[10px] uppercase transition-colors',
                  viewMode === mode
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-slate-500 hover:text-slate-300'
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          {onAddEntry && (
            <button
              onClick={onAddEntry}
              className="flex items-center gap-1 px-2 py-1 rounded bg-cyan-500/20
                         hover:bg-cyan-500/30 text-cyan-400 text-xs font-mono transition-colors"
            >
              <Plus size={12} />
              <span>add</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search timeline..."
              className="w-full pl-8 pr-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-lg
                         font-mono text-xs text-slate-300 placeholder:text-slate-600
                         focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            />
          </div>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as TransformationType | 'all')}
            className="px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-lg
                       font-mono text-xs text-slate-300
                       focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          >
            <option value="all">All Types</option>
            {Object.entries(TRANSFORMATION_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          {/* Milestones toggle */}
          <button
            onClick={() => setFilterMilestones(!filterMilestones)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg border font-mono text-xs transition-colors',
              filterMilestones
                ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:border-slate-600'
            )}
          >
            <Star size={12} />
            <span>Milestones</span>
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Timeline View */}
      {!isLoading && viewMode === 'timeline' && (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-700/50" />

          <div className="space-y-4">
            {filteredEntries.map((entry, index) => {
              const config = TRANSFORMATION_CONFIG[entry.transformation_type];
              const isSelected = selectedEntryId === entry.id;

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative flex gap-4"
                >
                  {/* Timeline node */}
                  <div className={cn(
                    'relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors',
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-500'
                      : 'bg-slate-800 border-slate-700',
                    config.color.split(' ')[0]
                  )}>
                    {config.icon}
                    {entry.is_milestone && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-400" />
                    )}
                  </div>

                  {/* Entry card */}
                  <div
                    onClick={() => handleEntryClick(entry)}
                    className={cn(
                      'flex-1 p-3 rounded-lg border cursor-pointer transition-all',
                      'bg-slate-800/40',
                      isSelected
                        ? 'border-cyan-500 ring-1 ring-cyan-500/20'
                        : 'border-slate-700/50 hover:border-slate-600'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded overflow-hidden bg-slate-700 flex-shrink-0">
                        {entry.thumbnail_url || entry.avatar_url ? (
                          <img
                            src={entry.thumbnail_url || entry.avatar_url}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <Image size={20} />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            'px-1.5 py-0.5 rounded text-[10px] font-mono border',
                            config.color
                          )}>
                            {config.label}
                          </span>
                          {entry.age_stage && (
                            <span className="px-1.5 py-0.5 bg-slate-700/50 rounded text-[10px] font-mono text-slate-400">
                              {AGE_STAGE_CONFIG[entry.age_stage].label}
                            </span>
                          )}
                        </div>

                        {entry.transformation_trigger && (
                          <p className="font-mono text-xs text-slate-300 line-clamp-1">
                            {entry.transformation_trigger}
                          </p>
                        )}

                        {entry.scene && (
                          <p className="font-mono text-[10px] text-cyan-500/70 mt-1">
                            Scene {entry.scene.scene_number}: {entry.scene.title}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid View */}
      {!isLoading && viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredEntries.map((entry) => (
            <TimelineEntryCard
              key={entry.id}
              entry={entry}
              isSelected={selectedEntryId === entry.id}
              onClick={() => handleEntryClick(entry)}
            />
          ))}
        </div>
      )}

      {/* Filmstrip View */}
      {!isLoading && viewMode === 'filmstrip' && (
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700">
          {filteredEntries.map((entry) => (
            <div key={entry.id} className="flex-shrink-0 w-32">
              <TimelineEntryCard
                entry={entry}
                isSelected={selectedEntryId === entry.id}
                onClick={() => handleEntryClick(entry)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredEntries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <Clock size={32} className="mb-3 opacity-50" />
          <p className="font-mono text-sm mb-1">No timeline entries</p>
          <p className="font-mono text-xs text-slate-600">
            {entries.length > 0 ? 'Try adjusting your filters' : 'Add an entry to start tracking evolution'}
          </p>
          {entries.length === 0 && onAddEntry && (
            <button
              onClick={onAddEntry}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg
                         bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400
                         font-mono text-xs transition-colors"
            >
              <Plus size={14} />
              <span>Add First Entry</span>
            </button>
          )}
        </div>
      )}

      {/* Selected Entry Details */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-slate-700/50"
          >
            <div className="flex items-start gap-4">
              {/* Full image */}
              <div className="w-32 h-32 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                {selectedEntry.avatar_url ? (
                  <img
                    src={selectedEntry.avatar_url}
                    alt="Selected Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <Image size={32} />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-slate-400 uppercase">
                    selected_entry
                  </span>
                  <button
                    onClick={() => onSelectEntry?.(null)}
                    className="p-1 rounded hover:bg-slate-700/50 text-slate-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                {selectedEntry.transformation_trigger && (
                  <p className="font-mono text-sm text-slate-300 mb-2">
                    {selectedEntry.transformation_trigger}
                  </p>
                )}

                {selectedEntry.notes && (
                  <p className="font-mono text-xs text-slate-500 mb-3">
                    {selectedEntry.notes}
                  </p>
                )}

                {/* Visual changes */}
                {selectedEntry.visual_changes && selectedEntry.visual_changes.length > 0 && (
                  <div className="mb-3">
                    <span className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
                      visual_changes
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedEntry.visual_changes.map((change, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-slate-800/60 rounded text-[10px] font-mono text-slate-400"
                        >
                          {change.attribute}: {change.to}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    className="flex items-center gap-1 px-2 py-1 rounded
                               bg-slate-800/40 hover:bg-slate-700/60 text-slate-400
                               font-mono text-[10px] transition-colors"
                  >
                    <Eye size={12} />
                    <span>View Full</span>
                  </button>
                  {onDeleteEntry && (
                    <button
                      onClick={() => onDeleteEntry(selectedEntry.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded
                                 bg-red-500/10 hover:bg-red-500/20 text-red-400
                                 font-mono text-[10px] transition-colors"
                    >
                      <X size={12} />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AvatarTimeline;
