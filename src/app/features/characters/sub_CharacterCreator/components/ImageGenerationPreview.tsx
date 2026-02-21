'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { SectionWrapper } from '@/app/components/UI';

interface ImageGenerationPreviewProps {
  prompt: string;
}

/**
 * Image Generation Preview Component
 * Displays skeleton slots for future character image generation
 */
export function ImageGenerationPreview({ prompt }: ImageGenerationPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSlots, setShowSlots] = useState(false);

  const handleGenerate = () => {
    if (!prompt.trim()) {
      alert('Please enter an AI Generation Prompt first');
      return;
    }

    setIsGenerating(true);
    setShowSlots(true);

    // Simulate generation delay
    setTimeout(() => {
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <SectionWrapper borderColor="orange" padding="md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-semibold text-white mb-1">Image Generation Preview</h4>
          <p className="text-xs text-gray-400">
            Generate character sketches in different styles
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors text-sm"
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generate Images
            </>
          )}
        </button>
      </div>

      {showSlots && (
        <div className="mt-4">
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="aspect-square bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden group"
              >
                {/* Skeleton loading animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/50 to-transparent animate-shimmer" />

                {/* Placeholder content */}
                <div className="relative z-10 flex flex-col items-center gap-2 text-gray-600">
                  <Sparkles size={24} className="opacity-50" />
                  <span className="text-xs font-medium">Slot {index + 1}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Image generation integration coming soon. These slots will display character sketches.
          </p>
        </div>
      )}
    </SectionWrapper>
  );
}
