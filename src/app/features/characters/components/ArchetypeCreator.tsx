'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Save,
  X,
  User,
  FileText,
  Tag,
  Globe,
  Sparkles,
  AlertCircle,
  Check,
  ChevronRight,
  ChevronDown,
  Copy,
} from 'lucide-react';
import { CharacterArchetype, ArchetypeCategory, ArchetypeGenre } from '@/app/types/Archetype';
import { Appearance, defaultAppearance } from '@/app/types/Character';
import {
  CreateCustomArchetypeInput,
  extractArchetypeFromCharacter,
  HierarchicalArchetype,
} from '@/app/features/characters/lib/archetypeEngine';
import { cn } from '@/app/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface ArchetypeCreatorProps {
  // If provided, create from existing character
  fromCharacter?: {
    id: string;
    name: string;
    appearance: Appearance;
    backstory?: string;
    motivations?: string;
    personality?: string;
    type?: string;
  };
  // If provided, base on existing archetype
  baseArchetype?: CharacterArchetype;
  onSave: (archetype: CreateCustomArchetypeInput) => void;
  onCancel: () => void;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const CATEGORIES: ArchetypeCategory[] = [
  'Hero', 'Villain', 'Mentor', 'Sidekick', 'Rogue', 'Guardian',
  'Trickster', 'Innocent', 'Ruler', 'Lover', 'Explorer', 'Sage',
];

const GENRES: ArchetypeGenre[] = [
  'fantasy', 'sci-fi', 'mystery', 'romance', 'horror',
  'western', 'historical', 'contemporary', 'all',
];

const SUGGESTED_TAGS: Record<ArchetypeCategory, string[]> = {
  Hero: ['brave', 'selfless', 'chosen-one', 'underdog', 'reluctant'],
  Villain: ['cunning', 'tragic', 'mastermind', 'corrupted', 'charismatic'],
  Mentor: ['wise', 'experienced', 'cryptic', 'protective', 'stern'],
  Sidekick: ['loyal', 'comic-relief', 'brave', 'resourceful', 'growing'],
  Rogue: ['charming', 'thief', 'morally-gray', 'independent', 'cunning'],
  Guardian: ['protective', 'stoic', 'dutiful', 'strong', 'self-sacrificing'],
  Trickster: ['clever', 'mischievous', 'unpredictable', 'wise-fool', 'subversive'],
  Innocent: ['pure', 'optimistic', 'compassionate', 'naive', 'hopeful'],
  Ruler: ['authoritative', 'burdened', 'just', 'powerful', 'lonely'],
  Lover: ['passionate', 'devoted', 'romantic', 'emotional', 'idealistic'],
  Explorer: ['adventurous', 'curious', 'independent', 'restless', 'brave'],
  Sage: ['intellectual', 'analytical', 'truth-seeker', 'wise', 'detached'],
};

// ============================================================================
// Subcomponents
// ============================================================================

interface FormSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const FormSection: React.FC<FormSectionProps> = ({
  title,
  icon,
  children,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-800 transition-colors"
      >
        <span className="p-1.5 rounded bg-gray-700 text-gray-300">{icon}</span>
        <span className="flex-1 text-left font-medium text-white">{title}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }}>
          <ChevronDown size={18} className="text-gray-400" />
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4 bg-gray-900/50">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface TagInputProps {
  tags: string[];
  suggestions: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
}

