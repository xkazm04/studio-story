/**
 * EmotionalMarkers
 * UI component for displaying and editing emotional classifications on beats
 */

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Heart,
  Frown,
  AlertTriangle,
  Flame,
  Zap,
  ThumbsDown,
  Clock,
  Shield,
  Activity,
  Smile,
  HeartCrack,
  Skull,
  Sun,
  Cloud,
  HelpCircle,
  Sparkles,
  Award,
  EyeOff,
  History,
  Star,
  ChevronDown,
  X,
  Plus,
} from 'lucide-react';
import {
  type EmotionType,
  type EmotionalMarker,
  EMOTIONS,
  getEmotion,
} from '@/lib/beats/TaxonomyLibrary';

// Emotion icon mapping
const EMOTION_ICONS: Record<EmotionType, React.ComponentType<{ className?: string }>> = {
  joy: Smile,
  sadness: Frown,
  fear: AlertTriangle,
  anger: Flame,
  surprise: Zap,
  disgust: ThumbsDown,
  anticipation: Clock,
  trust: Shield,
  tension: Activity,
  relief: Sun,
  love: Heart,
  hate: Skull,
  hope: Sun,
  despair: Cloud,
  curiosity: HelpCircle,
  confusion: HelpCircle,
  pride: Award,
  shame: EyeOff,
  nostalgia: History,
  awe: Star,
};

interface EmotionalMarkersProps {
  markers: EmotionalMarker[];
  onMarkersChange?: (markers: EmotionalMarker[]) => void;
  readonly?: boolean;
  compact?: boolean;
}

// Individual emotion badge
function EmotionBadge({
  emotion,
  intensity,
  isSecondary,
  onRemove,
  readonly,
}: {
  emotion: EmotionType;
  intensity: number;
  isSecondary?: boolean;
  onRemove?: () => void;
  readonly?: boolean;
}) {
  const emotionDef = getEmotion(emotion);
  const Icon = EMOTION_ICONS[emotion] || Sparkles;

  if (!emotionDef) return null;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
        'border transition-all',
        isSecondary ? 'opacity-70' : 'opacity-100'
      )}
      style={{
        backgroundColor: `${emotionDef.color}15`,
        borderColor: `${emotionDef.color}40`,
        color: emotionDef.color,
      }}
    >
      <Icon className="w-3 h-3" />
      <span>{emotionDef.label}</span>
      {intensity > 0 && (
        <span className="text-[10px] opacity-70">{intensity}%</span>
      )}
      {!readonly && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:opacity-100 opacity-60 transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </motion.div>
  );
}

// Emotion shift indicator
function EmotionShift({
  from,
  to,
}: {
  from: EmotionType;
  to: EmotionType;
}) {
  const fromDef = getEmotion(from);
  const toDef = getEmotion(to);
  const FromIcon = EMOTION_ICONS[from] || Sparkles;
  const ToIcon = EMOTION_ICONS[to] || Sparkles;

  if (!fromDef || !toDef) return null;

  return (
    <div className="flex items-center gap-1 text-xs">
      <span
        className="flex items-center gap-1"
        style={{ color: fromDef.color }}
      >
        <FromIcon className="w-3 h-3" />
        {fromDef.label}
      </span>
      <span className="text-slate-500">→</span>
      <span
        className="flex items-center gap-1"
        style={{ color: toDef.color }}
      >
        <ToIcon className="w-3 h-3" />
        {toDef.label}
      </span>
    </div>
  );
}

// Intensity slider
function IntensitySlider({
  value,
  onChange,
  color,
}: {
  value: number;
  onChange: (value: number) => void;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 w-16">Intensity</span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} ${value}%, #374151 ${value}%)`,
        }}
      />
      <span className="text-xs text-slate-300 w-8 text-right">{value}%</span>
    </div>
  );
}

