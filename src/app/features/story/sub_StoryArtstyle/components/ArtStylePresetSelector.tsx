/**
 * ArtStylePresetSelector Component
 * Grid of predefined art style presets with collapsible view
 */

'use client';

import { useState } from 'react';
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

export function ArtStylePresetSelector({
  selectedStyleId,
  onSelect,
  disabled = false,
}: ArtStylePresetSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const selectedStyle = ART_STYLES.find((s) => s.id === selectedStyleId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Palette className="w-4 h-4 text-cyan-400" />
          Art Style Preset
        </label>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
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
              <p className="text-xs text-white/80 line-clamp-1">
                {selectedStyle.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Style Grid with Image Cards */}
      {isExpanded && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-1">
          {ART_STYLES.map((style) => (
            <StyleImageCard
              key={style.id}
              imageUrl={style.imageUrl}
              label={style.label}
              description={style.description}
              isSelected={style.id === selectedStyleId}
              onSelect={() => {
                onSelect(style.id);
                setIsExpanded(false);
              }}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}
