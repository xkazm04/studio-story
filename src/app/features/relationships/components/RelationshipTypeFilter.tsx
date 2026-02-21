'use client';

import React from 'react';
import { Filter } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { RelationshipType, RelationshipTypeConfig } from '../types';

interface RelationshipTypeFilterProps {
  activeFilters: Set<RelationshipType>;
  onFilterChange: (filters: Set<RelationshipType>) => void;
}

const RelationshipTypeFilter: React.FC<RelationshipTypeFilterProps> = ({
  activeFilters,
  onFilterChange
}) => {
  const handleToggle = (type: RelationshipType) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(type)) {
      newFilters.delete(type);
    } else {
      newFilters.add(type);
    }
    onFilterChange(newFilters);
  };

  const handleToggleAll = () => {
    if (activeFilters.size === Object.keys(RelationshipType).length) {
      // Deselect all
      onFilterChange(new Set());
    } else {
      // Select all
      onFilterChange(new Set(Object.values(RelationshipType)));
    }
  };

  const allSelected = activeFilters.size === Object.keys(RelationshipType).length;

  return (
    <div className="absolute top-4 right-4 z-10 w-72">
      {/* Glassmorphism Panel */}
      <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-white" />
            <h3 className="text-white font-semibold text-sm">
              Relationship Filters
            </h3>
          </div>
          <button
            onClick={handleToggleAll}
            className="text-xs text-blue-300 hover:text-blue-200 transition-colors font-medium"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {/* Filter Options */}
        <div className="space-y-2">
          {Object.entries(RelationshipTypeConfig).map(([type, config]) => {
            const isActive = activeFilters.has(type as RelationshipType);

            return (
              <label
                key={type}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200',
                  isActive
                    ? 'bg-white/20 shadow-md'
                    : 'bg-white/5 hover:bg-white/10'
                )}
              >
                {/* Custom Checkbox */}
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => handleToggle(type as RelationshipType)}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200',
                      isActive
                        ? 'border-white bg-white/30 scale-110'
                        : 'border-white/50 bg-transparent'
                    )}
                  >
                    {isActive && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Color Indicator */}
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: config.color }}
                />

                {/* Label */}
                <span className="text-white text-sm font-medium flex-1">
                  {config.label}
                </span>

                {/* Count Badge (optional - for future use) */}
                {/* <span className="text-xs text-white/70 bg-white/10 px-2 py-0.5 rounded-full">
                  0
                </span> */}
              </label>
            );
          })}
        </div>

        {/* Active Count */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="text-xs text-white/70 text-center">
            {activeFilters.size === 0
              ? 'No filters active (showing all)'
              : `Showing ${activeFilters.size} of ${Object.keys(RelationshipType).length} types`
            }
          </div>
        </div>
      </div>

      {/* Decorative Glow */}
      <div
        className="absolute inset-0 rounded-2xl blur-xl opacity-30 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.5), rgba(147, 51, 234, 0.5))'
        }}
      />
    </div>
  );
};

export default RelationshipTypeFilter;
