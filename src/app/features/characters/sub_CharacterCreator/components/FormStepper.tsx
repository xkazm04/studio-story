'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { FormSectionConfig, SectionColor } from '../lib/formConfig';

interface FormStepperProps {
  sections: FormSectionConfig[];
  currentStep: number;
  onStepChange: (step: number) => void;
  completedSteps?: Set<number>;
}

const colorMap: Record<SectionColor, { bg: string; border: string; text: string }> = {
  blue: { bg: 'bg-blue-600', border: 'border-blue-500', text: 'text-blue-400' },
  purple: { bg: 'bg-purple-600', border: 'border-purple-500', text: 'text-purple-400' },
  green: { bg: 'bg-green-600', border: 'border-green-500', text: 'text-green-400' },
  yellow: { bg: 'bg-yellow-600', border: 'border-yellow-500', text: 'text-yellow-400' },
  orange: { bg: 'bg-orange-600', border: 'border-orange-500', text: 'text-orange-400' },
  pink: { bg: 'bg-pink-600', border: 'border-pink-500', text: 'text-pink-400' },
  gray: { bg: 'bg-gray-600', border: 'border-gray-500', text: 'text-gray-400' },
};

/**
 * Form Stepper Component
 * Displays step indicators and navigation for multi-step forms
 */
export function FormStepper({
  sections,
  currentStep,
  onStepChange,
  completedSteps = new Set(),
}: FormStepperProps) {
  const canGoBack = currentStep > 0;
  const canGoForward = currentStep < sections.length - 1;

  return (
    <div className="space-y-4">
      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {sections.map((section, index) => {
          const isActive = index === currentStep;
          const isCompleted = completedSteps.has(index);
          const isPast = index < currentStep;
          const colors = colorMap[section.color];

          return (
            <React.Fragment key={section.id}>
              <button
                onClick={() => onStepChange(index)}
                className={cn(
                  'relative flex flex-col items-center group transition-all duration-200',
                  isActive ? 'scale-105' : 'hover:scale-102'
                )}
                title={section.title}
              >
                {/* Step Circle */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200',
                    isActive
                      ? cn(colors.bg, 'border-transparent text-white shadow-lg')
                      : isCompleted || isPast
                      ? cn('bg-gray-800', colors.border, colors.text)
                      : 'bg-gray-800 border-gray-600 text-gray-500'
                  )}
                >
                  {isCompleted ? (
                    <Check size={18} />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>

                {/* Step Label */}
                <span
                  className={cn(
                    'mt-2 text-xs font-medium transition-colors duration-200',
                    isActive
                      ? 'text-white'
                      : isCompleted || isPast
                      ? colors.text
                      : 'text-gray-500'
                  )}
                >
                  {section.title}
                </span>

                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeStep"
                    className={cn('absolute -bottom-1 w-full h-0.5 rounded-full', colors.bg)}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>

              {/* Connector Line */}
              {index < sections.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 rounded-full transition-colors duration-200',
                    isPast ? colors.bg : 'bg-gray-700'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => canGoBack && onStepChange(currentStep - 1)}
          disabled={!canGoBack}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors',
            canGoBack
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          )}
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <span className="text-sm text-gray-400">
          Step {currentStep + 1} of {sections.length}
        </span>

        <button
          onClick={() => canGoForward && onStepChange(currentStep + 1)}
          disabled={!canGoForward}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors',
            canGoForward
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          )}
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
