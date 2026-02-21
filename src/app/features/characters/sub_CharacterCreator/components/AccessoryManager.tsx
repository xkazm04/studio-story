'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Plus,
  Search,
  Filter,
  Star,
  Trash2,
  Edit3,
  X,
  Check,
  AlertCircle,
  Info,
  Gem,
  Sword,
  Wrench,
  Briefcase,
  Sparkles,
  Heart,
  Car,
  FileText,
  Coins,
  MoreHorizontal,
  MapPin,
  Clock,
  Eye,
  EyeOff,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Image,
} from 'lucide-react';
import {
  Accessory,
  AccessoryCategory,
  AccessoryState,
  useAccessoryManager,
} from '@/app/hooks/integration/useCharacterOutfits';
import { cn } from '@/app/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface AccessoryManagerProps {
  characterId: string;
  characterName?: string;
  onAccessoryClick?: (accessory: Accessory) => void;
  className?: string;
}

interface AccessoryFormData {
  name: string;
  category: AccessoryCategory;
  description: string;
  material: string;
  color: string;
  is_signature: boolean;
  story_significance: string;
  current_state: AccessoryState;
  prompt_fragment: string;
  reference_image_url: string;
  attributes: Record<string, unknown>;
}

type ViewMode = 'grid' | 'list' | 'category';

// ============================================================================
// Constants
// ============================================================================

const CATEGORY_CONFIG: Record<AccessoryCategory, { label: string; icon: React.ReactNode; color: string }> = {
  jewelry: { label: 'Jewelry', icon: <Gem size={16} />, color: 'text-pink-400 bg-pink-600/20' },
  weapon: { label: 'Weapon', icon: <Sword size={16} />, color: 'text-red-400 bg-red-600/20' },
  tool: { label: 'Tool', icon: <Wrench size={16} />, color: 'text-blue-400 bg-blue-600/20' },
  bag: { label: 'Bag', icon: <Briefcase size={16} />, color: 'text-amber-400 bg-amber-600/20' },
  magical_item: { label: 'Magical Item', icon: <Sparkles size={16} />, color: 'text-purple-400 bg-purple-600/20' },
  personal_item: { label: 'Personal Item', icon: <Heart size={16} />, color: 'text-rose-400 bg-rose-600/20' },
  companion: { label: 'Companion', icon: <Heart size={16} />, color: 'text-green-400 bg-green-600/20' },
  vehicle: { label: 'Vehicle', icon: <Car size={16} />, color: 'text-cyan-400 bg-cyan-600/20' },
  document: { label: 'Document', icon: <FileText size={16} />, color: 'text-gray-400 bg-gray-600/20' },
  currency: { label: 'Currency', icon: <Coins size={16} />, color: 'text-yellow-400 bg-yellow-600/20' },
  other: { label: 'Other', icon: <MoreHorizontal size={16} />, color: 'text-gray-400 bg-gray-600/20' },
};

const STATE_CONFIG: Record<AccessoryState, { label: string; color: string; bgColor: string }> = {
  worn: { label: 'Worn', color: 'text-green-400', bgColor: 'bg-green-600/20' },
  stored: { label: 'Stored', color: 'text-blue-400', bgColor: 'bg-blue-600/20' },
  lost: { label: 'Lost', color: 'text-yellow-400', bgColor: 'bg-yellow-600/20' },
  given: { label: 'Given Away', color: 'text-purple-400', bgColor: 'bg-purple-600/20' },
  destroyed: { label: 'Destroyed', color: 'text-red-400', bgColor: 'bg-red-600/20' },
};

const DEFAULT_FORM_DATA: AccessoryFormData = {
  name: '',
  category: 'personal_item',
  description: '',
  material: '',
  color: '',
  is_signature: false,
  story_significance: '',
  current_state: 'worn',
  prompt_fragment: '',
  reference_image_url: '',
  attributes: {},
};

// ============================================================================
// Subcomponents
// ============================================================================

interface AccessoryCardProps {
  accessory: Accessory;
  viewMode: ViewMode;
  onEdit: () => void;
  onDelete: () => void;
  onStateChange: (state: AccessoryState) => void;
  onClick?: () => void;
}

