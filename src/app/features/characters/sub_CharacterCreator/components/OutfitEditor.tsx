'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shirt,
  Save,
  X,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Image as ImageIcon,
  Tag,
  MapPin,
  Cloud,
  Clock,
  Info,
  Check,
} from 'lucide-react';
import {
  Outfit,
  OutfitType,
  ClothingDetails,
  ClothingPiece,
  OverallCondition,
  Formality,
  OUTFIT_TEMPLATES,
  generateOutfitPrompt,
} from '@/app/hooks/integration/useCharacterOutfits';
import { cn } from '@/app/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface OutfitEditorProps {
  outfit?: Outfit;
  onSave: (outfit: Partial<Outfit>) => void;
  onCancel: () => void;
  characterName?: string;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const OUTFIT_TYPES: { value: OutfitType; label: string; description: string }[] = [
  { value: 'default', label: 'Default', description: 'Signature everyday look' },
  { value: 'casual', label: 'Casual', description: 'Relaxed everyday attire' },
  { value: 'formal', label: 'Formal', description: 'Dressy occasions' },
  { value: 'combat', label: 'Combat', description: 'Battle-ready gear' },
  { value: 'work', label: 'Work', description: 'Professional/occupational' },
  { value: 'sleep', label: 'Sleep', description: 'Nightwear/comfortable' },
  { value: 'disguise', label: 'Disguise', description: 'Incognito/undercover' },
  { value: 'ceremonial', label: 'Ceremonial', description: 'Religious/ritualistic' },
  { value: 'athletic', label: 'Athletic', description: 'Sports/training' },
  { value: 'travel', label: 'Travel', description: 'Journey/expedition gear' },
  { value: 'weather', label: 'Weather', description: 'Protection from elements' },
  { value: 'custom', label: 'Custom', description: 'User-defined type' },
];

const CONDITIONS: OverallCondition[] = ['pristine', 'worn', 'damaged', 'tattered'];
const FORMALITIES: Formality[] = ['casual', 'smart_casual', 'business', 'formal', 'ceremonial'];

const COMMON_MATERIALS = [
  'Cotton', 'Linen', 'Wool', 'Silk', 'Leather', 'Fur', 'Velvet', 'Satin',
  'Canvas', 'Denim', 'Chainmail', 'Plate', 'Scale', 'Rubber', 'Synthetic',
];

const COMMON_COLORS = [
  'Black', 'White', 'Gray', 'Brown', 'Tan', 'Navy', 'Blue', 'Red',
  'Green', 'Gold', 'Silver', 'Purple', 'Burgundy', 'Cream', 'Olive',
];

const LOCATION_SUGGESTIONS = [
  'castle', 'tavern', 'forest', 'city', 'village', 'battlefield', 'court',
  'ship', 'temple', 'market', 'dungeon', 'mountains', 'desert', 'beach',
  'inn', 'workshop', 'library', 'garden', 'arena', 'palace',
];

const WEATHER_SUGGESTIONS = [
  'sunny', 'cloudy', 'rainy', 'snowy', 'stormy', 'foggy', 'windy',
  'hot', 'cold', 'humid', 'indoor', 'any',
];

const TIME_SUGGESTIONS = [
  'morning', 'afternoon', 'evening', 'night', 'dawn', 'dusk', 'any',
];

const CONTEXT_TAG_SUGGESTIONS = [
  'outdoor', 'indoor', 'combat', 'social', 'stealth', 'work', 'rest',
  'travel', 'celebration', 'mourning', 'religious', 'athletic', 'romantic',
  'diplomatic', 'dangerous', 'peaceful', 'festive', 'mysterious',
];

// ============================================================================
// Subcomponents
// ============================================================================

interface ClothingPieceEditorProps {
  label: string;
  piece: ClothingPiece | undefined;
  onChange: (piece: ClothingPiece) => void;
  onClear: () => void;
}

