'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bookmark,
  Plus,
  Trash2,
  Download,
  Upload,
  Search,
  Star,
  StarOff,
  Copy,
  Check,
  X,
  FolderOpen,
  Tag,
  Clock,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { type AdjustmentLayer, type LayerStack } from '@/lib/editor';
import { cn } from '@/app/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface Preset {
  id: string;
  name: string;
  description?: string;
  category: PresetCategory;
  tags: string[];
  layers: AdjustmentLayer[];
  thumbnail?: string;
  isFavorite: boolean;
  isBuiltIn: boolean;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}

export type PresetCategory =
  | 'color-grading'
  | 'film-looks'
  | 'vintage'
  | 'black-white'
  | 'cinematic'
  | 'portrait'
  | 'landscape'
  | 'custom';

interface PresetManagerProps {
  currentLayers: AdjustmentLayer[];
  onApplyPreset: (layers: AdjustmentLayer[]) => void;
  onBatchApply?: (presetId: string, imageIds: string[]) => void;
}

// ============================================================================
// Constants
// ============================================================================

const PRESET_CATEGORIES: { value: PresetCategory; label: string }[] = [
  { value: 'color-grading', label: 'Color Grading' },
  { value: 'film-looks', label: 'Film Looks' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'black-white', label: 'Black & White' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' },
  { value: 'custom', label: 'Custom' },
];

const BUILT_IN_PRESETS: Omit<Preset, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>[] = [
  {
    name: 'Warm Sunset',
    description: 'Golden hour warmth with enhanced highlights',
    category: 'color-grading',
    tags: ['warm', 'golden', 'sunset'],
    isBuiltIn: true,
    isFavorite: false,
    layers: [
      {
        id: 'preset_warm_temp',
        name: 'Temperature',
        type: 'temperature',
        adjustment: { type: 'temperature', params: { temperature: 35, tint: 5 } },
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        order: 0,
      },
      {
        id: 'preset_warm_vibrance',
        name: 'Vibrance',
        type: 'vibrance',
        adjustment: { type: 'vibrance', params: { vibrance: 20, saturation: 10 } },
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        order: 1,
      },
    ],
  },
  {
    name: 'Cool Blue',
    description: 'Cool tones with enhanced shadows',
    category: 'color-grading',
    tags: ['cool', 'blue', 'moody'],
    isBuiltIn: true,
    isFavorite: false,
    layers: [
      {
        id: 'preset_cool_temp',
        name: 'Temperature',
        type: 'temperature',
        adjustment: { type: 'temperature', params: { temperature: -30, tint: -5 } },
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        order: 0,
      },
      {
        id: 'preset_cool_contrast',
        name: 'Contrast',
        type: 'brightness-contrast',
        adjustment: { type: 'brightness-contrast', params: { brightness: -5, contrast: 15 } },
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        order: 1,
      },
    ],
  },
  {
    name: 'Vintage Film',
    description: 'Classic film emulation with faded blacks',
    category: 'vintage',
    tags: ['vintage', 'film', 'retro', 'faded'],
    isBuiltIn: true,
    isFavorite: false,
    layers: [
      {
        id: 'preset_vintage_levels',
        name: 'Faded Blacks',
        type: 'levels',
        adjustment: {
          type: 'levels',
          params: {
            inputBlack: 0,
            inputWhite: 240,
            inputGamma: 1.1,
            outputBlack: 20,
            outputWhite: 255,
            channel: 'rgb',
          },
        },
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        order: 0,
      },
      {
        id: 'preset_vintage_hsl',
        name: 'Desaturate',
        type: 'hsl',
        adjustment: { type: 'hsl', params: { hue: 0, saturation: -20, lightness: 0 } },
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        order: 1,
      },
      {
        id: 'preset_vintage_grain',
        name: 'Film Grain',
        type: 'grain',
        adjustment: {
          type: 'grain',
          params: { amount: 15, size: 30, roughness: 50, monochromatic: true },
        },
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        order: 2,
      },
    ],
  },
  {
    name: 'Cinematic Teal & Orange',
    description: 'Hollywood-style color grading',
    category: 'cinematic',
    tags: ['cinematic', 'teal', 'orange', 'hollywood'],
    isBuiltIn: true,
    isFavorite: false,
    layers: [
      {
        id: 'preset_cine_temp',
        name: 'Warm Midtones',
        type: 'temperature',
        adjustment: { type: 'temperature', params: { temperature: 15, tint: -10 } },
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        order: 0,
      },
      {
        id: 'preset_cine_contrast',
        name: 'Contrast',
        type: 'brightness-contrast',
        adjustment: { type: 'brightness-contrast', params: { brightness: 0, contrast: 20 } },
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        order: 1,
      },
      {
        id: 'preset_cine_vignette',
        name: 'Vignette',
        type: 'vignette',
        adjustment: {
          type: 'vignette',
          params: { amount: 25, midpoint: 50, roundness: 0, feather: 50, highlightPriority: false },
        },
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        order: 2,
      },
    ],
  },
  {
    name: 'High Contrast B&W',
    description: 'Dramatic black and white conversion',
    category: 'black-white',
    tags: ['black-white', 'monochrome', 'dramatic', 'contrast'],
    isBuiltIn: true,
    isFavorite: false,
    layers: [
      {
        id: 'preset_bw_hsl',
        name: 'Desaturate',
        type: 'hsl',
        adjustment: { type: 'hsl', params: { hue: 0, saturation: -100, lightness: 0 } },
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        order: 0,
      },
      {
        id: 'preset_bw_contrast',
        name: 'High Contrast',
        type: 'brightness-contrast',
        adjustment: { type: 'brightness-contrast', params: { brightness: 5, contrast: 40 } },
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        order: 1,
      },
    ],
  },
  {
    name: 'Soft Portrait',
    description: 'Flattering skin tones with soft contrast',
    category: 'portrait',
    tags: ['portrait', 'soft', 'skin', 'beauty'],
    isBuiltIn: true,
    isFavorite: false,
    layers: [
      {
        id: 'preset_portrait_exposure',
        name: 'Brighten',
        type: 'exposure',
        adjustment: { type: 'exposure', params: { exposure: 0.2, offset: 0, gamma: 1.1 } },
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        order: 0,
      },
      {
        id: 'preset_portrait_vibrance',
        name: 'Subtle Color',
        type: 'vibrance',
        adjustment: { type: 'vibrance', params: { vibrance: 15, saturation: -5 } },
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        order: 1,
      },
      {
        id: 'preset_portrait_sharpen',
        name: 'Subtle Sharpen',
        type: 'sharpen',
        adjustment: {
          type: 'sharpen',
          params: { amount: 30, radius: 1, threshold: 10, type: 'unsharp-mask' },
        },
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        order: 2,
      },
    ],
  },
];

// ============================================================================
// Storage Helper
// ============================================================================

const STORAGE_KEY = 'imageEditor_presets';

function loadPresets(): Preset[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as Preset[];
      return data.map((p) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      }));
    }
  } catch (err) {
    console.error('Failed to load presets:', err);
  }

  // Return built-in presets with generated IDs
  return BUILT_IN_PRESETS.map((preset, index) => ({
    ...preset,
    id: `builtin_${index}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    usageCount: 0,
  }));
}

function savePresets(presets: Preset[]): void {
  if (typeof window === 'undefined') return;

  try {
    // Only save non-built-in presets and favorite status of built-ins
    const toSave = presets.filter((p) => !p.isBuiltIn || p.isFavorite);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.error('Failed to save presets:', err);
  }
}

// ============================================================================
// Preset Card Component
// ============================================================================

interface PresetCardProps {
  preset: Preset;
  onApply: () => void;
  onToggleFavorite: () => void;
  onDelete?: () => void;
  onDuplicate: () => void;
}

const PresetCard: React.FC<PresetCardProps> = ({
  preset,
  onApply,
  onToggleFavorite,
  onDelete,
  onDuplicate,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-slate-800/60 rounded-lg border border-slate-700/50 hover:border-slate-600 overflow-hidden transition-colors"
    >
      {/* Thumbnail/Preview */}
      <div className="aspect-video bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-slate-600" />
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-slate-200 truncate">{preset.name}</h4>
            {preset.description && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{preset.description}</p>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={cn(
              'p-1 transition-colors',
              preset.isFavorite
                ? 'text-yellow-500 hover:text-yellow-400'
                : 'text-slate-500 hover:text-yellow-500'
            )}
          >
            {preset.isFavorite ? (
              <Star className="w-4 h-4 fill-current" />
            ) : (
              <StarOff className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Tags */}
        {preset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {preset.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-[10px] bg-slate-700/50 text-slate-400 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 mt-3">
          <button
            onClick={onApply}
            className="flex-1 px-2 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
          >
            Apply
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
            title="Duplicate preset"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          {onDelete && !preset.isBuiltIn && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
              title="Delete preset"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Built-in badge */}
      {preset.isBuiltIn && (
        <div className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] bg-slate-900/80 text-slate-400 rounded">
          Built-in
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// Save Preset Dialog
// ============================================================================

interface SavePresetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string, category: PresetCategory, tags: string[]) => void;
}

const SavePresetDialog: React.FC<SavePresetDialogProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PresetCategory>('custom');
  const [tagsInput, setTagsInput] = useState('');

  const handleSave = useCallback(() => {
    if (!name.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    onSave(name.trim(), description.trim(), category, tags);
    setName('');
    setDescription('');
    setCategory('custom');
    setTagsInput('');
    onClose();
  }, [name, description, category, tagsInput, onSave, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-slate-800 rounded-xl border border-slate-700 shadow-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-200">Save Preset</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Preset"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this preset..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PresetCategory)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PRESET_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="warm, portrait, soft"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
          >
            <Check className="w-4 h-4" />
            Save Preset
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const PresetManager: React.FC<PresetManagerProps> = ({
  currentLayers,
  onApplyPreset,
  onBatchApply,
}) => {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PresetCategory | 'all' | 'favorites'>('all');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'popular'>('name');

  // Load presets on mount
  useEffect(() => {
    const loaded = loadPresets();

    // Merge with built-in presets
    const builtInIds = new Set(loaded.filter((p) => p.isBuiltIn).map((p) => p.id));
    const customPresets = loaded.filter((p) => !p.isBuiltIn);

    const allBuiltIns = BUILT_IN_PRESETS.map((preset, index) => {
      const existingId = `builtin_${index}`;
      const existing = loaded.find((p) => p.id === existingId);
      return {
        ...preset,
        id: existingId,
        isFavorite: existing?.isFavorite || false,
        createdAt: existing?.createdAt || new Date(),
        updatedAt: existing?.updatedAt || new Date(),
        usageCount: existing?.usageCount || 0,
      };
    });

    setPresets([...allBuiltIns, ...customPresets]);
  }, []);

  // Save presets when changed
  useEffect(() => {
    if (presets.length > 0) {
      savePresets(presets);
    }
  }, [presets]);

  const filteredPresets = useMemo(() => {
    let filtered = presets;

    // Category filter
    if (selectedCategory === 'favorites') {
      filtered = filtered.filter((p) => p.isFavorite);
    } else if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.tags.some((t) => t.includes(query))
      );
    }

    // Sort
    switch (sortBy) {
      case 'recent':
        filtered = [...filtered].sort(
          (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
        );
        break;
      case 'popular':
        filtered = [...filtered].sort((a, b) => b.usageCount - a.usageCount);
        break;
      case 'name':
      default:
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return filtered;
  }, [presets, selectedCategory, searchQuery, sortBy]);

  const handleSavePreset = useCallback(
    (name: string, description: string, category: PresetCategory, tags: string[]) => {
      const newPreset: Preset = {
        id: `preset_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        name,
        description: description || undefined,
        category,
        tags,
        layers: currentLayers.map((layer, index) => ({
          ...layer,
          id: `preset_layer_${Date.now()}_${index}`,
          order: index,
        })),
        isFavorite: false,
        isBuiltIn: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
      };

      setPresets((prev) => [...prev, newPreset]);
    },
    [currentLayers]
  );

  const handleApplyPreset = useCallback(
    (preset: Preset) => {
      // Generate new IDs for the layers
      const newLayers = preset.layers.map((layer, index) => ({
        ...layer,
        id: `layer_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 9)}`,
        order: index,
      }));

      onApplyPreset(newLayers);

      // Update usage count
      setPresets((prev) =>
        prev.map((p) =>
          p.id === preset.id
            ? { ...p, usageCount: p.usageCount + 1, updatedAt: new Date() }
            : p
        )
      );
    },
    [onApplyPreset]
  );

  const handleToggleFavorite = useCallback((presetId: string) => {
    setPresets((prev) =>
      prev.map((p) =>
        p.id === presetId ? { ...p, isFavorite: !p.isFavorite, updatedAt: new Date() } : p
      )
    );
  }, []);

  const handleDeletePreset = useCallback((presetId: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== presetId));
  }, []);

  const handleDuplicatePreset = useCallback((preset: Preset) => {
    const duplicate: Preset = {
      ...preset,
      id: `preset_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      name: `${preset.name} (Copy)`,
      isBuiltIn: false,
      isFavorite: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      layers: preset.layers.map((layer, index) => ({
        ...layer,
        id: `preset_layer_${Date.now()}_${index}`,
      })),
    };

    setPresets((prev) => [...prev, duplicate]);
  }, []);

  const handleExportPresets = useCallback(() => {
    const data = JSON.stringify(presets.filter((p) => !p.isBuiltIn), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presets_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [presets]);

  const handleImportPresets = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const imported = JSON.parse(text) as Preset[];

        // Validate and sanitize imported presets
        const validPresets = imported
          .filter((p) => p.name && p.layers && Array.isArray(p.layers))
          .map((p) => ({
            ...p,
            id: `imported_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            isBuiltIn: false,
            createdAt: new Date(p.createdAt || Date.now()),
            updatedAt: new Date(),
            usageCount: 0,
          }));

        setPresets((prev) => [...prev, ...validPresets]);
      } catch (err) {
        console.error('Failed to import presets:', err);
      }
    };
    input.click();
  }, []);

  return (
    <div className="h-full flex flex-col bg-slate-900/50">
      {/* Header */}
      <div className="p-3 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-200">Presets</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleExportPresets}
              className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
              title="Export presets"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleImportPresets}
              className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
              title="Import presets"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowSaveDialog(true)}
              disabled={currentLayers.length === 0}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Save
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search presets..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as PresetCategory | 'all' | 'favorites')}
            className="flex-1 px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="favorites">Favorites</option>
            {PRESET_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'recent' | 'popular')}
            className="px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="name">Name</option>
            <option value="recent">Recent</option>
            <option value="popular">Popular</option>
          </select>
        </div>
      </div>

      {/* Preset Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredPresets.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm text-slate-500">No presets found</p>
            {searchQuery && (
              <p className="text-xs text-slate-600 mt-1">Try a different search term</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {filteredPresets.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  onApply={() => handleApplyPreset(preset)}
                  onToggleFavorite={() => handleToggleFavorite(preset.id)}
                  onDelete={preset.isBuiltIn ? undefined : () => handleDeletePreset(preset.id)}
                  onDuplicate={() => handleDuplicatePreset(preset)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Save Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <SavePresetDialog
            isOpen={showSaveDialog}
            onClose={() => setShowSaveDialog(false)}
            onSave={handleSavePreset}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PresetManager;
