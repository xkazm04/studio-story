/**
 * AICompanion Component
 * AI-powered story writing assistant panel — mode routing and shared layout
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TYPOGRAPHY, SEMANTIC_COLORS, FM_VARIANTS, FM_TRANSITION } from '@/workspace/theme/tokens';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  XCircle,
  Lightbulb,
  PenTool,
  Network,
  Brain,
} from 'lucide-react';
import { useAICompanion } from './useAICompanion';
import type { AICompanionMode } from './types';
import type { BrainstormStoryContext } from '../types/ai-writing';
import { SuggestMode } from './components/SuggestMode';
import { GenerateMode } from './components/GenerateMode';
import { ArchitectMode } from './components/ArchitectMode';
import { BrainstormMode } from './components/BrainstormMode';

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

const orderedModes: AICompanionMode[] = ['suggest', 'generate', 'architect', 'brainstorm'];

export function AICompanion({ className }: AICompanionProps) {
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
            <motion.div key="suggest" {...FM_VARIANTS.slideInLeft} transition={FM_TRANSITION.normal}>
              <SuggestMode
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
            <motion.div key="generate" {...FM_VARIANTS.slideInLeft} transition={FM_TRANSITION.normal}>
              <GenerateMode
                variants={contentVariants}
                isGenerating={isGenerating}
                hasCurrentScene={hasCurrentScene}
                onGenerate={generateContentVariants}
                onApply={applyContentVariant}
              />
            </motion.div>
          )}

          {mode === 'architect' && (
            <motion.div key="architect" {...FM_VARIANTS.slideInLeft} transition={FM_TRANSITION.normal}>
              <ArchitectMode
                isGenerating={isGenerating}
                hasCurrentScene={hasCurrentScene}
                onGenerate={generateStoryStructure}
              />
            </motion.div>
          )}

          {mode === 'brainstorm' && (
            <motion.div key="brainstorm" {...FM_VARIANTS.slideInLeft} transition={FM_TRANSITION.normal}>
              <BrainstormMode
                projectId="default"
                currentSceneId={currentSceneId}
                storyContext={storyContext}
                isGenerating={isGenerating}
                disabled={false}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default AICompanion;
