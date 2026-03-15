/**
 * ArtStylePresetSelector Component
 * Grid of predefined art style presets with collapsible view
 * Implements roving tabindex for keyboard navigation
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Check, Palette, ChevronDown } from 'lucide-react';
import { ART_STYLES } from '../artStyleData';
import { StyleImageCard } from './StyleImageCard';

interface ArtStylePresetSelectorProps {
  selectedStyleId: string | null;
  onSelect: (styleId: string) => void;
  disabled?: boolean;
}

/** Number of columns at each breakpoint — must match the grid-cols classes */
const COLS_DEFAULT = 2;
const COLS_SM = 3;

function getColumnCount() {
  if (typeof window === 'undefined') return COLS_DEFAULT;
  return window.innerWidth >= 640 ? COLS_SM : COLS_DEFAULT;
}

export function ArtStylePresetSelector({
  selectedStyleId,
  onSelect,
  disabled = false,
}: ArtStylePresetSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

  const selectedStyle = ART_STYLES.find((s) => s.id === selectedStyleId);

  const focusItem = useCallback((index: number) => {
    const grid = gridRef.current;
    if (!grid) return;
    const buttons = grid.querySelectorAll<HTMLButtonElement>('[role="gridcell"] > button');
    buttons[index]?.focus();
    setFocusedIndex(index);
  }, []);

  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const total = ART_STYLES.length;
      const cols = getColumnCount();
      let next = focusedIndex;

      switch (e.key) {
        case 'ArrowRight':
          next = focusedIndex + 1 < total ? focusedIndex + 1 : focusedIndex;
          break;
        case 'ArrowLeft':
          next = focusedIndex - 1 >= 0 ? focusedIndex - 1 : focusedIndex;
          break;
        case 'ArrowDown':
          next = focusedIndex + cols < total ? focusedIndex + cols : focusedIndex;
          break;
        case 'ArrowUp':
          next = focusedIndex - cols >= 0 ? focusedIndex - cols : focusedIndex;
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = total - 1;
          break;
        default:
          return; // don't preventDefault for other keys
      }

      e.preventDefault();
      if (next !== focusedIndex) {
        focusItem(next);
      }
    },
    [focusedIndex, focusItem]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Palette className="w-4 h-4 text-cyan-400" />
          Art Style Preset
        </label>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
          disabled={disabled}
        >
          {isExpanded ? 'Collapse' : 'Show all'}
          <ChevronDown
            className={cn(
              'w-3 h-3 transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* Currently Selected Style - Image Card */}
      {selectedStyle && !isExpanded && (
        <div className="relative rounded-lg border-2 border-cyan-500 overflow-hidden">
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={selectedStyle.imageUrl}
              alt={selectedStyle.label}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute top-2 right-2 bg-cyan-500 text-white rounded-full p-1">
              <Check className="w-4 h-4" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="font-semibold text-white text-sm">
                {selectedStyle.label}
              </p>
              <p className="text-sm text-white/80 line-clamp-1">
                {selectedStyle.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Style Grid with Image Cards — roving tabindex */}
      {isExpanded && (
        <div
          ref={gridRef}
          role="grid"
          aria-label="Art style presets"
          onKeyDown={handleGridKeyDown}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-1"
        >
          {ART_STYLES.map((style, index) => (
            <div key={style.id} role="gridcell">
              <StyleImageCard
                imageUrl={style.imageUrl}
                label={style.label}
                description={style.description}
                ariaLabel={`${style.label} — ${style.description}. ${style.renderingTechnique}`}
                isSelected={style.id === selectedStyleId}
                tabIndex={index === focusedIndex ? 0 : -1}
                onSelect={() => {
                  onSelect(style.id);
                  setIsExpanded(false);
                }}
                onFocus={() => setFocusedIndex(index)}
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
