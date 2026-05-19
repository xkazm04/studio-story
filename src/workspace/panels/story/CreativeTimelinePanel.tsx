'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { History, Play, Pause, Users, FileText, Swords, MapPin, Clapperboard, GitBranch, Layers, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import PanelFrame from '../shared/PanelFrame';
import { PanelEmptyState, PanelSkeletonList } from '../shared/PanelPrimitives';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { getEventPersistence } from '@/lib/coordination/persistence';
import { getCoordinationHub } from '@/lib/coordination/CoordinationHub';
import type { CoordinationEvent, CoordinationEventType, EntityType } from '@/lib/coordination/types';
import type { PanelDensity } from '@/workspace/types';

// ─── All event types for subscription ────────────────────────────────────────

const ALL_EVENT_TYPES: CoordinationEventType[] = [
  'CHARACTER_CREATED', 'CHARACTER_UPDATED', 'CHARACTER_DELETED',
  'CHARACTER_FACTION_CHANGED', 'CHARACTER_AVATAR_CHANGED',
  'CHARACTER_VOICE_CHANGED', 'CHARACTER_APPEARANCE_CHANGED',
  'SCENE_CREATED', 'SCENE_UPDATED', 'SCENE_DELETED',
  'SCENE_REORDERED', 'SCENE_CONTENT_CHANGED', 'SCENE_IMAGE_CHANGED',
  'ACT_CREATED', 'ACT_UPDATED', 'ACT_DELETED', 'ACT_REORDERED',
  'BEAT_CREATED', 'BEAT_UPDATED', 'BEAT_DELETED', 'BEAT_COMPLETED',
  'BEAT_DEPENDENCY_ADDED', 'BEAT_DEPENDENCY_REMOVED', 'BEAT_SCENE_MAPPING_CHANGED',
  'FACTION_CREATED', 'FACTION_UPDATED', 'FACTION_DELETED',
  'FACTION_MEMBER_ADDED', 'FACTION_MEMBER_REMOVED',
  'FACTION_LORE_CHANGED', 'FACTION_EVENT_ADDED', 'FACTION_RELATIONSHIP_CHANGED',
  'ASSET_UPLOADED', 'ASSET_UPDATED', 'ASSET_DELETED',
  'ASSET_TAGGED', 'ASSET_LINKED', 'ASSET_UNLINKED',
  'RELATIONSHIP_CREATED', 'RELATIONSHIP_UPDATED', 'RELATIONSHIP_DELETED',
  'PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_DELETED', 'PROJECT_STYLE_CHANGED',
];

// ─── Constants ──────────────────────────────────────────────────────────────

const ENTITY_CONFIG: Record<EntityType, { icon: React.ElementType; color: string; label: string }> = {
  character: { icon: Users, color: 'text-emerald-400', label: 'Character' },
  scene: { icon: FileText, color: 'text-amber-400', label: 'Scene' },
  act: { icon: Clapperboard, color: 'text-purple-400', label: 'Act' },
  beat: { icon: MapPin, color: 'text-cyan-400', label: 'Beat' },
  faction: { icon: Swords, color: 'text-rose-400', label: 'Faction' },
  asset: { icon: Layers, color: 'text-orange-400', label: 'Asset' },
  relationship: { icon: GitBranch, color: 'text-sky-400', label: 'Relationship' },
  project: { icon: Layers, color: 'text-indigo-400', label: 'Project' },
};

function getActionVerb(eventType: string): string {
  if (eventType.endsWith('_CREATED')) return 'created';
  if (eventType.endsWith('_UPDATED')) return 'updated';
  if (eventType.endsWith('_DELETED')) return 'deleted';
  if (eventType.endsWith('_REORDERED')) return 'reordered';
  if (eventType.endsWith('_COMPLETED')) return 'completed';
  if (eventType.includes('FACTION_CHANGED')) return 'changed faction';
  if (eventType.includes('AVATAR_CHANGED')) return 'avatar changed';
  if (eventType.includes('VOICE_CHANGED')) return 'voice changed';
  if (eventType.includes('APPEARANCE_CHANGED')) return 'appearance changed';
  if (eventType.includes('CONTENT_CHANGED')) return 'content edited';
  if (eventType.includes('IMAGE_CHANGED')) return 'image changed';
  if (eventType.includes('MEMBER_ADDED')) return 'member added';
  if (eventType.includes('MEMBER_REMOVED')) return 'member removed';
  if (eventType.includes('DEPENDENCY_ADDED')) return 'dependency added';
  if (eventType.includes('DEPENDENCY_REMOVED')) return 'dependency removed';
  if (eventType.includes('SCENE_MAPPING')) return 'scene mapped';
  if (eventType.includes('LORE_CHANGED')) return 'lore updated';
  if (eventType.includes('EVENT_ADDED')) return 'event added';
  if (eventType.includes('RELATIONSHIP_CHANGED')) return 'relationship changed';
  if (eventType.includes('STYLE_CHANGED')) return 'style changed';
  if (eventType.includes('TAGGED')) return 'tagged';
  if (eventType.includes('LINKED')) return 'linked';
  if (eventType.includes('UNLINKED')) return 'unlinked';
  return eventType.split('_').slice(1).join(' ').toLowerCase();
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ─── Graph Visualization ────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  type: EntityType;
  name?: string;
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;
  strength?: string;
}