const AccessoryCard: React.FC<AccessoryCardProps> = ({
  accessory,
  viewMode,
  onEdit,
  onDelete,
  onStateChange,
  onClick,
}) => {
  const [showStateMenu, setShowStateMenu] = useState(false);
  const categoryConfig = CATEGORY_CONFIG[accessory.category];
  const stateConfig = STATE_CONFIG[accessory.current_state];

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
      >
        {/* Icon */}
        <div className={cn('p-2 rounded-lg', categoryConfig.color)}>
          {categoryConfig.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
          <div className="flex items-center gap-2">
            <span className="font-medium text-white truncate">{accessory.name}</span>
            {accessory.is_signature && (
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{categoryConfig.label}</span>
            {accessory.material && (
              <>
                <span>•</span>
                <span>{accessory.material}</span>
              </>
            )}
          </div>
        </div>

        {/* State */}
        <div className="relative">
          <button
            onClick={() => setShowStateMenu(!showStateMenu)}
            className={cn(
              'px-2 py-1 rounded text-xs font-medium',
              stateConfig.bgColor,
              stateConfig.color
            )}
          >
            {stateConfig.label}
            <ChevronDown size={12} className="inline ml-1" />
          </button>
          {showStateMenu && (
            <StateDropdown
              currentState={accessory.current_state}
              onSelect={(state) => {
                onStateChange(state);
                setShowStateMenu(false);
              }}
              onClose={() => setShowStateMenu(false)}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className={cn('p-2 rounded-lg', categoryConfig.color)}>
          {categoryConfig.icon}
        </div>
        <div className="flex items-center gap-1">
          {accessory.is_signature && (
            <Star size={14} className="text-yellow-400 fill-yellow-400" />
          )}
          <div className="relative">
            <button
              onClick={() => setShowStateMenu(!showStateMenu)}
              className={cn(
                'px-2 py-0.5 rounded text-xs font-medium',
                stateConfig.bgColor,
                stateConfig.color
              )}
            >
              {stateConfig.label}
            </button>
            {showStateMenu && (
              <StateDropdown
                currentState={accessory.current_state}
                onSelect={(state) => {
                  onStateChange(state);
                  setShowStateMenu(false);
                }}
                onClose={() => setShowStateMenu(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="cursor-pointer" onClick={onClick}>
        <h4 className="font-medium text-white mb-1 truncate">{accessory.name}</h4>
        <p className="text-xs text-gray-400 mb-2">{categoryConfig.label}</p>

        {accessory.description && (
          <p className="text-sm text-gray-400 line-clamp-2 mb-2">
            {accessory.description}
          </p>
        )}

        {/* Attributes */}
        <div className="flex flex-wrap gap-1 mb-3">
          {accessory.material && (
            <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">
              {accessory.material}
            </span>
          )}
          {accessory.color && (
            <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">
              {accessory.color}
            </span>
          )}
        </div>
      </div>

      {/* Story Significance */}
      {accessory.story_significance && (
        <div className="p-2 bg-purple-900/20 border border-purple-700/30 rounded text-xs text-purple-300 mb-3">
          <span className="font-medium">Significance: </span>
          {accessory.story_significance}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
        >
          <Edit3 size={14} />
          Edit
        </button>
        <button
          onClick={onDelete}
          className="flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
};

interface StateDropdownProps {
  currentState: AccessoryState;
  onSelect: (state: AccessoryState) => void;
  onClose: () => void;
}

const StateDropdown: React.FC<StateDropdownProps> = ({ currentState, onSelect, onClose }) => {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute right-0 top-full mt-1 w-32 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden z-20">
        {(Object.keys(STATE_CONFIG) as AccessoryState[]).map((state) => (
          <button
            key={state}
            onClick={() => onSelect(state)}
            className={cn(
              'w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-700 transition-colors',
              currentState === state ? 'bg-gray-700' : ''
            )}
          >
            <span className={STATE_CONFIG[state].color}>{STATE_CONFIG[state].label}</span>
            {currentState === state && <Check size={12} className="ml-auto" />}
          </button>
        ))}
      </div>
    </>
  );
};

interface AccessoryFormProps {
  initialData?: Accessory;
  onSubmit: (data: AccessoryFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const AccessoryForm: React.FC<AccessoryFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const [formData, setFormData] = useState<AccessoryFormData>(
    initialData
      ? {
          name: initialData.name,
          category: initialData.category,
          description: initialData.description || '',
          material: initialData.material || '',
          color: initialData.color || '',
          is_signature: initialData.is_signature,
          story_significance: initialData.story_significance || '',
          current_state: initialData.current_state,
          prompt_fragment: initialData.prompt_fragment || '',
          reference_image_url: initialData.reference_image_url || '',
          attributes: initialData.attributes || {},
        }
      : DEFAULT_FORM_DATA
  );

  const [errors, setErrors] = useState<Partial<Record<keyof AccessoryFormData, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof AccessoryFormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={cn(
            'w-full px-3 py-2 bg-gray-800 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500',
            errors.name ? 'border-red-500' : 'border-gray-700'
          )}
          placeholder="e.g., Family Sword, Silver Pendant"
        />
        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(CATEGORY_CONFIG) as AccessoryCategory[]).map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setFormData({ ...formData, category })}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all',
                formData.category === category
                  ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
              )}
            >
              {CATEGORY_CONFIG[category].icon}
              <span className="truncate w-full text-center">{CATEGORY_CONFIG[category].label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          placeholder="Describe the accessory..."
        />
      </div>

      {/* Material and Color */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Material</label>
          <input
            type="text"
            value={formData.material}
            onChange={(e) => setFormData({ ...formData, material: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="e.g., Steel, Gold, Leather"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Color</label>
          <input
            type="text"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="e.g., Silver, Dark brown"
          />
        </div>
      </div>

      {/* State */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Current State</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(STATE_CONFIG) as AccessoryState[]).map((state) => (
            <button
              key={state}
              type="button"
              onClick={() => setFormData({ ...formData, current_state: state })}
              className={cn(
                'px-3 py-1.5 rounded-lg border text-sm transition-all',
                formData.current_state === state
                  ? `${STATE_CONFIG[state].bgColor} border-current ${STATE_CONFIG[state].color}`
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
              )}
            >
              {STATE_CONFIG[state].label}
            </button>
          ))}
        </div>
      </div>

      {/* Signature Item */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setFormData({ ...formData, is_signature: !formData.is_signature })}
          className={cn(
            'w-5 h-5 rounded border flex items-center justify-center transition-colors',
            formData.is_signature
              ? 'bg-yellow-600 border-yellow-500'
              : 'bg-gray-800 border-gray-600'
          )}
        >
          {formData.is_signature && <Check size={14} className="text-white" />}
        </button>
        <div>
          <label className="text-sm font-medium text-gray-300 flex items-center gap-1">
            <Star size={14} className="text-yellow-400" />
            Signature Item
          </label>
          <p className="text-xs text-gray-500">Mark as a defining item for this character</p>
        </div>
      </div>

      {/* Story Significance */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Story Significance</label>
        <textarea
          value={formData.story_significance}
          onChange={(e) => setFormData({ ...formData, story_significance: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          placeholder="Why is this item important to the story?"
        />
      </div>

      {/* Prompt Fragment */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          AI Prompt Fragment
          <span className="text-gray-500 font-normal ml-1">(optional)</span>
        </label>
        <input
          type="text"
          value={formData.prompt_fragment}
          onChange={(e) => setFormData({ ...formData, prompt_fragment: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="e.g., ornate silver pendant with blue moonstone"
        />
        <p className="text-xs text-gray-500 mt-1">
          Used when generating AI images featuring this accessory
        </p>
      </div>

      {/* Reference Image URL */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Reference Image URL
          <span className="text-gray-500 font-normal ml-1">(optional)</span>
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={formData.reference_image_url}
            onChange={(e) => setFormData({ ...formData, reference_image_url: e.target.value })}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="https://..."
          />
          {formData.reference_image_url && (
            <div className="w-10 h-10 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={formData.reference_image_url}
                alt="Reference"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : initialData ? 'Update Accessory' : 'Create Accessory'}
        </button>
      </div>
    </form>
  );
};

interface CategoryGroupProps {
  category: AccessoryCategory;
  accessories: Accessory[];
  onEdit: (accessory: Accessory) => void;
  onDelete: (accessory: Accessory) => void;
  onStateChange: (accessory: Accessory, state: AccessoryState) => void;
  onClick?: (accessory: Accessory) => void;
}

const CategoryGroup: React.FC<CategoryGroupProps> = ({
  category,
  accessories,
  onEdit,
  onDelete,
  onStateChange,
  onClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const categoryConfig = CATEGORY_CONFIG[category];

  if (accessories.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
      >
        <div className={cn('p-1.5 rounded', categoryConfig.color)}>
          {categoryConfig.icon}
        </div>
        <span className="font-medium text-white">{categoryConfig.label}</span>
        <span className="text-sm text-gray-400">({accessories.length})</span>
        {isExpanded ? (
          <ChevronUp size={16} className="ml-auto text-gray-400" />
        ) : (
          <ChevronDown size={16} className="ml-auto text-gray-400" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-2 pl-2">
              {accessories.map((accessory) => (
                <AccessoryCard
                  key={accessory.id}
                  accessory={accessory}
                  viewMode="list"
                  onEdit={() => onEdit(accessory)}
                  onDelete={() => onDelete(accessory)}
                  onStateChange={(state) => onStateChange(accessory, state)}
                  onClick={() => onClick?.(accessory)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const AccessoryManager: React.FC<AccessoryManagerProps> = ({
  characterId,
  characterName,
  onAccessoryClick,
  className,
}) => {
  const {
    accessories,
    changeState,
    getByCategory,
    getSignatureItems,
    createAccessory,
    deleteAccessory,
    isUpdating,
  } = useAccessoryManager(characterId);

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<AccessoryCategory | 'all'>('all');
  const [filterState, setFilterState] = useState<AccessoryState | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<Accessory | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter accessories
  const filteredAccessories = useMemo(() => {
    return accessories.filter((acc) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          acc.name.toLowerCase().includes(query) ||
          acc.description?.toLowerCase().includes(query) ||
          acc.material?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filterCategory !== 'all' && acc.category !== filterCategory) {
        return false;
      }

      // State filter
      if (filterState !== 'all' && acc.current_state !== filterState) {
        return false;
      }

      return true;
    });
  }, [accessories, searchQuery, filterCategory, filterState]);

  // Group by category for category view
  const accessoriesByCategory = useMemo(() => {
    const grouped: Partial<Record<AccessoryCategory, Accessory[]>> = {};
    filteredAccessories.forEach((acc) => {
      if (!grouped[acc.category]) grouped[acc.category] = [];
      grouped[acc.category]!.push(acc);
    });
    return grouped;
  }, [filteredAccessories]);

  // Signature items
  const signatureItems = useMemo(() => {
    return filteredAccessories.filter((a) => a.is_signature);
  }, [filteredAccessories]);

  // Handlers
  const handleCreate = (data: AccessoryFormData) => {
    createAccessory({
      ...data,
      character_id: characterId,
    });
    setShowForm(false);
  };

  const handleEdit = (accessory: Accessory) => {
    setEditingAccessory(accessory);
    setShowForm(true);
  };

  const handleUpdate = (data: AccessoryFormData) => {
    if (!editingAccessory) return;
    // Note: Using the mutation from the hook would require the full updateAccessory
    // For now, we'll just close the form - the actual update would go through the hook
    setShowForm(false);
    setEditingAccessory(null);
  };

  const handleDelete = (accessory: Accessory) => {
    setDeletingId(accessory.id);
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteAccessory(deletingId);
      setDeletingId(null);
    }
  };

  const handleStateChange = (accessory: Accessory, newState: AccessoryState) => {
    changeState(accessory.id, newState);
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-600/20 rounded-lg">
              <Package size={20} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Accessories</h2>
              <p className="text-sm text-gray-400">
                {characterName ? `${characterName}'s ` : ''}items and possessions
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditingAccessory(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Plus size={16} />
            Add Accessory
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Search accessories..."
            />
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as AccessoryCategory | 'all')}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Categories</option>
            {(Object.keys(CATEGORY_CONFIG) as AccessoryCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_CONFIG[cat].label}
              </option>
            ))}
          </select>

          {/* State Filter */}
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value as AccessoryState | 'all')}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All States</option>
            {(Object.keys(STATE_CONFIG) as AccessoryState[]).map((state) => (
              <option key={state} value={state}>
                {STATE_CONFIG[state].label}
              </option>
            ))}
          </select>

          {/* View Mode */}
          <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg p-0.5">
            {(['grid', 'list', 'category'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded transition-colors',
                  viewMode === mode
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowForm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-gray-900 border border-gray-700 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    {editingAccessory ? 'Edit Accessory' : 'New Accessory'}
                  </h3>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <AccessoryForm
                  initialData={editingAccessory || undefined}
                  onSubmit={editingAccessory ? handleUpdate : handleCreate}
                  onCancel={() => setShowForm(false)}
                  isLoading={isUpdating}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation */}
        <AnimatePresence>
          {deletingId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setDeletingId(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-600/20 rounded-lg">
                    <AlertCircle size={20} className="text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Delete Accessory?</h3>
                </div>

                <p className="text-sm text-gray-400 mb-6">
                  This action cannot be undone. The accessory will be permanently removed.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setDeletingId(null)}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {accessories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Package size={48} className="mb-4 opacity-50" />
            <p className="text-lg">No accessories yet</p>
            <p className="text-sm mb-4">Add items, weapons, jewelry, and more</p>
            <button
              onClick={() => {
                setEditingAccessory(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Plus size={16} />
              Add First Accessory
            </button>
          </div>
        ) : filteredAccessories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Search size={48} className="mb-4 opacity-50" />
            <p className="text-lg">No matches found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            {/* Signature Items Highlight */}
            {signatureItems.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                  <Star size={14} className="text-yellow-400" />
                  Signature Items
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {signatureItems.map((acc) => (
                    <AccessoryCard
                      key={acc.id}
                      accessory={acc}
                      viewMode="grid"
                      onEdit={() => handleEdit(acc)}
                      onDelete={() => handleDelete(acc)}
                      onStateChange={(state) => handleStateChange(acc, state)}
                      onClick={() => onAccessoryClick?.(acc)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Main Content */}
            {viewMode === 'category' ? (
              <div>
                {(Object.keys(CATEGORY_CONFIG) as AccessoryCategory[]).map((category) => (
                  <CategoryGroup
                    key={category}
                    category={category}
                    accessories={accessoriesByCategory[category] || []}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onStateChange={handleStateChange}
                    onClick={onAccessoryClick}
                  />
                ))}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAccessories
                  .filter((a) => !a.is_signature)
                  .map((acc) => (
                    <AccessoryCard
                      key={acc.id}
                      accessory={acc}
                      viewMode="grid"
                      onEdit={() => handleEdit(acc)}
                      onDelete={() => handleDelete(acc)}
                      onStateChange={(state) => handleStateChange(acc, state)}
                      onClick={() => onAccessoryClick?.(acc)}
                    />
                  ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAccessories
                  .filter((a) => !a.is_signature)
                  .map((acc) => (
                    <AccessoryCard
                      key={acc.id}
                      accessory={acc}
                      viewMode="list"
                      onEdit={() => handleEdit(acc)}
                      onDelete={() => handleDelete(acc)}
                      onStateChange={(state) => handleStateChange(acc, state)}
                      onClick={() => onAccessoryClick?.(acc)}
                    />
                  ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-gray-400">
            <span>{accessories.length} total</span>
            <span className="text-green-400">
              {accessories.filter((a) => a.current_state === 'worn').length} worn
            </span>
            <span className="text-blue-400">
              {accessories.filter((a) => a.current_state === 'stored').length} stored
            </span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <Info size={14} />
            <span>Click an accessory to view details</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessoryManager;
