'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Filter, X, ChevronDown, Calendar, Hash } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type { FacetMeta, FacetedFilterResult } from './useFacetedFilter';

// ─── Props ───────────────────────────────────────────────

interface FacetedFilterBarProps {
  facets: FacetMeta[];
  activeFilterCount: number;
  toggleValue: FacetedFilterResult<object>['toggleValue'];
  setTextQuery: FacetedFilterResult<object>['setTextQuery'];
  setDateRange: FacetedFilterResult<object>['setDateRange'];
  setNumberRange: FacetedFilterResult<object>['setNumberRange'];
  clearField: FacetedFilterResult<object>['clearField'];
  clearAll: FacetedFilterResult<object>['clearAll'];
}

// ─── Component ───────────────────────────────────────────

export default function FacetedFilterBar({
  facets,
  activeFilterCount,
  toggleValue,
  setTextQuery,
  setDateRange,
  setNumberRange,
  clearField,
  clearAll,
}: FacetedFilterBarProps) {
  const [expandedFacet, setExpandedFacet] = useState<string | null>(null);

  if (facets.length === 0) return null;

  return (
    <div className="shrink-0 border-b border-slate-800/40">
      {/* Active filter pills */}
      {activeFilterCount > 0 && (
        <ActiveFilterPills
          facets={facets}
          clearField={clearField}
          clearAll={clearAll}
        />
      )}

      {/* Facet buttons row */}
      <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto">
        <Filter className="w-3 h-3 text-slate-500 shrink-0" />
        {facets.map((facet) => (
          <FacetButton
            key={facet.field.key}
            facet={facet}
            isExpanded={expandedFacet === facet.field.key}
            onToggle={() =>
              setExpandedFacet((prev) =>
                prev === facet.field.key ? null : facet.field.key,
              )
            }
          />
        ))}
      </div>

      {/* Expanded facet dropdown */}
      {expandedFacet && (
        <FacetDropdown
          facet={facets.find((f) => f.field.key === expandedFacet)!}
          toggleValue={toggleValue}
          setTextQuery={setTextQuery}
          setDateRange={setDateRange}
          setNumberRange={setNumberRange}
          onClose={() => setExpandedFacet(null)}
        />
      )}
    </div>
  );
}

// ─── Facet Button ────────────────────────────────────────

function FacetButton({
  facet,
  isExpanded,
  onToggle,
}: {
  facet: FacetMeta;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const hasActive =
    facet.state.selected.size > 0 ||
    facet.state.dateRange !== null ||
    facet.state.numberRange !== null ||
    facet.state.textQuery.length > 0;

  const activeCount = facet.state.selected.size;

  const icon =
    facet.field.type === 'date' ? (
      <Calendar className="w-3 h-3" />
    ) : facet.field.type === 'number' ? (
      <Hash className="w-3 h-3" />
    ) : null;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors shrink-0',
        hasActive
          ? 'bg-cyan-500/15 text-cyan-300'
          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40',
        isExpanded && 'ring-1 ring-cyan-500/30',
      )}
      aria-expanded={isExpanded}
      aria-label={`Filter by ${facet.field.label}`}
    >
      {icon}
      {facet.field.label}
      {activeCount > 0 && (
        <span className="bg-cyan-500/25 text-cyan-200 rounded-full px-1 text-[9px] min-w-[14px] text-center">
          {activeCount}
        </span>
      )}
      <ChevronDown
        className={cn(
          'w-2.5 h-2.5 transition-transform',
          isExpanded && 'rotate-180',
        )}
      />
    </button>
  );
}

// ─── Active Filter Pills ─────────────────────────────────

