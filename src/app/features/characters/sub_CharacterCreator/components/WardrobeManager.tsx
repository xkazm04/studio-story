'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shirt,
  Plus,
  Trash2,
  Edit2,
  Star,
  Copy,
  MoreVertical,
  Search,
  Filter,
  Grid,
  List,
  Check,
  X,
  Sparkles,
  Clock,
  Tag,
  ChevronRight,
} from 'lucide-react';
import {
  Outfit,
  OutfitType,
  useCharacterOutfits,
  generateOutfitPrompt,
  OUTFIT_TEMPLATES,
} from '@/app/hooks/integration/useCharacterOutfits';
import OutfitEditor from './OutfitEditor';
import { cn } from '@/app/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface WardrobeManagerProps {
  characterId: string;
  characterName?: string;
  onOutfitSelect?: (outfit: Outfit) => void;
  className?: string;
}

type ViewMode = 'grid' | 'list';

// ============================================================================
// Constants
// ============================================================================

const OUTFIT_TYPE_COLORS: Record<OutfitType, string> = {
  default: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
  casual: 'bg-green-600/20 text-green-400 border-green-500/30',
  formal: 'bg-purple-600/20 text-purple-400 border-purple-500/30',
  combat: 'bg-red-600/20 text-red-400 border-red-500/30',
  work: 'bg-amber-600/20 text-amber-400 border-amber-500/30',
  sleep: 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30',
  disguise: 'bg-gray-600/20 text-gray-400 border-gray-500/30',
  ceremonial: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30',
  athletic: 'bg-cyan-600/20 text-cyan-400 border-cyan-500/30',
  travel: 'bg-orange-600/20 text-orange-400 border-orange-500/30',
  weather: 'bg-sky-600/20 text-sky-400 border-sky-500/30',
  custom: 'bg-pink-600/20 text-pink-400 border-pink-500/30',
};

// ============================================================================
// Subcomponents
// ============================================================================

interface OutfitCardProps {
  outfit: Outfit;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onSetDefault: () => void;
  viewMode: ViewMode;
}

