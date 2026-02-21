'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { Appearance } from '@/app/types/Character';
import { generateFacialFeaturesPrompt, generateClothingPrompt } from '../lib/promptGenerators';

interface PromptGeneratorProps {
  type: 'facial' | 'clothing';
  appearance: Appearance;
  onPromptGenerated: (prompt: string) => void;
}

/**
 * Prompt Generator Component
 * Generates prompts for Facial Features or Clothing & Style sections
 */
export function PromptGenerator({ type, appearance, onPromptGenerated }: PromptGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);

    // Simulate API call delay (in future, this could call Ollama to enhance the prompt)
    setTimeout(() => {
      let prompt = '';
      if (type === 'facial') {
        prompt = generateFacialFeaturesPrompt(appearance);
      } else {
        prompt = generateClothingPrompt(appearance);
      }

      onPromptGenerated(prompt);
      setIsGenerating(false);
    }, 500);
  };

  const label = type === 'facial' ? 'Facial Features' : 'Clothing & Style';
  const colorClasses = type === 'facial'
    ? 'bg-purple-600 hover:bg-purple-700'
    : 'bg-green-600 hover:bg-green-700';

  return (
    <button
      onClick={handleGenerate}
      disabled={isGenerating}
      className={cn('flex items-center gap-2 px-3 py-1.5', colorClasses, 'disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors text-xs')}
      title={`Generate prompt for ${label}`}
    >
      {isGenerating ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles size={14} />
          Generate Prompt
        </>
      )}
    </button>
  );
}
