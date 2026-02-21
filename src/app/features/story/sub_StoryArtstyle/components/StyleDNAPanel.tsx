/**
 * StyleDNAPanel Component
 *
 * Comprehensive UI for managing Style DNA configurations including
 * color palettes, lighting, textures, composition, and mood settings.
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dna,
  Palette,
  Sun,
  Layers,
  Layout,
  Heart,
  Wand2,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/UI/Button';
import { Label } from '@/app/components/UI/Label';
import {
  styleDNA,
  colorTheory,
  styleInjector,
  type StyleDNAConfig,
  type LightingType,
  type LightingDirection,
  type TimeOfDay,
  type TextureStyle,
  type CompositionType,
  type AspectRatio,
  type DepthOfField,
  type ColorHarmony,
} from '@/lib/style';

// ============================================================================
// Types
// ============================================================================

interface StyleDNAPanelProps {
  projectId: string;
  onStyleChange?: (config: StyleDNAConfig | null) => void;
  disabled?: boolean;
}

type SectionId = 'color' | 'lighting' | 'texture' | 'composition' | 'mood' | 'keywords';

// ============================================================================
// Option Data
// ============================================================================

const LIGHTING_TYPES: { value: LightingType; label: string }[] = [
  { value: 'natural', label: 'Natural' },
  { value: 'dramatic', label: 'Dramatic' },
  { value: 'soft', label: 'Soft' },
  { value: 'harsh', label: 'Harsh' },
  { value: 'ambient', label: 'Ambient' },
  { value: 'rim', label: 'Rim' },
  { value: 'volumetric', label: 'Volumetric' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'noir', label: 'Noir' },
];

const LIGHTING_DIRECTIONS: { value: LightingDirection; label: string }[] = [
  { value: 'front', label: 'Front' },
  { value: 'side', label: 'Side' },
  { value: 'back', label: 'Back' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'three-point', label: 'Three-Point' },
  { value: 'rembrandt', label: 'Rembrandt' },
];

const TIME_OF_DAY: { value: TimeOfDay; label: string }[] = [
  { value: 'dawn', label: 'Dawn' },
  { value: 'morning', label: 'Morning' },
  { value: 'noon', label: 'Noon' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'golden-hour', label: 'Golden Hour' },
  { value: 'dusk', label: 'Dusk' },
  { value: 'night', label: 'Night' },
  { value: 'midnight', label: 'Midnight' },
];

const TEXTURE_STYLES: { value: TextureStyle; label: string }[] = [
  { value: 'smooth', label: 'Smooth' },
  { value: 'rough', label: 'Rough' },
  { value: 'organic', label: 'Organic' },
  { value: 'geometric', label: 'Geometric' },
  { value: 'painterly', label: 'Painterly' },
  { value: 'digital', label: 'Digital' },
  { value: 'film-grain', label: 'Film Grain' },
  { value: 'watercolor', label: 'Watercolor' },
  { value: 'oil-paint', label: 'Oil Paint' },
  { value: 'pencil-sketch', label: 'Pencil Sketch' },
];

const COMPOSITION_TYPES: { value: CompositionType; label: string }[] = [
  { value: 'rule-of-thirds', label: 'Rule of Thirds' },
  { value: 'golden-ratio', label: 'Golden Ratio' },
  { value: 'centered', label: 'Centered' },
  { value: 'diagonal', label: 'Diagonal' },
  { value: 'symmetrical', label: 'Symmetrical' },
  { value: 'asymmetrical', label: 'Asymmetrical' },
  { value: 'framing', label: 'Framing' },
  { value: 'leading-lines', label: 'Leading Lines' },
];

const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: '1:1 Square' },
  { value: '4:3', label: '4:3 Standard' },
  { value: '16:9', label: '16:9 Widescreen' },
  { value: '2.35:1', label: '2.35:1 Cinematic' },
  { value: '9:16', label: '9:16 Portrait' },
  { value: '3:2', label: '3:2 Classic' },
];

const DEPTH_OF_FIELD: { value: DepthOfField; label: string }[] = [
  { value: 'deep', label: 'Deep Focus' },
  { value: 'shallow', label: 'Shallow' },
  { value: 'selective', label: 'Selective' },
  { value: 'tilt-shift', label: 'Tilt-Shift' },
];

const COLOR_HARMONIES: { value: ColorHarmony; label: string }[] = [
  { value: 'monochromatic', label: 'Monochromatic' },
  { value: 'complementary', label: 'Complementary' },
  { value: 'analogous', label: 'Analogous' },
  { value: 'triadic', label: 'Triadic' },
  { value: 'split-complementary', label: 'Split-Comp' },
  { value: 'tetradic', label: 'Tetradic' },
  { value: 'custom', label: 'Custom' },
];

// ============================================================================
// Sub-Components
// ============================================================================

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

function Slider({ label, value, onChange, min = 0, max = 100, disabled }: SliderProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400">{label}</span>
        <span className="text-[10px] text-slate-500 font-mono">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={disabled}
        className={cn(
          'w-full h-1.5 rounded-full appearance-none cursor-pointer',
          'bg-slate-700',
          '[&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3',
          '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500',
          '[&::-webkit-slider-thumb]:cursor-pointer',
          '[&::-webkit-slider-thumb]:transition-transform',
          '[&::-webkit-slider-thumb]:hover:scale-125',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      />
    </div>
  );
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}

function Select({ value, onChange, options, disabled }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        'w-full px-2 py-1.5 text-xs rounded-md',
        'bg-slate-800/60 border border-slate-700',
        'text-slate-200',
        'focus:outline-none focus:ring-1 focus:ring-cyan-500/50',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function ColorInput({ label, value, onChange, disabled }: ColorInputProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value || '#3b82f6'}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          'w-8 h-8 rounded cursor-pointer',
          'border border-slate-700',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      />
      <div className="flex-1">
        <span className="text-[10px] text-slate-400">{label}</span>
        <span className="text-[10px] text-slate-500 font-mono block">{value}</span>
      </div>
    </div>
  );
}

interface SectionProps {
  id: SectionId;
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({ id, title, icon, isExpanded, onToggle, children }: SectionProps) {
  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2',
          'bg-slate-800/30 hover:bg-slate-800/50 transition-colors',
          'text-left'
        )}
      >
        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
        )}
        <span className="text-cyan-400">{icon}</span>
        <span className="text-xs font-medium text-slate-200">{title}</span>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-3 border-t border-slate-800">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function StyleDNAPanel({ projectId, onStyleChange, disabled = false }: StyleDNAPanelProps) {
  const [activeConfig, setActiveConfig] = useState<StyleDNAConfig | null>(
    () => styleDNA.getActiveConfig() || null
  );
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(
    new Set(['color', 'lighting'])
  );
  const [showPreview, setShowPreview] = useState(true);
  const [copied, setCopied] = useState(false);

  const presets = useMemo(() => styleDNA.getPresets(), []);

  const toggleSection = useCallback((section: SectionId) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  const handleCreateFromPreset = useCallback(
    (presetId: string) => {
      const config = styleDNA.createFromPreset(presetId);
      if (config) {
        styleDNA.setActiveConfig(config.id);
        setActiveConfig(config);
        onStyleChange?.(config);
      }
    },
    [onStyleChange]
  );

  const handleCreateNew = useCallback(() => {
    const config = styleDNA.createConfig('New Style');
    styleDNA.setActiveConfig(config.id);
    setActiveConfig(config);
    onStyleChange?.(config);
  }, [onStyleChange]);

  const handleUpdateConfig = useCallback(
    (updates: Partial<StyleDNAConfig>) => {
      if (!activeConfig) return;

      const updated = styleDNA.updateConfig(activeConfig.id, updates);
      if (updated) {
        setActiveConfig(updated);
        onStyleChange?.(updated);
      }
    },
    [activeConfig, onStyleChange]
  );

  const handleDeleteConfig = useCallback(() => {
    if (!activeConfig) return;

    styleDNA.deleteConfig(activeConfig.id);
    styleDNA.setActiveConfig(null);
    setActiveConfig(null);
    onStyleChange?.(null);
  }, [activeConfig, onStyleChange]);

  const handleCopyPreview = useCallback(async () => {
    if (!activeConfig) return;

    const preview = styleInjector.previewInjection(activeConfig);
    try {
      await navigator.clipboard.writeText(preview);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = preview;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [activeConfig]);

  const previewText = useMemo(() => {
    if (!activeConfig) return '';
    return styleInjector.previewInjection(activeConfig);
  }, [activeConfig]);

  // -------------------------------------------------------------------------
  // Render: No Active Config
  // -------------------------------------------------------------------------

  if (!activeConfig) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Dna className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-slate-200">Style DNA</span>
        </div>

        <p className="text-xs text-slate-400">
          Create a Style DNA profile to automatically apply consistent visual style across all your
          story&apos;s generated images.
        </p>

        <div className="space-y-2">
          <Label className="text-xs text-slate-400">Start from a preset:</Label>
          <div className="grid grid-cols-2 gap-2">
            {presets.slice(0, 4).map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleCreateFromPreset(preset.id)}
                disabled={disabled}
                className={cn(
                  'px-3 py-2 text-xs rounded-md text-left',
                  'bg-slate-800/50 border border-slate-700',
                  'hover:bg-slate-800 hover:border-cyan-500/30',
                  'transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <Sparkles className="w-3 h-3 text-cyan-400 inline mr-1.5" />
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="flex-1 h-px bg-slate-800" />
          <span>or</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        <Button
          onClick={handleCreateNew}
          disabled={disabled}
          variant="secondary"
          size="sm"
          className="w-full"
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          Create Custom Style DNA
        </Button>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Active Config
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Dna className="w-4 h-4 text-cyan-400" />
          <input
            type="text"
            value={activeConfig.name}
            onChange={(e) => handleUpdateConfig({ name: e.target.value })}
            disabled={disabled}
            className={cn(
              'bg-transparent text-sm font-semibold text-slate-200',
              'focus:outline-none focus:ring-1 focus:ring-cyan-500/50 rounded px-1',
              'disabled:opacity-50'
            )}
          />
        </div>
        <div className="flex items-center gap-1">
          <Button
            onClick={handleDeleteConfig}
            disabled={disabled}
            variant="ghost"
            size="xs"
            icon={<Trash2 className="w-3 h-3 text-red-400" />}
          />
        </div>
      </div>

      {/* Auto-inject toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs text-slate-300">Auto-inject style</span>
        </div>
        <button
          onClick={() => handleUpdateConfig({ autoInject: !activeConfig.autoInject })}
          disabled={disabled}
          className={cn(
            'w-8 h-4 rounded-full transition-colors',
            activeConfig.autoInject ? 'bg-cyan-500' : 'bg-slate-700',
            'disabled:opacity-50'
          )}
        >
          <div
            className={cn(
              'w-3 h-3 rounded-full bg-white shadow transition-transform',
              activeConfig.autoInject ? 'translate-x-4' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>

      {/* Injection Strength */}
      <Slider
        label="Injection Strength"
        value={activeConfig.injectionStrength}
        onChange={(v) => handleUpdateConfig({ injectionStrength: v })}
        disabled={disabled}
      />

      {/* Sections */}
      <div className="space-y-2">
        {/* Color Section */}
        <Section
          id="color"
          title="Color Palette"
          icon={<Palette className="w-3.5 h-3.5" />}
          isExpanded={expandedSections.has('color')}
          onToggle={() => toggleSection('color')}
        >
          <div className="space-y-3">
            <ColorInput
              label="Primary"
              value={activeConfig.colorPalette.primary}
              onChange={(v) =>
                handleUpdateConfig({
                  colorPalette: { ...activeConfig.colorPalette, primary: v },
                })
              }
              disabled={disabled}
            />
            <ColorInput
              label="Secondary"
              value={activeConfig.colorPalette.secondary || '#6366f1'}
              onChange={(v) =>
                handleUpdateConfig({
                  colorPalette: { ...activeConfig.colorPalette, secondary: v },
                })
              }
              disabled={disabled}
            />
            <ColorInput
              label="Accent"
              value={activeConfig.colorPalette.accent || '#f59e0b'}
              onChange={(v) =>
                handleUpdateConfig({
                  colorPalette: { ...activeConfig.colorPalette, accent: v },
                })
              }
              disabled={disabled}
            />
            <div>
              <Label className="text-[10px] text-slate-400 mb-1 block">Harmony</Label>
              <Select
                value={activeConfig.colorPalette.harmony}
                onChange={(v) =>
                  handleUpdateConfig({
                    colorPalette: {
                      ...activeConfig.colorPalette,
                      harmony: v as ColorHarmony,
                    },
                  })
                }
                options={COLOR_HARMONIES}
                disabled={disabled}
              />
            </div>
          </div>
        </Section>

        {/* Lighting Section */}
        <Section
          id="lighting"
          title="Lighting"
          icon={<Sun className="w-3.5 h-3.5" />}
          isExpanded={expandedSections.has('lighting')}
          onToggle={() => toggleSection('lighting')}
        >
          <div className="space-y-3">
            <div>
              <Label className="text-[10px] text-slate-400 mb-1 block">Type</Label>
              <Select
                value={activeConfig.lighting.type}
                onChange={(v) =>
                  handleUpdateConfig({
                    lighting: { ...activeConfig.lighting, type: v as LightingType },
                  })
                }
                options={LIGHTING_TYPES}
                disabled={disabled}
              />
            </div>
            <div>
              <Label className="text-[10px] text-slate-400 mb-1 block">Direction</Label>
              <Select
                value={activeConfig.lighting.direction}
                onChange={(v) =>
                  handleUpdateConfig({
                    lighting: {
                      ...activeConfig.lighting,
                      direction: v as LightingDirection,
                    },
                  })
                }
                options={LIGHTING_DIRECTIONS}
                disabled={disabled}
              />
            </div>
            <div>
              <Label className="text-[10px] text-slate-400 mb-1 block">Time of Day</Label>
              <Select
                value={activeConfig.lighting.preferredTimeOfDay}
                onChange={(v) =>
                  handleUpdateConfig({
                    lighting: {
                      ...activeConfig.lighting,
                      preferredTimeOfDay: v as TimeOfDay,
                    },
                  })
                }
                options={TIME_OF_DAY}
                disabled={disabled}
              />
            </div>
            <Slider
              label="Intensity"
              value={activeConfig.lighting.intensity}
              onChange={(v) =>
                handleUpdateConfig({
                  lighting: { ...activeConfig.lighting, intensity: v },
                })
              }
              disabled={disabled}
            />
            <Slider
              label="Contrast"
              value={activeConfig.lighting.contrast}
              onChange={(v) =>
                handleUpdateConfig({
                  lighting: { ...activeConfig.lighting, contrast: v },
                })
              }
              disabled={disabled}
            />
          </div>
        </Section>

        {/* Texture Section */}
        <Section
          id="texture"
          title="Texture"
          icon={<Layers className="w-3.5 h-3.5" />}
          isExpanded={expandedSections.has('texture')}
          onToggle={() => toggleSection('texture')}
        >
          <div className="space-y-3">
            <div>
              <Label className="text-[10px] text-slate-400 mb-1 block">Primary Style</Label>
              <Select
                value={activeConfig.texture.primary}
                onChange={(v) =>
                  handleUpdateConfig({
                    texture: { ...activeConfig.texture, primary: v as TextureStyle },
                  })
                }
                options={TEXTURE_STYLES}
                disabled={disabled}
              />
            </div>
            <Slider
              label="Grain"
              value={activeConfig.texture.grain}
              onChange={(v) =>
                handleUpdateConfig({
                  texture: { ...activeConfig.texture, grain: v },
                })
              }
              disabled={disabled}
            />
            <Slider
              label="Detail Level"
              value={activeConfig.texture.detail}
              onChange={(v) =>
                handleUpdateConfig({
                  texture: { ...activeConfig.texture, detail: v },
                })
              }
              disabled={disabled}
            />
            <Slider
              label="Smoothness"
              value={activeConfig.texture.smoothness}
              onChange={(v) =>
                handleUpdateConfig({
                  texture: { ...activeConfig.texture, smoothness: v },
                })
              }
              disabled={disabled}
            />
          </div>
        </Section>

        {/* Composition Section */}
        <Section
          id="composition"
          title="Composition"
          icon={<Layout className="w-3.5 h-3.5" />}
          isExpanded={expandedSections.has('composition')}
          onToggle={() => toggleSection('composition')}
        >
          <div className="space-y-3">
            <div>
              <Label className="text-[10px] text-slate-400 mb-1 block">Layout</Label>
              <Select
                value={activeConfig.composition.primaryLayout}
                onChange={(v) =>
                  handleUpdateConfig({
                    composition: {
                      ...activeConfig.composition,
                      primaryLayout: v as CompositionType,
                    },
                  })
                }
                options={COMPOSITION_TYPES}
                disabled={disabled}
              />
            </div>
            <div>
              <Label className="text-[10px] text-slate-400 mb-1 block">Aspect Ratio</Label>
              <Select
                value={activeConfig.composition.aspectRatio}
                onChange={(v) =>
                  handleUpdateConfig({
                    composition: {
                      ...activeConfig.composition,
                      aspectRatio: v as AspectRatio,
                    },
                  })
                }
                options={ASPECT_RATIOS}
                disabled={disabled}
              />
            </div>
            <div>
              <Label className="text-[10px] text-slate-400 mb-1 block">Depth of Field</Label>
              <Select
                value={activeConfig.composition.depthOfField}
                onChange={(v) =>
                  handleUpdateConfig({
                    composition: {
                      ...activeConfig.composition,
                      depthOfField: v as DepthOfField,
                    },
                  })
                }
                options={DEPTH_OF_FIELD}
                disabled={disabled}
              />
            </div>
            <Slider
              label="Negative Space"
              value={activeConfig.composition.negativeSpacePreference}
              onChange={(v) =>
                handleUpdateConfig({
                  composition: {
                    ...activeConfig.composition,
                    negativeSpacePreference: v,
                  },
                })
              }
              disabled={disabled}
            />
          </div>
        </Section>

        {/* Mood Section */}
        <Section
          id="mood"
          title="Mood & Atmosphere"
          icon={<Heart className="w-3.5 h-3.5" />}
          isExpanded={expandedSections.has('mood')}
          onToggle={() => toggleSection('mood')}
        >
          <div className="space-y-3">
            <div>
              <Label className="text-[10px] text-slate-400 mb-1 block">Primary Mood</Label>
              <input
                type="text"
                value={activeConfig.mood.primary}
                onChange={(e) =>
                  handleUpdateConfig({
                    mood: { ...activeConfig.mood, primary: e.target.value },
                  })
                }
                disabled={disabled}
                placeholder="e.g., dramatic, ethereal, cozy"
                className={cn(
                  'w-full px-2 py-1.5 text-xs rounded-md',
                  'bg-slate-800/60 border border-slate-700',
                  'text-slate-200 placeholder:text-slate-500',
                  'focus:outline-none focus:ring-1 focus:ring-cyan-500/50'
                )}
              />
            </div>
            <div>
              <Label className="text-[10px] text-slate-400 mb-1 block">Secondary Mood</Label>
              <input
                type="text"
                value={activeConfig.mood.secondary || ''}
                onChange={(e) =>
                  handleUpdateConfig({
                    mood: { ...activeConfig.mood, secondary: e.target.value || undefined },
                  })
                }
                disabled={disabled}
                placeholder="Optional undertone"
                className={cn(
                  'w-full px-2 py-1.5 text-xs rounded-md',
                  'bg-slate-800/60 border border-slate-700',
                  'text-slate-200 placeholder:text-slate-500',
                  'focus:outline-none focus:ring-1 focus:ring-cyan-500/50'
                )}
              />
            </div>
            <div>
              <Label className="text-[10px] text-slate-400 mb-1 block">
                Intensity: {activeConfig.mood.intensity}/5
              </Label>
              <input
                type="range"
                min={1}
                max={5}
                value={activeConfig.mood.intensity}
                onChange={(e) =>
                  handleUpdateConfig({
                    mood: {
                      ...activeConfig.mood,
                      intensity: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5,
                    },
                  })
                }
                disabled={disabled}
                className={cn(
                  'w-full h-1.5 rounded-full appearance-none cursor-pointer',
                  'bg-slate-700',
                  '[&::-webkit-slider-thumb]:appearance-none',
                  '[&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3',
                  '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500'
                )}
              />
            </div>
          </div>
        </Section>

        {/* Keywords Section */}
        <Section
          id="keywords"
          title="Style Keywords"
          icon={<Sparkles className="w-3.5 h-3.5" />}
          isExpanded={expandedSections.has('keywords')}
          onToggle={() => toggleSection('keywords')}
        >
          <div className="space-y-3">
            <div>
              <Label className="text-[10px] text-slate-400 mb-1 block">
                Style Keywords (comma-separated)
              </Label>
              <textarea
                value={activeConfig.styleKeywords.join(', ')}
                onChange={(e) =>
                  handleUpdateConfig({
                    styleKeywords: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                disabled={disabled}
                placeholder="cinematic, moody, detailed..."
                rows={2}
                className={cn(
                  'w-full px-2 py-1.5 text-xs rounded-md resize-none',
                  'bg-slate-800/60 border border-slate-700',
                  'text-slate-200 placeholder:text-slate-500',
                  'focus:outline-none focus:ring-1 focus:ring-cyan-500/50'
                )}
              />
            </div>
            <div>
              <Label className="text-[10px] text-slate-400 mb-1 block">
                Avoid Keywords (comma-separated)
              </Label>
              <textarea
                value={activeConfig.avoidKeywords.join(', ')}
                onChange={(e) =>
                  handleUpdateConfig({
                    avoidKeywords: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                disabled={disabled}
                placeholder="blurry, distorted..."
                rows={2}
                className={cn(
                  'w-full px-2 py-1.5 text-xs rounded-md resize-none',
                  'bg-slate-800/60 border border-slate-700',
                  'text-slate-200 placeholder:text-slate-500',
                  'focus:outline-none focus:ring-1 focus:ring-cyan-500/50'
                )}
              />
            </div>
            <div>
              <Label className="text-[10px] text-slate-400 mb-1 block">
                Artistic Influences (comma-separated)
              </Label>
              <textarea
                value={activeConfig.artisticInfluences.join(', ')}
                onChange={(e) =>
                  handleUpdateConfig({
                    artisticInfluences: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                disabled={disabled}
                placeholder="Studio Ghibli, Moebius..."
                rows={2}
                className={cn(
                  'w-full px-2 py-1.5 text-xs rounded-md resize-none',
                  'bg-slate-800/60 border border-slate-700',
                  'text-slate-200 placeholder:text-slate-500',
                  'focus:outline-none focus:ring-1 focus:ring-cyan-500/50'
                )}
              />
            </div>
          </div>
        </Section>
      </div>

      {/* Preview */}
      <div className="pt-3 border-t border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
          >
            {showPreview ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Style Preview
          </button>
          <Button
            onClick={handleCopyPreview}
            disabled={disabled || !previewText}
            variant="ghost"
            size="xs"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 mr-1 text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
        <AnimatePresence>
          {showPreview && previewText && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div
                className={cn(
                  'p-2 text-[10px] text-slate-400 rounded-md',
                  'bg-slate-800/30 border border-slate-800',
                  'font-mono leading-relaxed'
                )}
              >
                {previewText}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