const OutfitCard: React.FC<OutfitCardProps> = ({
  outfit,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onSetDefault,
  viewMode,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const typeColor = OUTFIT_TYPE_COLORS[outfit.outfit_type] || OUTFIT_TYPE_COLORS.custom;

  // Generate preview description
  const previewText = useMemo(() => {
    const parts: string[] = [];
    if (outfit.clothing.top?.item) parts.push(outfit.clothing.top.item);
    if (outfit.clothing.bottom?.item) parts.push(outfit.clothing.bottom.item);
    if (outfit.clothing.outerwear?.item) parts.push(outfit.clothing.outerwear.item);
    return parts.length > 0 ? parts.join(', ') : 'No clothing details';
  }, [outfit.clothing]);

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-center gap-4 p-3 bg-gray-800/50 border rounded-lg cursor-pointer transition-all',
          isSelected
            ? 'border-purple-500 bg-purple-900/20'
            : 'border-gray-700 hover:border-gray-600'
        )}
        onClick={onSelect}
      >
        {/* Thumbnail or Icon */}
        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
          {outfit.thumbnail_url ? (
            <img
              src={outfit.thumbnail_url}
              alt={outfit.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Shirt size={20} className="text-gray-400" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white truncate">{outfit.name}</span>
            {outfit.is_default && (
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
            )}
          </div>
          <p className="text-xs text-gray-400 truncate">{previewText}</p>
        </div>

        {/* Type Badge */}
        <span className={cn('px-2 py-1 text-xs rounded border', typeColor)}>
          {outfit.outfit_type}
        </span>

        {/* Actions */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <MoreVertical size={16} />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-full mt-1 z-10 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[140px]"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => { onEdit(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button
                  onClick={() => { onDuplicate(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
                >
                  <Copy size={14} /> Duplicate
                </button>
                {!outfit.is_default && (
                  <button
                    onClick={() => { onSetDefault(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
                  >
                    <Star size={14} /> Set as Default
                  </button>
                )}
                <hr className="my-1 border-gray-700" />
                <button
                  onClick={() => { onDelete(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-700"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        'relative p-4 bg-gray-800/50 border rounded-lg cursor-pointer transition-all',
        isSelected
          ? 'border-purple-500 bg-purple-900/20'
          : 'border-gray-700 hover:border-gray-600'
      )}
      onClick={onSelect}
    >
      {/* Default badge */}
      {outfit.is_default && (
        <div className="absolute top-2 left-2 z-10">
          <Star size={16} className="text-yellow-400 fill-yellow-400" />
        </div>
      )}

      {/* Menu button */}
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1.5 bg-gray-800/80 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <MoreVertical size={14} />
        </button>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 top-full mt-1 z-20 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[140px]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { onEdit(); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
              >
                <Edit2 size={14} /> Edit
              </button>
              <button
                onClick={() => { onDuplicate(); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
              >
                <Copy size={14} /> Duplicate
              </button>
              {!outfit.is_default && (
                <button
                  onClick={() => { onSetDefault(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
                >
                  <Star size={14} /> Set as Default
                </button>
              )}
              <hr className="my-1 border-gray-700" />
              <button
                onClick={() => { onDelete(); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-700"
              >
                <Trash2 size={14} /> Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Thumbnail */}
      <div className="aspect-square bg-gray-700 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
        {outfit.thumbnail_url ? (
          <img
            src={outfit.thumbnail_url}
            alt={outfit.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Shirt size={32} className="text-gray-500" />
        )}
      </div>

      {/* Info */}
      <h3 className="font-medium text-white truncate mb-1">{outfit.name}</h3>
      <p className="text-xs text-gray-400 line-clamp-2 mb-2">{previewText}</p>

      {/* Type badge */}
      <span className={cn('inline-block px-2 py-0.5 text-xs rounded border', typeColor)}>
        {outfit.outfit_type}
      </span>

      {/* Tags preview */}
      {outfit.context_tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {outfit.context_tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="text-xs px-1.5 py-0.5 bg-gray-700/50 text-gray-400 rounded"
            >
              {tag}
            </span>
          ))}
          {outfit.context_tags.length > 3 && (
            <span className="text-xs text-gray-500">
              +{outfit.context_tags.length - 3}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const WardrobeManager: React.FC<WardrobeManagerProps> = ({
  characterId,
  characterName,
  onOutfitSelect,
  className,
}) => {
  const {
    outfits,
    isLoading,
    createOutfit,
    updateOutfit,
    deleteOutfit,
    isCreatingOutfit,
  } = useCharacterOutfits(characterId);

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<OutfitType | 'all'>('all');
  const [selectedOutfitId, setSelectedOutfitId] = useState<string | null>(null);
  const [editingOutfit, setEditingOutfit] = useState<Outfit | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Filter and search outfits
  const filteredOutfits = useMemo(() => {
    let result = [...outfits];

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(o => o.outfit_type === filterType);
    }

    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(o =>
        o.name.toLowerCase().includes(term) ||
        o.description?.toLowerCase().includes(term) ||
        o.context_tags.some(t => t.includes(term))
      );
    }

    return result;
  }, [outfits, filterType, searchTerm]);

  // Get unique outfit types for filter
  const availableTypes = useMemo(() => {
    const types = new Set(outfits.map(o => o.outfit_type));
    return Array.from(types);
  }, [outfits]);

  // Handlers
  const handleCreateOutfit = (data: Partial<Outfit>) => {
    createOutfit(data);
    setIsCreating(false);
  };

  const handleUpdateOutfit = (data: Partial<Outfit>) => {
    if (editingOutfit) {
      updateOutfit(editingOutfit.id, data);
      setEditingOutfit(null);
    }
  };

  const handleDuplicate = (outfit: Outfit) => {
    createOutfit({
      ...outfit,
      id: undefined,
      name: `${outfit.name} (Copy)`,
      is_default: false,
    } as Partial<Outfit>);
  };

  const handleSetDefault = (outfit: Outfit) => {
    updateOutfit(outfit.id, { is_default: true });
  };

  const handleSelectOutfit = (outfit: Outfit) => {
    setSelectedOutfitId(outfit.id);
    onOutfitSelect?.(outfit);
  };

  // Show editor for create/edit
  if (isCreating || editingOutfit) {
    return (
      <OutfitEditor
        outfit={editingOutfit || undefined}
        onSave={editingOutfit ? handleUpdateOutfit : handleCreateOutfit}
        onCancel={() => {
          setIsCreating(false);
          setEditingOutfit(null);
        }}
        characterName={characterName}
        className={className}
      />
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <Shirt size={20} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Wardrobe</h2>
              <p className="text-sm text-gray-400">
                {outfits.length} outfit{outfits.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            New Outfit
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search outfits..."
              className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as OutfitType | 'all')}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
          >
            <option value="all">All Types</option>
            {availableTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-800 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded transition-colors',
                viewMode === 'grid'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded transition-colors',
                viewMode === 'list'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
          </div>
        ) : filteredOutfits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Shirt size={48} className="mb-4 opacity-50" />
            {outfits.length === 0 ? (
              <>
                <p className="text-lg">No outfits yet</p>
                <p className="text-sm">Create your first outfit to build a wardrobe</p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                >
                  <Plus size={18} />
                  Create Outfit
                </button>
              </>
            ) : (
              <>
                <p className="text-lg">No outfits match your filters</p>
                <p className="text-sm">Try adjusting your search or filter</p>
              </>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredOutfits.map(outfit => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                isSelected={selectedOutfitId === outfit.id}
                onSelect={() => handleSelectOutfit(outfit)}
                onEdit={() => setEditingOutfit(outfit)}
                onDelete={() => deleteOutfit(outfit.id)}
                onDuplicate={() => handleDuplicate(outfit)}
                onSetDefault={() => handleSetDefault(outfit)}
                viewMode="grid"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredOutfits.map(outfit => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                isSelected={selectedOutfitId === outfit.id}
                onSelect={() => handleSelectOutfit(outfit)}
                onEdit={() => setEditingOutfit(outfit)}
                onDelete={() => deleteOutfit(outfit.id)}
                onDuplicate={() => handleDuplicate(outfit)}
                onSetDefault={() => handleSetDefault(outfit)}
                viewMode="list"
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions Footer */}
      {selectedOutfitId && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="p-4 border-t border-gray-700 bg-gray-900/90"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Selected: {outfits.find(o => o.id === selectedOutfitId)?.name}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const outfit = outfits.find(o => o.id === selectedOutfitId);
                  if (outfit) setEditingOutfit(outfit);
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm"
              >
                <Edit2 size={14} />
                Edit
              </button>
              <button
                onClick={() => {
                  const outfit = outfits.find(o => o.id === selectedOutfitId);
                  if (outfit) {
                    const prompt = generateOutfitPrompt(outfit, []);
                    navigator.clipboard.writeText(prompt);
                  }
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
              >
                <Sparkles size={14} />
                Copy Prompt
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default WardrobeManager;
