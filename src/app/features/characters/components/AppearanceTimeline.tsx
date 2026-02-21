/**
 * AppearanceTimeline - Visual timeline for character appearance evolution
 * Design: Clean Manuscript style with cyan accents
 *
 * Displays appearance milestones throughout the story timeline with:
 * - Multiple view modes (timeline, grid, comparison)
 * - Milestone versioning and tracking
 * - Scene-to-milestone mapping visualization
 * - Age progression indicators
 */

'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Calendar,
  Filter,
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  GitCompare,
  Download,
  Star,
  Layers,
  List,
  Grid,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import MilestoneCard from './MilestoneCard';
import {
  MilestoneManager,
  AppearanceMilestone,
  MilestoneFilter,
  filterMilestones,
  sortMilestonesByStoryPosition,
} from '@/lib/evolution/MilestoneManager';
import { useAvatarTimeline, TRANSFORMATION_TYPES, AGE_STAGES } from '@/app/hooks/integration/useAvatarTimeline';
import type { TransformationType, AgeStage } from '@/app/hooks/integration/useAvatarTimeline';

// ============================================================================
// Types
// ============================================================================

export interface AppearanceTimelineProps {
  characterId: string;
  characterName: string;
  onExportRequest?: () => void;
  compact?: boolean;
}

type ViewMode = 'timeline' | 'grid' | 'comparison';

interface ComparisonState {
  fromMilestoneId: string | null;
  toMilestoneId: string | null;
}

// ============================================================================
// Subcomponents
// ============================================================================

interface TimelineNodeProps {
  milestone: AppearanceMilestone;
  isFirst: boolean;
  isLast: boolean;
  isActive: boolean;
  isSelected: boolean;
  onClick: () => void;
}

const TimelineNode: React.FC<TimelineNodeProps> = ({
  milestone,
  isFirst,
  isLast,
  isActive,
  isSelected,
  onClick,
}) => {
  const typeConfig = TRANSFORMATION_TYPES[milestone.transformation_type];

  return (
    <div className="relative flex gap-4 group">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        {/* Line above */}
        {!isFirst && (
          <div className="w-px h-4 bg-slate-700/50" />
        )}

        {/* Node */}
        <button
          onClick={onClick}
          className={cn(
            'relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
            isSelected
              ? 'bg-cyan-500/20 border-cyan-500 scale-110'
              : isActive
              ? 'bg-green-500/20 border-green-500'
              : 'bg-slate-800 border-slate-600 group-hover:border-slate-500',
            typeConfig.color.split(' ')[0]
          )}
        >
          <span className={typeConfig.color.split(' ')[0]}>
            {milestone.transformation_type === 'initial' && <Star size={16} />}
            {milestone.transformation_type === 'natural_aging' && <Clock size={16} />}
            {milestone.transformation_type !== 'initial' && milestone.transformation_type !== 'natural_aging' && (
              <span className="w-2 h-2 rounded-full bg-current" />
            )}
          </span>
        </button>

        {/* Line below */}
        {!isLast && (
          <div className="w-px flex-1 min-h-8 bg-slate-700/50" />
        )}
      </div>

      {/* Card */}
      <div className="flex-1 pb-4">
        <MilestoneCard
          milestone={milestone}
          isSelected={isSelected}
          isActive={isActive}
          compact={false}
          onSelect={onClick}
        />
      </div>
    </div>
  );
};

interface ComparisonViewProps {
  fromMilestone: AppearanceMilestone | null;
  toMilestone: AppearanceMilestone | null;
  onSelectFrom: () => void;
  onSelectTo: () => void;
  onSwap: () => void;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({
  fromMilestone,
  toMilestone,
  onSelectFrom,
  onSelectTo,
  onSwap,
}) => {
  return (
    <div className="p-4 bg-slate-900/40 rounded-lg border border-slate-800/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitCompare size={14} className="text-cyan-400" />
          <span className="font-mono text-xs uppercase tracking-wide text-slate-300">
            comparison_view
          </span>
        </div>
        <button
          onClick={onSwap}
          disabled={!fromMilestone || !toMilestone}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded font-mono text-[10px] transition-colors',
            fromMilestone && toMilestone
              ? 'bg-slate-700/40 hover:bg-slate-700/60 text-slate-400'
              : 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
          )}
        >
          <RefreshCw size={12} />
          <span>Swap</span>
        </button>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start">
        {/* From milestone */}
        <div>
          <span className="font-mono text-[10px] text-slate-500 uppercase block mb-2">from</span>
          {fromMilestone ? (
            <MilestoneCard
              milestone={fromMilestone}
              isSelected={true}
              compact={false}
              onSelect={onSelectFrom}
            />
          ) : (
            <button
              onClick={onSelectFrom}
              className="w-full h-32 rounded-lg border-2 border-dashed border-slate-700/50
                         flex flex-col items-center justify-center gap-2
                         hover:border-slate-600 transition-colors"
            >
              <Plus size={20} className="text-slate-600" />
              <span className="font-mono text-xs text-slate-600">Select milestone</span>
            </button>
          )}
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center h-32">
          <ArrowRight size={24} className="text-slate-600" />
        </div>

