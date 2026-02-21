'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight, Film } from 'lucide-react';
import PromptEnhancer from './PromptEnhancer';
import NegativePromptGenerator from './NegativePromptGenerator';
import PromptInput from '../generator/components/PromptInput';
import type { PromptComponents } from '@/app/types/Image';

interface PromptBuilderProps {
  promptComponents: PromptComponents;
  setPromptComponents: React.Dispatch<React.SetStateAction<PromptComponents>>;
  negativePrompt: string;
  setNegativePrompt: (value: string) => void;
  showSceneInput?: boolean;
}

interface PromptSection {
  key: keyof PromptComponents;
  label: string;
  placeholder: string;
  description: string;
}

const sections: PromptSection[] = [
  {
    key: 'artstyle',
    label: 'Art Style',
    placeholder: 'e.g., digital art, oil painting, concept art, photorealistic...',
    description: 'Define the artistic style and medium',
  },
  {
    key: 'scenery',
    label: 'Scenery & Setting',
    placeholder: 'e.g., ancient forest, futuristic city, medieval castle...',
    description: 'Describe the environment and location',
  },
  {
    key: 'actors',
    label: 'Characters & Subjects',
    placeholder: 'e.g., warrior in armor, young woman, dragon...',
    description: 'Describe the main subjects in the scene',
  },
  {
    key: 'actions',
    label: 'Actions & Mood',
    placeholder: 'e.g., standing heroically, fighting, looking at sunset...',
    description: 'Describe what is happening and the emotional tone',
  },
];

const PromptBuilder: React.FC<PromptBuilderProps> = ({
  promptComponents,
  setPromptComponents,
  negativePrompt,
  setNegativePrompt,
  showSceneInput = true,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['artstyle'])
  );

  // Handle prompt generated from scene
  const handleScenePromptGenerated = useCallback(
    (components: PromptComponents, negative: string) => {
      setPromptComponents(components);
      setNegativePrompt(negative);
    },
    [setPromptComponents, setNegativePrompt]
  );

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handlePromptChange = (key: keyof PromptComponents, value: string) => {
    setPromptComponents((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Get combined prompt for preview
  const getCombinedPrompt = () => {
    return Object.values(promptComponents).filter(Boolean).join(', ');
  };

  return (
    <div className="p-4 space-y-4 text-sm text-slate-200">
      {/* Quick Scene Input */}
      {showSceneInput && (
        <div className="border border-slate-800/50 rounded-lg p-3 bg-slate-900/30">
          <div className="flex items-center gap-2 mb-2">
            <Film className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-medium text-slate-300">
              Quick Generate from Scene
            </span>
          </div>
          <PromptInput onPromptGenerated={handleScenePromptGenerated} />
        </div>
      )}

      {/* Final Prompt Preview */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-slate-200 mb-2 tracking-tight">
          Combined Prompt Preview
        </label>
        <div className="bg-slate-950/80 rounded-lg p-3 min-h-[60px] text-slate-200 text-xs border border-slate-900/70">
          {getCombinedPrompt() || (
            <span className="text-slate-500">Your prompt will appear here...</span>
          )}
        </div>
      </div>

      {/* Prompt Sections */}
      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.key);
        const Icon = isExpanded ? ChevronDown : ChevronRight;

        return (
          <div
            key={section.key}
            className="border border-slate-900/70 rounded-lg overflow-hidden bg-slate-950/95"
          >
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.key)}
              className="w-full flex items-center justify-between p-3 bg-slate-950/95 hover:bg-slate-900 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-medium text-slate-100 tracking-tight">{section.label}</span>
                <span className="text-[11px] text-slate-500">{section.description}</span>
              </div>
              {promptComponents[section.key] && (
                <span className="text-xs text-green-500">✓ Filled</span>
              )}
            </button>

            {/* Section Content */}
            {isExpanded && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="bg-slate-950/95"
              >
                <div className="p-3 space-y-3">
                  <textarea
                    value={promptComponents[section.key]}
                    onChange={(e) => handlePromptChange(section.key, e.target.value)}
                    placeholder={section.placeholder}
                    rows={3}
                    className="w-full bg-transparent border border-slate-800 rounded-lg p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/60"
                  />

                  {/* AI Enhancement */}
                  <PromptEnhancer
                    currentPrompt={promptComponents[section.key]}
                    promptType={section.key}
                    onEnhanced={(enhanced) => handlePromptChange(section.key, enhanced)}
                  />
                </div>
              </motion.div>
            )}
          </div>
        );
      })}

      {/* Negative Prompt Section */}
      <div className="border border-slate-900/70 rounded-lg overflow-hidden bg-slate-950/95">
        <button
          onClick={() => toggleSection('negative')}
          className="w-full flex items-center justify-between p-3 bg-slate-950/95 hover:bg-slate-900 transition-colors"
        >
          <div className="flex items-center gap-2">
              {expandedSections.has('negative') ? (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )}
            <span className="text-xs font-medium text-slate-100 tracking-tight">Negative Prompt</span>
            <span className="text-[11px] text-slate-500">Things to avoid</span>
          </div>
          {negativePrompt && <span className="text-xs text-green-500">✓ Filled</span>}
        </button>

        {expandedSections.has('negative') && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="bg-slate-950/95"
          >
            <div className="p-3 space-y-3">
              <textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="e.g., blurry, low quality, watermark, deformed..."
                rows={3}
                className="w-full bg-transparent border border-slate-800 rounded-lg p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/60"
              />

              <NegativePromptGenerator
                mainPrompt={getCombinedPrompt()}
                onGenerated={setNegativePrompt}
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PromptBuilder;
