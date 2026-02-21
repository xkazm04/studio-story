'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Save, Check, Palette, Sparkles, Loader2 } from 'lucide-react';
import { SectionWrapper } from '@/app/components/UI';
import { useAppearanceForm, appearanceFormConfig } from './lib';
import {
  CharacterImageExtraction,
  FormSection,
  ImageGenerationPreview,
  AppearancePreview,
} from './components';

interface CharacterAppearanceFormProps {
  characterId: string;
}

/**
 * Character Appearance Form
 * Non-stepped version showing all sections at once
 */
const CharacterAppearanceForm: React.FC<CharacterAppearanceFormProps> = ({
  characterId,
}) => {
  const {
    appearance,
    prompt,
    isLoading,
    isSaving,
    saved,
    isRandomizing,
    handleChange,
    handleSectionPromptGenerated,
    handleGenerateFullPrompt,
    handleRandomize,
    handleExtractedAppearance,
    handleSave,
    setPrompt,
  } = useAppearanceForm({ characterId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="text-sm text-gray-400">Loading appearance data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-1">
          <Palette size={18} />
          Physical Appearance
        </h3>
        <p className="text-sm text-gray-400">
          Define physical traits manually or extract them from an image using AI
        </p>
      </div>

      {/* Image Extraction Section */}
      <SectionWrapper borderColor="purple" padding="md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-semibold text-white mb-1">AI Image Extraction</h4>
            <p className="text-xs text-gray-400">Extract character traits from an image</p>
          </div>
          <button
            onClick={handleRandomize}
            disabled={isRandomizing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors text-sm"
            title="Generate random character attributes"
          >
            {isRandomizing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Randomizing...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Randomize
              </>
            )}
          </button>
        </div>
        <CharacterImageExtraction onExtracted={handleExtractedAppearance} />
      </SectionWrapper>

      {/* Manual Input Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {appearanceFormConfig.map((section) => (
          <FormSection
            key={section.id}
            section={section}
            appearance={appearance}
            onChange={handleChange}
            onPromptGenerated={handleSectionPromptGenerated}
          />
        ))}
      </div>

      {/* AI Generation Prompt */}
      <SectionWrapper borderColor="orange" padding="md">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="font-semibold text-white mb-1">AI Generation Prompt</h4>
            <p className="text-xs text-gray-400">
              Auto-generated from form inputs. Edit manually or regenerate from template.
            </p>
          </div>
          <button
            onClick={handleGenerateFullPrompt}
            className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors text-xs"
            title="Regenerate prompt from all form inputs"
          >
            <Sparkles size={14} />
            Regenerate
          </button>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Prompt will be auto-generated as you fill the form..."
          className="w-full min-h-[100px] px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm"
        />
      </SectionWrapper>

      {/* Image Generation Preview */}
      <ImageGenerationPreview prompt={prompt} />

      {/* Generated Description Preview */}
      <AppearancePreview appearance={appearance} />

      {/* Save Button */}
      <div className="flex justify-end">
        {saved ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg"
          >
            <Check size={16} />
            Saved
          </motion.div>
        ) : (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Appearance'}
          </button>
        )}
      </div>
    </div>
  );
};

export default CharacterAppearanceForm;