        {/* To milestone */}
        <div>
          <span className="font-mono text-[10px] text-slate-500 uppercase block mb-2">to</span>
          {toMilestone ? (
            <MilestoneCard
              milestone={toMilestone}
              isSelected={true}
              compact={false}
              onSelect={onSelectTo}
            />
          ) : (
            <button
              onClick={onSelectTo}
              className="w-full h-32 rounded-lg border-2 border-dashed border-slate-700/50
                         flex flex-col items-center justify-center gap-2
                         hover:border-slate-600 transition-colors"
            >
              <Plus size={20} className="text-slate-600" />
              <span className="font-mono text-xs text-slate-600">Select milestone</span>
            </button>
          )}
        </div>
      </div>

      {/* Changes summary */}
      {fromMilestone && toMilestone && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <span className="font-mono text-[10px] text-slate-500 uppercase block mb-2">
            changes_detected
          </span>
          <div className="flex flex-wrap gap-2">
            {toMilestone.visual_changes.length > 0 ? (
              toMilestone.visual_changes.map((change, i) => (
                <div
                  key={i}
                  className="px-2 py-1 bg-slate-800/60 rounded text-xs font-mono"
                >
                  <span className="text-slate-500">{change.attribute}:</span>
                  {change.from && (
                    <>
                      <span className="text-red-400/70 line-through mx-1">{change.from}</span>
                      <span className="text-slate-600">→</span>
                    </>
                  )}
                  <span className="text-green-400 ml-1">{change.to}</span>
                </div>
              ))
            ) : (
              <span className="font-mono text-xs text-slate-600 italic">
                No visual changes recorded
              </span>
            )}
          </div>

          {/* Age progression */}
          {fromMilestone.age_stage !== toMilestone.age_stage && (
            <div className="mt-3 flex items-center gap-2">
              <span className="font-mono text-[10px] text-amber-400">Age progression:</span>
              <span className="px-1.5 py-0.5 bg-amber-500/20 rounded text-[10px] font-mono text-amber-400">
                {AGE_STAGES[fromMilestone.age_stage]?.label}
              </span>
              <ArrowRight size={12} className="text-slate-600" />
              <span className="px-1.5 py-0.5 bg-amber-500/20 rounded text-[10px] font-mono text-amber-400">
                {AGE_STAGES[toMilestone.age_stage]?.label}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const AppearanceTimeline: React.FC<AppearanceTimelineProps> = ({
  characterId,
  characterName,
  onExportRequest,
  compact = false,
}) => {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TransformationType | 'all'>('all');
  const [filterAgeStage, setFilterAgeStage] = useState<AgeStage | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [comparison, setComparison] = useState<ComparisonState>({
    fromMilestoneId: null,
    toMilestoneId: null,
  });
  const [selectingFor, setSelectingFor] = useState<'from' | 'to' | null>(null);

  // Data hook
  const {
    timeline,
    milestones: avatarMilestones,
    summary,
    isLoading,
    latestEntry,
    createEntry,
    updateEntry,
    deleteEntry,
  } = useAvatarTimeline(characterId);

  // Create milestone manager and populate with timeline data
  const milestoneManager = useMemo(() => {
    const manager = new MilestoneManager();
    timeline.forEach((entry) => {
      const milestone = manager.fromAvatarHistoryEntry(entry);
      manager.createMilestone(characterId, milestone);
    });
    return manager;
  }, [timeline, characterId]);

  // Get milestones from manager
  const milestones = useMemo(() => {
    return milestoneManager.getSortedMilestones(characterId);
  }, [milestoneManager, characterId]);

  // Filter milestones
  const filteredMilestones = useMemo(() => {
    const filter: MilestoneFilter = {};

    if (searchQuery) {
      filter.search_query = searchQuery;
    }
    if (filterType !== 'all') {
      filter.transformation_types = [filterType];
    }
    if (filterAgeStage !== 'all') {
      filter.age_stages = [filterAgeStage];
    }

    return filterMilestones(milestones, filter);
  }, [milestones, searchQuery, filterType, filterAgeStage]);

  // Get active milestone
  const activeMilestone = useMemo(() => {
    return milestones.find((m) => m.is_active) || milestones[milestones.length - 1];
  }, [milestones]);

  // Handlers
  const handleSelectMilestone = useCallback((milestone: AppearanceMilestone) => {
    if (selectingFor) {
      if (selectingFor === 'from') {
        setComparison((prev) => ({ ...prev, fromMilestoneId: milestone.id }));
      } else {
        setComparison((prev) => ({ ...prev, toMilestoneId: milestone.id }));
      }
      setSelectingFor(null);
    } else {
      setSelectedMilestoneId(
        selectedMilestoneId === milestone.id ? null : milestone.id
      );
    }
  }, [selectingFor, selectedMilestoneId]);

  const handleSwapComparison = useCallback(() => {
    setComparison((prev) => ({
      fromMilestoneId: prev.toMilestoneId,
      toMilestoneId: prev.fromMilestoneId,
    }));
  }, []);

  const handleAddMilestone = useCallback(() => {
    createEntry({
      transformation_type: 'custom',
      transformation_trigger: 'New milestone',
      is_milestone: true,
      milestone_label: 'New Milestone',
      visual_changes: [],
    });
  }, [createEntry]);

  // Get comparison milestones
  const fromMilestone = comparison.fromMilestoneId
    ? milestones.find((m) => m.id === comparison.fromMilestoneId)
    : null;
  const toMilestone = comparison.toMilestoneId
    ? milestones.find((m) => m.id === comparison.toMilestoneId)
    : null;

  // Compact view
  if (compact) {
    return (
      <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <h3 className="font-mono text-xs uppercase tracking-wide text-slate-300">
              appearance_timeline
            </h3>
            <span className="px-1.5 py-0.5 bg-slate-800/60 rounded text-[10px] font-mono text-slate-500">
              {milestones.length}
            </span>
          </div>
          <button
            onClick={handleAddMilestone}
            className="p-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 transition-colors"
          >
            <Plus size={12} />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
          {filteredMilestones.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              isSelected={selectedMilestoneId === milestone.id}
              isActive={activeMilestone?.id === milestone.id}
              compact
              onSelect={() => handleSelectMilestone(milestone)}
            />
          ))}
          {filteredMilestones.length === 0 && (
            <div className="flex-1 flex items-center justify-center py-4 text-slate-600">
              <span className="font-mono text-xs">No milestones</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
              appearance_timeline
            </h3>
            <span className="px-2 py-0.5 bg-slate-800/60 rounded text-xs font-mono text-slate-500">
              {filteredMilestones.length} / {milestones.length} milestones
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View mode buttons */}
            <div className="flex bg-slate-800/40 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('timeline')}
                className={cn(
                  'p-1.5 rounded font-mono text-[10px] transition-colors',
                  viewMode === 'timeline'
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-slate-500 hover:text-slate-300'
                )}
                title="Timeline view"
              >
                <List size={14} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-1.5 rounded font-mono text-[10px] transition-colors',
                  viewMode === 'grid'
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-slate-500 hover:text-slate-300'
                )}
                title="Grid view"
              >
                <Grid size={14} />
              </button>
              <button
                onClick={() => setViewMode('comparison')}
                className={cn(
                  'p-1.5 rounded font-mono text-[10px] transition-colors',
                  viewMode === 'comparison'
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-slate-500 hover:text-slate-300'
                )}
                title="Comparison view"
              >
                <GitCompare size={14} />
              </button>
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'p-1.5 rounded transition-colors',
                showFilters
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'bg-slate-800/40 text-slate-500 hover:text-slate-300'
              )}
            >
              <Filter size={14} />
            </button>

            {/* Export button */}
            {onExportRequest && (
              <button
                onClick={onExportRequest}
                className="flex items-center gap-1 px-2 py-1 rounded
                           bg-slate-800/40 hover:bg-slate-700/60 text-slate-400
                           font-mono text-[10px] transition-colors"
              >
                <Download size={12} />
                <span>Export</span>
              </button>
            )}

            {/* Add button */}
            <button
              onClick={handleAddMilestone}
              className="flex items-center gap-1 px-2 py-1 rounded
                         bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400
                         font-mono text-xs transition-colors"
            >
              <Plus size={12} />
              <span>add</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-700/50">
                {/* Search */}
                <div className="relative flex-1 min-w-48">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search milestones..."
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
                  {Object.entries(TRANSFORMATION_TYPES).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>

                {/* Age stage filter */}
                <select
                  value={filterAgeStage}
                  onChange={(e) => setFilterAgeStage(e.target.value as AgeStage | 'all')}
                  className="px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-lg
                             font-mono text-xs text-slate-300
                             focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                >
                  <option value="all">All Ages</option>
                  {Object.entries(AGE_STAGES).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>

                {/* Clear filters */}
                {(searchQuery || filterType !== 'all' || filterAgeStage !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterType('all');
                      setFilterAgeStage('all');
                    }}
                    className="flex items-center gap-1 px-2 py-2 rounded-lg
                               bg-slate-800/40 hover:bg-slate-700/60 text-slate-400
                               font-mono text-xs transition-colors"
                  >
                    <X size={12} />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary stats */}
        {summary && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex items-center gap-2">
              <Layers size={12} className="text-slate-500" />
              <span className="font-mono text-[10px] text-slate-500">
                {summary.total_transformations} transformations
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Star size={12} className="text-yellow-500" />
              <span className="font-mono text-[10px] text-slate-500">
                {summary.milestone_count} milestones
              </span>
            </div>
            {summary.current_age_stage && (
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-amber-500" />
                <span className="font-mono text-[10px] text-slate-500">
                  Current: {AGE_STAGES[summary.current_age_stage]?.label}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Comparison View */}
      {!isLoading && viewMode === 'comparison' && (
        <div className="space-y-4">
          <ComparisonView
            fromMilestone={fromMilestone || null}
            toMilestone={toMilestone || null}
            onSelectFrom={() => setSelectingFor('from')}
            onSelectTo={() => setSelectingFor('to')}
            onSwap={handleSwapComparison}
          />

          {/* Milestone selector when in selection mode */}
          {selectingFor && (
            <div className="p-4 bg-slate-900/60 rounded-lg border border-cyan-500/30">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs text-cyan-400">
                  Select {selectingFor === 'from' ? 'starting' : 'ending'} milestone
                </span>
                <button
                  onClick={() => setSelectingFor(null)}
                  className="p-1 rounded hover:bg-slate-700/50 text-slate-500"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredMilestones.map((milestone) => (
                  <MilestoneCard
                    key={milestone.id}
                    milestone={milestone}
                    isSelected={false}
                    compact
                    onSelect={() => handleSelectMilestone(milestone)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timeline View */}
      {!isLoading && viewMode === 'timeline' && (
        <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
          {filteredMilestones.length > 0 ? (
            <div className="space-y-0">
              {filteredMilestones.map((milestone, index) => (
                <TimelineNode
                  key={milestone.id}
                  milestone={milestone}
                  isFirst={index === 0}
                  isLast={index === filteredMilestones.length - 1}
                  isActive={activeMilestone?.id === milestone.id}
                  isSelected={selectedMilestoneId === milestone.id}
                  onClick={() => handleSelectMilestone(milestone)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Clock size={32} className="mb-3 opacity-50" />
              <p className="font-mono text-sm mb-1">No milestones found</p>
              <p className="font-mono text-xs text-slate-600">
                {milestones.length > 0 ? 'Try adjusting your filters' : 'Add a milestone to start tracking evolution'}
              </p>
              {milestones.length === 0 && (
                <button
                  onClick={handleAddMilestone}
                  className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg
                             bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400
                             font-mono text-xs transition-colors"
                >
                  <Plus size={14} />
                  <span>Add First Milestone</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Grid View */}
      {!isLoading && viewMode === 'grid' && (
        <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
          {filteredMilestones.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMilestones.map((milestone) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  isSelected={selectedMilestoneId === milestone.id}
                  isActive={activeMilestone?.id === milestone.id}
                  onSelect={() => handleSelectMilestone(milestone)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Clock size={32} className="mb-3 opacity-50" />
              <p className="font-mono text-sm mb-1">No milestones found</p>
              <p className="font-mono text-xs text-slate-600">
                {milestones.length > 0 ? 'Try adjusting your filters' : 'Add a milestone to start tracking evolution'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppearanceTimeline;
