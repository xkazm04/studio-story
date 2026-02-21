'use client';

import React from 'react';
import { cn } from '@/app/lib/utils';
import { FormFieldConfig } from '../lib/formConfig';
import { GenderSelector } from './GenderSelector';

interface FormFieldProps {
  field: FormFieldConfig;
  value: string;
  onChange: (path: string, value: string) => void;
}

/**
 * Reusable Form Field Component
 * Renders text input, textarea, gender selector, or special features based on field config
 */
export function FormField({ field, value, onChange }: FormFieldProps) {
  const baseClasses = "w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500";

  // Gender selector
  if (field.type === 'gender') {
    return (
      <GenderSelector
        value={value}
        onChange={(val) => onChange(field.path, val)}
      />
    );
  }

  // Special features with word count
  if (field.type === 'special-features') {
    const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
    const isOverLimit = wordCount > 10;

    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-300">
            {field.label}
          </label>
          <span className={cn('text-xs', isOverLimit ? 'text-red-400' : 'text-gray-500')}>
            {wordCount}/10 words
          </span>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(field.path, e.target.value)}
          placeholder={field.placeholder}
          className={cn(baseClasses, isOverLimit && 'border-red-500')}
          maxLength={100}
          data-testid="special-features-input"
        />
        {isOverLimit && (
          <p className="text-xs text-red-400 mt-1">Please keep it to 10 words or less</p>
        )}
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {field.label}
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(field.path, e.target.value)}
          placeholder={field.placeholder}
          className={cn(baseClasses, 'min-h-[120px] resize-none')}
          data-testid={`${field.id}-textarea`}
        />
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {field.label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(field.path, e.target.value)}
        placeholder={field.placeholder}
        className={baseClasses}
        data-testid={`${field.id}-input`}
      />
    </div>
  );
}
