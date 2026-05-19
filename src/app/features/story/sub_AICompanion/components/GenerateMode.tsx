/**
 * GenerateMode — "Write Content" mode for AI Companion
 * Generates and displays content variations for the current scene
 */

'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TYPOGRAPHY, SEMANTIC_COLORS, FM_VARIANTS, FM_TRANSITION, fmStagger } from '@/workspace/theme/tokens';
import {
  Wand2,
  Loader2,
  RefreshCw,
  Check,
  PenTool,
} from 'lucide-react';
import { Button } from '@/app/components/UI/Button';
import type { ContentVariant } from '../types';

interface GenerateModeProps {
  variants: ContentVariant[];
  isGenerating: boolean;
  hasCurrentScene: boolean;
  onGenerate: () => void;
  onApply: (variant: ContentVariant) => void;
}

export function GenerateMode({
  variants,
  isGenerating,
  hasCurrentScene,
  onGenerate,
  onApply,
}: GenerateModeProps) {
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
