/**
 * VariationPreview Component
 *
 * Visual comparison tool for previewing style variations
 * before and after applying era, mood, and scene type rules.
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  Palette,
  Sun,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/UI/Button';
import { Label } from '@/app/components/UI/Label';
import {
  styleVariationManager,
  type StoryEra,
  type EmotionalMood,
  type SceneType,
  type VariationResult,
} from '@/lib/style/StyleVariationManager';
import { styleDNA, type StyleDNAConfig } from '@/lib/style/StyleDNA';

// ============================================================================
// Types
// ============================================================================

interface VariationPreviewProps {
  configId: string;
  baseStyleId?: string;
  era?: StoryEra;
  mood?: EmotionalMood;
  sceneTypes?: SceneType[];
  onApply?: (result: VariationResult) => void;
  disabled?: boolean;
}

// ============================================================================
// Color Preview Component
// ============================================================================

interface ColorSwatchProps {
  color: string;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

function ColorSwatch({ color, label, size = 'md' }: ColorSwatchProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(sizeClasses[size], 'rounded-md border border-slate-600 shadow-inner')}
        style={{ backgroundColor: color }}
        title={color}
      />
      <span className="text-[8px] text-slate-500">{label}</span>
    </div>
  );
}

// ============================================================================
// Before/After Comparison
// ============================================================================

interface ComparisonPanelProps {
  title: string;
  colors: string[];
  lighting: string;
  mood: string;
  modifiers?: string;
  isAfter?: boolean;
}

function ComparisonPanel({ title, colors, lighting, mood, modifiers, isAfter }: ComparisonPanelProps) {
  return (
    <div className={cn(
      'flex-1 p-3 rounded-lg border',
      isAfter
        ? 'bg-cyan-500/5 border-cyan-500/30'
        : 'bg-slate-800/50 border-slate-700'
    )}>
      <div className="flex items-center gap-2 mb-3">
        <span className={cn(
          'text-xs font-medium',
          isAfter ? 'text-cyan-400' : 'text-slate-400'
        )}>
          {title}
        </span>
        {isAfter && <Sparkles className="w-3 h-3 text-cyan-400" />}
      </div>

      {/* Colors */}
      <div className="flex items-center gap-2 mb-3">
        <Palette className="w-3.5 h-3.5 text-slate-500" />
        <div className="flex gap-1.5">
          {colors.length > 0 ? (
            colors.map((color, i) => (
              <ColorSwatch
                key={i}
                color={color}
                label={['P', 'S', 'A'][i] || ''}
                size="sm"
              />
            ))
          ) : (
            <span className="text-[10px] text-slate-500 italic">No colors</span>
          )}
        </div>
      </div>

      {/* Lighting */}
      <div className="flex items-center gap-2 mb-2">
        <Sun className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-[10px] text-slate-300 capitalize">{lighting}</span>
      </div>

      {/* Mood */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-[10px] text-slate-300 capitalize">{mood}</span>
      </div>

      {/* Modifiers (only for after) */}
      {modifiers && isAfter && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="text-[9px] text-slate-500 mb-1">Style Modifiers:</div>
          <div className="text-[10px] text-cyan-300 leading-relaxed">{modifiers}</div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function VariationPreview({
  configId,
  baseStyleId,
  era,
  mood,
  sceneTypes = [],
  onApply,
  disabled = false,
}: VariationPreviewProps) {
  const [copied, setCopied] = useState(false);

  // Get base style
  const baseStyle = useMemo<Partial<StyleDNAConfig>>(() => {
    if (baseStyleId) {
      const config = styleDNA.getConfig(baseStyleId);
      if (config) return config;
    }

    // Return active config or default
    const activeConfig = styleDNA.getActiveConfig();
    return activeConfig || {
      colorPalette: {
        id: 'default',
        name: 'Default',
        harmony: 'custom' as const,
        temperature: 'neutral' as const,
        primary: '#3b82f6',
        secondary: '#6366f1',
        accent: '#f59e0b',
        swatches: [],
        backgrounds: {
          primary: '#0f172a',
          secondary: '#1e293b',
          tertiary: '#334155',
        },
        text: {
          primary: '#f1f5f9',
          secondary: '#94a3b8',
          muted: '#64748b',
        },
      },
      lighting: {
        type: 'natural' as const,
        direction: 'three-point' as const,
        intensity: 70,
        contrast: 50,
        preferredTimeOfDay: 'golden-hour' as const,
        shadows: { softness: 60, depth: 50 },
        highlights: { bloom: 30, specularity: 40 },
      },
      mood: {
        primary: 'atmospheric',
        intensity: 3 as const,
        emotionalTone: 'contemplative',
        atmosphere: 'immersive',
      },
    };
  }, [baseStyleId]);

  // Calculate variation result
  const variationResult = useMemo(() => {
    if (!configId) return null;

    return styleVariationManager.applyVariations(baseStyle, configId, {
      era,
      mood,
      sceneTypes,
    });
  }, [baseStyle, configId, era, mood, sceneTypes]);

  // Generate preview data
  const previewData = useMemo(() => {
    if (!configId) return null;

    return styleVariationManager.previewVariation(baseStyle, configId, {
      era,
      mood,
      sceneTypes,
    });
  }, [baseStyle, configId, era, mood, sceneTypes]);

  const handleCopyModifiers = useCallback(async () => {
    if (!variationResult?.promptModifier) return;

    try {
      await navigator.clipboard.writeText(variationResult.promptModifier);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = variationResult.promptModifier;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [variationResult?.promptModifier]);

  const handleApply = useCallback(() => {
    if (!variationResult) return;
    onApply?.(variationResult);
  }, [variationResult, onApply]);

  // Check if any variation is active
  const hasActiveVariation = era || mood || sceneTypes.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-slate-200">Variation Preview</span>
        </div>
        {variationResult?.promptModifier && (
          <Button
            onClick={handleCopyModifiers}
            disabled={disabled}
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
        )}
      </div>

      {/* No Variation Active */}
      {!hasActiveVariation && (
        <div className="p-6 rounded-lg bg-slate-800/30 border border-slate-700 text-center">
          <RefreshCw className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400">
            Select an era, mood, or scene type to preview style variations
          </p>
        </div>
      )}

      {/* Preview Comparison */}
      {hasActiveVariation && previewData && (
        <div className="space-y-4">
          {/* Applied Variations Summary */}
          <div className="flex flex-wrap gap-2">
            {era && (
              <span className="px-2 py-1 text-[10px] rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Era: {era}
              </span>
            )}
            {mood && (
              <span className="px-2 py-1 text-[10px] rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30">
                Mood: {mood}
              </span>
            )}
            {sceneTypes.map(type => (
              <span
                key={type}
                className="px-2 py-1 text-[10px] rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30"
              >
                {type}
              </span>
            ))}
          </div>

          {/* Before/After Comparison */}
          <div className="flex items-stretch gap-4">
            <ComparisonPanel
              title="Before"
              colors={previewData.before.colors}
              lighting={previewData.before.lighting}
              mood={previewData.before.mood}
            />

            <div className="flex items-center">
              <ArrowRight className="w-5 h-5 text-slate-600" />
            </div>

            <ComparisonPanel
              title="After"
              colors={previewData.after.colors}
              lighting={previewData.after.lighting}
              mood={previewData.after.mood}
              modifiers={previewData.after.modifiers}
              isAfter
            />
          </div>

          {/* Detailed Changes */}
          {variationResult && (
            <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700 space-y-3">
              <Label className="text-xs text-slate-400">Applied Changes</Label>

              {/* Era Effect */}
              {variationResult.appliedEra && (
                <div className="flex items-start gap-2">
                  <ChevronRight className="w-3 h-3 text-amber-400 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-amber-400 font-medium">
                      {variationResult.appliedEra.name}
                    </span>
                    <p className="text-[9px] text-slate-500">
                      {variationResult.appliedEra.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Mood Effect */}
              {variationResult.appliedMood && (
                <div className="flex items-start gap-2">
                  <ChevronRight className="w-3 h-3 text-pink-400 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-pink-400 font-medium">
                      {variationResult.appliedMood.name} Mood
                    </span>
                    <p className="text-[9px] text-slate-500">
                      Hue: {variationResult.appliedMood.colorShift.hueRotation}°,
                      Sat: {variationResult.appliedMood.colorShift.saturation}%,
                      Bright: {variationResult.appliedMood.colorShift.brightness}%
                    </p>
                  </div>
                </div>
              )}

              {/* Scene Type Effects */}
              {variationResult.appliedSceneTypes.map((rule, i) => (
                <div key={rule.sceneType} className="flex items-start gap-2">
                  <ChevronRight className="w-3 h-3 text-orange-400 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-orange-400 font-medium">
                      {rule.name}
                    </span>
                    <span className="text-[9px] text-slate-600 ml-1">
                      (Priority {rule.priority})
                    </span>
                    <p className="text-[9px] text-slate-500">{rule.description}</p>
                  </div>
                </div>
              ))}

              {/* Keywords Added */}
              {variationResult.additionalKeywords.length > 0 && (
                <div className="pt-2 border-t border-slate-700/50">
                  <div className="text-[9px] text-slate-500 mb-1">Added Keywords:</div>
                  <div className="flex flex-wrap gap-1">
                    {variationResult.additionalKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 text-[9px] rounded bg-cyan-500/20 text-cyan-300"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Keywords to Avoid */}
              {variationResult.avoidKeywords.length > 0 && (
                <div className="pt-2 border-t border-slate-700/50">
                  <div className="text-[9px] text-slate-500 mb-1">Avoid Keywords:</div>
                  <div className="flex flex-wrap gap-1">
                    {variationResult.avoidKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 text-[9px] rounded bg-red-500/20 text-red-300"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Final Prompt Modifier */}
          {variationResult?.promptModifier && (
            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <Label className="text-[10px] text-cyan-400 mb-2 block">Generated Style Modifier</Label>
              <p className="text-xs text-cyan-200 font-mono leading-relaxed">
                {variationResult.promptModifier}
              </p>
            </div>
          )}

          {/* Apply Button */}
          {onApply && (
            <Button
              onClick={handleApply}
              disabled={disabled || !variationResult}
              variant="primary"
              size="sm"
              className="w-full"
            >
              Apply This Variation
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
