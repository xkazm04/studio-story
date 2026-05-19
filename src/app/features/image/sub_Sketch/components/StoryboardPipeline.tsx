'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  ChevronLeft,
  ChevronRight,
  Camera,
  Save,
  RefreshCw,
  Check,
  Loader2,
  MapPin,
  Users,
  Sparkles,
  Zap,
  Image as ImageIcon,
  Play,
} from 'lucide-react';
import { useStoryboardPipeline } from '@/app/hooks/integration/useStoryboardPipeline';
import { storyboardEngine } from '@/lib/image';
import type { StoryboardFrame, MoodPreset } from '@/lib/image';
import type { GeneratedPrompt, ShotType } from '@/lib/image';
import { cn } from '@/app/lib/utils';
import type { BeatType } from '@/app/types/Beat';

// ============================================================================
// Sub-components
// ============================================================================

const SHOT_TYPE_ICONS: Record<ShotType, string> = {
  establishing: '🏔️',
  master: '🎬',
  medium: '👤',
  'close-up': '😊',
  'extreme-close-up': '👁️',
  'over-shoulder': '🔄',
  reaction: '😮',
  detail: '🔍',
  action: '⚡',
};

const BEAT_TYPE_COLORS: Record<string, string> & Record<BeatType, string> = {
  setup: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  conflict: 'bg-red-500/20 text-red-300 border-red-500/30',
  climax: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  resolution: 'bg-green-500/20 text-green-300 border-green-500/30',
  transition: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  reveal: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  action: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
};

interface MoodBadgeProps {
  moodPreset: MoodPreset;
}

const MoodBadge: React.FC<MoodBadgeProps> = ({ moodPreset }) => {
  const colorClass = BEAT_TYPE_COLORS[moodPreset.beatType] || 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border', colorClass)}>
      <Zap className="w-3 h-3" />
      {moodPreset.beatType}
    </span>
  );
};

interface FrameThumbnailProps {
  frame: StoryboardFrame;
  isSelected: boolean;
  onClick: () => void;
}

const FrameThumbnail: React.FC<FrameThumbnailProps> = ({ frame, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      'relative flex-shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition-all',
      isSelected
        ? 'border-cyan-500 ring-2 ring-cyan-500/30'
        : 'border-slate-700 hover:border-slate-500'
    )}
  >
    {frame.existingImageUrl ? (
      <img
        src={frame.existingImageUrl}
        alt={frame.sceneName}
        className="w-full h-full object-cover"
      />
    ) : (
      <div className="w-full h-full bg-slate-800 flex items-center justify-center">
        <Film className="w-3 h-3 text-slate-500" />
      </div>
    )}
    <div className="absolute bottom-0 left-0 right-0 bg-slate-900/80 px-1 py-px">
      <span className="text-xs text-slate-300 truncate block">
        {frame.order + 1}
      </span>
    </div>
  </button>
);

