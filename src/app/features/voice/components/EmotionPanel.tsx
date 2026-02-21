'use client';

import { useState, useMemo } from 'react';
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
  emotionController,
  type EmotionType,
  type EmotionConfig,
} from '@/lib/voice';

interface EmotionPanelProps {
  emotion: EmotionConfig;
  onChange: (emotion: EmotionConfig) => void;
  className?: string;
}

// Icon mapping for emotions
const EMOTION_ICONS: Record<EmotionType, React.ElementType> = {
  neutral: Minus,
  happy: Smile,
  sad: Frown,
  angry: Angry,
  fearful: AlertTriangle,
  surprised: Zap,
  disgusted: ThumbsDown,
  contemptuous: EyeOff,
  excited: Star,
  tender: Heart,
  anxious: Activity,
  melancholy: CloudRain,
  confident: Shield,
  sarcastic: MessageCircle,
  whispered: Volume,
  shouted: Volume2,
};

// Emotion display names
const EMOTION_LABELS: Record<EmotionType, string> = {
  neutral: 'Neutral',
  happy: 'Happy',
  sad: 'Sad',
  angry: 'Angry',
  fearful: 'Fearful',
  surprised: 'Surprised',
  disgusted: 'Disgusted',
  contemptuous: 'Contemptuous',
  excited: 'Excited',
  tender: 'Tender',
  anxious: 'Anxious',
  melancholy: 'Melancholy',
  confident: 'Confident',
  sarcastic: 'Sarcastic',
  whispered: 'Whispered',
  shouted: 'Shouted',
};

export default function EmotionPanel({
  emotion,
  onChange,
  className = '',
}: EmotionPanelProps) {
  const [showBlend, setShowBlend] = useState(!!emotion.blend);

  // Get available emotions
  const emotions = useMemo(() => emotionController.getEmotionTypes(), []);

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
            className={`text-xs px-2 py-1 rounded transition-colors ${
              showBlend
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {showBlend ? 'Blending On' : 'Add Blend'}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {emotions.map((type) => {
            const Icon = EMOTION_ICONS[type];
            const color = emotionController.getEmotionColor(type);
            const isSelected = emotion.type === type;

            return (
              <motion.button
                key={type}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleEmotionSelect(type)}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-cyan-500/50 bg-cyan-500/10'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                }`}
              >
                <Icon
                  className="w-5 h-5"
                  style={{ color: isSelected ? color : undefined }}
                />
                <span
                  className={`text-[10px] ${
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

      {/* Intensity Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-slate-300">Intensity</label>
          <span className="text-xs text-slate-500">
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
        <div className="flex justify-between text-[10px] text-slate-500">
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
            <p className="text-xs text-slate-500">
              Mix a secondary emotion for more nuanced delivery
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {emotions
              .filter((type) => type !== emotion.type)
              .map((type) => {
                const Icon = EMOTION_ICONS[type];
                const color = emotionController.getEmotionColor(type);
                const isSelected = emotion.blend === type;

                return (
                  <motion.button
                    key={type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleBlendSelect(type)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-purple-500/50 bg-purple-500/10'
                        : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                    }`}
                  >
                    <Icon
                      className="w-4 h-4"
                      style={{ color: isSelected ? color : undefined }}
                    />
                    <span
                      className={`text-[9px] ${
                        isSelected ? 'text-slate-200' : 'text-slate-400'
                      }`}
                    >
                      {EMOTION_LABELS[type]}
                    </span>
                  </motion.button>
                );
              })}
          </div>

          {/* Blend Ratio */}
          {emotion.blend && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300">Blend Ratio</label>
                <span className="text-xs text-slate-500">
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
              <div className="flex justify-between text-[10px] text-slate-500">
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
            const color = emotionController.getEmotionColor(emotion.type);
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
                  <div className="text-xs text-slate-500">
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
