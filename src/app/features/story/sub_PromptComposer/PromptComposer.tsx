'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Layers, Library, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FM_VARIANTS, FM_TRANSITION } from '@/workspace/theme/tokens';

import { ImagePromptComposer } from './ImagePromptComposer';
import { ContextBuilder } from './components/ContextBuilder';
import { TemplateLibraryTab } from './TemplateLibraryTab';
import { ContextPinManager } from './components/ContextPinManager';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import type { ContextElement, CompressedContext } from '@/lib/context';
import type { ComposerMode } from '../types/ai-writing';

interface PromptComposerProps {
  onImageSelect?: (imageUrl: string, prompt: string) => void;
  isGenerating?: boolean;
  sceneContent?: string;
  contextElements?: ContextElement[];
  focusSceneId?: string;
  focusCharacterIds?: string[];
  onContextGenerated?: (context: CompressedContext) => void;
}

export default function PromptComposer({
  onImageSelect,
  isGenerating = false,
  sceneContent,
  contextElements = [],
  focusSceneId,
  focusCharacterIds,
  onContextGenerated,
}: PromptComposerProps) {
  const [mode, setMode] = useState<ComposerMode>('image');
  const selectedProject = useProjectStore((s) => s.selectedProject);

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Mode Switcher — always visible */}
      <div className="shrink-0 flex border-b border-slate-800">
        <button
          onClick={() => setMode('image')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors',
            mode === 'image'
              ? 'bg-cyan-600/10 text-cyan-400 border-b-2 border-cyan-500 -mb-px'
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
          )}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Image Prompt</span>
        </button>
        <button
          onClick={() => setMode('context')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors',
            mode === 'context'
              ? 'bg-purple-600/10 text-purple-400 border-b-2 border-purple-500 -mb-px'
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Context Builder</span>
        </button>
        <button
          onClick={() => setMode('pins')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors',
            mode === 'pins'
              ? 'bg-emerald-600/10 text-emerald-400 border-b-2 border-emerald-500 -mb-px'
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
          )}
        >
          <Pin className="w-3.5 h-3.5" />
          <span>Story Rules</span>
        </button>
        <button
          onClick={() => setMode('templates')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors',
            mode === 'templates'
              ? 'bg-amber-600/10 text-amber-400 border-b-2 border-amber-500 -mb-px'
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
          )}
        >
          <Library className="w-3.5 h-3.5" />
          <span>Templates</span>
        </button>
      </div>

      {/* Mode Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {mode === 'image' && (
            <motion.div
              key="image-mode"
              {...FM_VARIANTS.slideInLeft}
              transition={FM_TRANSITION.normal}
              className="h-full flex flex-col"
            >
              <ImagePromptComposer
                isGenerating={isGenerating}
                onImageSelect={onImageSelect}
              />
            </motion.div>
          )}

          {mode === 'context' && (
            <motion.div
              key="context-mode"
              {...FM_VARIANTS.slideInLeft}
              transition={FM_TRANSITION.normal}
              className="h-full"
            >
              <ContextBuilder
                elements={contextElements}
                focusSceneId={focusSceneId}
                focusCharacterIds={focusCharacterIds}
                currentContent={sceneContent}
                onContextGenerated={onContextGenerated}
                className="h-full"
              />
            </motion.div>
          )}

          {mode === 'pins' && (
            <motion.div
              key="pins-mode"
              {...FM_VARIANTS.slideInLeft}
              transition={FM_TRANSITION.normal}
              className="h-full flex flex-col"
            >
              <ContextPinManager
                projectId={selectedProject?.id}
                className="h-full"
              />
            </motion.div>
          )}

          {mode === 'templates' && (
            <motion.div
              key="templates-mode"
              {...FM_VARIANTS.slideInLeft}
              transition={FM_TRANSITION.normal}
              className="h-full flex flex-col"
            >
              <TemplateLibraryTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