const TagInput: React.FC<TagInputProps> = ({
  tags,
  suggestions,
  onChange,
  maxTags = 8,
}) => {
  const [inputValue, setInputValue] = useState('');

  const addTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim().replace(/\s+/g, '-');
    if (normalizedTag && !tags.includes(normalizedTag) && tags.length < maxTags) {
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
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const unusedSuggestions = suggestions.filter(s => !tags.includes(s));

  return (
    <div className="space-y-2">
      {/* Tags Display */}
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <span
            key={tag}
            className="flex items-center gap-1 px-2 py-1 bg-purple-600/20 text-purple-300 rounded text-sm"
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
        placeholder="Add a tag..."
        disabled={tags.length >= maxTags}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
      />

      {/* Suggestions */}
      {unusedSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-gray-500">Suggestions:</span>
          {unusedSuggestions.slice(0, 5).map(suggestion => (
            <button
              key={suggestion}
              onClick={() => addTag(suggestion)}
              className="text-xs px-1.5 py-0.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded transition-colors"
            >
              + {suggestion}
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

const ArchetypeCreator: React.FC<ArchetypeCreatorProps> = ({
  fromCharacter,
  baseArchetype,
  onSave,
  onCancel,
  className,
}) => {
  // Initialize form state
  const initialData = useMemo(() => {
    if (fromCharacter) {
      return extractArchetypeFromCharacter(fromCharacter);
    }
    if (baseArchetype) {
      return {
        name: `${baseArchetype.name} (Custom)`,
        category: baseArchetype.category,
        appearance: baseArchetype.appearance,
        backstory: baseArchetype.backstory,
        motivations: baseArchetype.motivations,
        personality: baseArchetype.personality,
        tags: [...baseArchetype.tags],
        genres: [...baseArchetype.genre],
        basedOnId: baseArchetype.id,
      };
    }
    return {
      name: '',
      category: 'Hero' as ArchetypeCategory,
      appearance: defaultAppearance,
      backstory: '',
      motivations: '',
      personality: '',
      tags: [] as string[],
      genres: ['all'] as ArchetypeGenre[],
    };
  }, [fromCharacter, baseArchetype]);

  const [formData, setFormData] = useState<CreateCustomArchetypeInput>({
    name: initialData.name || '',
    category: initialData.category || 'Hero',
    appearance: initialData.appearance || defaultAppearance,
    backstory: initialData.backstory || '',
    motivations: initialData.motivations || '',
    personality: initialData.personality || '',
    tags: initialData.tags || [],
    genres: initialData.genres || ['all'],
    basedOnId: initialData.basedOnId,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update a single field
  const updateField = <K extends keyof CreateCustomArchetypeInput>(
    field: K,
    value: CreateCustomArchetypeInput[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Toggle genre
  const toggleGenre = (genre: ArchetypeGenre) => {
    setFormData(prev => {
      const genres = prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre];

      // Ensure at least one genre is selected
      if (genres.length === 0) genres.push('all');

      // If 'all' is selected, remove other genres
      if (genre === 'all') return { ...prev, genres: ['all'] };
      if (genres.includes('all' as ArchetypeGenre)) {
        return { ...prev, genres: genres.filter(g => g !== 'all') };
      }

      return { ...prev, genres };
    });
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (formData.name.length > 50) {
      newErrors.name = 'Name must be 50 characters or less';
    }
    if (!formData.backstory.trim()) {
      newErrors.backstory = 'Backstory is required';
    }
    if (!formData.personality.trim()) {
      newErrors.personality = 'Personality traits are required';
    }
    if (formData.tags.length === 0) {
      newErrors.tags = 'At least one tag is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (validate()) {
      onSave(formData);
    }
  };

  // Get suggested tags based on category
  const suggestedTags = SUGGESTED_TAGS[formData.category] || [];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-600/20 rounded-lg">
            <Sparkles size={20} className="text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Create Custom Archetype</h3>
            <p className="text-sm text-gray-400">
              {fromCharacter
                ? `Based on ${fromCharacter.name}`
                : baseArchetype
                  ? `Variant of ${baseArchetype.name}`
                  : 'Create from scratch'}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Source Info */}
      {(fromCharacter || baseArchetype) && (
        <div className="flex items-center gap-2 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
          <Copy size={16} className="text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-300">
            {fromCharacter
              ? `Extracting archetype patterns from "${fromCharacter.name}"`
              : `Creating variant of "${baseArchetype?.name}"`}
          </p>
        </div>
      )}

      {/* Form */}
      <div className="space-y-4">
        {/* Basic Info */}
        <FormSection title="Basic Information" icon={<FileText size={16} />}>
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Archetype Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g., The Wandering Sage"
              className={cn(
                'w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500',
                errors.name ? 'border-red-500' : 'border-gray-700'
              )}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => updateField('category', e.target.value as ArchetypeCategory)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Genres */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Compatible Genres
            </label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(genre => (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                    formData.genres.includes(genre)
                      ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  )}
                >
                  {genre === 'sci-fi' ? 'Sci-Fi' : genre.charAt(0).toUpperCase() + genre.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </FormSection>

        {/* Story Elements */}
        <FormSection title="Story Elements" icon={<User size={16} />}>
          {/* Backstory */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Backstory *
            </label>
            <textarea
              value={formData.backstory}
              onChange={(e) => updateField('backstory', e.target.value)}
              placeholder="Describe the character's background and history..."
              rows={3}
              className={cn(
                'w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none',
                errors.backstory ? 'border-red-500' : 'border-gray-700'
              )}
            />
            {errors.backstory && (
              <p className="mt-1 text-xs text-red-400">{errors.backstory}</p>
            )}
          </div>

          {/* Motivations */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Motivations
            </label>
            <textarea
              value={formData.motivations}
              onChange={(e) => updateField('motivations', e.target.value)}
              placeholder="What drives this character?"
              rows={2}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          {/* Personality */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Personality *
            </label>
            <textarea
              value={formData.personality}
              onChange={(e) => updateField('personality', e.target.value)}
              placeholder="Key personality traits (comma-separated)..."
              rows={2}
              className={cn(
                'w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none',
                errors.personality ? 'border-red-500' : 'border-gray-700'
              )}
            />
            {errors.personality && (
              <p className="mt-1 text-xs text-red-400">{errors.personality}</p>
            )}
          </div>
        </FormSection>

        {/* Tags */}
        <FormSection title="Tags" icon={<Tag size={16} />}>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Searchable Tags *
            </label>
            <TagInput
              tags={formData.tags}
              suggestions={suggestedTags}
              onChange={(tags) => updateField('tags', tags)}
            />
            {errors.tags && (
              <p className="mt-1 text-xs text-red-400">{errors.tags}</p>
            )}
          </div>
        </FormSection>

        {/* Appearance Preview */}
        {formData.appearance && (
          <FormSection title="Appearance (from source)" icon={<Globe size={16} />} defaultOpen={false}>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Gender:</span>{' '}
                <span className="text-gray-300">{formData.appearance.gender || 'Not set'}</span>
              </div>
              <div>
                <span className="text-gray-500">Age:</span>{' '}
                <span className="text-gray-300">{formData.appearance.age || 'Not set'}</span>
              </div>
              <div>
                <span className="text-gray-500">Body:</span>{' '}
                <span className="text-gray-300">{formData.appearance.bodyType || 'Not set'}</span>
              </div>
              <div>
                <span className="text-gray-500">Height:</span>{' '}
                <span className="text-gray-300">{formData.appearance.height || 'Not set'}</span>
              </div>
              <div>
                <span className="text-gray-500">Hair:</span>{' '}
                <span className="text-gray-300">{formData.appearance.face.hairColor || 'Not set'}</span>
              </div>
              <div>
                <span className="text-gray-500">Eyes:</span>{' '}
                <span className="text-gray-300">{formData.appearance.face.eyeColor || 'Not set'}</span>
              </div>
            </div>
          </FormSection>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
        >
          <Save size={18} />
          Save Archetype
        </button>
      </div>
    </div>
  );
};

export default ArchetypeCreator;
