'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/app/lib/utils';
import PanelFrame from '../shared/PanelFrame';
import { PanelEmptyState, PanelErrorState, PanelSkeletonList } from '../shared/PanelPrimitives';
import type { BasePrimitiveProps, BulkAction, FieldSchema } from './types';
import { getFieldValue, renderFieldValue } from './utils';
import { SPACING, MOTION } from '@/workspace/theme/tokens';
import { useKeyboardNavigation } from './useKeyboardNavigation';
import { useMultiSelect } from './useMultiSelect';
import BulkActionBar from './BulkActionBar';
import { useFacetedFilter } from './useFacetedFilter';
import FacetedFilterBar from './FacetedFilterBar';
import ContextMenu, { useContextMenu } from './ContextMenu';

interface CardGridProps<T extends object = Record<string, unknown>> extends BasePrimitiveProps {
  items: T[];
  fields: FieldSchema[];
  selectedId?: string;
  highlightIds?: Set<string>;
  highlightField?: string;
  onSelect?: (item: T) => void;
  searchable?: boolean;
  searchField?: string;
  cardVariant?: 'compact' | 'standard' | 'gallery';
  /** Bulk actions shown when multiple items are selected via Ctrl/Shift+click */
  bulkActions?: BulkAction[];
  /** Called when a bulk action button is clicked */
  onBulkAction?: (action: string, ids: string[]) => void;
  /** Returns context menu items for a right-clicked entity */
  contextMenuItems?: (entity: T) => import('./ContextMenu').ContextMenuItem[];
  /** Called when a context menu action is selected */
  onContextMenuAction?: (actionId: string, entity: T) => void;
}

/** Threshold: virtualize grids above this size */
const VIRTUALIZE_THRESHOLD = 50;
/** Row height estimate for grid rows */
const GRID_ROW_HEIGHT = 80;
/** Gallery item width for horizontal scroll */
const GALLERY_ITEM_WIDTH = 144; // w-36

function getColumnCount(variant: 'compact' | 'standard' | 'gallery'): number {
  // For virtualization we use a conservative column count
  // The @container queries in the real grid handle responsive widths
  if (variant === 'compact') return 2;
  if (variant === 'standard') return 3;
  return 1; // gallery is horizontal
}

