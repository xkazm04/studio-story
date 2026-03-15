/**
 * AICompanion Component
 * AI-powered story writing assistant panel
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TYPOGRAPHY, SEMANTIC_COLORS, FM_VARIANTS, FM_TRANSITION, fmStagger } from '@/workspace/theme/tokens';
import {
  Sparkles,
  Wand2,
  Loader2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  XCircle,
  Check,
  ArrowRight,
  Lightbulb,
  PenTool,
  Network,
  Brain,
} from 'lucide-react';
import { Button } from '@/app/components/UI/Button';
import { Label } from '@/app/components/UI/Label';
import { useAICompanion } from './useAICompanion';
import type { AICompanionMode, ContentVariant, NextStepSuggestion } from './types';
import { BrainstormMode } from './components/BrainstormMode';
import type { StoryContext as BrainstormStoryContext } from '@/lib/brainstorm';

interface AICompanionProps {
  className?: string;
  defaultExpanded?: boolean;
}

const modeConfig = {
  suggest: {
    label: 'Next Steps',
    icon: Lightbulb,
    description: 'AI suggests what happens next',
  },
  generate: {
    label: 'Write Content',
    icon: PenTool,
    description: 'AI writes this scene',
  },
  architect: {
    label: 'Story Architect',
    icon: Network,
    description: 'Build story structure',
  },
  brainstorm: {
    label: 'Brainstorm',
    icon: Brain,
    description: 'Generate ideas & explore what-ifs',
  },
};

export function AICompanion({ className, defaultExpanded = true }: AICompanionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const {
    state,
    setMode,
    clearError,
    generateContentVariants,
    applyContentVariant,
    generateNextSteps,
    acceptNextStep,
    declineNextStep,
    dismissAllSuggestions,
    generateStoryStructure,
    scenesLength,
    currentSceneId,
    hasCurrentScene,
  } = useAICompanion({ enabled: true });

  const { mode, isGenerating, error, contentVariants, nextStepSuggestions } = state;

  // Architect form state
  const [architectLevels, setArchitectLevels] = useState(2);
  const [architectChoicesPerScene, setArchitectChoicesPerScene] = useState(2);

  const orderedModes: AICompanionMode[] = ['suggest', 'generate', 'architect', 'brainstorm'];

  const handleModeShortcuts = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const keyMap: Record<string, AICompanionMode> = {
      '1': 'suggest',
      '2': 'generate',
      '3': 'architect',
      '4': 'brainstorm',
    };

    const directMode = keyMap[event.key];
    if ((event.metaKey || event.ctrlKey) && directMode) {
      event.preventDefault();
      setMode(directMode);
      return;
    }

    if (!(event.metaKey || event.ctrlKey)) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    const currentIndex = orderedModes.indexOf(mode);
    if (currentIndex < 0) return;
    event.preventDefault();

    const nextIndex =
      event.key === 'ArrowRight'
        ? (currentIndex + 1) % orderedModes.length
        : (currentIndex - 1 + orderedModes.length) % orderedModes.length;

    setMode(orderedModes[nextIndex]);
  };

  const handleArchitectGenerate = () => {
    generateStoryStructure(architectLevels, architectChoicesPerScene);
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={handleModeShortcuts}
      aria-label="AI Companion panel. Use Ctrl/Cmd+1 through Ctrl/Cmd+4 to switch modes."
      className={cn('h-full flex flex-col bg-slate-950 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40', className)}
    >
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-1.5 rounded-lg', SEMANTIC_COLORS.brand.bg)}>
              <Sparkles className={cn('w-4 h-4', SEMANTIC_COLORS.brand.text)} />
            </div>
            <div>
              <h2 className={TYPOGRAPHY.h2}>AI Story Companion</h2>
              <p className={TYPOGRAPHY.caption}>{modeConfig[mode].description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isGenerating && <Loader2 className={cn('w-4 h-4 animate-spin', SEMANTIC_COLORS.brand.text)} />}
            {nextStepSuggestions.length > 0 && (
              <span className={cn('px-1.5 py-0.5 text-sm font-medium rounded', SEMANTIC_COLORS.brand.bg, SEMANTIC_COLORS.brand.text)}>
                {nextStepSuggestions.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="shrink-0 flex border-b border-slate-800">
        {(Object.keys(modeConfig) as AICompanionMode[]).map((m) => {
          const config = modeConfig[m];
          const Icon = config.icon;
          const isActive = mode === m;

          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? cn(SEMANTIC_COLORS.brand.bg, SEMANTIC_COLORS.brand.text, 'border-b-2', SEMANTIC_COLORS.brand.border, '-mb-px')
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* Error Display */}
      {error && (
        <div className={cn('shrink-0 p-3 border-b', SEMANTIC_COLORS.danger.bg, SEMANTIC_COLORS.danger.border)}>
          <div className={cn('flex items-center gap-2 text-sm', SEMANTIC_COLORS.danger.text)}>
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={clearError} className="hover:opacity-70">
              <XCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {mode === 'suggest' && (
            <motion.div
              key="suggest"
              {...FM_VARIANTS.slideInLeft}
              transition={FM_TRANSITION.normal}
            >
              <SuggestModeContent
                suggestions={nextStepSuggestions}
                isGenerating={isGenerating}
                scenesLength={scenesLength}
                currentSceneId={currentSceneId}
                onGenerate={() => generateNextSteps(currentSceneId || undefined)}
                onAccept={acceptNextStep}
                onDecline={declineNextStep}
                onDismissAll={dismissAllSuggestions}
              />
            </motion.div>
          )}

          {mode === 'generate' && (
            <motion.div
              key="generate"
              {...FM_VARIANTS.slideInLeft}
              transition={FM_TRANSITION.normal}
            >
              <GenerateModeContent
                variants={contentVariants}
                isGenerating={isGenerating}
                hasCurrentScene={hasCurrentScene}
                onGenerate={generateContentVariants}
                onApply={applyContentVariant}
              />
            </motion.div>
          )}

          {mode === 'architect' && (
            <motion.div
              key="architect"
              {...FM_VARIANTS.slideInLeft}
              transition={FM_TRANSITION.normal}
            >
              <ArchitectModeContent
                levels={architectLevels}
                choicesPerScene={architectChoicesPerScene}
                isGenerating={isGenerating}
                hasCurrentScene={hasCurrentScene}
                onLevelsChange={setArchitectLevels}
                onChoicesPerSceneChange={setArchitectChoicesPerScene}
                onGenerate={handleArchitectGenerate}
              />
            </motion.div>
          )}

          {mode === 'brainstorm' && (
            <motion.div
              key="brainstorm"
              {...FM_VARIANTS.slideInLeft}
              transition={FM_TRANSITION.normal}
            >
              <BrainstormModeContent
                currentSceneId={currentSceneId}
                hasCurrentScene={hasCurrentScene}
                isGenerating={isGenerating}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// === Sub-components ===

interface SuggestModeContentProps {
  suggestions: NextStepSuggestion[];
  isGenerating: boolean;
  scenesLength: number;
  currentSceneId: string | null;
  onGenerate: () => void;
  onAccept: (suggestion: NextStepSuggestion) => void;
  onDecline: (id: string) => void;
  onDismissAll: () => void;
}

function SuggestModeContent({
  suggestions,
  isGenerating,
  scenesLength,
  currentSceneId,
  onGenerate,
  onAccept,
  onDecline,
  onDismissAll,
}: SuggestModeContentProps) {
  if (scenesLength === 0) {
    return (
      <div className="text-center py-8">
        <Wand2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <p className="text-sm text-slate-400">Create your first scene to get AI suggestions</p>
      </div>
    );
  }

  if (suggestions.length === 0 && !isGenerating) {
    return (
      <div className="text-center py-8">
        <Lightbulb className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <p className="text-sm text-slate-400 mb-4">
          {currentSceneId ? 'Ready to suggest what happens next' : 'Select a scene to get suggestions'}
        </p>
        <Button onClick={onGenerate} disabled={!currentSceneId} className="gap-2">
          <Sparkles className="w-4 h-4" />
          Generate Ideas
        </Button>
      </div>
    );
  }

  if (isGenerating && suggestions.length === 0) {
    return (
      <div className="text-center py-8">
        <Loader2 className={cn('w-10 h-10 mx-auto mb-3 animate-spin', SEMANTIC_COLORS.brand.text, 'opacity-50')} />
        <p className="text-sm text-slate-400">Thinking about what happens next...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          <span className="font-semibold text-slate-300">{suggestions.length}</span> suggestions
        </p>
        <div className="flex gap-2">
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className={cn(
              'flex items-center gap-1 px-2 py-1 text-sm font-medium rounded',
              SEMANTIC_COLORS.brand.bg, SEMANTIC_COLORS.brand.text, SEMANTIC_COLORS.brand.hover,
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <RefreshCw className={cn('w-3 h-3', isGenerating && 'animate-spin')} />
            Refresh
          </button>
          <button
            onClick={onDismissAll}
            className="flex items-center gap-1 px-2 py-1 text-sm font-medium rounded bg-slate-800 text-slate-400 hover:bg-slate-700"
          >
            <XCircle className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onAccept={() => onAccept(suggestion)}
            onDecline={() => onDecline(suggestion.id)}
          />
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-400 pt-2 border-t border-slate-800">
        <span className="flex items-center gap-1">
          <div className={cn('w-2 h-2 rounded-full', SEMANTIC_COLORS.success.dot)} />
          High
        </span>
        <span className="flex items-center gap-1">
          <div className={cn('w-2 h-2 rounded-full', SEMANTIC_COLORS.warning.dot)} />
          Medium
        </span>
        <span className="flex items-center gap-1">
          <div className={cn('w-2 h-2 rounded-full', SEMANTIC_COLORS.danger.dot)} />
          Low
        </span>
      </div>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  onAccept,
  onDecline,
}: {
  suggestion: NextStepSuggestion;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const confidenceColor =
    suggestion.confidence >= 0.7
      ? SEMANTIC_COLORS.success.dot
      : suggestion.confidence >= 0.4
      ? SEMANTIC_COLORS.warning.dot
      : SEMANTIC_COLORS.danger.dot;

  return (
    <motion.div
      {...FM_VARIANTS.fadeIn}
      transition={FM_TRANSITION.normal}
      className="p-3 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors"
    >
      <div className="flex items-start gap-2 mb-2">
        <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', confidenceColor)} />
        <div className="flex-1 min-w-0">
          <h4 className={cn(TYPOGRAPHY.h3, 'truncate')}>{suggestion.title}</h4>
          <p className="text-sm text-slate-400 line-clamp-2 mt-0.5">{suggestion.content}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className={cn('text-sm flex items-center gap-1', SEMANTIC_COLORS.brand.text)}>
          <ArrowRight className="w-3 h-3" />
          {suggestion.choiceLabel}
        </span>
        <div className="flex gap-1.5">
          <button
            onClick={onAccept}
            className={cn('p-1.5 rounded', SEMANTIC_COLORS.brand.bg, SEMANTIC_COLORS.brand.text, SEMANTIC_COLORS.brand.hover)}
            title="Accept suggestion"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDecline}
            className="p-1.5 rounded bg-slate-700 text-slate-400 hover:bg-slate-600"
            title="Decline suggestion"
          >
            <XCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

interface GenerateModeContentProps {
  variants: ContentVariant[];
  isGenerating: boolean;
  hasCurrentScene: boolean;
  onGenerate: () => void;
  onApply: (variant: ContentVariant) => void;
}

function GenerateModeContent({
  variants,
  isGenerating,
  hasCurrentScene,
  onGenerate,
  onApply,
}: GenerateModeContentProps) {
  if (!hasCurrentScene) {
    return (
      <div className="text-center py-8">
        <PenTool className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <p className="text-sm text-slate-400">Select a scene to generate content</p>
      </div>
    );
  }

  if (variants.length === 0 && !isGenerating) {
    return (
      <div className="text-center py-8">
        <PenTool className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <p className="text-sm text-slate-400 mb-4">Generate 3 content variations for your current scene</p>
        <Button onClick={onGenerate} className="gap-2">
          <Wand2 className="w-4 h-4" />
          Write Scene
        </Button>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="text-center py-8">
        <Loader2 className={cn('w-10 h-10 mx-auto mb-3 animate-spin', SEMANTIC_COLORS.brand.text, 'opacity-50')} />
        <p className="text-sm text-slate-400">Writing your scene...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-slate-400">Choose a version:</p>
        <button onClick={onGenerate} className={cn('text-sm hover:underline flex items-center gap-1', SEMANTIC_COLORS.brand.text)}>
          <RefreshCw className="w-3 h-3" />
          Regenerate
        </button>
      </div>
      {variants.map((variant, index) => (
        <motion.div
          key={variant.id}
          {...FM_VARIANTS.fadeIn}
          transition={{ ...FM_TRANSITION.normal, ...fmStagger(index * 2) }}
          onClick={() => onApply(variant)}
          className="p-3 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={TYPOGRAPHY.h3}>Option {index + 1}</h4>
            <span className="text-sm text-slate-400 shrink-0">{Math.round(variant.confidence * 100)}%</span>
          </div>
          <p className="text-sm text-slate-400 line-clamp-3">{variant.content}</p>
          {variant.choices && variant.choices.length > 0 && (
            <p className={cn('text-sm mt-2', SEMANTIC_COLORS.brand.text)}>
              + {variant.choices.length} choice{variant.choices.length > 1 ? 's' : ''}
            </p>
          )}
          <button className={cn('mt-2 text-sm hover:underline flex items-center gap-1', SEMANTIC_COLORS.brand.text)}>
            <Check className="w-3 h-3" />
            Apply this version
          </button>
        </motion.div>
      ))}
    </div>
  );
}

interface ArchitectModeContentProps {
  levels: number;
  choicesPerScene: number;
  isGenerating: boolean;
  hasCurrentScene: boolean;
  onLevelsChange: (value: number) => void;
  onChoicesPerSceneChange: (value: number) => void;
  onGenerate: () => void;
}

function ArchitectModeContent({
  levels,
  choicesPerScene,
  isGenerating,
  hasCurrentScene,
  onLevelsChange,
  onChoicesPerSceneChange,
  onGenerate,
}: ArchitectModeContentProps) {
  const calculateTotalScenes = () => {
    let total = 0;
    for (let i = 1; i <= levels; i++) {
      total += Math.pow(choicesPerScene, i);
    }
    return total;
  };

  const totalScenes = calculateTotalScenes();

  if (!hasCurrentScene) {
    return (
      <div className="text-center py-8">
        <Network className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <p className="text-sm text-slate-400">Select a scene to branch from</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400">Generate a branching tree from the current scene.</p>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-slate-400">Levels deep:</Label>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => onLevelsChange(n)}
                disabled={isGenerating}
                className={cn(
                  'w-7 h-7 rounded-full text-sm font-bold transition-all',
                  'border-2 flex items-center justify-center',
                  levels === n
                    ? 'bg-purple-600 text-white border-purple-500 scale-110'
                    : cn('bg-transparent border-slate-700 text-slate-400', 'hover:border-purple-500/50'),
                  isGenerating && 'opacity-50 cursor-not-allowed'
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-slate-400">Choices per scene:</Label>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => onChoicesPerSceneChange(n)}
                disabled={isGenerating}
                className={cn(
                  'w-7 h-7 rounded-full text-sm font-bold transition-all',
                  'border-2 flex items-center justify-center',
                  choicesPerScene === n
                    ? 'bg-purple-600 text-white border-purple-500 scale-110'
                    : 'bg-transparent border-slate-700 text-slate-400 hover:border-purple-500/50',
                  isGenerating && 'opacity-50 cursor-not-allowed'
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-slate-400 py-2 border-t border-slate-800">
        Will generate <span className="font-semibold text-slate-300">{totalScenes}</span> new scenes
      </div>

      <Button onClick={onGenerate} disabled={isGenerating} className="w-full gap-2">
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating Tree...
          </>
        ) : (
          <>
            <Network className="w-4 h-4" />
            Generate Tree
          </>
        )}
      </Button>
    </div>
  );
}

interface BrainstormModeContentProps {
  currentSceneId: string | null;
  hasCurrentScene: boolean;
  isGenerating: boolean;
}

function BrainstormModeContent({
  currentSceneId,
  hasCurrentScene,
  isGenerating,
}: BrainstormModeContentProps) {
  // Build a simple story context for brainstorming
  // In a real implementation, this would come from the useAICompanion hook
  const storyContext: BrainstormStoryContext | null = hasCurrentScene
    ? {
        currentSceneTitle: 'Current Scene',
        currentSceneSummary: '',
        characters: [],
        recentEvents: [],
        activeConflicts: [],
        themes: [],
        genre: 'general',
        mood: 'neutral',
      }
    : null;

  return (
    <BrainstormMode
      projectId="default"
      currentSceneId={currentSceneId}
      storyContext={storyContext}
      isGenerating={isGenerating}
      disabled={false}
    />
  );
}

export default AICompanion;
