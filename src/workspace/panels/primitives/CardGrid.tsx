'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/app/lib/utils';
import PanelFrame from '../shared/PanelFrame';
import { PanelEmptyState, PanelErrorState, PanelSkeletonList } from '../shared/PanelPrimitives';
import type { BasePrimitiveProps, FieldSchema } from './types';
import { SPACING, MOTION } from '@/workspace/theme/tokens';

interface CardGridProps extends BasePrimitiveProps {
  items: Record<string, unknown>[];
  fields: FieldSchema[];
  selectedId?: string;
  highlightIds?: Set<string>;
  highlightField?: string;
  onSelect?: (item: Record<string, unknown>) => void;
  searchable?: boolean;
  searchField?: string;
  cardVariant?: 'compact' | 'standard' | 'gallery';
}

function getFieldValue(item: Record<string, unknown>, key: string): unknown {
  return item[key];
}

function renderFieldValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
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

export default function CardGrid({
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
}: CardGridProps) {
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchable || !query.trim()) return items;
    const lowerQuery = query.toLowerCase();
    const fieldKey = searchField ?? fields[0]?.key;
    if (!fieldKey) return items;
    return items.filter((item) => {
      const val = getFieldValue(item, fieldKey);
      return renderFieldValue(val).toLowerCase().includes(lowerQuery);
    });
  }, [items, query, searchable, searchField, fields]);

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

  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const container = gridRef.current;
      if (!container) return;
      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>('[role="gridcell"]')
      );
      const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
      if (currentIndex === -1) return;

      let nextIndex = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        nextIndex = Math.min(currentIndex + 1, focusable.length - 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        nextIndex = Math.max(currentIndex - 1, 0);
      } else if (e.key === 'Home') {
        nextIndex = 0;
      } else if (e.key === 'End') {
        nextIndex = focusable.length - 1;
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        (document.activeElement as HTMLElement)?.click();
        return;
      }

      if (nextIndex >= 0 && nextIndex !== currentIndex) {
        e.preventDefault();
        focusable[nextIndex].focus();
      }
    },
    []
  );

  const renderCard = useCallback(
    (item: Record<string, unknown>, animated: boolean) => {
      const id = renderFieldValue(getFieldValue(item, 'id'));
      const isSelected = selectedId != null && id === selectedId;
      const highlightKey = highlightField ?? 'id';
      const highlightValue = renderFieldValue(getFieldValue(item, highlightKey));
      const isHighlighted = highlightIds?.has(highlightValue) ?? false;

      const cardClassName = cn(
        `flex flex-col items-start ${SPACING.itemGap} rounded-md ${SPACING.panelPaddingCompact} text-left min-h-[28px]`,
        'bg-white/[0.03] backdrop-blur-sm border border-white/[0.06]',
        'hover:border-white/[0.10] hover:-translate-y-px hover:shadow-lg hover:shadow-black/20',
        isSelected ? 'hover:brightness-[1.15]' : 'hover:bg-white/[0.06]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50',
        `transition-all ${MOTION.hoverDuration}`,
        isSelected && 'ring-1 ring-cyan-500/40 bg-cyan-500/[0.06] border-cyan-500/20',
        isHighlighted && 'ring-1 ring-emerald-500/35 border-emerald-500/25 bg-emerald-500/[0.06]',
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
            aria-selected={isSelected}
            tabIndex={isSelected || selectedId == null ? 0 : -1}
            initial={MOTION.cardEnter}
            animate={MOTION.show}
            exit={{ opacity: 0 }}
            type="button"
            onClick={() => onSelect?.(item)}
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
          aria-selected={isSelected}
          tabIndex={isSelected || selectedId == null ? 0 : -1}
          type="button"
          onClick={() => onSelect?.(item)}
          className={cardClassName}
        >
          {cardContent}
        </button>
      );
    },
    [selectedId, highlightIds, highlightField, onSelect, avatarField, imageField, titleField, subtitleFields, cardVariant]
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
              {filteredItems.map((item) => renderCard(item, true))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </PanelFrame>
  );
}

// ─── Virtualized Card Grid ───────────────────────────────

interface VirtualizedCardGridProps {
  items: Record<string, unknown>[];
  gridRef: React.RefObject<HTMLDivElement | null>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  title: string;
  handleGridKeyDown: (e: React.KeyboardEvent) => void;
  cardVariant: 'compact' | 'standard' | 'gallery';
  renderCard: (item: Record<string, unknown>, animated: boolean) => React.ReactNode;
}

function VirtualizedCardGrid({
  items,
  gridRef,
  scrollRef,
  title,
  handleGridKeyDown,
  cardVariant,
  renderCard,
}: VirtualizedCardGridProps) {
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
            {rowItems.map((item) => renderCard(item, shouldAnimate))}
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
