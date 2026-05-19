'use client';

import { useState, useMemo, useCallback } from 'react';
import type { FieldSchema } from './types';
import { getFieldValue, renderFieldValue } from './utils';

// ─── Types ───────────────────────────────────────────────

export interface FacetOption {
  value: string;
  count: number;
}

export interface DateRange {
  from: string; // ISO date string
  to: string;
}

export interface FacetState {
  /** badge / text fields: set of selected values */
  selected: Set<string>;
  /** date fields: optional range */
  dateRange: DateRange | null;
  /** number fields: optional min/max */
  numberRange: { min: number; max: number } | null;
  /** text fields: typeahead query */
  textQuery: string;
}

export interface FacetMeta {
  field: FieldSchema;
  options: FacetOption[];
  state: FacetState;
}

export interface FacetedFilterResult<T> {
  /** Items after all active filters applied */
  filteredItems: T[];
  /** Per-field facet metadata (options, active state) */
  facets: FacetMeta[];
  /** Number of active filter constraints */
  activeFilterCount: number;
  /** Toggle a discrete value for a badge/text facet */
  toggleValue: (fieldKey: string, value: string) => void;
  /** Set text query for a text facet */
  setTextQuery: (fieldKey: string, query: string) => void;
  /** Set date range for a date facet */
  setDateRange: (fieldKey: string, range: DateRange | null) => void;
  /** Set number range for a number facet */
  setNumberRange: (fieldKey: string, range: { min: number; max: number } | null) => void;
  /** Clear all filters for a specific field */
  clearField: (fieldKey: string) => void;
  /** Clear all filters */
  clearAll: () => void;
}

function emptyState(): FacetState {
  return { selected: new Set(), dateRange: null, numberRange: null, textQuery: '' };
}

// ─── Hook ────────────────────────────────────────────────

export function useFacetedFilter<T extends object>(
  items: T[],
  fields: FieldSchema[],
): FacetedFilterResult<T> {
  const filterableFields = useMemo(
    () => fields.filter((f) => f.filterable),
    [fields],
  );

  const [stateMap, setStateMap] = useState<Record<string, FacetState>>({});

  const getState = useCallback(
    (key: string): FacetState => stateMap[key] ?? emptyState(),
    [stateMap],
  );

  const updateField = useCallback(
    (key: string, updater: (prev: FacetState) => FacetState) => {
      setStateMap((prev) => ({
        ...prev,
        [key]: updater(prev[key] ?? emptyState()),
      }));
    },
    [],
  );

  // ─── Compute facet options from unfiltered items ──────

  const facetOptions = useMemo(() => {
    const map: Record<string, Map<string, number>> = {};
    for (const field of filterableFields) {
      if (field.type === 'badge' || field.type === 'text') {
        const counts = new Map<string, number>();
        for (const item of items) {
          const raw = renderFieldValue(getFieldValue(item, field.key));
          if (raw) {
            counts.set(raw, (counts.get(raw) ?? 0) + 1);
          }
        }
        map[field.key] = counts;
      }
    }
    return map;
  }, [items, filterableFields]);

  // ─── Filter items ─────────────────────────────────────

  const filteredItems = useMemo(() => {
    const activeFields = filterableFields.filter((f) => {
      const s = getState(f.key);
      return (
        s.selected.size > 0 ||
        s.dateRange !== null ||
        s.numberRange !== null ||
        s.textQuery.length > 0
      );
    });

    if (activeFields.length === 0) return items;

    return items.filter((item) =>
      activeFields.every((field) => {
        const s = getState(field.key);
        const raw = getFieldValue(item, field.key);
        const str = renderFieldValue(raw);

        if (field.type === 'badge' && s.selected.size > 0) {
          return s.selected.has(str);
        }

        if (field.type === 'text' && s.selected.size > 0) {
          return s.selected.has(str);
        }

        if (field.type === 'text' && s.textQuery) {
          return str.toLowerCase().includes(s.textQuery.toLowerCase());
        }

        if (field.type === 'date' && s.dateRange) {
          const dateStr = str;
          if (!dateStr) return false;
          return dateStr >= s.dateRange.from && dateStr <= s.dateRange.to;
        }

        if (field.type === 'number' && s.numberRange) {
          const num = Number(str);
          if (isNaN(num)) return false;
          return num >= s.numberRange.min && num <= s.numberRange.max;
        }

        return true;
      }),
    );
  }, [items, filterableFields, getState]);

  // ─── Build facet metadata ─────────────────────────────

  const facets: FacetMeta[] = useMemo(
    () =>
      filterableFields.map((field) => {
        const counts = facetOptions[field.key];
        const options: FacetOption[] = counts
          ? Array.from(counts.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([value, count]) => ({ value, count }))
          : [];
        return { field, options, state: getState(field.key) };
      }),
    [filterableFields, facetOptions, getState],
  );

  // ─── Count active filters ─────────────────────────────

  const activeFilterCount = useMemo(
    () =>
      filterableFields.reduce((count, f) => {
        const s = getState(f.key);
        if (s.selected.size > 0 || s.dateRange || s.numberRange || s.textQuery) {
          return count + 1;
        }
        return count;
      }, 0),
    [filterableFields, getState],
  );

  // ─── Actions ──────────────────────────────────────────

  const toggleValue = useCallback(
    (fieldKey: string, value: string) => {
      updateField(fieldKey, (prev) => {
        const next = new Set(prev.selected);
        if (next.has(value)) {
          next.delete(value);
        } else {
          next.add(value);
        }
        return { ...prev, selected: next };
      });
    },
    [updateField],
  );

  const setTextQuery = useCallback(
    (fieldKey: string, query: string) => {
      updateField(fieldKey, (prev) => ({ ...prev, textQuery: query }));
    },
    [updateField],
  );

  const setDateRange = useCallback(
    (fieldKey: string, range: DateRange | null) => {
      updateField(fieldKey, (prev) => ({ ...prev, dateRange: range }));
    },
    [updateField],
  );

  const setNumberRange = useCallback(
    (fieldKey: string, range: { min: number; max: number } | null) => {
      updateField(fieldKey, (prev) => ({ ...prev, numberRange: range }));
    },
    [updateField],
  );

  const clearField = useCallback(
    (fieldKey: string) => {
      setStateMap((prev) => {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
    },
    [],
  );

  const clearAll = useCallback(() => {
    setStateMap({});
  }, []);

  return {
    filteredItems,
    facets,
    activeFilterCount,
    toggleValue,
    setTextQuery,
    setDateRange,
    setNumberRange,
    clearField,
    clearAll,
  };
}
