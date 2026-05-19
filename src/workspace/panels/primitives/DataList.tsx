'use client';

import React, { useRef, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ArrowUp, ArrowDown } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/app/lib/utils';
import PanelFrame from '../shared/PanelFrame';
import { PanelEmptyState, PanelErrorState, PanelSkeletonList } from '../shared/PanelPrimitives';
import type { BasePrimitiveProps, BulkAction, FieldSchema } from './types';
import { getFieldValue, renderFieldValue } from './utils';
import { getAccent, SPACING, MOTION } from '@/workspace/theme/tokens';
import { useKeyboardNavigation } from './useKeyboardNavigation';
import { useMultiSelect } from './useMultiSelect';
import BulkActionBar from './BulkActionBar';
import { useFacetedFilter } from './useFacetedFilter';
import FacetedFilterBar from './FacetedFilterBar';
import ContextMenu, { useContextMenu } from './ContextMenu';

// ─── Sort Types & Helpers ────────────────────────────────

type SortDirection = 'asc' | 'desc';

interface SortState {
  key: string;
  direction: SortDirection;
}

function compareValues(a: unknown, b: unknown, direction: SortDirection): number {
  const aStr = renderFieldValue(a);
  const bStr = renderFieldValue(b);

  // Try numeric comparison first
  const aNum = Number(aStr);
  const bNum = Number(bStr);
  if (aStr !== '' && bStr !== '' && !isNaN(aNum) && !isNaN(bNum)) {
    return direction === 'asc' ? aNum - bNum : bNum - aNum;
  }

  // Fall back to locale-aware string comparison
  const cmp = aStr.localeCompare(bStr, undefined, { sensitivity: 'base', numeric: true });
  return direction === 'asc' ? cmp : -cmp;
}

interface DataListProps<T extends object = Record<string, unknown>> extends BasePrimitiveProps {
  items: T[];
  fields: FieldSchema[];
  selectedId?: string;
  onSelect?: (item: T) => void;
  highlightIds?: Set<string>;
  highlightField?: string;
  highlightAccent?: string;
  onItemClick?: (item: T) => void;
  numberedItems?: boolean;
  itemBadge?: (item: T) => { label: string; className: string } | null;
  /** Bulk actions shown when multiple items are selected via Ctrl/Shift+click */
  bulkActions?: BulkAction[];
  /** Called when a bulk action button is clicked */
  onBulkAction?: (action: string, ids: string[]) => void;
  /** Returns context menu items for a right-clicked entity */
  contextMenuItems?: (entity: T) => import('./ContextMenu').ContextMenuItem[];
  /** Called when a context menu action is selected */
  onContextMenuAction?: (actionId: string, entity: T) => void;
}

/** Threshold: virtualize lists above this size */
const VIRTUALIZE_THRESHOLD = 50;
/** Estimated row height in px for the virtualizer */
const ROW_HEIGHT = 36;

