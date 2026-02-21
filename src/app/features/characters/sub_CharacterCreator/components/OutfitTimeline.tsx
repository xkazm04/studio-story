'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Shirt,
  MapPin,
  Calendar,
  ChevronRight,
  Play,
  Pause,
  ArrowRight,
  Info,
  AlertCircle,
} from 'lucide-react';
import {
  Outfit,
  OutfitHistoryEntry,
  useCharacterOutfits,
} from '@/app/hooks/integration/useCharacterOutfits';
import { cn } from '@/app/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface OutfitTimelineProps {
  characterId: string;
  characterName?: string;
  onOutfitClick?: (outfit: Outfit) => void;
  onSceneClick?: (sceneId: string) => void;
  className?: string;
}

interface TimelineEntry extends OutfitHistoryEntry {
  outfit?: Outfit;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(start: string, end?: string): string {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
  if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
  return `${diffMins}m`;
}

// ============================================================================
// Subcomponents
// ============================================================================

interface TimelineNodeProps {
  entry: TimelineEntry;
  isFirst: boolean;
  isLast: boolean;
  isCurrent: boolean;
  onOutfitClick?: (outfit: Outfit) => void;
  onSceneClick?: (sceneId: string) => void;
}

const TimelineNode: React.FC<TimelineNodeProps> = ({
  entry,
  isFirst,
  isLast,
  isCurrent,
  onOutfitClick,
  onSceneClick,
}) => {
  const duration = formatDuration(entry.start_time, entry.end_time);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative flex gap-4"
    >
      {/* Timeline Line */}
      <div className="flex flex-col items-center">
        {/* Top line */}
        {!isFirst && (
          <div className="w-0.5 h-4 bg-gray-700" />
        )}

        {/* Node dot */}
        <div
          className={cn(
            'w-4 h-4 rounded-full border-2 flex-shrink-0',
            isCurrent
              ? 'bg-green-500 border-green-400 animate-pulse'
              : 'bg-gray-700 border-gray-600'
          )}
        />

        {/* Bottom line */}
        {!isLast && (
          <div className="w-0.5 flex-1 min-h-[60px] bg-gray-700" />
        )}
      </div>

      {/* Content Card */}
      <div
        className={cn(
          'flex-1 p-4 bg-gray-800/50 border rounded-lg mb-4',
          isCurrent
            ? 'border-green-500/50 bg-green-900/10'
            : 'border-gray-700'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {entry.outfit ? (
              <button
                onClick={() => entry.outfit && onOutfitClick?.(entry.outfit)}
                className="font-medium text-white hover:text-purple-400 transition-colors"
              >
                {entry.outfit.name}
              </button>
            ) : (
              <span className="font-medium text-gray-400">Unknown Outfit</span>
            )}
            {isCurrent && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-green-600/20 text-green-400 rounded text-xs">
                <Play size={10} />
                Current
              </span>
            )}
          </div>

          <span className="text-xs text-gray-500">{duration}</span>
        </div>

        {/* Time Range */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
          <Clock size={12} />
          <span>{formatDate(entry.start_time)}</span>
          {entry.end_time && (
            <>
              <ArrowRight size={12} />
              <span>{formatDate(entry.end_time)}</span>
            </>
          )}
        </div>

        {/* Scene Info */}
        {entry.scene_title && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={14} className="text-blue-400" />
            <button
              onClick={() => entry.scene_id && onSceneClick?.(entry.scene_id)}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              {entry.scene_title}
            </button>
          </div>
        )}

        {/* Narrative Reason */}
        {entry.narrative_reason && (
          <p className="text-sm text-gray-400 mt-2 italic">
            "{entry.narrative_reason}"
          </p>
        )}

        {/* Modifications */}
        {entry.modifications && Object.keys(entry.modifications).length > 0 && (
          <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-700/30 rounded text-xs text-yellow-300">
            <span className="font-medium">Modifications: </span>
            {JSON.stringify(entry.modifications)}
          </div>
        )}
      </div>
    </motion.div>
  );
};

interface TimelineSummaryProps {
  entries: TimelineEntry[];
  outfits: Outfit[];
}

const TimelineSummary: React.FC<TimelineSummaryProps> = ({ entries, outfits }) => {
  // Calculate statistics
  const stats = useMemo(() => {
    const outfitUsage = new Map<string, number>();
    entries.forEach(e => {
      const count = outfitUsage.get(e.outfit_id) || 0;
      outfitUsage.set(e.outfit_id, count + 1);
    });

    const mostUsed = Array.from(outfitUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, count]) => ({
        outfit: outfits.find(o => o.id === id),
        count,
      }));

    const uniqueOutfits = outfitUsage.size;
    const totalChanges = entries.length;

    return { mostUsed, uniqueOutfits, totalChanges };
  }, [entries, outfits]);

  if (entries.length === 0) return null;

  return (
    <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg mb-4">
      <h4 className="text-sm font-medium text-gray-300 mb-3">Timeline Summary</h4>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{stats.totalChanges}</div>
          <div className="text-xs text-gray-400">Total Changes</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{stats.uniqueOutfits}</div>
          <div className="text-xs text-gray-400">Unique Outfits</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{outfits.length}</div>
          <div className="text-xs text-gray-400">Total Available</div>
        </div>
      </div>

      {stats.mostUsed.length > 0 && (
        <div>
          <div className="text-xs text-gray-400 mb-2">Most Used:</div>
          <div className="space-y-1">
            {stats.mostUsed.map(({ outfit, count }, i) => (
              <div key={outfit?.id || i} className="flex items-center justify-between">
                <span className="text-sm text-gray-300">
                  {outfit?.name || 'Unknown'}
                </span>
                <span className="text-xs text-gray-500">{count}x</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const OutfitTimeline: React.FC<OutfitTimelineProps> = ({
  characterId,
  characterName,
  onOutfitClick,
  onSceneClick,
  className,
}) => {
  const { outfits, history, isLoadingHistory } = useCharacterOutfits(characterId);

  // Merge history with outfit data
  const timelineEntries: TimelineEntry[] = useMemo(() => {
    return history.map(entry => ({
      ...entry,
      outfit: outfits.find(o => o.id === entry.outfit_id),
    }));
  }, [history, outfits]);

  // Find current outfit (no end_time)
  const currentEntry = timelineEntries.find(e => !e.end_time);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 rounded-lg">
            <Clock size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Outfit Timeline</h2>
            <p className="text-sm text-gray-400">
              {characterName ? `${characterName}'s ` : ''}wardrobe history
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : timelineEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Calendar size={48} className="mb-4 opacity-50" />
            <p className="text-lg">No outfit history yet</p>
            <p className="text-sm">
              Outfit changes will appear here as you use them in scenes
            </p>
          </div>
        ) : (
          <>
            {/* Current Outfit Highlight */}
            {currentEntry && currentEntry.outfit && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gradient-to-r from-green-900/30 to-blue-900/30 border border-green-500/30 rounded-lg mb-6"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Play size={16} className="text-green-400" />
                  <span className="text-sm font-medium text-green-300">Currently Wearing</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                    {currentEntry.outfit.thumbnail_url ? (
                      <img
                        src={currentEntry.outfit.thumbnail_url}
                        alt={currentEntry.outfit.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Shirt size={20} className="text-gray-500" />
                    )}
                  </div>
                  <div>
                    <button
                      onClick={() => currentEntry.outfit && onOutfitClick?.(currentEntry.outfit)}
                      className="font-medium text-white hover:text-purple-400 transition-colors"
                    >
                      {currentEntry.outfit.name}
                    </button>
                    <p className="text-xs text-gray-400">
                      Since {formatDate(currentEntry.start_time)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Summary */}
            <TimelineSummary entries={timelineEntries} outfits={outfits} />

            {/* Timeline */}
            <div className="space-y-0">
              <h4 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                <Clock size={14} />
                Full History
              </h4>

              {timelineEntries
                .slice()
                .reverse()
                .map((entry, index, arr) => (
                  <TimelineNode
                    key={entry.id}
                    entry={entry}
                    isFirst={index === 0}
                    isLast={index === arr.length - 1}
                    isCurrent={!entry.end_time}
                    onOutfitClick={onOutfitClick}
                    onSceneClick={onSceneClick}
                  />
                ))}
            </div>
          </>
        )}
      </div>

      {/* Info Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-start gap-2 text-xs text-gray-500">
          <Info size={14} className="flex-shrink-0 mt-0.5" />
          <p>
            Outfit changes are automatically tracked when you assign outfits to scenes.
            This helps maintain costume continuity throughout your story.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OutfitTimeline;
