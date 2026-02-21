/**
 * StyleDefinition - Configure project-wide visual style for character consistency
 * Design: Clean Manuscript style with cyan accents
 *
 * Provides art direction presets, color palette enforcement, and style constraints
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Sun,
  Paintbrush,
  Image,
  Settings,
  Plus,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Save,
  RotateCcw,
  Sparkles,
  Eye,
  Copy,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import {
  type StyleDefinition as StyleDefinitionType,
  type ArtDirection,
  type ColorPaletteConstraint,
  type LightingConstraint,
  type ConsistencyLevel,
  type LightingConsistency,
  type StyleReferenceImage,
  ART_DIRECTION_PRESETS,
  DEFAULT_COLOR_PALETTE,
  DEFAULT_LIGHTING,
  createStyleDefinition,
} from '../lib/styleEngine';

// ============================================================================
// Types
// ============================================================================

export interface StyleDefinitionProps {
  initialDefinition?: StyleDefinitionType;
  onSave?: (definition: StyleDefinitionType) => void;
  onChange?: (definition: StyleDefinitionType) => void;
  disabled?: boolean;
  compact?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const ART_DIRECTION_OPTIONS: Array<{ id: ArtDirection; label: string; description: string }> = [
  { id: 'anime', label: 'Anime', description: 'Japanese animation style' },
  { id: 'realistic', label: 'Realistic', description: 'Photorealistic portraits' },
  { id: 'painterly', label: 'Painterly', description: 'Oil painting aesthetic' },
  { id: 'comic', label: 'Comic', description: 'Western comic book style' },
  { id: 'semi-realistic', label: 'Semi-Realistic', description: 'Stylized realism' },
  { id: 'pixel', label: 'Pixel Art', description: 'Retro gaming aesthetic' },
  { id: 'chibi', label: 'Chibi', description: 'Cute, super deformed' },
  { id: 'watercolor', label: 'Watercolor', description: 'Soft, flowing colors' },
  { id: 'sketch', label: 'Sketch', description: 'Pencil drawing style' },
  { id: 'custom', label: 'Custom', description: 'Define your own style' },
];

const CONSISTENCY_LEVELS: Array<{ id: ConsistencyLevel; label: string; description: string }> = [
  { id: 'strict', label: 'Strict', description: 'Exact style matching enforced' },
  { id: 'moderate', label: 'Moderate', description: 'Allow minor variations' },
  { id: 'loose', label: 'Loose', description: 'Flexible style guidelines' },
];

const LIGHTING_CONSISTENCY_OPTIONS: Array<{ id: LightingConsistency; label: string; description: string }> = [
  { id: 'same', label: 'Identical', description: 'Same lighting for all' },
  { id: 'similar', label: 'Similar', description: 'Consistent type, slight variations' },
  { id: 'thematic', label: 'Thematic', description: 'Based on character role' },
  { id: 'custom', label: 'Custom', description: 'Per-character control' },
];

const PRESET_PALETTES: Array<{ name: string; colors: string[] }> = [
  { name: 'Warm Fantasy', colors: ['#8B4513', '#CD853F', '#DEB887', '#F4A460', '#D2691E'] },
  { name: 'Cool Sci-Fi', colors: ['#1E3A5F', '#2E5E88', '#4A90B8', '#6BB3D9', '#A8D8EA'] },
  { name: 'Dark Fantasy', colors: ['#1A1A2E', '#16213E', '#0F3460', '#533483', '#7B2869'] },
  { name: 'Vibrant Anime', colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'] },
  { name: 'Muted Earth', colors: ['#5C4033', '#8B7355', '#A0826D', '#C4A77D', '#E6D5B8'] },
  { name: 'Pastel Dream', colors: ['#FFB5E8', '#B5DEFF', '#D5B5FF', '#FFDBB5', '#B5FFD5'] },
];

// ============================================================================
// Subcomponents
// ============================================================================

interface ColorPickerProps {
  colors: string[];
  onChange: (colors: string[]) => void;
  maxColors?: number;
  label: string;
  disabled?: boolean;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  colors,
  onChange,
  maxColors = 6,
  label,
  disabled = false,
}) => {
  const addColor = () => {
    if (colors.length < maxColors) {
      onChange([...colors, '#808080']);
    }
  };

  const removeColor = (index: number) => {
    onChange(colors.filter((_, i) => i !== index));
  };

  const updateColor = (index: number, color: string) => {
    const newColors = [...colors];
    newColors[index] = color;
    onChange(newColors);
  };

  return (
    <div className="space-y-2">
      <label className="font-mono text-[10px] text-slate-500 uppercase block">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {colors.map((color, index) => (
          <div key={index} className="relative group">
            <input
              type="color"
              value={color}
              onChange={(e) => updateColor(index, e.target.value)}
              disabled={disabled}
              className="w-8 h-8 rounded border border-slate-700 cursor-pointer"
            />
            {!disabled && (
              <button
                onClick={() => removeColor(index)}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white
                           flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}
        {colors.length < maxColors && !disabled && (
          <button
            onClick={addColor}
            className="w-8 h-8 rounded border-2 border-dashed border-slate-600
                       flex items-center justify-center text-slate-500 hover:border-cyan-500 hover:text-cyan-400
                       transition-colors"
          >
            <Plus size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const StyleDefinition: React.FC<StyleDefinitionProps> = ({
  initialDefinition,
  onSave,
  onChange,
  disabled = false,
  compact = false,
}) => {
  // Initialize with provided definition or create a new one
  const [definition, setDefinition] = useState<StyleDefinitionType>(
    initialDefinition || createStyleDefinition('Project Style', 'semi-realistic')
  );

  const [expandedSection, setExpandedSection] = useState<string | null>(
    compact ? null : 'artDirection'
  );

  const [showPresetPalettes, setShowPresetPalettes] = useState(false);

  // Update definition and notify parent
  const updateDefinition = useCallback(
    (updates: Partial<StyleDefinitionType>) => {
      const newDefinition = {
        ...definition,
        ...updates,
        updatedAt: new Date().toISOString(),
        version: definition.version + 1,
      };
      setDefinition(newDefinition);
      onChange?.(newDefinition);
    },
    [definition, onChange]
  );

  // Update nested color palette
  const updateColorPalette = useCallback(
    (updates: Partial<ColorPaletteConstraint>) => {
      updateDefinition({
        colorPalette: { ...definition.colorPalette, ...updates },
      });
    },
    [definition.colorPalette, updateDefinition]
  );

  // Update nested lighting
  const updateLighting = useCallback(
    (updates: Partial<LightingConstraint>) => {
      updateDefinition({
        lighting: { ...definition.lighting, ...updates },
      });
    },
    [definition.lighting, updateDefinition]
  );

  // Apply art direction preset
  const applyArtDirectionPreset = useCallback(
    (artDirection: ArtDirection) => {
      const preset = ART_DIRECTION_PRESETS[artDirection];
      updateDefinition({
        artDirection,
        stylePromptPrefix: preset.stylePromptPrefix || '',
        stylePromptSuffix: preset.stylePromptSuffix || '',
        negativePrompt: preset.negativePrompt || '',
        styleKeywords: preset.styleKeywords || [],
        avoidKeywords: preset.avoidKeywords || [],
        artisticInfluences: preset.artisticInfluences || [],
      });
    },
    [updateDefinition]
  );

  // Apply preset palette
  const applyPresetPalette = useCallback(
    (palette: { name: string; colors: string[] }) => {
      updateColorPalette({
        primaryColors: palette.colors.slice(0, 3),
        secondaryColors: palette.colors.slice(3, 5),
        accentColors: palette.colors.length > 5 ? [palette.colors[5]] : [],
      });
      setShowPresetPalettes(false);
    },
    [updateColorPalette]
  );

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    const newDefinition = createStyleDefinition('Project Style', definition.artDirection);
    setDefinition(newDefinition);
    onChange?.(newDefinition);
  }, [definition.artDirection, onChange]);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Get current preset info
  const currentPreset = useMemo(() => {
    return ART_DIRECTION_OPTIONS.find(o => o.id === definition.artDirection);
  }, [definition.artDirection]);

  if (compact) {
    return (
      <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <h3 className="font-mono text-xs uppercase tracking-wide text-slate-300">
              style
            </h3>
          </div>
        </div>

        {/* Quick art direction selector */}
        <div className="flex flex-wrap gap-1.5">
          {ART_DIRECTION_OPTIONS.slice(0, 5).map((option) => {
            const isSelected = option.id === definition.artDirection;
            return (
              <button
                key={option.id}
                onClick={() => applyArtDirectionPreset(option.id)}
                disabled={disabled}
                className={cn(
                  'px-2 py-1 rounded text-[10px] font-mono transition-all',
                  isSelected
                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400'
                    : 'bg-slate-800/40 border border-slate-700/50 text-slate-500 hover:border-slate-600',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
            style_definition
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetToDefaults}
            disabled={disabled}
            className="p-1.5 rounded bg-slate-800/40 hover:bg-slate-700/60 text-slate-400 transition-colors disabled:opacity-50"
            title="Reset to defaults"
          >
            <RotateCcw size={14} />
          </button>
          {onSave && (
            <button
              onClick={() => onSave(definition)}
              disabled={disabled}
              className="flex items-center gap-1 px-2 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30
                         text-cyan-400 text-xs font-mono transition-colors disabled:opacity-50"
            >
              <Save size={12} />
              <span>Save</span>
            </button>
          )}
        </div>
      </div>

      {/* Style Name */}
      <div className="mb-4">
        <label className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
          style_name
        </label>
        <input
          type="text"
          value={definition.name}
          onChange={(e) => updateDefinition({ name: e.target.value })}
          disabled={disabled}
          placeholder="Enter style name..."
          className="w-full px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-lg
                     font-mono text-sm text-slate-300 placeholder:text-slate-600
                     focus:outline-none focus:ring-1 focus:ring-cyan-500/50
                     disabled:opacity-50"
        />
      </div>

      {/* Art Direction Section */}
      <div className="mb-3">
        <button
          onClick={() => toggleSection('artDirection')}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Paintbrush size={14} className="text-cyan-400" />
            <span className="font-mono text-xs text-slate-300">
              Art Direction: {currentPreset?.label}
            </span>
          </div>
          {expandedSection === 'artDirection' ? (
            <ChevronUp size={14} className="text-slate-500" />
          ) : (
            <ChevronDown size={14} className="text-slate-500" />
          )}
        </button>

        <AnimatePresence>
          {expandedSection === 'artDirection' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 p-3 bg-slate-800/20 rounded-lg border border-slate-700/30"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {ART_DIRECTION_OPTIONS.map((option) => {
                  const isSelected = option.id === definition.artDirection;
                  return (
                    <button
                      key={option.id}
                      onClick={() => applyArtDirectionPreset(option.id)}
                      disabled={disabled}
                      className={cn(
                        'flex flex-col items-start p-2 rounded-lg border transition-all text-left',
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-500/40'
                          : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600',
                        disabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <span className={cn(
                        'font-mono text-xs',
                        isSelected ? 'text-cyan-400' : 'text-slate-300'
                      )}>
                        {option.label}
                      </span>
                      <span className="font-mono text-[9px] text-slate-500 line-clamp-1">
                        {option.description}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Style Keywords */}
              <div className="mb-3">
                <label className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
                  style_keywords
                </label>
                <div className="flex flex-wrap gap-1">
                  {definition.styleKeywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded
                                 text-[10px] font-mono text-cyan-400"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* Artistic Influences */}
              <div>
                <label className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
                  artistic_influences
                </label>
                <div className="flex flex-wrap gap-1">
                  {definition.artisticInfluences.map((influence, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 rounded
                                 text-[10px] font-mono text-purple-400"
                    >
                      {influence}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Color Palette Section */}
      <div className="mb-3">
        <button
          onClick={() => toggleSection('colorPalette')}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Palette size={14} className="text-cyan-400" />
            <span className="font-mono text-xs text-slate-300">Color Palette</span>
            <div className="flex gap-0.5">
              {definition.colorPalette.primaryColors.slice(0, 3).map((color, i) => (
                <span
                  key={i}
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          {expandedSection === 'colorPalette' ? (
            <ChevronUp size={14} className="text-slate-500" />
          ) : (
            <ChevronDown size={14} className="text-slate-500" />
          )}
        </button>

        <AnimatePresence>
          {expandedSection === 'colorPalette' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 p-3 bg-slate-800/20 rounded-lg border border-slate-700/30 space-y-4"
            >
              {/* Preset Palettes */}
              <div className="relative">
                <button
                  onClick={() => setShowPresetPalettes(!showPresetPalettes)}
                  className="flex items-center gap-2 px-2 py-1 rounded bg-slate-700/50 hover:bg-slate-700
                             text-xs font-mono text-slate-300 transition-colors"
                >
                  <Sparkles size={12} />
                  <span>Preset Palettes</span>
                  <ChevronDown size={12} className={cn(
                    'transition-transform',
                    showPresetPalettes && 'rotate-180'
                  )} />
                </button>

                {showPresetPalettes && (
                  <div className="absolute top-full left-0 mt-1 p-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 min-w-48">
                    {PRESET_PALETTES.map((palette) => (
                      <button
                        key={palette.name}
                        onClick={() => applyPresetPalette(palette)}
                        className="w-full flex items-center gap-2 p-2 rounded hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex gap-0.5">
                          {palette.colors.map((color, i) => (
                            <span
                              key={i}
                              className="w-4 h-4 rounded-sm"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <span className="font-mono text-xs text-slate-300">{palette.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <ColorPicker
                colors={definition.colorPalette.primaryColors}
                onChange={(colors) => updateColorPalette({ primaryColors: colors })}
                label="Primary Colors"
                maxColors={4}
                disabled={disabled}
              />

              <ColorPicker
                colors={definition.colorPalette.secondaryColors}
                onChange={(colors) => updateColorPalette({ secondaryColors: colors })}
                label="Secondary Colors"
                maxColors={4}
                disabled={disabled}
              />

              <ColorPicker
                colors={definition.colorPalette.accentColors}
                onChange={(colors) => updateColorPalette({ accentColors: colors })}
                label="Accent Colors"
                maxColors={2}
                disabled={disabled}
              />

              {/* Saturation/Brightness Ranges */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
                    saturation: {definition.colorPalette.saturationRange[0]}-{definition.colorPalette.saturationRange[1]}%
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={definition.colorPalette.saturationRange[0]}
                      onChange={(e) => updateColorPalette({
                        saturationRange: [Number(e.target.value), definition.colorPalette.saturationRange[1]],
                      })}
                      disabled={disabled}
                      className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                                 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
                    />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={definition.colorPalette.saturationRange[1]}
                      onChange={(e) => updateColorPalette({
                        saturationRange: [definition.colorPalette.saturationRange[0], Number(e.target.value)],
                      })}
                      disabled={disabled}
                      className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                                 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
                    brightness: {definition.colorPalette.brightnessRange[0]}-{definition.colorPalette.brightnessRange[1]}%
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={definition.colorPalette.brightnessRange[0]}
                      onChange={(e) => updateColorPalette({
                        brightnessRange: [Number(e.target.value), definition.colorPalette.brightnessRange[1]],
                      })}
                      disabled={disabled}
                      className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                                 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
                    />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={definition.colorPalette.brightnessRange[1]}
                      onChange={(e) => updateColorPalette({
                        brightnessRange: [definition.colorPalette.brightnessRange[0], Number(e.target.value)],
                      })}
                      disabled={disabled}
                      className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                                 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lighting Section */}
      <div className="mb-3">
        <button
          onClick={() => toggleSection('lighting')}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sun size={14} className="text-cyan-400" />
            <span className="font-mono text-xs text-slate-300">
              Lighting: {definition.lighting.type}
            </span>
          </div>
          {expandedSection === 'lighting' ? (
            <ChevronUp size={14} className="text-slate-500" />
          ) : (
            <ChevronDown size={14} className="text-slate-500" />
          )}
        </button>

        <AnimatePresence>
          {expandedSection === 'lighting' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 p-3 bg-slate-800/20 rounded-lg border border-slate-700/30 space-y-4"
            >
              {/* Lighting Type */}
              <div>
                <label className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
                  lighting_type
                </label>
                <select
                  value={definition.lighting.type}
                  onChange={(e) => updateLighting({ type: e.target.value })}
                  disabled={disabled}
                  className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg
                             font-mono text-xs text-slate-300
                             focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                >
                  <option value="natural">Natural</option>
                  <option value="dramatic">Dramatic</option>
                  <option value="soft">Soft</option>
                  <option value="cinematic">Cinematic</option>
                  <option value="rim">Rim Lighting</option>
                  <option value="ambient">Ambient</option>
                </select>
              </div>

              {/* Lighting Direction */}
              <div>
                <label className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
                  direction
                </label>
                <select
                  value={definition.lighting.direction}
                  onChange={(e) => updateLighting({ direction: e.target.value })}
                  disabled={disabled}
                  className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg
                             font-mono text-xs text-slate-300
                             focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                >
                  <option value="front">Front</option>
                  <option value="side">Side</option>
                  <option value="back">Back</option>
                  <option value="three-point">Three-Point</option>
                  <option value="rembrandt">Rembrandt</option>
                </select>
              </div>

              {/* Shadow Style */}
              <div>
                <label className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
                  shadow_style
                </label>
                <div className="flex gap-2">
                  {(['soft', 'hard', 'ambient'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => updateLighting({ shadowStyle: style })}
                      disabled={disabled}
                      className={cn(
                        'flex-1 px-2 py-1.5 rounded font-mono text-xs transition-colors',
                        definition.lighting.shadowStyle === style
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'bg-slate-800/40 text-slate-500 hover:bg-slate-700/60'
                      )}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Highlight Strength */}
              <div>
                <label className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
                  highlight_strength: {definition.lighting.highlightStrength}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={definition.lighting.highlightStrength}
                  onChange={(e) => updateLighting({ highlightStrength: Number(e.target.value) })}
                  disabled={disabled}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                             [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Consistency Settings Section */}
      <div className="mb-3">
        <button
          onClick={() => toggleSection('consistency')}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings size={14} className="text-cyan-400" />
            <span className="font-mono text-xs text-slate-300">
              Consistency: {definition.consistencyLevel}
            </span>
          </div>
          {expandedSection === 'consistency' ? (
            <ChevronUp size={14} className="text-slate-500" />
          ) : (
            <ChevronDown size={14} className="text-slate-500" />
          )}
        </button>

        <AnimatePresence>
          {expandedSection === 'consistency' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 p-3 bg-slate-800/20 rounded-lg border border-slate-700/30 space-y-4"
            >
              {/* Consistency Level */}
              <div>
                <label className="font-mono text-[10px] text-slate-500 uppercase block mb-2">
                  consistency_level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CONSISTENCY_LEVELS.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => updateDefinition({ consistencyLevel: level.id })}
                      disabled={disabled}
                      className={cn(
                        'flex flex-col items-center p-2 rounded-lg border transition-all',
                        definition.consistencyLevel === level.id
                          ? 'bg-cyan-500/20 border-cyan-500/40'
                          : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
                      )}
                    >
                      <span className={cn(
                        'font-mono text-xs',
                        definition.consistencyLevel === level.id ? 'text-cyan-400' : 'text-slate-300'
                      )}>
                        {level.label}
                      </span>
                      <span className="font-mono text-[8px] text-slate-500 text-center">
                        {level.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Lighting Consistency */}
              <div>
                <label className="font-mono text-[10px] text-slate-500 uppercase block mb-2">
                  lighting_consistency
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {LIGHTING_CONSISTENCY_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => updateDefinition({ lightingConsistency: option.id })}
                      disabled={disabled}
                      className={cn(
                        'flex flex-col items-start p-2 rounded-lg border transition-all text-left',
                        definition.lightingConsistency === option.id
                          ? 'bg-cyan-500/20 border-cyan-500/40'
                          : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
                      )}
                    >
                      <span className={cn(
                        'font-mono text-xs',
                        definition.lightingConsistency === option.id ? 'text-cyan-400' : 'text-slate-300'
                      )}>
                        {option.label}
                      </span>
                      <span className="font-mono text-[8px] text-slate-500">
                        {option.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Prompt Preview */}
      <div className="mt-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] text-slate-500 uppercase">
            prompt_preview
          </span>
          <button
            onClick={() => {
              const text = `${definition.stylePromptPrefix} [character description] ${definition.stylePromptSuffix}`;
              navigator.clipboard.writeText(text);
            }}
            className="p-1 rounded hover:bg-slate-700/50 text-slate-500 transition-colors"
            title="Copy prompt"
          >
            <Copy size={12} />
          </button>
        </div>
        <p className="font-mono text-[10px] text-slate-400 leading-relaxed">
          <span className="text-cyan-400">{definition.stylePromptPrefix}</span>
          {' [character description] '}
          <span className="text-cyan-400">{definition.stylePromptSuffix}</span>
        </p>
        {definition.negativePrompt && (
          <p className="font-mono text-[10px] text-red-400/70 mt-2">
            Avoid: {definition.negativePrompt}
          </p>
        )}
      </div>
    </div>
  );
};

export default StyleDefinition;