const NODE_COLORS: Record<EntityType, string> = {
  character: '#34d399',
  scene: '#fbbf24',
  act: '#a78bfa',
  beat: '#22d3ee',
  faction: '#fb7185',
  asset: '#fb923c',
  relationship: '#38bdf8',
  project: '#818cf8',
};

function StoryGraph({ nodes, edges, className }: { nodes: GraphNode[]; edges: GraphEdge[]; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Position nodes in a force-directed-like layout (simple circular for now)
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.35;

    const positions = new Map<string, { x: number; y: number }>();
    nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
      positions.set(node.id, {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      });
    });

    // Draw edges
    ctx.lineWidth = 1;
    for (const edge of edges) {
      const from = positions.get(edge.source);
      const to = positions.get(edge.target);
      if (!from || !to) continue;

      ctx.strokeStyle = edge.strength === 'strong' ? 'rgba(148, 163, 184, 0.4)' : 'rgba(148, 163, 184, 0.15)';
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }

    // Draw nodes
    for (const node of nodes) {
      const pos = positions.get(node.id);
      if (!pos) continue;

      const color = NODE_COLORS[node.type] || '#94a3b8';
      const r = 5;

      // Glow
      ctx.fillStyle = color + '33';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r + 3, 0, Math.PI * 2);
      ctx.fill();

      // Node
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
      ctx.fill();

      // Label
      if (node.name && w > 200) {
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.name.slice(0, 12), pos.x, pos.y + r + 12);
      }
    }
  }, [nodes, edges]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('w-full', className)}
      style={{ height: '100%' }}
    />
  );
}

// ─── Day Group ──────────────────────────────────────────────────────────────

