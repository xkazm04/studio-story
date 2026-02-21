'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Wand2, Loader2 } from 'lucide-react';
import { useCLIFeature } from '@/app/hooks/useCLIFeature';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import InlineTerminal from '@/cli/InlineTerminal';

interface NegativePromptGeneratorProps {
  mainPrompt: string;
  onGenerated: (negativePrompt: string) => void;
}

const NegativePromptGenerator: React.FC<NegativePromptGeneratorProps> = ({
  mainPrompt,
  onGenerated,
}) => {
  const { selectedProject } = useProjectStore();

  const cli = useCLIFeature({
    featureId: 'neg-prompt',
    projectId: selectedProject?.id || '',
    projectPath: typeof window !== 'undefined' ? window.location.origin : '',
  });

  const handleGenerate = () => {
    if (!mainPrompt.trim()) {
      alert('Please fill in some prompt sections first');
      return;
    }

    const prompt = `Generate a negative prompt for AI image generation. The main prompt is:
"${mainPrompt}"

Return ONLY the negative prompt text — a comma-separated list of things to avoid in the generated image (e.g., "blurry, low quality, deformed, watermark, text, signature"). Focus on quality issues, unwanted elements, and style artifacts to avoid. Keep it under 200 words.`;

    cli.executePrompt(prompt, 'Negative Prompt');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <motion.button
          onClick={handleGenerate}
          disabled={cli.isRunning || !mainPrompt.trim()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
            transition-colors duration-200
            ${cli.isRunning || !mainPrompt.trim()
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
            }
          `}
        >
          {cli.isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Generate with AI
            </>
          )}
        </motion.button>

        <span className="text-xs text-gray-500">
          AI will suggest things to avoid
        </span>
      </div>

      <InlineTerminal
        {...cli.terminalProps}
        height={120}
        collapsible
        onInsert={onGenerated}
      />
    </div>
  );
};

export default NegativePromptGenerator;