const ClothingPieceEditor: React.FC<ClothingPieceEditorProps> = ({
  label,
  piece,
  onChange,
  onClear,
}) => {
  const [isExpanded, setIsExpanded] = useState(!!piece?.item);

  const handleChange = (field: keyof ClothingPiece, value: string) => {
    onChange({ ...piece, [field]: value } as ClothingPiece);
  };

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Shirt size={16} className="text-gray-400" />
          <span className="font-medium text-white">{label}</span>
          {piece?.item && (
            <span className="text-xs text-gray-400">- {piece.item}</span>
          )}
        </div>
        <motion.span animate={{ rotate: isExpanded ? 180 : 0 }}>
          <ChevronDown size={16} className="text-gray-400" />
        </motion.span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-3 bg-gray-900/50">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Item</label>
                  <input
                    type="text"
                    value={piece?.item || ''}
                    onChange={(e) => handleChange('item', e.target.value)}
                    placeholder="e.g., Linen shirt"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Material</label>
                  <input
                    type="text"
                    value={piece?.material || ''}
                    onChange={(e) => handleChange('material', e.target.value)}
                    placeholder="e.g., Linen"
                    list="materials"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500"
                  />
                  <datalist id="materials">
                    {COMMON_MATERIALS.map(m => <option key={m} value={m} />)}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Color</label>
                  <input
                    type="text"
                    value={piece?.color || ''}
                    onChange={(e) => handleChange('color', e.target.value)}
                    placeholder="e.g., White"
                    list="colors"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500"
                  />
                  <datalist id="colors">
                    {COMMON_COLORS.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Pattern</label>
                  <input
                    type="text"
                    value={piece?.pattern || ''}
                    onChange={(e) => handleChange('pattern', e.target.value)}
                    placeholder="e.g., Striped"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1">Condition</label>
                  <select
                    value={piece?.condition || 'worn'}
                    onChange={(e) => handleChange('condition', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                  >
                    {CONDITIONS.map(c => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={onClear}
                  className="ml-3 mt-5 p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Clear this item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface TagInputProps {
  label: string;
  icon: React.ReactNode;
  tags: string[];
  suggestions: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

const TagInput: React.FC<TagInputProps> = ({
  label,
  icon,
  tags,
  suggestions,
  onChange,
  placeholder,
}) => {
  const [inputValue, setInputValue] = useState('');

  const addTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (normalizedTag && !tags.includes(normalizedTag)) {
      onChange([...tags, normalizedTag]);
    }
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  const unusedSuggestions = suggestions.filter(s => !tags.includes(s));

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        {icon}
        <span>{label}</span>
      </div>

      {/* Current tags */}
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <span
            key={tag}
            className="flex items-center gap-1 px-2 py-1 bg-purple-600/20 text-purple-300 rounded text-xs"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="hover:text-red-400 transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>

      {/* Input */}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Type and press Enter'}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500"
      />

      {/* Suggestions */}
      {unusedSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {unusedSuggestions.slice(0, 8).map(s => (
            <button
              key={s}
              onClick={() => addTag(s)}
              className="text-xs px-1.5 py-0.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const OutfitEditor: React.FC<OutfitEditorProps> = ({
  outfit,
  onSave,
  onCancel,
  characterName,
  className,
}) => {
  // Form state
  const [formData, setFormData] = useState<Partial<Outfit>>({
    name: outfit?.name || '',
    outfit_type: outfit?.outfit_type || 'custom',
    description: outfit?.description || '',
    is_default: outfit?.is_default || false,
    clothing: outfit?.clothing || {},
    context_tags: outfit?.context_tags || [],
    suitable_locations: outfit?.suitable_locations || [],
    suitable_weather: outfit?.suitable_weather || [],
    suitable_time_of_day: outfit?.suitable_time_of_day || [],
  });

  const [activeSection, setActiveSection] = useState<string>('basic');

  const isEditing = !!outfit?.id;

  // Update form field
  const updateField = <K extends keyof Outfit>(field: K, value: Outfit[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Update clothing piece
  const updateClothingPiece = (
    piece: keyof ClothingDetails,
    value: ClothingPiece | undefined
  ) => {
    setFormData(prev => ({
      ...prev,
      clothing: { ...prev.clothing, [piece]: value },
    }));
  };

  // Apply template
  const applyTemplate = (type: OutfitType) => {
    const template = OUTFIT_TEMPLATES[type];
    setFormData(prev => ({
      ...prev,
      ...template,
      name: template.name || prev.name,
      outfit_type: type,
    }));
  };

  // Generate preview prompt
  const previewPrompt = useMemo(() => {
    return generateOutfitPrompt(formData as Outfit, []);
  }, [formData]);

  // Validate form
  const isValid = !!formData.name?.trim();

  // Handle save
  const handleSave = () => {
    if (!isValid) return;
    onSave(formData);
  };

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: <Info size={16} /> },
    { id: 'clothing', label: 'Clothing', icon: <Shirt size={16} /> },
    { id: 'context', label: 'Context', icon: <Tag size={16} /> },
  ];

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {isEditing ? 'Edit Outfit' : 'Create Outfit'}
            </h2>
            {characterName && (
              <p className="text-sm text-gray-400">For {characterName}</p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-2 mt-4">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                activeSection === section.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              )}
            >
              {section.icon}
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Basic Info Section */}
        {activeSection === 'basic' && (
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Outfit Name *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g., Battle Armor"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Outfit Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {OUTFIT_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => {
                      updateField('outfit_type', type.value);
                      if (!formData.name) {
                        applyTemplate(type.value);
                      }
                    }}
                    className={cn(
                      'p-3 rounded-lg border text-left transition-all',
                      formData.outfit_type === type.value
                        ? 'border-purple-500 bg-purple-900/20'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    )}
                  >
                    <div className="text-sm font-medium text-white">{type.label}</div>
                    <div className="text-xs text-gray-400">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Describe this outfit..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none"
              />
            </div>

            {/* Default checkbox */}
            <label className="flex items-center gap-3 p-3 bg-gray-800/50 border border-gray-700 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_default || false}
                onChange={(e) => updateField('is_default', e.target.checked)}
                className="rounded bg-gray-700 border-gray-600"
              />
              <div>
                <div className="text-sm font-medium text-white">Set as default outfit</div>
                <div className="text-xs text-gray-400">
                  This will be the character's primary appearance
                </div>
              </div>
            </label>

            {/* Style Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Style Notes
              </label>
              <textarea
                value={formData.clothing?.style_notes || ''}
                onChange={(e) => updateClothingPiece('style_notes' as any, e.target.value as any)}
                placeholder="Additional style details..."
                rows={2}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none"
              />
            </div>

            {/* Overall Condition & Formality */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Overall Condition
                </label>
                <select
                  value={formData.clothing?.overall_condition || 'worn'}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      clothing: { ...prev.clothing, overall_condition: e.target.value as OverallCondition },
                    }))
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  {CONDITIONS.map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Formality
                </label>
                <select
                  value={formData.clothing?.formality || 'casual'}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      clothing: { ...prev.clothing, formality: e.target.value as Formality },
                    }))
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  {FORMALITIES.map(f => (
                    <option key={f} value={f}>
                      {f.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Clothing Section */}
        {activeSection === 'clothing' && (
          <div className="space-y-3">
            <ClothingPieceEditor
              label="Top / Shirt"
              piece={formData.clothing?.top}
              onChange={(p) => updateClothingPiece('top', p)}
              onClear={() => updateClothingPiece('top', undefined)}
            />
            <ClothingPieceEditor
              label="Bottom / Pants"
              piece={formData.clothing?.bottom}
              onChange={(p) => updateClothingPiece('bottom', p)}
              onClear={() => updateClothingPiece('bottom', undefined)}
            />
            <ClothingPieceEditor
              label="Footwear"
              piece={formData.clothing?.footwear}
              onChange={(p) => updateClothingPiece('footwear', p)}
              onClear={() => updateClothingPiece('footwear', undefined)}
            />
            <ClothingPieceEditor
              label="Outerwear / Cloak"
              piece={formData.clothing?.outerwear}
              onChange={(p) => updateClothingPiece('outerwear', p)}
              onClear={() => updateClothingPiece('outerwear', undefined)}
            />
            <ClothingPieceEditor
              label="Headwear"
              piece={formData.clothing?.headwear}
              onChange={(p) => updateClothingPiece('headwear', p)}
              onClear={() => updateClothingPiece('headwear', undefined)}
            />
            <ClothingPieceEditor
              label="Handwear / Gloves"
              piece={formData.clothing?.handwear}
              onChange={(p) => updateClothingPiece('handwear', p)}
              onClear={() => updateClothingPiece('handwear', undefined)}
            />
          </div>
        )}

        {/* Context Section */}
        {activeSection === 'context' && (
          <div className="space-y-6">
            <TagInput
              label="Context Tags"
              icon={<Tag size={16} />}
              tags={formData.context_tags || []}
              suggestions={CONTEXT_TAG_SUGGESTIONS}
              onChange={(tags) => updateField('context_tags', tags)}
              placeholder="Add context tags..."
            />

            <TagInput
              label="Suitable Locations"
              icon={<MapPin size={16} />}
              tags={formData.suitable_locations || []}
              suggestions={LOCATION_SUGGESTIONS}
              onChange={(tags) => updateField('suitable_locations', tags)}
              placeholder="Add locations..."
            />

            <TagInput
              label="Suitable Weather"
              icon={<Cloud size={16} />}
              tags={formData.suitable_weather || []}
              suggestions={WEATHER_SUGGESTIONS}
              onChange={(tags) => updateField('suitable_weather', tags)}
              placeholder="Add weather conditions..."
            />

            <TagInput
              label="Suitable Time of Day"
              icon={<Clock size={16} />}
              tags={formData.suitable_time_of_day || []}
              suggestions={TIME_SUGGESTIONS}
              onChange={(tags) => updateField('suitable_time_of_day', tags)}
              placeholder="Add time periods..."
            />
          </div>
        )}

        {/* Prompt Preview */}
        {previewPrompt && (
          <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Sparkles size={14} />
              <span>Generated Prompt Preview</span>
            </div>
            <p className="text-sm text-gray-300 italic">"{previewPrompt}"</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!isValid}
          className={cn(
            'flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors',
            isValid
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          )}
        >
          <Save size={18} />
          {isEditing ? 'Save Changes' : 'Create Outfit'}
        </button>
      </div>
    </div>
  );
};

export default OutfitEditor;