function DayGroup({
  date,
  events,
  scrubIndex,
  totalOffset,
  onScrub,
}: {
  date: string;
  events: CoordinationEvent[];
  scrubIndex: number | null;
  totalOffset: number;
  onScrub: (idx: number) => void;
}) {
  const [expanded, setExpanded] = useState(date === 'Today');

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-300 transition-colors"
      >
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {date}
        <span className="ml-auto text-slate-500 font-normal normal-case">{events.length}</span>
      </button>

      {expanded && (
        <div className="space-y-px pl-3 pr-2">
          {events.map((event, localIdx) => {
            const globalIdx = totalOffset + localIdx;
            const entityType = event.payload.entityType as EntityType;
            const config = ENTITY_CONFIG[entityType] || ENTITY_CONFIG.project;
            const Icon = config.icon;
            const isScrubbed = scrubIndex !== null && globalIdx === scrubIndex;

            return (
              <button
                key={event.id}
                type="button"
                onClick={() => onScrub(globalIdx)}
                className={cn(
                  'group flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-all duration-100',
                  isScrubbed
                    ? 'bg-cyan-500/10 border border-cyan-500/30'
                    : 'border border-transparent hover:bg-slate-800/60',
                )}
              >
                {/* Timeline dot */}
                <div className="relative mt-1 flex flex-col items-center">
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    isScrubbed ? 'bg-cyan-400' : 'bg-slate-600 group-hover:bg-slate-500',
                  )} />
                </div>

                <Icon className={cn('w-3.5 h-3.5 mt-0.5 shrink-0', config.color)} />

                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-300 leading-tight">
                    <span className={cn('font-medium', config.color)}>{config.label}</span>
                    {' '}
                    <span className="text-slate-400">{getActionVerb(event.type)}</span>
                  </p>
                  {event.payload.source && (
                    <p className="text-[10px] text-slate-500 truncate">{event.payload.source}</p>
                  )}
                </div>

                <span className="shrink-0 text-[10px] text-slate-500 mt-0.5 tabular-nums">
                  {formatTime(event.metadata.createdAt)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Timeline Scrubber ──────────────────────────────────────────────────────

function TimelineScrubber({
  total,
  value,
  onChange,
  isPlaying,
  onTogglePlay,
}: {
  total: number;
  value: number;
  onChange: (v: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-800/50 bg-slate-900/60">
      <button
        type="button"
        onClick={onTogglePlay}
        className="rounded p-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors"
        title={isPlaying ? 'Pause replay' : 'Replay creative process'}
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </button>
      <input
        type="range"
        min={0}
        max={Math.max(0, total - 1)}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1 accent-cyan-500 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border-0"
      />
      <span className="text-[10px] text-slate-500 tabular-nums w-12 text-right">
        {value + 1}/{total}
      </span>
    </div>
  );
}

// ─── Entity Stats (for micro density) ───────────────────────────────────────

function EntityStats({ events }: { events: CoordinationEvent[] }) {
  const counts = useMemo(() => {
    const m = new Map<EntityType, number>();
    for (const e of events) {
      const t = e.payload.entityType as EntityType;
      m.set(t, (m.get(t) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [events]);

  return (
    <div className="flex items-center gap-2 px-2 text-[10px]">
      <History className="w-3 h-3 text-slate-400 shrink-0" />
      <span className="text-slate-400 font-medium">{events.length}</span>
      {counts.map(([type, count]) => {
        const config = ENTITY_CONFIG[type];
        return (
          <span key={type} className={cn('flex items-center gap-0.5', config.color)}>
            {count}
            <span className="text-slate-500">{config.label.slice(0, 3).toLowerCase()}</span>
          </span>
        );
      })}
    </div>
  );
}

// ─── Main Panel ─────────────────────────────────────────────────────────────

interface CreativeTimelinePanelProps {
  onClose?: () => void;
  density?: PanelDensity;
}

export default function CreativeTimelinePanel({ onClose, density }: CreativeTimelinePanelProps) {
  const { selectedProject } = useProjectStore();
  const projectId = selectedProject?.id;

  const [events, setEvents] = useState<CoordinationEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showGraph, setShowGraph] = useState(true);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load events from IndexedDB persistence
  useEffect(() => {
    if (!projectId) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const persistence = getEventPersistence();
    persistence.getProjectEvents(projectId, { limit: 500 }).then((loaded) => {
      if (cancelled) return;
      // Sort chronologically (oldest first)
      loaded.sort((a, b) => a.metadata.createdAt - b.metadata.createdAt);
      setEvents(loaded);
      setIsLoading(false);
    }).catch(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [projectId]);

  // Subscribe to live events so the timeline updates in real-time
  useEffect(() => {
    if (!projectId) return;

    const hub = getCoordinationHub();
    const subId = hub.subscribe(
      ALL_EVENT_TYPES,
      (event: CoordinationEvent) => {
        if (event.payload.projectId === projectId) {
          setEvents((prev) => [...prev, event]);
        }
      },
      { label: 'creative-timeline' },
    );

    return () => { hub.unsubscribe(subId); };
  }, [projectId]);

  // Group events by day
  const dayGroups = useMemo(() => {
    const groups: { date: string; events: CoordinationEvent[]; offset: number }[] = [];
    let currentDate = '';
    let offset = 0;

    for (const event of events) {
      const d = formatDate(event.metadata.createdAt);
      if (d !== currentDate) {
        currentDate = d;
        groups.push({ date: d, events: [], offset });
      }
      groups[groups.length - 1].events.push(event);
      offset++;
    }

    // Reverse so newest day is first
    return groups.reverse();
  }, [events]);

  // Build graph state at current scrub position
  const graphData = useMemo(() => {
    // If scrubbing, show graph up to scrub point; otherwise show full graph
    const hub = getCoordinationHub();
    const fullGraph = hub.exportDependencyGraph();

    if (scrubIndex === null || scrubIndex >= events.length - 1) {
      return fullGraph;
    }

    // Filter to only entities that existed at the scrub point
    const visibleEvents = events.slice(0, scrubIndex + 1);
    const entityIds = new Set<string>();
    for (const e of visibleEvents) {
      entityIds.add(`${e.payload.entityType}:${e.payload.entityId}`);
    }

    return {
      nodes: fullGraph.nodes.filter((n) => entityIds.has(n.id)),
      edges: fullGraph.edges.filter((e) => entityIds.has(e.source) && entityIds.has(e.target)),
    };
  }, [events, scrubIndex]);

  // Playback logic
  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      if (playRef.current) clearInterval(playRef.current);
      playRef.current = null;
    } else {
      setIsPlaying(true);
      const startIdx = scrubIndex ?? 0;
      let current = startIdx;
      setScrubIndex(current);
      playRef.current = setInterval(() => {
        current++;
        if (current >= events.length) {
          setIsPlaying(false);
          if (playRef.current) clearInterval(playRef.current);
          playRef.current = null;
          setScrubIndex(null);
        } else {
          setScrubIndex(current);
        }
      }, 300);
    }
  }, [isPlaying, scrubIndex, events.length]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (playRef.current) clearInterval(playRef.current);
    };
  }, []);

  // Micro density — just entity stats badge
  if (density === 'micro') {
    return (
      <PanelFrame title="Timeline" icon={History} onClose={onClose} density={density}>
        {isLoading ? (
          <span className="text-[10px] text-slate-500 px-2">Loading...</span>
        ) : (
          <EntityStats events={events} />
        )}
      </PanelFrame>
    );
  }

  // Compact density — timeline list only, no graph
  if (density === 'compact') {
    return (
      <PanelFrame
        title="Creative Timeline"
        icon={History}
        onClose={onClose}
        headerAccent="indigo"
        density={density}
      >
        {isLoading ? (
          <PanelSkeletonList rows={4} />
        ) : !projectId ? (
          <PanelEmptyState icon={History} title="Select a project" />
        ) : events.length === 0 ? (
          <PanelEmptyState icon={History} title="No creative history" description="Events will appear as you build your story." />
        ) : (
          <div className="overflow-y-auto min-h-0">
            {dayGroups.map((group) => (
              <DayGroup
                key={group.date}
                date={group.date}
                events={group.events}
                scrubIndex={scrubIndex}
                totalOffset={group.offset}
                onScrub={setScrubIndex}
              />
            ))}
          </div>
        )}
      </PanelFrame>
    );
  }

  // Full density — timeline + graph + scrubber
  return (
    <PanelFrame
      title="Creative Timeline"
      icon={History}
      onClose={onClose}
      headerAccent="indigo"
      density={density}
      isLoading={isLoading}
      actions={
        <button
          type="button"
          onClick={() => setShowGraph(!showGraph)}
          className={cn(
            'rounded p-0.5 transition-colors duration-150',
            showGraph
              ? 'text-cyan-400 bg-cyan-500/10'
              : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80',
          )}
          title={showGraph ? 'Hide structure graph' : 'Show structure graph'}
        >
          <GitBranch className="w-3 h-3" />
        </button>
      }
    >
      {!projectId ? (
        <PanelEmptyState icon={History} title="Select a project" description="Choose a project to see its creative history." />
      ) : events.length === 0 && !isLoading ? (
        <PanelEmptyState
          icon={History}
          title="No creative history yet"
          description="Your timeline will fill as you create characters, scenes, beats, and more."
        />
      ) : (
        <div className="flex flex-col h-full min-h-0">
          {/* Story structure graph */}
          {showGraph && (
            <div className="shrink-0 border-b border-slate-800/50 bg-slate-900/40 relative" style={{ height: '35%', minHeight: 120 }}>
              <StoryGraph nodes={graphData.nodes} edges={graphData.edges} />
              {scrubIndex !== null && (
                <div className="absolute top-1.5 left-2 rounded bg-slate-900/80 px-1.5 py-0.5 text-[10px] text-cyan-400 border border-cyan-500/20">
                  Step {scrubIndex + 1} of {events.length}
                </div>
              )}
              {/* Legend */}
              <div className="absolute bottom-1 right-2 flex items-center gap-2">
                {(['character', 'scene', 'beat', 'faction'] as EntityType[]).map((t) => (
                  <div key={t} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: NODE_COLORS[t] }} />
                    <span className="text-[9px] text-slate-500">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline events */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {dayGroups.map((group) => (
              <DayGroup
                key={group.date}
                date={group.date}
                events={group.events}
                scrubIndex={scrubIndex}
                totalOffset={group.offset}
                onScrub={setScrubIndex}
              />
            ))}
          </div>

          {/* Scrubber bar */}
          {events.length > 1 && (
            <TimelineScrubber
              total={events.length}
              value={scrubIndex ?? events.length - 1}
              onChange={setScrubIndex}
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
            />
          )}
        </div>
      )}
    </PanelFrame>
  );
}
