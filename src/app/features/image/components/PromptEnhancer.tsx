'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useCLIFeature } from '@/app/hooks/useCLIFeature';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { SmartGenerateButton } from '@/app/components/UI/SmartGenerateButton';
import { Button } from '@/app/components/UI/Button';
import InlineTerminal from '@/cli/InlineTerminal';

interface PromptEnhancerProps {
  currentPrompt: string;
  promptType: string;
  onEnhanced: (enhancedPrompt: string) => void;
}

const PromptEnhancer: React.FC<PromptEnhancerProps> = ({
  currentPrompt,
  promptType,
  onEnhanced,
}) => {
  const { selectedProject } = useProjectStore();

  const cli = useCLIFeature({
    featureId: 'img-enhance',
    projectId: selectedProject?.id || '',
    projectPath: typeof window !== 'undefined' ? window.location.origin : '',
    defaultSkills: ['image-prompt-enhance', 'image-prompt-compose'],
  });

  const handleEnhance = () => {
    if (!currentPrompt.trim()) {
      alert('Please enter some text to enhance');
      return;
    }

    cli.execute('image-prompt-enhance');
  };

  const handleSmartGenerate = () => {
    if (!selectedProject) return;
    cli.execute('image-prompt-compose');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {/* Basic Enhancement */}
        <Button
          size="sm"
          variant="primary"
          icon={<Sparkles />}
          onClick={handleEnhance}
          disabled={cli.isRunning || !currentPrompt.trim()}
          loading={cli.isRunning}
        >
          {cli.isRunning ? 'Enhancing...' : 'Enhance'}
        </Button>

        {/* Smart Generation Button */}
        {selectedProject && (
          <SmartGenerateButton
            onClick={handleSmartGenerate}
            isLoading={cli.isRunning}
            disabled={cli.isRunning}
            label="Context-Aware"
            size="sm"
            variant="ghost"
          />
        )}

        <span className="text-xs text-gray-500">
          {selectedProject
            ? 'Use project context for consistency'
            : 'Basic enhancement'}
        </span>
      </div>

      <InlineTerminal
        {...cli.terminalProps}
        height={120}
        collapsible
        onInsert={onEnhanced}
      />
    </div>
  );
};

export default PromptEnhancer;
