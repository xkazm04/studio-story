/**
 * OutfitSelector - Choose character outfit for avatar generation
 * Design: Clean Manuscript style with cyan accents
 *
 * Integrates with useCharacterOutfits to show available outfits
 * and pass selected outfit clothing details to avatar prompt
 */

'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shirt,
  ChevronDown,
  Check,
  Sparkles,
  Tag,
  Star,
  Plus,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import {
  Outfit,
  OutfitType,
  useCharacterOutfits,
  generateOutfitPrompt,
} from '@/app/hooks/integration/useCharacterOutfits';
import type { OutfitInfo } from '../../hooks/useAvatarGenerator';

// ============================================================================
// Types
// ============================================================================

interface OutfitSelectorProps {
  characterId: string;
  selectedOutfit: OutfitInfo | null;
  onSelectOutfit: (outfit: OutfitInfo | null) => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const OUTFIT_TYPE_COLORS: Partial<Record<OutfitType, string>> = {
  default: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  casual: 'bg-green-500/20 text-green-400 border-green-500/30',
  formal: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  combat: 'bg-red-500/20 text-red-400 border-red-500/30',
  work: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  ceremonial: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  travel: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  custom: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

// ============================================================================
// Component
// ============================================================================

const OutfitSelector: React.FC<OutfitSelectorProps> = ({
  characterId,
  selectedOutfit,
  onSelectOutfit,
  disabled = false,
  compact = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { outfits, accessories, isLoading } = useCharacterOutfits(characterId);

  // Convert outfit to OutfitInfo for the generator
  const handleSelectOutfit = (outfit: Outfit | null) => {
    if (!outfit) {
      onSelectOutfit(null);
    } else {
      // Get worn accessories for this character
      const wornAccessories = accessories.filter(a => a.current_state === 'worn');

      onSelectOutfit({
        id: outfit.id,
        name: outfit.name,
        promptFragment: generateOutfitPrompt(outfit, wornAccessories),
        thumbnailUrl: outfit.thumbnail_url,
      });
    }
    setIsOpen(false);
  };

  // Get selected outfit details if any
  const selectedOutfitDetails = useMemo(() => {
    if (!selectedOutfit) return null;
    return outfits.find(o => o.id === selectedOutfit.id);
  }, [selectedOutfit, outfits]);

  // Sort outfits: default first, then by type
  const sortedOutfits = useMemo(() => {
    return [...outfits].sort((a, b) => {
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [outfits]);

  if (compact) {
    return (
      <div className={cn('relative', className)}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || isLoading}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-left',
            'bg-slate-800/40 border-slate-700/50',
            disabled || isLoading
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:border-slate-600',
            selectedOutfit && 'border-cyan-500/30 bg-cyan-500/5'
          )}
        >
          <Shirt size={14} className={selectedOutfit ? 'text-cyan-400' : 'text-slate-500'} />
          <span className="font-mono text-xs text-slate-300 truncate max-w-[100px]">
            {selectedOutfit?.name || 'No outfit'}
          </span>
          <ChevronDown
            size={12}
            className={cn('text-slate-500 transition-transform', isOpen && 'rotate-180')}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute z-20 top-full left-0 mt-1 w-56 py-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl"
            >
              {/* No outfit option */}
              <button
                onClick={() => handleSelectOutfit(null)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
                  !selectedOutfit ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-slate-700/50'
                )}
              >
                <span className="font-mono text-xs">No specific outfit</span>
                {!selectedOutfit && <Check size={12} className="ml-auto" />}
              </button>

              <hr className="my-1 border-slate-700" />

              {sortedOutfits.map(outfit => (
                <button
                  key={outfit.id}
                  onClick={() => handleSelectOutfit(outfit)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
                    selectedOutfit?.id === outfit.id
                      ? 'bg-cyan-500/10 text-cyan-400'
                      : 'text-slate-300 hover:bg-slate-700/50'
                  )}
                >
                  {outfit.is_default && <Star size={10} className="text-yellow-400" />}
                  <span className="font-mono text-xs truncate flex-1">{outfit.name}</span>
                  {selectedOutfit?.id === outfit.id && <Check size={12} />}
                </button>
              ))}

              {outfits.length === 0 && (
                <div className="px-3 py-2 text-slate-500 font-mono text-xs">
                  No outfits defined
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={cn('p-4 bg-slate-900/60 rounded-lg border border-slate-800/50', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <h3 className="font-mono text-xs uppercase tracking-wide text-slate-300">
            outfit_selection
          </h3>
        </div>
        {isLoading && (
          <span className="text-[10px] font-mono text-slate-500">loading...</span>
        )}
      </div>

      {/* Current Selection Display */}
      {selectedOutfitDetails ? (
        <div className="mb-3 p-3 bg-slate-800/40 rounded-lg border border-cyan-500/20">
          <div className="flex items-start gap-3">
            {/* Thumbnail */}
            <div className="w-12 h-12 rounded-lg bg-slate-700 flex-shrink-0 overflow-hidden">
              {selectedOutfitDetails.thumbnail_url ? (
                <img
                  src={selectedOutfitDetails.thumbnail_url}
                  alt={selectedOutfitDetails.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Shirt size={20} className="text-slate-500" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-white truncate">
                  {selectedOutfitDetails.name}
                </span>
                {selectedOutfitDetails.is_default && (
                  <Star size={12} className="text-yellow-400 flex-shrink-0" />
                )}
              </div>
              <span
                className={cn(
                  'inline-block mt-1 px-1.5 py-0.5 text-[10px] font-mono rounded border',
                  OUTFIT_TYPE_COLORS[selectedOutfitDetails.outfit_type] || 'bg-slate-700 text-slate-400'
                )}
              >
                {selectedOutfitDetails.outfit_type}
              </span>

              {/* Context tags preview */}
              {selectedOutfitDetails.context_tags.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <Tag size={10} className="text-slate-500" />
                  <span className="text-[10px] text-slate-500 truncate">
                    {selectedOutfitDetails.context_tags.slice(0, 3).join(', ')}
                    {selectedOutfitDetails.context_tags.length > 3 && '...'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Prompt preview */}
          {selectedOutfit?.promptFragment && (
            <div className="mt-2 pt-2 border-t border-slate-700/50">
              <div className="flex items-center gap-1 mb-1">
                <Sparkles size={10} className="text-cyan-400" />
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  prompt_fragment
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 italic line-clamp-2">
                "{selectedOutfit.promptFragment}"
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700/50 text-center">
          <Shirt size={24} className="mx-auto text-slate-600 mb-2" />
          <p className="font-mono text-xs text-slate-500">No outfit selected</p>
          <p className="font-mono text-[10px] text-slate-600 mt-1">
            Avatar will use default appearance
          </p>
        </div>
      )}

      {/* Outfit Grid */}
      <div className="space-y-2">
        <span className="font-mono text-[10px] text-slate-500 uppercase">available_outfits</span>

        {outfits.length === 0 ? (
          <div className="p-4 text-center border border-dashed border-slate-700 rounded-lg">
            <p className="font-mono text-xs text-slate-500">No outfits defined for this character</p>
            <p className="font-mono text-[10px] text-slate-600 mt-1">
              Create outfits in the Wardrobe Manager
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {/* None option */}
            <button
              onClick={() => handleSelectOutfit(null)}
              disabled={disabled}
              className={cn(
                'p-2 rounded-lg border text-left transition-all',
                !selectedOutfit
                  ? 'border-cyan-500/50 bg-cyan-500/10'
                  : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-slate-700/50 flex items-center justify-center">
                  <Shirt size={14} className="text-slate-500" />
                </div>
                <span className="font-mono text-xs text-slate-400">None</span>
              </div>
            </button>

            {sortedOutfits.map(outfit => (
              <button
                key={outfit.id}
                onClick={() => handleSelectOutfit(outfit)}
                disabled={disabled}
                className={cn(
                  'p-2 rounded-lg border text-left transition-all',
                  selectedOutfit?.id === outfit.id
                    ? 'border-cyan-500/50 bg-cyan-500/10'
                    : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-slate-700/50 flex-shrink-0 overflow-hidden">
                    {outfit.thumbnail_url ? (
                      <img
                        src={outfit.thumbnail_url}
                        alt={outfit.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Shirt size={14} className="text-slate-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      {outfit.is_default && (
                        <Star size={8} className="text-yellow-400 flex-shrink-0" />
                      )}
                      <span className="font-mono text-xs text-slate-300 truncate">
                        {outfit.name}
                      </span>
                    </div>
                    <span className="font-mono text-[9px] text-slate-500">
                      {outfit.outfit_type}
                    </span>
                  </div>
                  {selectedOutfit?.id === outfit.id && (
                    <Check size={12} className="text-cyan-400 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OutfitSelector;
