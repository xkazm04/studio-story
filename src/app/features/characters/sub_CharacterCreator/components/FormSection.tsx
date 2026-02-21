'use client';

import React from 'react';
import { FormFieldConfig, SectionColor, getFieldValue } from '../lib/formConfig';
import { Appearance } from '@/app/types/Character';
import { CollapsibleSection } from '@/app/components/UI/CollapsibleSection';
import { FormField } from './FormField';
import { PromptGenerator } from './PromptGenerator';

interface FormSectionProps {
  section: {
    id: string;
    title: string;
    color: SectionColor;
    fields: FormFieldConfig[];
  };
  appearance: Appearance;
  onChange: (path: string, value: string) => void;
  onPromptGenerated?: (sectionId: string, prompt: string) => void;
}

/**
 * Reusable Form Section Component
 * Renders a collapsible section with fields based on config
 * Now keyboard-accessible with Enter/Space toggle support
 */
export function FormSection({ section, appearance, onChange, onPromptGenerated }: FormSectionProps) {
  const handlePromptGenerated = (prompt: string) => {
    if (onPromptGenerated) {
      onPromptGenerated(section.id, prompt);
    }
  };

  const canGeneratePrompt = section.id === 'facial' || section.id === 'clothing';

  return (
    <CollapsibleSection
      title={section.title}
      borderColor={section.color}
      defaultOpen={true}
    >
      {canGeneratePrompt && (
        <div className="flex justify-end mb-4">
          <PromptGenerator
            type={section.id === 'facial' ? 'facial' : 'clothing'}
            appearance={appearance}
            onPromptGenerated={handlePromptGenerated}
          />
        </div>
      )}
      <div className="space-y-4">
        {section.fields.map((field) => (
          <FormField
            key={field.id}
            field={field}
            value={getFieldValue(appearance, field.path)}
            onChange={onChange}
          />
        ))}
      </div>
    </CollapsibleSection>
  );
}
