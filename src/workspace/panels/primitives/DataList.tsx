'use client';

import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/app/lib/utils';
import PanelFrame from '../shared/PanelFrame';
import { PanelEmptyState, PanelErrorState, PanelSkeletonList } from '../shared/PanelPrimitives';
import type { BasePrimitiveProps, FieldSchema } from './types';
import { getAccent, SPACING, MOTION } from '@/workspace/theme/tokens';

interface DataListProps extends BasePrimitiveProps {
  items: Record<string, unknown>[];
  fields: FieldSchema[];
  selectedId?: string;
  onSelect?: (item: Record<string, unknown>) => void;
  highlightIds?: Set<string>;
  highlightField?: string;
  highlightAccent?: string;
  onItemClick?: (item: Record<string, unknown>) => void;
  numberedItems?: boolean;
  itemBadge?: (item: Record<string, unknown>) => { label: string; className: string } | null;
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

/** Threshold: virtualize lists above this size */
const VIRTUALIZE_THRESHOLD = 50;
/** Estimated row height in px for the virtualizer */
const ROW_HEIGHT = 36;

export default function DataList({
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
}: DataListProps) {
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

  const shouldVirtualize = items.length > VIRTUALIZE_THRESHOLD;

  const handleListKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const container = listRef.current;
      if (!container) return;
      const options = Array.from(
        container.querySelectorAll<HTMLElement>('[role="option"]')
      );
      const currentIndex = options.indexOf(document.activeElement as HTMLElement);
      if (currentIndex === -1) return;

      let nextIndex = -1;
      if (e.key === 'ArrowDown') {
        nextIndex = Math.min(currentIndex + 1, options.length - 1);
      } else if (e.key === 'ArrowUp') {
        nextIndex = Math.max(currentIndex - 1, 0);
      } else if (e.key === 'Home') {
        nextIndex = 0;
      } else if (e.key === 'End') {
        nextIndex = options.length - 1;
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        (document.activeElement as HTMLElement)?.click();
        return;
      }

      if (nextIndex >= 0 && nextIndex !== currentIndex) {
        e.preventDefault();
        options[nextIndex].focus();
      }
    },
    []
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
      {isLoading ? (
        <PanelSkeletonList rows={5} />
      ) : isError ? (
        <PanelErrorState message={errorMessage} onRetry={onRetry} />
      ) : items.length === 0 ? (
        <PanelEmptyState
          icon={emptyIcon}
          title={emptyTitle ?? 'No items'}
          description={emptyDescription}
        />
      ) : shouldVirtualize ? (
        <div
          ref={scrollRef}
          className={cn('overflow-auto flex-1', SPACING.panelPaddingCompact)}
        >
          <VirtualizedList
            items={items}
            listRef={listRef}
            scrollRef={scrollRef}
            title={title}
            handleListKeyDown={handleListKeyDown}
            selectedId={selectedId}
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
            {items.map((item, index) => (
              <DataListRow
                key={renderFieldValue(getFieldValue(item, 'id')) || `item-${index}`}
                item={item}
                index={index}
                animated
                selectedId={selectedId}
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
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </PanelFrame>
  );
}

// ─── Virtualized List ────────────────────────────────────

interface VirtualizedListProps {
  items: Record<string, unknown>[];
  listRef: React.RefObject<HTMLDivElement | null>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  title: string;
  handleListKeyDown: (e: React.KeyboardEvent) => void;
  selectedId?: string;
  highlightIds?: Set<string>;
  highlightField?: string;
  accentStyles: ReturnType<typeof getAccent>;
  onItemClick?: (item: Record<string, unknown>) => void;
  onSelect?: (item: Record<string, unknown>) => void;
  numberedItems?: boolean;
  itemBadge?: (item: Record<string, unknown>) => { label: string; className: string } | null;
  avatarField?: FieldSchema;
  titleField?: FieldSchema;
  subtitleField?: FieldSchema;
}

function VirtualizedList({
  items,
  listRef,
  scrollRef,
  title,
  handleListKeyDown,
  selectedId,
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
}: VirtualizedListProps) {
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
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Row Component ───────────────────────────────────────

interface DataListRowProps {
  item: Record<string, unknown>;
  index: number;
  animated: boolean;
  selectedId?: string;
  highlightIds?: Set<string>;
  highlightField?: string;
  accentStyles: ReturnType<typeof getAccent>;
  onItemClick?: (item: Record<string, unknown>) => void;
  onSelect?: (item: Record<string, unknown>) => void;
  numberedItems?: boolean;
  itemBadge?: (item: Record<string, unknown>) => { label: string; className: string } | null;
  avatarField?: FieldSchema;
  titleField?: FieldSchema;
  subtitleField?: FieldSchema;
}

const DataListRow = React.memo(function DataListRow({
  item,
  index,
  animated,
  selectedId,
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
}: DataListRowProps) {
  const id = renderFieldValue(getFieldValue(item, 'id'));
  const isSelected = selectedId != null && id === selectedId;
  const highlightKey = highlightField ?? 'id';
  const highlightValue = renderFieldValue(getFieldValue(item, highlightKey));
  const isHighlighted = highlightIds?.has(highlightValue) ?? false;
  const badge = itemBadge?.(item) ?? null;

  const handleClick = () => {
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
    !isSelected && !isHighlighted && 'hover:bg-slate-800/40',
    (isSelected || isHighlighted) && 'hover:brightness-[1.15]',
    isHighlighted && cn(accentStyles.border, 'border-l-2', accentStyles.leftBorder),
    isHighlighted && !isSelected && accentStyles.bg,
    isSelected && 'bg-amber-500/[0.08] border-l-2 border-l-amber-500/40',
    isSelected && !isHighlighted && 'border-amber-500/25',
    isSelected && isHighlighted && 'shadow-[inset_0_0_0_1px_rgba(245,158,11,0.25),0_0_0_2px_var(--highlight-ring)]',
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

  if (animated) {
    return (
      <motion.button
        role="option"
        aria-selected={isSelected}
        tabIndex={isSelected || (selectedId == null && index === 0) ? 0 : -1}
        initial={MOTION.listEnter}
        animate={{ ...MOTION.show, transition: { delay: MOTION.stagger(index) } }}
        type="button"
        onClick={handleClick}
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
      aria-selected={isSelected}
      tabIndex={isSelected || (selectedId == null && index === 0) ? 0 : -1}
      type="button"
      onClick={handleClick}
      className={className}
      style={style}
    >
      {content}
    </button>
  );
});

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
