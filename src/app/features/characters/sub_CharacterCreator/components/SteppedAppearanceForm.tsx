'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette } from 'lucide-react';
import { useAppearanceForm } from '../lib/useAppearanceForm';
import { appearanceFormConfig } from '../lib/formConfig';
import { FormStepper } from './FormStepper';
import { FormSection } from './FormSection';
import { ImageGenerationPreview } from './ImageGenerationPreview';
import { AppearancePreview } from './AppearancePreview';
import { AIExtractionSection, PromptSection, SaveButton } from './FormSubComponents';

interface SteppedAppearanceFormProps {
  characterId: string;
}

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
  }),
};

/**
 * Stepped Appearance Form
 * Multi-step form with stepper navigation for focused section editing
 */
export function SteppedAppearanceForm({ characterId }: SteppedAppearanceFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

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

  const currentSection = useMemo(() => appearanceFormConfig[currentStep], [currentStep]);

  const handleStepChange = (newStep: number) => {
    setDirection(newStep > currentStep ? 1 : -1);
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    setCurrentStep(newStep);
  };

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
          Define physical traits step by step or extract them from an image using AI
        </p>
      </div>

      <AIExtractionSection
        isRandomizing={isRandomizing}
        onRandomize={handleRandomize}
        onExtracted={handleExtractedAppearance}
      />

      <FormStepper
        sections={appearanceFormConfig}
        currentStep={currentStep}
        onStepChange={handleStepChange}
        completedSteps={completedSteps}
      />

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <FormSection
            section={currentSection}
            appearance={appearance}
            onChange={handleChange}
            onPromptGenerated={handleSectionPromptGenerated}
          />
        </motion.div>
      </AnimatePresence>

      <PromptSection
        prompt={prompt}
        onPromptChange={setPrompt}
        onRegenerate={handleGenerateFullPrompt}
      />

      <ImageGenerationPreview prompt={prompt} />
      <AppearancePreview appearance={appearance} />
      <SaveButton isSaving={isSaving} saved={saved} onSave={handleSave} />
    </div>
  );
}