// Emotion picker dropdown
function EmotionPicker({
  selectedEmotions,
  onSelect,
  onClose,
}: {
  selectedEmotions: EmotionType[];
  onSelect: (emotion: EmotionType) => void;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');

  const filteredEmotions = useMemo(() => {
    return EMOTIONS.filter(e => {
      if (selectedEmotions.includes(e.type)) return false;
      if (filter === 'all') return true;
      return e.valence === filter;
    });
  }, [filter, selectedEmotions]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full left-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden"
    >
      {/* Filter tabs */}
      <div className="flex border-b border-slate-700">
        {(['all', 'positive', 'negative', 'neutral'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'flex-1 px-2 py-1.5 text-xs font-medium transition-colors capitalize',
              filter === f
                ? 'bg-slate-700 text-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Emotion grid */}
      <div className="p-2 max-h-48 overflow-y-auto">
        <div className="grid grid-cols-2 gap-1">
          {filteredEmotions.map((emotion) => {
            const Icon = EMOTION_ICONS[emotion.type] || Sparkles;
            return (
              <button
                key={emotion.type}
                onClick={() => {
                  onSelect(emotion.type);
                  onClose();
                }}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors',
                  'hover:bg-slate-700/50 text-left'
                )}
              >
                <span style={{ color: emotion.color }}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="text-slate-200">{emotion.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export default function EmotionalMarkers({
  markers,
  onMarkersChange,
  readonly = false,
  compact = false,
}: EmotionalMarkersProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAddEmotion = (emotion: EmotionType) => {
    if (!onMarkersChange) return;

    const newMarker: EmotionalMarker = {
      primary: emotion,
      intensity: 50,
    };

    onMarkersChange([...markers, newMarker]);
    setShowPicker(false);
  };

  const handleRemoveMarker = (index: number) => {
    if (!onMarkersChange) return;
    const updated = markers.filter((_, i) => i !== index);
    onMarkersChange(updated);
  };

  const handleUpdateIntensity = (index: number, intensity: number) => {
    if (!onMarkersChange) return;
    const updated = markers.map((m, i) =>
      i === index ? { ...m, intensity } : m
    );
    onMarkersChange(updated);
  };

  const handleAddSecondary = (index: number, emotion: EmotionType) => {
    if (!onMarkersChange) return;
    const updated = markers.map((m, i) =>
      i === index ? { ...m, secondary: emotion } : m
    );
    onMarkersChange(updated);
  };

  const handleRemoveSecondary = (index: number) => {
    if (!onMarkersChange) return;
    const updated = markers.map((m, i) => {
      if (i === index) {
        const { secondary, ...rest } = m;
        return rest;
      }
      return m;
    });
    onMarkersChange(updated);
  };

  const handleSetShift = (index: number, from: EmotionType, to: EmotionType) => {
    if (!onMarkersChange) return;
    const updated = markers.map((m, i) =>
      i === index ? { ...m, shift: { from, to } } : m
    );
    onMarkersChange(updated);
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        <AnimatePresence>
          {markers.map((marker, index) => (
            <EmotionBadge
              key={`${marker.primary}-${index}`}
              emotion={marker.primary}
              intensity={marker.intensity}
              readonly={readonly}
              onRemove={readonly ? undefined : () => handleRemoveMarker(index)}
            />
          ))}
        </AnimatePresence>
        {!readonly && markers.length < 3 && (
          <div className="relative">
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs
                border border-dashed border-slate-600 text-slate-400
                hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
            <AnimatePresence>
              {showPicker && (
                <EmotionPicker
                  selectedEmotions={markers.map(m => m.primary)}
                  onSelect={handleAddEmotion}
                  onClose={() => setShowPicker(false)}
                />
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {markers.map((marker, index) => {
          const emotionDef = getEmotion(marker.primary);

          return (
            <motion.div
              key={`${marker.primary}-${index}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3 space-y-2"
            >
              {/* Primary emotion */}
              <div className="flex items-center justify-between">
                <EmotionBadge
                  emotion={marker.primary}
                  intensity={marker.intensity}
                  readonly={readonly}
                  onRemove={() => handleRemoveMarker(index)}
                />
                {!readonly && (
                  <button
                    onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                    className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    <ChevronDown className={cn(
                      'w-4 h-4 transition-transform',
                      editingIndex === index && 'rotate-180'
                    )} />
                  </button>
                )}
              </div>

              {/* Expanded editing */}
              <AnimatePresence>
                {editingIndex === index && !readonly && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 pt-2 border-t border-slate-700/50"
                  >
                    {/* Intensity */}
                    <IntensitySlider
                      value={marker.intensity}
                      onChange={(v) => handleUpdateIntensity(index, v)}
                      color={emotionDef?.color || '#888'}
                    />

                    {/* Secondary emotion */}
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400">Secondary emotion</span>
                      {marker.secondary ? (
                        <EmotionBadge
                          emotion={marker.secondary}
                          intensity={0}
                          isSecondary
                          readonly={readonly}
                          onRemove={() => handleRemoveSecondary(index)}
                        />
                      ) : (
                        <div className="relative">
                          <button
                            onClick={() => setShowPicker(true)}
                            className="text-xs text-slate-500 hover:text-cyan-400 transition-colors"
                          >
                            + Add secondary
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Emotional shift */}
                    {marker.shift && (
                      <div className="space-y-1">
                        <span className="text-xs text-slate-400">Emotional shift</span>
                        <EmotionShift from={marker.shift.from} to={marker.shift.to} />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Add emotion button */}
      {!readonly && markers.length < 3 && (
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg',
              'border border-dashed border-slate-600 text-slate-400 text-xs',
              'hover:border-cyan-500/50 hover:text-cyan-400 transition-colors'
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Emotional Marker
          </button>
          <AnimatePresence>
            {showPicker && (
              <EmotionPicker
                selectedEmotions={markers.map(m => m.primary)}
                onSelect={handleAddEmotion}
                onClose={() => setShowPicker(false)}
              />
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Empty state */}
      {markers.length === 0 && readonly && (
        <div className="text-xs text-slate-500 italic">No emotional markers</div>
      )}
    </div>
  );
}

// Compact display for tables/cards
export function EmotionalMarkersCompact({
  markers,
}: {
  markers: EmotionalMarker[];
}) {
  if (markers.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {markers.slice(0, 2).map((marker, index) => {
        const emotionDef = getEmotion(marker.primary);
        const Icon = EMOTION_ICONS[marker.primary] || Sparkles;

        return (
          <div
            key={index}
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px]"
            style={{
              backgroundColor: `${emotionDef?.color}15`,
              color: emotionDef?.color,
            }}
            title={`${emotionDef?.label} (${marker.intensity}%)`}
          >
            <Icon className="w-2.5 h-2.5" />
          </div>
        );
      })}
      {markers.length > 2 && (
        <span className="text-[10px] text-slate-500">+{markers.length - 2}</span>
      )}
    </div>
  );
}
