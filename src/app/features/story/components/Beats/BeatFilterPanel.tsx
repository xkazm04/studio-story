'use client';

import { useState } from 'react';
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/app/components/UI/Input';
import { Select } from '@/app/components/UI/Select';
import { clsx } from 'clsx';
import { INTERACTIVE } from '@/workspace/theme/tokens';
import { BeatTableItem } from './BeatsOverview';

export interface BeatFilters {
  searchQuery: string;
  type: 'all' | 'story' | 'act';
  completionStatus: 'all' | 'completed' | 'incomplete';
}

interface BeatFilterPanelProps {
  filters: BeatFilters;
  onFiltersChange: (filters: BeatFilters) => void;
  totalBeats: number;
  filteredBeatsCount: number;
}

export const BeatFilterPanel = ({
  filters,
  onFiltersChange,
  totalBeats,
  filteredBeatsCount,
}: BeatFilterPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.type !== 'all' ||
    filters.completionStatus !== 'all';

  const activeFilterCount = [
    filters.searchQuery !== '',
    filters.type !== 'all',
    filters.completionStatus !== 'all',
  ].filter(Boolean).length;

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, searchQuery: value });
  };

  const handleTypeChange = (value: string) => {
    onFiltersChange({ ...filters, type: value as BeatFilters['type'] });
  };

  const handleCompletionChange = (value: string) => {
    onFiltersChange({
      ...filters,
      completionStatus: value as BeatFilters['completionStatus']
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      searchQuery: '',
      type: 'all',
      completionStatus: 'all',
    });
  };

  // Compact view for mobile (hidden on medium screens and larger, or when expanded)
  return (
    <div className="@container w-full">
      {/* Compact view for mobile */}
      <div className={clsx(
        "flex items-center gap-2 p-2 bg-slate-950/80 border border-slate-900/70 rounded-lg",
        isExpanded ? "hidden" : "flex @md:hidden"
      )}>
        <button
          onClick={() => setIsExpanded(true)}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg', INTERACTIVE.transition, 'text-sm',
            'bg-slate-900/80 hover:bg-slate-900',
            hasActiveFilters ? 'border border-cyan-500/40 text-slate-50' : 'border border-slate-800 text-slate-300'
          )}
          data-testid="beat-filter-expand-btn"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-sm font-medium">
              {activeFilterCount}
            </span>
          )}
        </button>
        {filteredBeatsCount !== totalBeats && (
          <span className="text-sm text-slate-400 ml-auto">
            {filteredBeatsCount} of {totalBeats}
          </span>
        )}
      </div>

      {/* Expanded view (always visible on md screens, visible on small when expanded) */}
      <div className={clsx(
        "space-y-3 p-3 bg-slate-950/90 border border-slate-900/70 rounded-lg",
        isExpanded ? "block" : "hidden @md:block"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-slate-200 tracking-tight">Filter Beats</span>
            {hasActiveFilters && (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-sm font-medium">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {filteredBeatsCount !== totalBeats && (
              <span className="text-sm text-slate-400">
                {filteredBeatsCount} of {totalBeats}
              </span>
            )}
            <button
              onClick={() => setIsExpanded(false)}
              className={clsx('p-1 rounded @md:hidden', INTERACTIVE.control)}
              data-testid="beat-filter-collapse-btn"
            >
              <ChevronUp className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <Input
              type="text"
              placeholder="Search beats..."
              value={filters.searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
              size="sm"
              fullWidth
              data-testid="beat-search-input"
            />
          </div>

          {/* Type Filter */}
          <Select
            value={filters.type}
            onChange={(e) => handleTypeChange(e.target.value)}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'story', label: 'Story Beats' },
              { value: 'act', label: 'Act Beats' },
            ]}
            size="sm"
            fullWidth
            data-testid="beat-type-filter"
          />

          {/* Completion Status Filter */}
          <Select
            value={filters.completionStatus}
            onChange={(e) => handleCompletionChange(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'completed', label: 'Completed' },
              { value: 'incomplete', label: 'Incomplete' },
            ]}
            size="sm"
            fullWidth
            data-testid="beat-completion-filter"
          />
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="flex justify-end pt-1">
            <button
              onClick={handleClearFilters}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg ${INTERACTIVE.control} bg-slate-900/80 border border-slate-800`}
              data-testid="beat-clear-filters-btn"
            >
              <X className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to filter beats based on criteria
export const filterBeats = (
  beats: BeatTableItem[],
  filters: BeatFilters
): BeatTableItem[] => {
  return beats.filter((beat) => {
    // Search filter
    if (filters.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase();
      const matchesName = beat.name.toLowerCase().includes(searchLower);
      const matchesDescription = beat.description?.toLowerCase().includes(searchLower);
      if (!matchesName && !matchesDescription) {
        return false;
      }
    }

    // Type filter
    if (filters.type !== 'all' && beat.type !== filters.type) {
      return false;
    }

    // Completion status filter
    if (filters.completionStatus !== 'all') {
      const isCompleted = beat.completed === true;
      if (filters.completionStatus === 'completed' && !isCompleted) {
        return false;
      }
      if (filters.completionStatus === 'incomplete' && isCompleted) {
        return false;
      }
    }

    return true;
  });
};
