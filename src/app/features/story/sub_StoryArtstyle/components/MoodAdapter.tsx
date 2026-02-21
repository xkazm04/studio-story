/**
 * MoodAdapter Component
 *
 * UI for managing mood-based style adaptations that shift colors
 * and lighting based on emotional context.
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Smile,
  Frown,
  AlertTriangle,
  Sparkles,
  Moon,
  Sun,
  CloudRain,
  Flame,
  Eye,
  ChevronDown,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/UI/Button';
import { Label } from '@/app/components/UI/Label';
import {
  styleVariationManager,
  type EmotionalMood,
  type MoodAdaptation,
  DEFAULT_MOOD_ADAPTATIONS,
} from '@/lib/style/StyleVariationManager';

// ============================================================================
// Types
// ============================================================================

interface MoodAdapterProps {
  configId: string;
  selectedMood?: EmotionalMood;
  onMoodSelect?: (mood: EmotionalMood) => void;
  onMoodUpdate?: (mood: EmotionalMood, adaptation: MoodAdaptation) => void;
  disabled?: boolean;
}

// ============================================================================
// Mood Icons & Colors
// ============================================================================

const MOOD_ICONS: Record<EmotionalMood, React.ReactNode> = {
  neutral: <Eye className="w-4 h-4" />,
  joyful: <Smile className="w-4 h-4" />,
  melancholic: <CloudRain className="w-4 h-4" />,
  tense: <AlertTriangle className="w-4 h-4" />,
  romantic: <Heart className="w-4 h-4" />,
  mysterious: <Moon className="w-4 h-4" />,
  triumphant: <Sun className="w-4 h-4" />,
  fearful: <Frown className="w-4 h-4" />,
  peaceful: <Sparkles className="w-4 h-4" />,
  angry: <Flame className="w-4 h-4" />,
  hopeful: <Sun className="w-4 h-4" />,
  desperate: <AlertTriangle className="w-4 h-4" />,
};

const MOOD_COLORS: Record<EmotionalMood, string> = {
  neutral: 'text-slate-400 bg-slate-500/20 border-slate-500/30',
  joyful: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
  melancholic: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
  tense: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
  romantic: 'text-pink-400 bg-pink-500/20 border-pink-500/30',
  mysterious: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
  triumphant: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
  fearful: 'text-red-400 bg-red-500/20 border-red-500/30',
  peaceful: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
  angry: 'text-red-500 bg-red-600/20 border-red-600/30',
  hopeful: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
  desperate: 'text-gray-400 bg-gray-500/20 border-gray-500/30',
};

const MOOD_ACTIVE_COLORS: Record<EmotionalMood, string> = {
  neutral: 'bg-slate-500 text-white border-slate-400',
  joyful: 'bg-yellow-500 text-black border-yellow-400',
  melancholic: 'bg-blue-500 text-white border-blue-400',
  tense: 'bg-orange-500 text-white border-orange-400',
  romantic: 'bg-pink-500 text-white border-pink-400',
  mysterious: 'bg-purple-500 text-white border-purple-400',
  triumphant: 'bg-amber-500 text-black border-amber-400',
  fearful: 'bg-red-500 text-white border-red-400',
  peaceful: 'bg-emerald-500 text-white border-emerald-400',
  angry: 'bg-red-600 text-white border-red-500',
  hopeful: 'bg-cyan-500 text-white border-cyan-400',
  desperate: 'bg-gray-500 text-white border-gray-400',
};

const ALL_MOODS: EmotionalMood[] = [
  'neutral',
  'joyful',
  'melancholic',
  'tense',
  'romantic',
  'mysterious',
  'triumphant',
  'fearful',
  'peaceful',
  'angry',
  'hopeful',
  'desperate',
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
  showSign?: boolean;
}

function Slider({ label, value, onChange, min = -50, max = 50, disabled, showSign = true }: SliderProps) {
  const displayValue = showSign && value > 0 ? `+${value}` : value.toString();

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400">{label}</span>
        <span className={cn(
          'text-[10px] font-mono',
          value > 0 ? 'text-emerald-400' : value < 0 ? 'text-red-400' : 'text-slate-500'
        )}>
          {displayValue}
        </span>
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
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      />
    </div>
  );
}

interface MoodCardProps {
  mood: EmotionalMood;
  adaptation: MoodAdaptation;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

function MoodCard({ mood, adaptation, isSelected, onSelect, disabled }: MoodCardProps) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
        isSelected
          ? MOOD_ACTIVE_COLORS[mood]
          : cn(MOOD_COLORS[mood], 'hover:opacity-80'),
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
    >
      {MOOD_ICONS[mood]}
      <span className="text-xs font-medium">{adaptation.name}</span>
    </button>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function MoodAdapter({
  configId,
  selectedMood = 'neutral',
  onMoodSelect,
  onMoodUpdate,
  disabled = false,
}: MoodAdapterProps) {
  const [expandedMood, setExpandedMood] = useState<EmotionalMood | null>(null);
  const [localAdaptations, setLocalAdaptations] = useState<Map<EmotionalMood, MoodAdaptation>>(() => {
    const config = styleVariationManager.getConfig(configId);
    return config?.moodAdaptations || new Map(DEFAULT_MOOD_ADAPTATIONS.map(m => [m.mood, m]));
  });

  const handleMoodSelect = useCallback((mood: EmotionalMood) => {
    onMoodSelect?.(mood);
  }, [onMoodSelect]);

  const handleAdaptationChange = useCallback((mood: EmotionalMood, updates: Partial<MoodAdaptation>) => {
    const existing = localAdaptations.get(mood);
    if (!existing) return;

    const updated = { ...existing, ...updates };
    const newMap = new Map(localAdaptations);
    newMap.set(mood, updated);
    setLocalAdaptations(newMap);

    // Persist to storage
    styleVariationManager.updateMoodAdaptation(configId, mood, updates);
    onMoodUpdate?.(mood, updated);
  }, [configId, localAdaptations, onMoodUpdate]);

  const handleResetMood = useCallback((mood: EmotionalMood) => {
    const defaultAdaptation = DEFAULT_MOOD_ADAPTATIONS.find(m => m.mood === mood);
    if (!defaultAdaptation) return;

    const newMap = new Map(localAdaptations);
    newMap.set(mood, defaultAdaptation);
    setLocalAdaptations(newMap);

    styleVariationManager.updateMoodAdaptation(configId, mood, defaultAdaptation);
    onMoodUpdate?.(mood, defaultAdaptation);
  }, [configId, localAdaptations, onMoodUpdate]);

  const toggleExpand = useCallback((mood: EmotionalMood) => {
    setExpandedMood(prev => prev === mood ? null : mood);
  }, []);

  const currentAdaptation = useMemo(() => {
    return localAdaptations.get(selectedMood) || DEFAULT_MOOD_ADAPTATIONS.find(m => m.mood === selectedMood);
  }, [localAdaptations, selectedMood]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
        <Heart className="w-4 h-4 text-pink-400" />
        <span className="text-sm font-semibold text-slate-200">Mood Adaptation</span>
      </div>

      {/* Mood Grid */}
      <div className="grid grid-cols-3 gap-2">
        {ALL_MOODS.map(mood => {
          const adaptation = localAdaptations.get(mood) || DEFAULT_MOOD_ADAPTATIONS.find(m => m.mood === mood)!;
          return (
            <MoodCard
              key={mood}
              mood={mood}
              adaptation={adaptation}
              isSelected={selectedMood === mood}
              onSelect={() => handleMoodSelect(mood)}
              disabled={disabled}
            />
          );
        })}
      </div>

      {/* Selected Mood Details */}
      {currentAdaptation && (
        <div className="mt-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn('p-1.5 rounded', MOOD_COLORS[selectedMood])}>
                {MOOD_ICONS[selectedMood]}
              </span>
              <div>
                <div className="text-sm font-medium text-slate-200">{currentAdaptation.name}</div>
                <div className="text-[10px] text-slate-500">Adjust color and lighting shifts</div>
              </div>
            </div>
            <Button
              onClick={() => handleResetMood(selectedMood)}
              disabled={disabled}
              variant="ghost"
              size="xs"
              icon={<RotateCcw className="w-3 h-3" />}
            >
              Reset
            </Button>
          </div>

          {/* Color Shifts */}
          <div className="space-y-3">
            <Label className="text-xs text-slate-400">Color Shifts</Label>
            <Slider
              label="Hue Rotation"
              value={currentAdaptation.colorShift.hueRotation}
              onChange={(v) => handleAdaptationChange(selectedMood, {
                colorShift: { ...currentAdaptation.colorShift, hueRotation: v }
              })}
              min={-180}
              max={180}
              disabled={disabled}
            />
            <Slider
              label="Saturation"
              value={currentAdaptation.colorShift.saturation}
              onChange={(v) => handleAdaptationChange(selectedMood, {
                colorShift: { ...currentAdaptation.colorShift, saturation: v }
              })}
              disabled={disabled}
            />
            <Slider
              label="Brightness"
              value={currentAdaptation.colorShift.brightness}
              onChange={(v) => handleAdaptationChange(selectedMood, {
                colorShift: { ...currentAdaptation.colorShift, brightness: v }
              })}
              disabled={disabled}
            />
          </div>

          {/* Lighting Modifications */}
          <div className="space-y-3">
            <Label className="text-xs text-slate-400">Lighting Modifications</Label>
            <Slider
              label="Intensity"
              value={currentAdaptation.lightingMod.intensity}
              onChange={(v) => handleAdaptationChange(selectedMood, {
                lightingMod: { ...currentAdaptation.lightingMod, intensity: v }
              })}
              min={-30}
              max={30}
              disabled={disabled}
            />
            <Slider
              label="Contrast"
              value={currentAdaptation.lightingMod.contrast}
              onChange={(v) => handleAdaptationChange(selectedMood, {
                lightingMod: { ...currentAdaptation.lightingMod, contrast: v }
              })}
              min={-30}
              max={30}
              disabled={disabled}
            />
            <Slider
              label="Warmth"
              value={currentAdaptation.lightingMod.warmth}
              onChange={(v) => handleAdaptationChange(selectedMood, {
                lightingMod: { ...currentAdaptation.lightingMod, warmth: v }
              })}
              disabled={disabled}
            />
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label className="text-xs text-slate-400">Style Keywords</Label>
            <div className="flex flex-wrap gap-1">
              {currentAdaptation.keywords.map((keyword, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-[10px] rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                >
                  {keyword}
                </span>
              ))}
              {currentAdaptation.keywords.length === 0 && (
                <span className="text-[10px] text-slate-500 italic">No keywords defined</span>
              )}
            </div>
          </div>

          {/* Avoid Keywords */}
          {currentAdaptation.avoidKeywords.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Avoid Keywords</Label>
              <div className="flex flex-wrap gap-1">
                {currentAdaptation.avoidKeywords.map((keyword, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-[10px] rounded-full bg-red-500/20 text-red-400 border border-red-500/30"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* All Moods Expandable List */}
      <div className="space-y-1 pt-2 border-t border-slate-800">
        <div className="text-[10px] text-slate-500 mb-2">All Mood Adaptations</div>
        {ALL_MOODS.filter(m => m !== selectedMood).map(mood => {
          const adaptation = localAdaptations.get(mood) || DEFAULT_MOOD_ADAPTATIONS.find(m => m.mood === mood)!;
          const isExpanded = expandedMood === mood;

          return (
            <div key={mood} className="border border-slate-800 rounded-md overflow-hidden">
              <button
                onClick={() => toggleExpand(mood)}
                className="w-full flex items-center gap-2 px-2 py-1.5 bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-slate-500" />
                )}
                <span className={cn('p-1 rounded', MOOD_COLORS[mood])}>
                  {MOOD_ICONS[mood]}
                </span>
                <span className="text-xs text-slate-300">{adaptation.name}</span>
                <span className="ml-auto text-[9px] text-slate-500">
                  H:{adaptation.colorShift.hueRotation} S:{adaptation.colorShift.saturation} B:{adaptation.colorShift.brightness}
                </span>
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-2 space-y-2 bg-slate-900/50 border-t border-slate-800">
                      <Slider
                        label="Hue"
                        value={adaptation.colorShift.hueRotation}
                        onChange={(v) => handleAdaptationChange(mood, {
                          colorShift: { ...adaptation.colorShift, hueRotation: v }
                        })}
                        min={-180}
                        max={180}
                        disabled={disabled}
                      />
                      <Slider
                        label="Saturation"
                        value={adaptation.colorShift.saturation}
                        onChange={(v) => handleAdaptationChange(mood, {
                          colorShift: { ...adaptation.colorShift, saturation: v }
                        })}
                        disabled={disabled}
                      />
                      <Slider
                        label="Brightness"
                        value={adaptation.colorShift.brightness}
                        onChange={(v) => handleAdaptationChange(mood, {
                          colorShift: { ...adaptation.colorShift, brightness: v }
                        })}
                        disabled={disabled}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
