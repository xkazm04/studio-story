'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  ChevronDown,
  Filter,
  Search,
  RotateCcw,
  RotateCw,
  Users,
  Film,
  Folder,
  Target,
  Layers,
  Image as ImageIcon,
  GitBranch,
  FileText,
  Plus,
  Edit,
  Trash2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button, IconButton } from '../UI/Button';
import {
  CoordinationEvent,
  CoordinationEventType,
  EntityType,
} from '@/lib/coordination/types';
import { getCoordinationHub } from '@/lib/coordination/CoordinationHub';

// ============================================================================
// Types
// ============================================================================

interface EventTimelineProps {
  maxEvents?: number;
  showFilters?: boolean;
  showUndoRedo?: boolean;
  onEventClick?: (event: CoordinationEvent) => void;
  className?: string;
}

type EventCategory = 'created' | 'updated' | 'deleted' | 'changed' | 'other';

// ============================================================================
// Config
// ============================================================================

const entityTypeConfig: Record<
  EntityType,
  { icon: React.ReactNode; color: string; bgColor: string }
> = {
  character: {
    icon: <Users className="w-3.5 h-3.5" />,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
  scene: {
    icon: <Film className="w-3.5 h-3.5" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  act: {
    icon: <Folder className="w-3.5 h-3.5" />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
  beat: {
    icon: <Target className="w-3.5 h-3.5" />,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  faction: {
    icon: <Layers className="w-3.5 h-3.5" />,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
  },
  asset: {
    icon: <ImageIcon className="w-3.5 h-3.5" />,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
  },
  relationship: {
    icon: <GitBranch className="w-3.5 h-3.5" />,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
  },
  project: {
    icon: <FileText className="w-3.5 h-3.5" />,
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
  },
};

const categoryConfig: Record<
  EventCategory,
  { icon: React.ReactNode; color: string; label: string }
> = {
  created: {
    icon: <Plus className="w-3 h-3" />,
    color: 'text-emerald-400',
    label: 'Created',
  },
  updated: {
    icon: <Edit className="w-3 h-3" />,
    color: 'text-blue-400',
    label: 'Updated',
  },
  deleted: {
    icon: <Trash2 className="w-3 h-3" />,
    color: 'text-red-400',
    label: 'Deleted',
  },
  changed: {
    icon: <RefreshCw className="w-3 h-3" />,
    color: 'text-amber-400',
    label: 'Changed',
  },
  other: {
    icon: <ArrowRight className="w-3 h-3" />,
    color: 'text-slate-400',
    label: 'Other',
  },
};

// ============================================================================
// Helpers
// ============================================================================

function getEventCategory(eventType: CoordinationEventType): EventCategory {
  if (eventType.includes('CREATED') || eventType.includes('UPLOADED')) return 'created';
  if (eventType.includes('UPDATED')) return 'updated';
  if (eventType.includes('DELETED')) return 'deleted';
  if (eventType.includes('CHANGED') || eventType.includes('ADDED') || eventType.includes('REMOVED')) return 'changed';
  return 'other';
}

function formatEventType(eventType: CoordinationEventType): string {
  return eventType
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) {
    return 'Just now';
  } else if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins}m ago`;
  } else if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  } else {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

function groupEventsByTime(
  events: CoordinationEvent[]
): Array<{ label: string; events: CoordinationEvent[] }> {
  const now = Date.now();
  const groups: Record<string, CoordinationEvent[]> = {
    'Just now': [],
    'Last hour': [],
    'Today': [],
    'Yesterday': [],
    'Earlier': [],
  };

  for (const event of events) {
    const diff = now - event.metadata.createdAt;

    if (diff < 60000) {
      groups['Just now'].push(event);
    } else if (diff < 3600000) {
      groups['Last hour'].push(event);
    } else if (diff < 86400000) {
      groups['Today'].push(event);
    } else if (diff < 172800000) {
      groups['Yesterday'].push(event);
    } else {
      groups['Earlier'].push(event);
    }
  }

  return Object.entries(groups)
    .filter(([, events]) => events.length > 0)
    .map(([label, events]) => ({ label, events }));
}

// ============================================================================
// Event Item Component
// ============================================================================

function EventItem({
  event,
  onClick,
  isExpanded,
  onToggle,
}: {
  event: CoordinationEvent;
  onClick?: (event: CoordinationEvent) => void;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const entityConfig = entityTypeConfig[event.payload.entityType];
  const category = getEventCategory(event.type);
  const catConfig = categoryConfig[category];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative"
    >
      {/* Timeline connector */}
      <div className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-700/50" />

      <div
        className={clsx(
          'relative flex items-start gap-3 p-2 rounded-lg transition-colors cursor-pointer',
          'hover:bg-slate-800/30'
        )}
        onClick={() => onClick?.(event)}
      >
        {/* Entity icon */}
        <div
          className={clsx(
            'relative z-10 p-1.5 rounded-lg border shrink-0',
            entityConfig.bgColor,
            `border-${event.payload.entityType === 'character' ? 'purple' : 'slate'}-500/30`
          )}
        >
          <span className={entityConfig.color}>{entityConfig.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={clsx('flex items-center gap-1', catConfig.color)}>
              {catConfig.icon}
              <span className="text-xs font-medium">{catConfig.label}</span>
            </span>
            <span className="text-xs text-slate-500">
              {formatTimestamp(event.metadata.createdAt)}
            </span>
          </div>

          <div className="text-sm text-slate-300 truncate">
            {formatEventType(event.type)}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="flex items-center gap-1 mt-1 text-xs text-slate-500 hover:text-slate-400 transition-colors"
          >
            <ChevronDown
              className={clsx(
                'w-3 h-3 transition-transform',
                isExpanded && 'rotate-180'
              )}
            />
            <span>Details</span>
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 p-2 rounded bg-slate-900/50 border border-slate-700/50 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500">Entity ID:</span>
                      <span className="ml-1 text-slate-300 font-mono">
                        {event.payload.entityId?.slice(0, 12) || 'N/A'}...
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Source:</span>
                      <span className="ml-1 text-slate-300">
                        {event.payload.source || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Priority:</span>
                      <span
                        className={clsx(
                          'ml-1',
                          event.metadata.priority === 'high'
                            ? 'text-red-400'
                            : event.metadata.priority === 'low'
                              ? 'text-slate-400'
                              : 'text-amber-400'
                        )}
                      >
                        {event.metadata.priority}
                      </span>
                    </div>
                    {event.metadata.batchId && (
                      <div>
                        <span className="text-slate-500">Batch:</span>
                        <span className="ml-1 text-slate-300 font-mono">
                          {event.metadata.batchId.slice(0, 8)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function EventTimeline({
  maxEvents = 50,
  showFilters = true,
  showUndoRedo = true,
  onEventClick,
  className,
}: EventTimelineProps) {
  const [events, setEvents] = useState<CoordinationEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<Set<EntityType>>(new Set());
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Load events and subscribe to updates
  useEffect(() => {
    const hub = getCoordinationHub();

    // Load initial events
    setEvents(hub.getEventLog().slice(-maxEvents));

    // Update undo/redo state
    const undoContext = hub.getUndoContext();
    setCanUndo(undoContext.canUndo);
    setCanRedo(undoContext.canRedo);

    // Subscribe to new events
    const subscriptionId = hub.subscribe(
      [
        'CHARACTER_CREATED', 'CHARACTER_UPDATED', 'CHARACTER_DELETED',
        'SCENE_CREATED', 'SCENE_UPDATED', 'SCENE_DELETED',
        'BEAT_CREATED', 'BEAT_UPDATED', 'BEAT_DELETED',
        'FACTION_CREATED', 'FACTION_UPDATED', 'FACTION_DELETED',
        'ASSET_UPLOADED', 'ASSET_UPDATED', 'ASSET_DELETED',
      ],
      (event) => {
        setEvents((prev) => [...prev.slice(-(maxEvents - 1)), event]);

        // Update undo/redo state
        const undoContext = hub.getUndoContext();
        setCanUndo(undoContext.canUndo);
        setCanRedo(undoContext.canRedo);
      },
      { label: 'event-timeline' }
    );

    return () => {
      hub.unsubscribe(subscriptionId);
    };
  }, [maxEvents]);

  // Filter events
  const filteredEvents = useMemo(() => {
    let result = events;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (event) =>
          event.type.toLowerCase().includes(query) ||
          event.payload.entityId?.toLowerCase().includes(query) ||
          event.payload.source?.toLowerCase().includes(query)
      );
    }

    // Filter by entity type
    if (selectedTypes.size > 0) {
      result = result.filter((event) =>
        selectedTypes.has(event.payload.entityType)
      );
    }

    return result;
  }, [events, searchQuery, selectedTypes]);

  // Group events by time
  const groupedEvents = useMemo(
    () => groupEventsByTime(filteredEvents.slice().reverse()),
    [filteredEvents]
  );

  const toggleEventExpanded = (eventId: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const toggleTypeFilter = (type: EntityType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const handleUndo = () => {
    const hub = getCoordinationHub();
    hub.undo();

    // Refresh events
    setEvents(hub.getEventLog().slice(-maxEvents));
    const undoContext = hub.getUndoContext();
    setCanUndo(undoContext.canUndo);
    setCanRedo(undoContext.canRedo);
  };

  const handleRedo = () => {
    const hub = getCoordinationHub();
    hub.redo();

    // Refresh events
    setEvents(hub.getEventLog().slice(-maxEvents));
    const undoContext = hub.getUndoContext();
    setCanUndo(undoContext.canUndo);
    setCanRedo(undoContext.canRedo);
  };

  return (
    <div className={clsx('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-200">Activity</span>
          <span className="px-1.5 py-0.5 text-xs rounded bg-slate-700/50 text-slate-400">
            {filteredEvents.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {showUndoRedo && (
            <>
              <IconButton
                icon={<RotateCcw />}
                size="xs"
                variant="ghost"
                onClick={handleUndo}
                disabled={!canUndo}
                aria-label="Undo"
              />
              <IconButton
                icon={<RotateCw />}
                size="xs"
                variant="ghost"
                onClick={handleRedo}
                disabled={!canRedo}
                aria-label="Redo"
              />
              <div className="w-px h-4 bg-slate-700/50 mx-1" />
            </>
          )}
          {showFilters && (
            <IconButton
              icon={<Filter />}
              size="xs"
              variant={showFilterPanel ? 'secondary' : 'ghost'}
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              aria-label="Toggle filters"
            />
          )}
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilterPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-slate-700/50"
          >
            <div className="p-3 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Entity Type Filters */}
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(entityTypeConfig) as EntityType[]).map((type) => {
                  const config = entityTypeConfig[type];
                  const isSelected = selectedTypes.has(type);

                  return (
                    <button
                      key={type}
                      onClick={() => toggleTypeFilter(type)}
                      className={clsx(
                        'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors border',
                        isSelected
                          ? `${config.bgColor} ${config.color} border-${type === 'character' ? 'purple' : 'slate'}-500/50`
                          : 'bg-slate-800/30 text-slate-400 border-slate-700/50 hover:border-slate-600/50'
                      )}
                    >
                      {config.icon}
                      <span className="capitalize">{type}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-3">
        {groupedEvents.length > 0 ? (
          <div className="space-y-4">
            {groupedEvents.map(({ label, events: groupEvents }) => (
              <div key={label}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px flex-1 bg-slate-700/50" />
                  <span className="text-xs text-slate-500 uppercase tracking-wider">
                    {label}
                  </span>
                  <div className="h-px flex-1 bg-slate-700/50" />
                </div>
                <div className="space-y-1">
                  {groupEvents.map((event) => (
                    <EventItem
                      key={event.id}
                      event={event}
                      onClick={onEventClick}
                      isExpanded={expandedEvents.has(event.id)}
                      onToggle={() => toggleEventExpanded(event.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="w-10 h-10 text-slate-600 mb-3" />
            <div className="text-slate-400 font-medium">No activity yet</div>
            <div className="text-sm text-slate-500 mt-1">
              Events will appear here as you make changes
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventTimeline;