export default function DataList<T extends object>({
  title,
  icon,
  headerAccent,
  onClose,
  actions,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  items,
  fields,
  selectedId,
  onSelect,
  highlightIds,
  highlightField,
  highlightAccent = 'cyan',
  onItemClick,
  numberedItems,
  itemBadge,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  density,
  bulkActions,
  onBulkAction,
  contextMenuItems,
  onContextMenuAction,
}: DataListProps<T>) {
  const ctxMenu = useContextMenu<T>();

  const listFields = fields.filter(
    (f) => !f.displayIn || f.displayIn.includes('list-item')
  );

  const avatarField = listFields.find((f) => f.type === 'avatar');
  const textFields = listFields.filter((f) => f.type === 'text');
  const titleField = textFields[0];
  const subtitleField = textFields[1];

  const accentStyles = getAccent(highlightAccent);

  const listRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ─── Sorting ─────────────────────────────────────────
  const sortableFields = useMemo(
    () => listFields.filter((f) => f.sortable),
    [listFields]
  );

  const [sortState, setSortState] = useState<SortState | null>(null);

  const toggleSort = (key: string) => {
    setSortState((prev) => {
      if (!prev || prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return null; // third click clears sort
    });
  };

  const sortedItems = useMemo(() => {
    if (!sortState) return items;
    const { key, direction } = sortState;
    return [...items].sort((a, b) =>
      compareValues(getFieldValue(a, key), getFieldValue(b, key), direction)
    );
  }, [items, sortState]);

  // Faceted filtering runs on top of sorting
  const facetFilter = useFacetedFilter(sortedItems, fields);
  const hasFilterableFields = facetFilter.facets.length > 0;
  const displayItems = hasFilterableFields ? facetFilter.filteredItems : sortedItems;

  const allSortedIds = useMemo(
    () => displayItems.map((item) => renderFieldValue(getFieldValue(item, 'id'))),
    [displayItems],
  );
  const multiSelect = useMultiSelect(allSortedIds);
  const hasBulkActions = bulkActions && bulkActions.length > 0;

  const shouldVirtualize = displayItems.length > VIRTUALIZE_THRESHOLD;

  const handleListKeyDown = useKeyboardNavigation(listRef, {
    selector: '[role="option"]',
    mode: 'list',
  });

  return (
    <PanelFrame
      title={title}
      icon={icon}
      headerAccent={headerAccent}
      onClose={onClose}
      actions={actions}
      density={density}
    >
      {hasBulkActions && (
        <BulkActionBar
          selectedCount={multiSelect.selectedIds.size}
          totalCount={displayItems.length}
          actions={bulkActions!}
          onAction={(actionId) =>
            onBulkAction?.(actionId, Array.from(multiSelect.selectedIds))
          }
          onSelectAll={() => multiSelect.selectAll(allSortedIds)}
          onClear={multiSelect.clearSelection}
        />
      )}

      {isLoading ? (
        <PanelSkeletonList rows={5} />
      ) : isError ? (
        <PanelErrorState message={errorMessage} onRetry={onRetry} />
      ) : displayItems.length === 0 ? (
        <PanelEmptyState
          icon={emptyIcon}
          title={emptyTitle ?? 'No items'}
          description={emptyDescription}
        />
      ) : (
        <>
          {sortableFields.length > 0 && (
            <SortHeader
              fields={sortableFields}
              sortState={sortState}
              onToggle={toggleSort}
            />
          )}
          {hasFilterableFields && (
            <FacetedFilterBar
              facets={facetFilter.facets}
              activeFilterCount={facetFilter.activeFilterCount}
              toggleValue={facetFilter.toggleValue}
              setTextQuery={facetFilter.setTextQuery}
              setDateRange={facetFilter.setDateRange}
              setNumberRange={facetFilter.setNumberRange}
              clearField={facetFilter.clearField}
              clearAll={facetFilter.clearAll}
            />
          )}
          {shouldVirtualize ? (
            <div
              ref={scrollRef}
              className={cn('overflow-auto flex-1', SPACING.panelPaddingCompact)}
            >
              <VirtualizedList
                items={displayItems}
                listRef={listRef}
                scrollRef={scrollRef}
                title={title}
                handleListKeyDown={handleListKeyDown}
                selectedId={selectedId}
                multiSelectedIds={hasBulkActions ? multiSelect.selectedIds : undefined}
                onMultiClick={hasBulkActions ? multiSelect.handleClick : undefined}
                highlightIds={highlightIds}
                highlightField={highlightField}
                accentStyles={accentStyles}
                onItemClick={onItemClick}
                onSelect={onSelect}
                numberedItems={numberedItems}
                itemBadge={itemBadge}
                avatarField={avatarField}
                titleField={titleField}
                subtitleField={subtitleField}
                onContextMenu={contextMenuItems ? ctxMenu.open : undefined}
              />
            </div>
          ) : (
            <div
              ref={listRef}
              role="listbox"
              aria-label={title}
              onKeyDown={handleListKeyDown}
              className={cn(SPACING.listGap, SPACING.panelPaddingCompact)}
            >
              <AnimatePresence mode="popLayout">
                {displayItems.map((item, index) => (
                  <DataListRow
                    key={renderFieldValue(getFieldValue(item, 'id')) || `item-${index}`}
                    item={item}
                    index={index}
                    animated
                    selectedId={selectedId}
                    multiSelectedIds={hasBulkActions ? multiSelect.selectedIds : undefined}
                    onMultiClick={hasBulkActions ? multiSelect.handleClick : undefined}
                    highlightIds={highlightIds}
                    highlightField={highlightField}
                    accentStyles={accentStyles}
                    onItemClick={onItemClick}
                    onSelect={onSelect}
                    numberedItems={numberedItems}
                    itemBadge={itemBadge}
                    avatarField={avatarField}
                    titleField={titleField}
                    subtitleField={subtitleField}
                    onContextMenu={contextMenuItems ? ctxMenu.open : undefined}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {ctxMenu.position && ctxMenu.entity && contextMenuItems && (
        <ContextMenu
          position={ctxMenu.position}
          items={contextMenuItems(ctxMenu.entity)}
          onAction={(actionId) => onContextMenuAction?.(actionId, ctxMenu.entity!)}
          onClose={ctxMenu.close}
        />
      )}
    </PanelFrame>
  );
}

// ─── Sort Header ─────────────────────────────────────────

interface SortHeaderProps {
  fields: FieldSchema[];
  sortState: SortState | null;
  onToggle: (key: string) => void;
}

function SortHeader({ fields, sortState, onToggle }: SortHeaderProps) {
  return (
    <div
      className="flex items-center gap-1 px-3 py-1 border-b border-slate-800/60"
      role="toolbar"
      aria-label="Sort controls"
    >
      <span className="text-[10px] uppercase tracking-wider text-slate-600 mr-1 select-none">
        Sort
      </span>
      {fields.map((field) => {
        const isActive = sortState?.key === field.key;
        const direction = isActive ? sortState!.direction : null;
        return (
          <button
            key={field.key}
            type="button"
            onClick={() => onToggle(field.key)}
            className={cn(
              'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors',
              isActive
                ? 'bg-cyan-500/15 text-cyan-300'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40',
            )}
            aria-label={`Sort by ${field.label}${direction ? ` ${direction}ending` : ''}`}
            aria-pressed={isActive}
          >
            {field.label}
            {direction === 'asc' && <ArrowUp className="w-3 h-3" />}
            {direction === 'desc' && <ArrowDown className="w-3 h-3" />}
          </button>
        );
      })}
    </div>
  );
}

// ─── Virtualized List ────────────────────────────────────

interface VirtualizedListProps<T extends object> {
  items: T[];
  listRef: React.RefObject<HTMLDivElement | null>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  title: string;
  handleListKeyDown: (e: React.KeyboardEvent) => void;
  selectedId?: string;
  multiSelectedIds?: Set<string>;
  onMultiClick?: (id: string, index: number, e: React.MouseEvent) => boolean;
  highlightIds?: Set<string>;
  highlightField?: string;
  accentStyles: ReturnType<typeof getAccent>;
  onItemClick?: (item: T) => void;
  onSelect?: (item: T) => void;
  numberedItems?: boolean;
  itemBadge?: (item: T) => { label: string; className: string } | null;
  avatarField?: FieldSchema;
  titleField?: FieldSchema;
  subtitleField?: FieldSchema;
  onContextMenu?: (e: React.MouseEvent, item: T) => void;
}

function VirtualizedList<T extends object>({
  items,
  listRef,
  scrollRef,
  title,
  handleListKeyDown,
  selectedId,
  multiSelectedIds,
  onMultiClick,
  highlightIds,
  highlightField,
  accentStyles,
  onItemClick,
  onSelect,
  numberedItems,
  itemBadge,
  avatarField,
  titleField,
  subtitleField,
  onContextMenu,
}: VirtualizedListProps<T>) {
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  // Track which indices were recently visible for enter animations
  const [animatedIndices] = useState(() => new Set<number>());

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label={title}
      onKeyDown={handleListKeyDown}
      style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
    >
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const item = items[virtualRow.index];
        const shouldAnimate = !animatedIndices.has(virtualRow.index);
        if (shouldAnimate) animatedIndices.add(virtualRow.index);

        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <DataListRow
              item={item}
              index={virtualRow.index}
              animated={shouldAnimate}
              selectedId={selectedId}
              multiSelectedIds={multiSelectedIds}
              onMultiClick={onMultiClick}
              highlightIds={highlightIds}
              highlightField={highlightField}
              accentStyles={accentStyles}
              onItemClick={onItemClick}
              onSelect={onSelect}
              numberedItems={numberedItems}
              itemBadge={itemBadge}
              avatarField={avatarField}
              titleField={titleField}
              subtitleField={subtitleField}
              onContextMenu={onContextMenu}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Row Component ───────────────────────────────────────

interface DataListRowProps<T extends object> {
  item: T;
  index: number;
  animated: boolean;
  selectedId?: string;
  multiSelectedIds?: Set<string>;
  onMultiClick?: (id: string, index: number, e: React.MouseEvent) => boolean;
  highlightIds?: Set<string>;
  highlightField?: string;
  accentStyles: ReturnType<typeof getAccent>;
  onItemClick?: (item: T) => void;
  onSelect?: (item: T) => void;
  numberedItems?: boolean;
  itemBadge?: (item: T) => { label: string; className: string } | null;
  avatarField?: FieldSchema;
  titleField?: FieldSchema;
  subtitleField?: FieldSchema;
  onContextMenu?: (e: React.MouseEvent, item: T) => void;
}

function DataListRowInner<T extends object>({
  item,
  index,
  animated,
  selectedId,
  multiSelectedIds,
  onMultiClick,
  highlightIds,
  highlightField,
  accentStyles,
  onItemClick,
  onSelect,
  numberedItems,
  itemBadge,
  avatarField,
  titleField,
  subtitleField,
  onContextMenu,
}: DataListRowProps<T>) {
  const id = renderFieldValue(getFieldValue(item, 'id'));
  const isSelected = selectedId != null && id === selectedId;
  const isMultiSelected = multiSelectedIds?.has(id) ?? false;
  const highlightKey = highlightField ?? 'id';
  const highlightValue = renderFieldValue(getFieldValue(item, highlightKey));
  const isHighlighted = highlightIds?.has(highlightValue) ?? false;
  const badge = itemBadge?.(item) ?? null;

  const handleClick = (e: React.MouseEvent) => {
    if (onMultiClick) {
      const consumed = onMultiClick(id, index, e);
      if (consumed) return;
    }
    if (onItemClick) {
      onItemClick(item);
    } else {
      onSelect?.(item);
    }
  };

  const className = cn(
    `group flex w-full items-center gap-2 rounded-md ${SPACING.rowPx} ${SPACING.rowPy} min-h-[30px] text-left transition-all ${MOTION.hoverDuration} border`,
    'border-transparent',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50',
    !isSelected && !isMultiSelected && !isHighlighted && 'hover:bg-slate-800/40',
    (isSelected || isHighlighted || isMultiSelected) && 'hover:brightness-[1.15]',
    isMultiSelected && 'bg-cyan-500/[0.08] border-l-2 border-l-cyan-500/40 border-cyan-500/25',
    isHighlighted && !isMultiSelected && cn(accentStyles.border, 'border-l-2', accentStyles.leftBorder),
    isHighlighted && !isSelected && !isMultiSelected && accentStyles.bg,
    isSelected && !isMultiSelected && 'bg-amber-500/[0.08] border-l-2 border-l-amber-500/40',
    isSelected && !isHighlighted && !isMultiSelected && 'border-amber-500/25',
    isSelected && isHighlighted && !isMultiSelected && 'shadow-[inset_0_0_0_1px_rgba(245,158,11,0.25),0_0_0_2px_var(--highlight-ring)]',
  );

  const style = isSelected && isHighlighted
    ? { '--highlight-ring': accentStyles.ring.match(/rgba\([^)]+\)/)?.[0] ?? 'rgba(6,182,212,0.25)' } as React.CSSProperties
    : undefined;

  const content = (
    <>
      {isHighlighted && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', accentStyles.dot)} />
      )}
      {numberedItems && (
        <span
          className={cn(
            'w-4 h-4 rounded flex items-center justify-center text-xs font-mono font-bold shrink-0',
            isSelected
              ? 'bg-amber-500/20 text-amber-300'
              : 'bg-slate-800/60 text-slate-500'
          )}
        >
          {index + 1}
        </span>
      )}
      {avatarField && (
        <ListAvatar value={getFieldValue(item, avatarField.key)} />
      )}
      <div className="flex-1 min-w-0">
        {titleField && (
          <span className="block text-sm font-medium text-slate-300 truncate">
            {renderFieldValue(getFieldValue(item, titleField.key))}
          </span>
        )}
        {subtitleField && (
          <span className="block text-xs text-slate-500 truncate">
            {renderFieldValue(getFieldValue(item, subtitleField.key))}
          </span>
        )}
      </div>
      {badge && (
        <span
          className={cn(
            'px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-medium shrink-0',
            badge.className
          )}
        >
          {badge.label}
        </span>
      )}
    </>
  );

  const handleRightClick = onContextMenu
    ? (e: React.MouseEvent) => onContextMenu(e, item)
    : undefined;

  if (animated) {
    return (
      <motion.button
        role="option"
        aria-selected={isSelected || isMultiSelected}
        tabIndex={isSelected || (selectedId == null && index === 0) ? 0 : -1}
        initial={MOTION.listEnter}
        animate={{ ...MOTION.show, transition: { delay: MOTION.stagger(index) } }}
        type="button"
        onClick={handleClick}
        onContextMenu={handleRightClick}
        className={className}
        style={style}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <button
      role="option"
      aria-selected={isSelected || isMultiSelected}
      tabIndex={isSelected || (selectedId == null && index === 0) ? 0 : -1}
      type="button"
      onClick={handleClick}
      onContextMenu={handleRightClick}
      className={className}
      style={style}
    >
      {content}
    </button>
  );
}
const DataListRow = React.memo(DataListRowInner) as typeof DataListRowInner;

function ListAvatar({ value }: { value: unknown }) {
  const src = typeof value === 'string' ? value : null;

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="w-6 h-6 rounded-full object-cover border border-slate-700/50 shrink-0"
      />
    );
  }

  return (
    <div className="flex w-6 h-6 items-center justify-center rounded-full border border-slate-700/50 bg-slate-800/60 shrink-0">
      <User className="w-3 h-3 text-slate-500" />
    </div>
  );
}