export default function CardGrid<T extends object>({
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
  highlightIds,
  highlightField,
  onSelect,
  searchable,
  searchField,
  cardVariant = 'standard',
  emptyIcon,
  emptyTitle,
  emptyDescription,
  density,
  bulkActions,
  onBulkAction,
  contextMenuItems,
  onContextMenuAction,
}: CardGridProps<T>) {
  const [query, setQuery] = useState('');
  const ctxMenu = useContextMenu<T>();

  const textFiltered = useMemo(() => {
    if (!searchable || !query.trim()) return items;
    const lowerQuery = query.toLowerCase();
    const fieldKey = searchField ?? fields[0]?.key;
    if (!fieldKey) return items;
    return items.filter((item) => {
      const val = getFieldValue(item, fieldKey);
      return renderFieldValue(val).toLowerCase().includes(lowerQuery);
    });
  }, [items, query, searchable, searchField, fields]);

  // Faceted filtering runs on top of text search
  const facetFilter = useFacetedFilter(textFiltered, fields);
  const hasFilterableFields = facetFilter.facets.length > 0;
  const filteredItems = hasFilterableFields ? facetFilter.filteredItems : textFiltered;

  const allFilteredIds = useMemo(
    () => filteredItems.map((item) => renderFieldValue(getFieldValue(item, 'id'))),
    [filteredItems],
  );
  const multiSelect = useMultiSelect(allFilteredIds);
  const hasBulkActions = bulkActions && bulkActions.length > 0;

  const cardFields = fields.filter(
    (f) => !f.displayIn || f.displayIn.includes('card')
  );

  const avatarField = cardFields.find((f) => f.type === 'avatar');
  const imageField = cardFields.find((f) => f.type === 'image');
  const textFields = cardFields.filter((f) => f.type === 'text');
  const badgeFields = cardFields.filter((f) => f.type === 'badge');
  const titleField = textFields[0];
  const subtitleFields = [...textFields.slice(1), ...badgeFields];

  const gridClassName = cn(
    cardVariant === 'compact' && `grid @md:grid-cols-2 ${SPACING.gridGapCompact}`,
    cardVariant === 'standard' && `grid @md:grid-cols-2 @lg:grid-cols-3 ${SPACING.gridGap}`,
    cardVariant === 'gallery' && `flex items-stretch ${SPACING.gridGapCompact} overflow-x-auto`
  );

  const gridRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const shouldVirtualize = filteredItems.length > VIRTUALIZE_THRESHOLD && cardVariant !== 'gallery';

  const handleGridKeyDown = useKeyboardNavigation(gridRef, {
    selector: '[role="gridcell"]',
    mode: 'grid',
  });

  const renderCard = useCallback(
    (item: T, animated: boolean, index: number) => {
      const id = renderFieldValue(getFieldValue(item, 'id'));
      const isSelected = selectedId != null && id === selectedId;
      const isMultiSelected = multiSelect.selectedIds.has(id);
      const highlightKey = highlightField ?? 'id';
      const highlightValue = renderFieldValue(getFieldValue(item, highlightKey));
      const isHighlighted = highlightIds?.has(highlightValue) ?? false;

      const handleCardClick = (e: React.MouseEvent) => {
        if (hasBulkActions) {
          const consumed = multiSelect.handleClick(id, index, e);
          if (consumed) return;
        }
        onSelect?.(item);
      };

      const handleContextMenu = contextMenuItems
        ? (e: React.MouseEvent) => ctxMenu.open(e, item)
        : undefined;

      const cardClassName = cn(
        `flex flex-col items-start ${SPACING.itemGap} rounded-md ${SPACING.panelPaddingCompact} text-left min-h-[28px]`,
        'bg-white/[0.03] backdrop-blur-sm border border-white/[0.06]',
        'hover:border-white/[0.10] hover:-translate-y-px hover:shadow-lg hover:shadow-black/20',
        isSelected ? 'hover:brightness-[1.15]' : 'hover:bg-white/[0.06]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50',
        `transition-all ${MOTION.hoverDuration}`,
        isSelected && 'ring-1 ring-cyan-500/40 bg-cyan-500/[0.06] border-cyan-500/20',
        isMultiSelected && 'ring-1 ring-cyan-500/40 bg-cyan-500/[0.08] border-cyan-500/25',
        isHighlighted && !isMultiSelected && 'ring-1 ring-emerald-500/35 border-emerald-500/25 bg-emerald-500/[0.06]',
        cardVariant === 'gallery' && 'w-36 shrink-0'
      );

      const cardContent = (
        <>
          {avatarField && (
            <AvatarRenderer value={getFieldValue(item, avatarField.key)} />
          )}
          {imageField && (
            <ImageRenderer value={getFieldValue(item, imageField.key)} />
          )}
          {titleField && (
            <span className="text-sm font-medium text-slate-200 truncate w-full">
              {renderFieldValue(getFieldValue(item, titleField.key))}
            </span>
          )}
          {subtitleFields.map((f) => (
            <span
              key={f.key}
              className={cn(
                'text-xs text-slate-500 truncate w-full',
                f.className
              )}
            >
              {renderFieldValue(getFieldValue(item, f.key))}
            </span>
          ))}
        </>
      );

      if (animated) {
        return (
          <motion.button
            key={id || Math.random().toString()}
            role="gridcell"
            aria-selected={isSelected || isMultiSelected}
            tabIndex={isSelected || selectedId == null ? 0 : -1}
            initial={MOTION.cardEnter}
            animate={MOTION.show}
            exit={{ opacity: 0 }}
            type="button"
            onClick={handleCardClick}
            onContextMenu={handleContextMenu}
            className={cardClassName}
          >
            {cardContent}
          </motion.button>
        );
      }

      return (
        <button
          key={id || Math.random().toString()}
          role="gridcell"
          aria-selected={isSelected || isMultiSelected}
          tabIndex={isSelected || selectedId == null ? 0 : -1}
          type="button"
          onClick={handleCardClick}
          onContextMenu={handleContextMenu}
          className={cardClassName}
        >
          {cardContent}
        </button>
      );
    },
    [selectedId, multiSelect, highlightIds, highlightField, onSelect, hasBulkActions, avatarField, imageField, titleField, subtitleFields, cardVariant, contextMenuItems, ctxMenu]
  );

  return (
    <PanelFrame
      title={title}
      icon={icon}
      headerAccent={headerAccent}
      onClose={onClose}
      actions={actions}
      density={density}
    >
      {searchable && (
        <div className="shrink-0 border-b border-slate-800/40 px-2 py-1.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              aria-label={`Search ${title}`}
              className="w-full rounded-md border border-slate-800/60 bg-slate-900/60 py-1 pl-7 pr-2 text-sm text-slate-200 placeholder:text-slate-500 transition-colors focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>
        </div>
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

      {hasBulkActions && (
        <BulkActionBar
          selectedCount={multiSelect.selectedIds.size}
          totalCount={filteredItems.length}
          actions={bulkActions!}
          onAction={(actionId) =>
            onBulkAction?.(actionId, Array.from(multiSelect.selectedIds))
          }
          onSelectAll={() => multiSelect.selectAll(allFilteredIds)}
          onClear={multiSelect.clearSelection}
        />
      )}

      {isLoading ? (
        <PanelSkeletonList rows={6} />
      ) : isError ? (
        <PanelErrorState message={errorMessage} onRetry={onRetry} />
      ) : filteredItems.length === 0 ? (
        <PanelEmptyState
          icon={emptyIcon}
          title={emptyTitle ?? 'No items'}
          description={emptyDescription}
        />
      ) : shouldVirtualize ? (
        <div
          ref={scrollRef}
          className={cn('@container overflow-auto flex-1', SPACING.panelPaddingCompact)}
        >
          <VirtualizedCardGrid
            items={filteredItems}
            gridRef={gridRef}
            scrollRef={scrollRef}
            title={title}
            handleGridKeyDown={handleGridKeyDown}
            cardVariant={cardVariant}
            renderCard={renderCard}
          />
        </div>
      ) : (
        <div className={cn('@container overflow-auto', SPACING.panelPaddingCompact)}>
          <div
            ref={gridRef}
            role="grid"
            aria-label={title}
            onKeyDown={handleGridKeyDown}
            className={gridClassName}
          >
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, idx) => renderCard(item, true, idx))}
            </AnimatePresence>
          </div>
        </div>
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

// ─── Virtualized Card Grid ───────────────────────────────

interface VirtualizedCardGridProps<T extends object> {
  items: T[];
  gridRef: React.RefObject<HTMLDivElement | null>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  title: string;
  handleGridKeyDown: (e: React.KeyboardEvent) => void;
  cardVariant: 'compact' | 'standard' | 'gallery';
  renderCard: (item: T, animated: boolean, index: number) => React.ReactNode;
}

function VirtualizedCardGrid<T extends object>({
  items,
  gridRef,
  scrollRef,
  title,
  handleGridKeyDown,
  cardVariant,
  renderCard,
}: VirtualizedCardGridProps<T>) {
  const cols = getColumnCount(cardVariant);

  const rowCount = Math.ceil(items.length / cols);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => GRID_ROW_HEIGHT,
    overscan: 4,
  });

  const [animatedRows] = useState(() => new Set<number>());

  const gridGapClass = cardVariant === 'compact' ? SPACING.gridGapCompact : SPACING.gridGap;
  const gridColsClass = cardVariant === 'compact' ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div
      ref={gridRef}
      role="grid"
      aria-label={title}
      onKeyDown={handleGridKeyDown}
      style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
    >
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const startIdx = virtualRow.index * cols;
        const rowItems = items.slice(startIdx, startIdx + cols);
        const shouldAnimate = !animatedRows.has(virtualRow.index);
        if (shouldAnimate) animatedRows.add(virtualRow.index);

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
            className={cn('grid', gridColsClass, gridGapClass)}
          >
            {rowItems.map((item, colIdx) => renderCard(item, shouldAnimate, startIdx + colIdx))}
          </div>
        );
      })}
    </div>
  );
}

// ─── Sub-renderers ───────────────────────────────────────

function AvatarRenderer({ value }: { value: unknown }) {
  const src = typeof value === 'string' ? value : null;

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="w-6 h-6 rounded-full object-cover border border-slate-700/50"
      />
    );
  }

  return (
    <div className="flex w-6 h-6 items-center justify-center rounded-full border border-slate-700/50 bg-slate-800/60">
      <User className="w-3 h-3 text-slate-500" />
    </div>
  );
}

function ImageRenderer({ value }: { value: unknown }) {
  const src = typeof value === 'string' ? value : null;

  if (src) {
    return (
      <div className="w-full h-12 rounded overflow-hidden bg-slate-800/30">
        <img src={src} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className="w-full h-12 rounded bg-slate-800/30" />
  );
}
