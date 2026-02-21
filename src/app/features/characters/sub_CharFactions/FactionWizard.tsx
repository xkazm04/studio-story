'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import ColoredBorder from '@/app/components/UI/ColoredBorder';
import { AIGeneratedFaction, FactionWizardResponse } from '@/app/types/Faction';
import WizardStepPrompt from './WizardStepPrompt';
import WizardStepPreview from './WizardStepPreview';
import WizardStepConfirm from './WizardStepConfirm';

interface FactionWizardProps {
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
}

type WizardStep = 'prompt' | 'preview' | 'confirm';

const FactionWizard: React.FC<FactionWizardProps> = ({
  onClose,
  onSuccess,
  projectId,
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('prompt');
  const [generatedFaction, setGeneratedFaction] = useState<AIGeneratedFaction | null>(null);
  const [metadata, setMetadata] = useState<FactionWizardResponse['metadata'] | null>(null);

  const handleFactionGenerated = (response: FactionWizardResponse) => {
    setGeneratedFaction(response.faction);
    setMetadata(response.metadata);
    setCurrentStep('preview');
  };

  const handleEditPrompt = () => {
    setCurrentStep('prompt');
  };

  const handleConfirmPreview = () => {
    setCurrentStep('confirm');
  };

  const handleBackToPreview = () => {
    setCurrentStep('preview');
  };

  const handleFactionCreated = () => {
    onSuccess();
    onClose();
  };

  const getStepNumber = () => {
    switch (currentStep) {
      case 'prompt':
        return 1;
      case 'preview':
        return 2;
      case 'confirm':
        return 3;
      default:
        return 1;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      data-testid="faction-wizard-modal"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-gray-900 rounded-lg border border-gray-800 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <ColoredBorder color="purple" />

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">AI Faction Builder</h3>
              <p className="text-sm text-gray-400">
                Step {getStepNumber()} of 3
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            data-testid="close-wizard-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex gap-2">
            <div
              className={cn('flex-1 h-1 rounded-full transition-colors',
                getStepNumber() >= 1 ? 'bg-purple-500' : 'bg-gray-700'
              )}
            />
            <div
              className={cn('flex-1 h-1 rounded-full transition-colors',
                getStepNumber() >= 2 ? 'bg-purple-500' : 'bg-gray-700'
              )}
            />
            <div
              className={cn('flex-1 h-1 rounded-full transition-colors',
                getStepNumber() >= 3 ? 'bg-purple-500' : 'bg-gray-700'
              )}
            />
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 'prompt' && (
            <WizardStepPrompt
              key="prompt"
              projectId={projectId}
              onFactionGenerated={handleFactionGenerated}
            />
          )}
          {currentStep === 'preview' && generatedFaction && (
            <WizardStepPreview
              key="preview"
              faction={generatedFaction}
              metadata={metadata}
              onEdit={handleEditPrompt}
              onConfirm={handleConfirmPreview}
            />
          )}
          {currentStep === 'confirm' && generatedFaction && (
            <WizardStepConfirm
              key="confirm"
              faction={generatedFaction}
              projectId={projectId}
              onBack={handleBackToPreview}
              onSuccess={handleFactionCreated}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default FactionWizard;
