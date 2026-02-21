'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/app/components/UI/Input';
import { Select } from '@/app/components/UI/Select';
import { clsx } from 'clsx';
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Compact view for mobile
  if (isMobile && !isExpanded) {
    return (
      <div className="flex items-center gap-2 p-2 bg-slate-950/80 border border-slate-900/70 rounded-lg">
        <button
          onClick={() => setIsExpanded(true)}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-xs',
            'bg-slate-900/80 hover:bg-slate-900',
            hasActiveFilters ? 'border border-cyan-500/40 text-slate-50' : 'border border-slate-800 text-slate-300'
          )}
          data-testid="beat-filter-expand-btn"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-medium">
              {activeFilterCount}
            </span>
          )}
        </button>
        {filteredBeatsCount !== totalBeats && (
          <span className="text-xs text-slate-400 ml-auto">
            {filteredBeatsCount} of {totalBeats}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 bg-slate-950/90 border border-slate-900/70 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-medium text-slate-200 tracking-tight">Filter Beats</span>
          {hasActiveFilters && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-medium">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {filteredBeatsCount !== totalBeats && (
            <span className="text-xs text-slate-400">
              {filteredBeatsCount} of {totalBeats}
            </span>
          )}
          {isMobile && (
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-slate-900 rounded transition-colors"
              data-testid="beat-filter-collapse-btn"
            >
              <ChevronUp className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Search Input */}
        <div className="relative md:col-span-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Search className="w-4 h-4 text-slate-500" />
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-lg transition-all bg-slate-900/80 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            data-testid="beat-clear-filters-btn"
          >
            <X className="w-3.5 h-3.5" />
            Clear Filters
          </button>
        </div>
      )}
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