function ActiveFilterPills({
  facets,
  clearField,
  clearAll,
}: {
  facets: FacetMeta[];
  clearField: (key: string) => void;
  clearAll: () => void;
}) {
  const activeFacets = facets.filter(
    (f) =>
      f.state.selected.size > 0 ||
      f.state.dateRange !== null ||
      f.state.numberRange !== null ||
      f.state.textQuery.length > 0,
  );

  return (
    <div className="flex items-center gap-1 px-2 py-1 overflow-x-auto">
      {activeFacets.map((facet) => (
        <FilterPill key={facet.field.key} facet={facet} onClear={() => clearField(facet.field.key)} />
      ))}
      {activeFacets.length > 1 && (
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

function FilterPill({
  facet,
  onClear,
}: {
  facet: FacetMeta;
  onClear: () => void;
}) {
  let label = facet.field.label;
  const { selected, dateRange, numberRange, textQuery } = facet.state;

  if (selected.size > 0) {
    const values = Array.from(selected);
    label +=
      values.length <= 2
        ? `: ${values.join(', ')}`
        : `: ${values[0]} +${values.length - 1}`;
  } else if (dateRange) {
    label += `: ${dateRange.from.slice(0, 10)} – ${dateRange.to.slice(0, 10)}`;
  } else if (numberRange) {
    label += `: ${numberRange.min}–${numberRange.max}`;
  } else if (textQuery) {
    label += `: "${textQuery}"`;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[10px] text-cyan-300 shrink-0">
      {label}
      <button
        type="button"
        onClick={onClear}
        className="hover:text-cyan-100 transition-colors"
        aria-label={`Clear ${facet.field.label} filter`}
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

// ─── Facet Dropdown ──────────────────────────────────────

function FacetDropdown({
  facet,
  toggleValue,
  setTextQuery,
  setDateRange,
  setNumberRange,
  onClose,
}: {
  facet: FacetMeta;
  toggleValue: (key: string, value: string) => void;
  setTextQuery: (key: string, query: string) => void;
  setDateRange: (key: string, range: { from: string; to: string } | null) => void;
  setNumberRange: (key: string, range: { min: number; max: number } | null) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="mx-2 mb-1.5 rounded-md border border-slate-700/60 bg-slate-900/95 backdrop-blur-sm max-h-48 overflow-auto"
    >
      {(facet.field.type === 'badge' || facet.field.type === 'text') && (
        <BadgeFacetContent
          facet={facet}
          toggleValue={(val) => toggleValue(facet.field.key, val)}
          setTextQuery={(q) => setTextQuery(facet.field.key, q)}
        />
      )}
      {facet.field.type === 'date' && (
        <DateFacetContent
          facet={facet}
          setDateRange={(r) => setDateRange(facet.field.key, r)}
        />
      )}
      {facet.field.type === 'number' && (
        <NumberFacetContent
          facet={facet}
          setNumberRange={(r) => setNumberRange(facet.field.key, r)}
        />
      )}
    </div>
  );
}

// ─── Badge / Text Facet Content ──────────────────────────

function BadgeFacetContent({
  facet,
  toggleValue,
  setTextQuery,
}: {
  facet: FacetMeta;
  toggleValue: (value: string) => void;
  setTextQuery: (query: string) => void;
}) {
  const [typeahead, setTypeahead] = useState('');

  const filteredOptions = useMemo(() => {
    if (!typeahead) return facet.options;
    const lower = typeahead.toLowerCase();
    return facet.options.filter((o) => o.value.toLowerCase().includes(lower));
  }, [facet.options, typeahead]);

  return (
    <div className="p-1.5">
      {facet.options.length > 5 && (
        <input
          type="text"
          value={typeahead}
          onChange={(e) => {
            setTypeahead(e.target.value);
            if (facet.field.type === 'text') {
              setTextQuery(e.target.value);
            }
          }}
          placeholder={`Search ${facet.field.label.toLowerCase()}...`}
          className="w-full rounded border border-slate-700/60 bg-slate-800/60 px-2 py-1 text-[11px] text-slate-200 placeholder:text-slate-500 mb-1.5 focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
          autoFocus
        />
      )}
      <div className="flex flex-col gap-0.5">
        {filteredOptions.map((opt) => {
          const isActive = facet.state.selected.has(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleValue(opt.value)}
              className={cn(
                'flex items-center justify-between rounded px-2 py-1 text-[11px] transition-colors text-left',
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40',
              )}
            >
              <span className="flex items-center gap-1.5 min-w-0">
                <span
                  className={cn(
                    'w-3 h-3 rounded border flex items-center justify-center shrink-0',
                    isActive
                      ? 'border-cyan-500/50 bg-cyan-500/20'
                      : 'border-slate-600',
                  )}
                >
                  {isActive && (
                    <svg viewBox="0 0 12 12" className="w-2 h-2 text-cyan-300" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </span>
                <span className="truncate">{opt.value}</span>
              </span>
              <span className="text-[9px] text-slate-600 ml-2 shrink-0">
                {opt.count}
              </span>
            </button>
          );
        })}
        {filteredOptions.length === 0 && (
          <span className="px-2 py-1 text-[10px] text-slate-600">No matches</span>
        )}
      </div>
    </div>
  );
}

// ─── Date Facet Content ──────────────────────────────────

function DateFacetContent({
  facet,
  setDateRange,
}: {
  facet: FacetMeta;
  setDateRange: (range: { from: string; to: string } | null) => void;
}) {
  const [from, setFrom] = useState(facet.state.dateRange?.from.slice(0, 10) ?? '');
  const [to, setTo] = useState(facet.state.dateRange?.to.slice(0, 10) ?? '');

  const apply = () => {
    if (from && to) {
      setDateRange({ from, to });
    } else {
      setDateRange(null);
    }
  };

  return (
    <div className="p-2 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <label className="text-[10px] text-slate-500 w-8">From</label>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="flex-1 rounded border border-slate-700/60 bg-slate-800/60 px-2 py-0.5 text-[11px] text-slate-200 focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <label className="text-[10px] text-slate-500 w-8">To</label>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="flex-1 rounded border border-slate-700/60 bg-slate-800/60 px-2 py-0.5 text-[11px] text-slate-200 focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
        />
      </div>
      <div className="flex items-center gap-1 pt-0.5">
        <button
          type="button"
          onClick={apply}
          className="rounded px-2 py-0.5 text-[10px] font-medium bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 transition-colors"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={() => { setFrom(''); setTo(''); setDateRange(null); }}
          className="rounded px-2 py-0.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

// ─── Number Facet Content ────────────────────────────────

function NumberFacetContent({
  facet,
  setNumberRange,
}: {
  facet: FacetMeta;
  setNumberRange: (range: { min: number; max: number } | null) => void;
}) {
  const [min, setMin] = useState(facet.state.numberRange?.min.toString() ?? '');
  const [max, setMax] = useState(facet.state.numberRange?.max.toString() ?? '');

  const apply = () => {
    const minN = Number(min);
    const maxN = Number(max);
    if (!isNaN(minN) && !isNaN(maxN)) {
      setNumberRange({ min: minN, max: maxN });
    } else {
      setNumberRange(null);
    }
  };

  return (
    <div className="p-2 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <label className="text-[10px] text-slate-500 w-8">Min</label>
        <input
          type="number"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          className="flex-1 rounded border border-slate-700/60 bg-slate-800/60 px-2 py-0.5 text-[11px] text-slate-200 focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <label className="text-[10px] text-slate-500 w-8">Max</label>
        <input
          type="number"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          className="flex-1 rounded border border-slate-700/60 bg-slate-800/60 px-2 py-0.5 text-[11px] text-slate-200 focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
        />
      </div>
      <div className="flex items-center gap-1 pt-0.5">
        <button
          type="button"
          onClick={apply}
          className="rounded px-2 py-0.5 text-[10px] font-medium bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 transition-colors"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={() => { setMin(''); setMax(''); setNumberRange(null); }}
          className="rounded px-2 py-0.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