interface PromptVariantTabsProps {
  prompts: GeneratedPrompt[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

const PromptVariantTabs: React.FC<PromptVariantTabsProps> = ({
  prompts,
  selectedIndex,
  onSelect,
}) => (
  <div className="flex flex-wrap gap-1">
    {prompts.map((prompt, index) => {
      const icon = SHOT_TYPE_ICONS[prompt.shotType] || '📷';
      return (
        <button
          key={prompt.id}
          onClick={() => onSelect(index)}
          className={cn(
            'px-2 py-1 rounded text-xs font-medium transition-colors border',
            selectedIndex === index
              ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-100'
              : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-300'
          )}
        >
          <span className="mr-1">{icon}</span>
          {prompt.shotType}
        </button>
      );
    })}
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

interface StoryboardPipelineProps {
  /** Called when user wants to load a frame's prompt into the sketch canvas */
  onLoadPrompt?: (prompt: string, negativePrompt: string) => void;
  /** Called when user wants to generate image for the current frame */
  onGenerateFrame?: (prompt: string, negativePrompt: string) => void;
  className?: string;
}

export const StoryboardPipeline: React.FC<StoryboardPipelineProps> = ({
  onLoadPrompt,
  onGenerateFrame,
  className,
}) => {
  const {
    actGroups,
    selectedFrame,
    selectFrame,
    nextFrame,
    prevFrame,
    selectPromptVariant,
    saveFrameImage,
    regenerateFrame,
    isLoading,
    totalFrames,
    currentFrameIndex,
  } = useStoryboardPipeline();

  const [isSaving, setIsSaving] = useState(false);
  const [savedFrameId, setSavedFrameId] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<'context' | 'prompt' | null>('prompt');

  // Save image to scene
  const handleSaveToScene = useCallback(
    async (imageUrl: string) => {
      if (!selectedFrame) return;
      setIsSaving(true);
      try {
        const prompt = storyboardEngine.getFramePrompt(selectedFrame);
        await saveFrameImage(selectedFrame.sceneId, imageUrl, prompt);
        setSavedFrameId(selectedFrame.sceneId);
        setTimeout(() => setSavedFrameId(null), 2000);
      } finally {
        setIsSaving(false);
      }
    },
    [selectedFrame, saveFrameImage]
  );

  // Load prompt into sketch canvas
  const handleLoadPrompt = useCallback(() => {
    if (!selectedFrame || !onLoadPrompt) return;
    const prompt = storyboardEngine.getFramePrompt(selectedFrame);
    const negative = storyboardEngine.getFrameNegativePrompt(selectedFrame);
    onLoadPrompt(prompt, negative);
  }, [selectedFrame, onLoadPrompt]);

  // Generate image for frame
  const handleGenerate = useCallback(() => {
    if (!selectedFrame || !onGenerateFrame) return;
    const prompt = storyboardEngine.getFramePrompt(selectedFrame);
    const negative = storyboardEngine.getFrameNegativePrompt(selectedFrame);
    onGenerateFrame(prompt, negative);
  }, [selectedFrame, onGenerateFrame]);

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12 text-slate-400', className)}>
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading story data...
      </div>
    );
  }

  if (totalFrames === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-slate-400', className)}>
        <Film className="w-10 h-10 mb-3 text-slate-500" />
        <p className="text-sm font-medium text-slate-300">No scenes found</p>
        <p className="text-xs text-slate-500 mt-1">
          Create scenes in your story to generate a storyboard
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-slate-200">Storyboard</span>
          <span className="text-xs px-1.5 py-0.5 bg-slate-700 rounded-full text-slate-400">
            {currentFrameIndex + 1}/{totalFrames}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={prevFrame}
            disabled={currentFrameIndex === 0}
            className={cn(
              'p-1.5 rounded transition-colors',
              currentFrameIndex === 0
                ? 'text-slate-600 cursor-not-allowed'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextFrame}
            disabled={currentFrameIndex >= totalFrames - 1}
            className={cn(
              'p-1.5 rounded transition-colors',
              currentFrameIndex >= totalFrames - 1
                ? 'text-slate-600 cursor-not-allowed'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            )}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Frame thumbnail strip */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
        {actGroups.map((group) => (
          <React.Fragment key={group.actId}>
            {actGroups.length > 1 && (
              <div className="flex-shrink-0 flex items-center px-1">
                <span className="text-xs text-slate-500 writing-mode-vertical rotate-180 whitespace-nowrap"
                  style={{ writingMode: 'vertical-rl' }}>
                  {group.actName}
                </span>
              </div>
            )}
            {group.frames.map((frame) => (
              <FrameThumbnail
                key={frame.sceneId}
                frame={frame}
                isSelected={selectedFrame?.sceneId === frame.sceneId}
                onClick={() => selectFrame(frame.sceneId)}
              />
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Selected frame detail */}
      {selectedFrame && (
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedFrame.sceneId}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="space-y-3"
          >
            {/* Frame header */}
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-100 truncate">
                    {selectedFrame.sceneName}
                  </h4>
                  <MoodBadge moodPreset={selectedFrame.moodPreset} />
                </div>
                {selectedFrame.beatName && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Beat: {selectedFrame.beatName}
                  </p>
                )}
              </div>
              <button
                onClick={() => regenerateFrame(selectedFrame.sceneId)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                title="Regenerate prompts"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Existing image preview */}
            {selectedFrame.existingImageUrl && (
              <div className="relative rounded-lg overflow-hidden border border-slate-700">
                <img
                  src={selectedFrame.existingImageUrl}
                  alt={selectedFrame.sceneName}
                  className="w-full h-32 object-cover"
                />
                <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-300">
                  Saved
                </div>
              </div>
            )}

            {/* Scene context summary (collapsible) */}
            <button
              onClick={() => setExpandedSection(expandedSection === 'context' ? null : 'context')}
              className="w-full flex items-center justify-between px-2 py-1.5 bg-slate-800/50 rounded text-xs hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2 text-slate-300">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Scene Context
              </div>
              <ChevronRight
                className={cn(
                  'w-3 h-3 text-slate-500 transition-transform',
                  expandedSection === 'context' && 'rotate-90'
                )}
              />
            </button>

            <AnimatePresence>
              {expandedSection === 'context' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 px-2 pb-2">
                    {/* Characters */}
                    {selectedFrame.context.characters.length > 0 && (
                      <div className="flex items-start gap-1.5">
                        <Users className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-slate-400">
                          {selectedFrame.context.characters
                            .map((c) => `${c.name}${c.emotion ? ` (${c.emotion})` : ''}`)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                    {/* Setting */}
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-slate-400">
                        {selectedFrame.context.setting.location}
                        {selectedFrame.context.setting.timeOfDay !== 'unknown' &&
                          ` (${selectedFrame.context.setting.timeOfDay})`}
                      </span>
                    </div>
                    {/* Mood */}
                    <div className="flex items-start gap-1.5">
                      <Zap className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-slate-400">
                        {selectedFrame.context.mood.primary} — intensity{' '}
                        {selectedFrame.context.mood.intensity}/5
                      </span>
                    </div>
                    {/* Lighting from mood preset */}
                    <div className="flex items-start gap-1.5">
                      <Camera className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-slate-400">
                        {selectedFrame.moodPreset.lighting}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Shot type variants */}
            <div>
              <button
                onClick={() => setExpandedSection(expandedSection === 'prompt' ? null : 'prompt')}
                className="w-full flex items-center justify-between px-2 py-1.5 bg-slate-800/50 rounded text-xs hover:bg-slate-800 transition-colors mb-2"
              >
                <div className="flex items-center gap-2 text-slate-300">
                  <Camera className="w-3 h-3 text-amber-400" />
                  Shot Variants ({selectedFrame.prompts.length})
                </div>
                <ChevronRight
                  className={cn(
                    'w-3 h-3 text-slate-500 transition-transform',
                    expandedSection === 'prompt' && 'rotate-90'
                  )}
                />
              </button>

              <AnimatePresence>
                {expandedSection === 'prompt' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2">
                      <PromptVariantTabs
                        prompts={selectedFrame.prompts}
                        selectedIndex={selectedFrame.selectedPromptIndex}
                        onSelect={selectPromptVariant}
                      />

                      {/* Selected prompt preview */}
                      {selectedFrame.prompts[selectedFrame.selectedPromptIndex] && (
                        <div className="bg-slate-900/50 rounded p-2 border border-slate-800/50">
                          <p className="text-xs text-slate-400 leading-relaxed line-clamp-4">
                            {selectedFrame.prompts[selectedFrame.selectedPromptIndex].main}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-slate-500">
                              Confidence:{' '}
                              {Math.round(
                                selectedFrame.prompts[selectedFrame.selectedPromptIndex]
                                  .confidence * 100
                              )}
                              %
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {onLoadPrompt && (
                <button
                  onClick={handleLoadPrompt}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Load Prompt
                </button>
              )}
              {onGenerateFrame && (
                <button
                  onClick={handleGenerate}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-gradient-to-r from-cyan-500 to-blue-500 text-white ms-shadow-subtle shadow-cyan-500/25 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  Generate
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default StoryboardPipeline;
