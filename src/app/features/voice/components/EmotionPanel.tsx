'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Smile,
  Frown,
  Angry,
  AlertTriangle,
  Zap,
  ThumbsDown,
  Star,
  Heart,
  Activity,
  CloudRain,
  Shield,
  MessageCircle,
  Volume,
  Volume2,
  Minus,
  EyeOff,
} from 'lucide-react';
import { Slider } from '@/app/components/UI/Slider';
import {
  type EmotionType,
  type EmotionConfig,
} from '@/lib/voice';
import {
  EMOTION_ENTRIES,
  VALENCE_GROUPS,
  getEmotionLabel,
  getEmotionHexColor,
} from '@/lib/voice/EmotionTaxonomy';

interface EmotionPanelProps {
  emotion: EmotionConfig;
  onChange: (emotion: EmotionConfig) => void;
  className?: string;
}

// Icon mapping for emotions — built from taxonomy icon names to Lucide components
const ICON_COMPONENTS: Record<string, React.ElementType> = {
  'minus': Minus,
  'smile': Smile,
  'frown': Frown,
  'angry': Angry,
  'alert-triangle': AlertTriangle,
  'zap': Zap,
  'thumbs-down': ThumbsDown,
  'eye-off': EyeOff,
  'star': Star,
  'heart': Heart,
  'activity': Activity,
  'cloud-rain': CloudRain,
  'shield': Shield,
  'message-circle': MessageCircle,
  'volume': Volume,
  'volume-2': Volume2,
};

const EMOTION_ICONS: Record<EmotionType, React.ElementType> = Object.fromEntries(
  EMOTION_ENTRIES.map((e) => [e.type, ICON_COMPONENTS[e.icon] ?? Minus]),
) as Record<EmotionType, React.ElementType>;

const EMOTION_LABELS: Record<EmotionType, string> = Object.fromEntries(
  EMOTION_ENTRIES.map((e) => [e.type, e.label]),
) as Record<EmotionType, string>;

export default function EmotionPanel({
  emotion,
  onChange,
  className = '',
}: EmotionPanelProps) {
  const [showBlend, setShowBlend] = useState(!!emotion.blend);

  // Handle primary emotion change
  const handleEmotionSelect = (type: EmotionType) => {
    onChange({
      ...emotion,
      type,
    });
  };

  // Handle intensity change
  const handleIntensityChange = (value: number) => {
    onChange({
      ...emotion,
      intensity: value,
    });
  };

  // Handle blend emotion change
  const handleBlendSelect = (type: EmotionType) => {
    onChange({
      ...emotion,
      blend: type,
      blendRatio: emotion.blendRatio || 0.3,
    });
  };

  // Handle blend ratio change
  const handleBlendRatioChange = (value: number) => {
    onChange({
      ...emotion,
      blendRatio: value,
    });
  };

  // Toggle blend mode
  const toggleBlend = () => {
    if (showBlend) {
      onChange({
        type: emotion.type,
        intensity: emotion.intensity,
      });
    }
    setShowBlend(!showBlend);
  };

  // Get intensity label
  const getIntensityLabel = (value: number): string => {
    if (value < 0.2) return 'Subtle';
    if (value < 0.4) return 'Mild';
    if (value < 0.6) return 'Moderate';
    if (value < 0.8) return 'Strong';
    return 'Intense';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Primary Emotion Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-slate-200">Primary Emotion</h4>
          <button
            onClick={toggleBlend}
            className={`text-sm px-2 py-1 rounded transition-colors ${
              showBlend
                ? 'bg-voice-muted/20 text-voice-muted'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {showBlend ? 'Blending On' : 'Add Blend'}
          </button>
        </div>

        <div className="space-y-3">
          {VALENCE_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">{group.label}</span>
                <div className="flex-1 border-b border-slate-800/50" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {group.emotions.map((type) => {
                  const Icon = EMOTION_ICONS[type];
                  const color = getEmotionHexColor(type);
                  const isSelected = emotion.type === type;

                  return (
                    <motion.button
                      key={type}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleEmotionSelect(type)}
                      className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-voice-primary/50 bg-voice-primary/10'
                          : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                      }`}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{ color: isSelected ? color : undefined }}
                      />
                      <span
                        className={`text-sm ${
                          isSelected ? 'text-slate-200' : 'text-slate-400'
                        }`}
                      >
                        {EMOTION_LABELS[type]}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Intensity Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-slate-300">Intensity</label>
          <span className="text-sm text-slate-400">
            {getIntensityLabel(emotion.intensity)} ({Math.round(emotion.intensity * 100)}%)
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Slider
            value={emotion.intensity}
            min={0}
            max={1}
            step={0.05}
            onChange={handleIntensityChange}
            className="flex-1"
          />
        </div>
        <div className="flex justify-between text-sm text-slate-400">
          <span>Subtle</span>
          <span>Intense</span>
        </div>
      </div>

      {/* Blend Section */}
      {showBlend && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="space-y-4 pt-4 border-t border-slate-800"
        >
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-200">Blend Emotion</h4>
            <p className="text-sm text-slate-400">
              Mix a secondary emotion for more nuanced delivery
            </p>
          </div>

          <div className="space-y-3">
            {VALENCE_GROUPS.map((group) => {
              const filtered = group.emotions.filter((type) => type !== emotion.type);
              if (filtered.length === 0) return null;
              return (
                <div key={group.label}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">{group.label}</span>
                    <div className="flex-1 border-b border-slate-800/50" />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {filtered.map((type) => {
                      const Icon = EMOTION_ICONS[type];
                      const color = getEmotionHexColor(type);
                      const isSelected = emotion.blend === type;

                      return (
                        <motion.button
                          key={type}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleBlendSelect(type)}
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                            isSelected
                              ? 'border-voice-muted/50 bg-voice-muted/10'
                              : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                          }`}
                        >
                          <Icon
                            className="w-4 h-4"
                            style={{ color: isSelected ? color : undefined }}
                          />
                          <span
                            className={`text-sm ${
                              isSelected ? 'text-slate-200' : 'text-slate-400'
                            }`}
                          >
                            {EMOTION_LABELS[type]}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Blend Ratio */}
          {emotion.blend && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300">Blend Ratio</label>
                <span className="text-sm text-slate-400">
                  {Math.round((emotion.blendRatio || 0) * 100)}% {EMOTION_LABELS[emotion.blend]}
                </span>
              </div>
              <Slider
                value={emotion.blendRatio || 0}
                min={0}
                max={1}
                step={0.05}
                onChange={handleBlendRatioChange}
                className="flex-1"
              />
              <div className="flex justify-between text-sm text-slate-400">
                <span>More {EMOTION_LABELS[emotion.type]}</span>
                <span>More {EMOTION_LABELS[emotion.blend]}</span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Preview */}
      <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/50">
        <div className="flex items-center gap-3">
          {(() => {
            const Icon = EMOTION_ICONS[emotion.type];
            const color = getEmotionHexColor(emotion.type);
            return (
              <>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-200">
                    {EMOTION_LABELS[emotion.type]}
                    {emotion.blend && (
                      <span className="text-slate-400">
                        {' + '}{EMOTION_LABELS[emotion.blend]}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-400">
                    {getIntensityLabel(emotion.intensity)} intensity
                    {emotion.blend && emotion.blendRatio && (
                      <span> • {Math.round(emotion.blendRatio * 100)}% blend</span>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
