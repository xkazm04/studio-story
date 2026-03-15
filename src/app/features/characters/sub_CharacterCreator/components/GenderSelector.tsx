'use client';

import React, { useState } from 'react';
import { CircleUser, Pen } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface GenderSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const PRESETS = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
] as const;

/**
 * Gender Selector Component
 * Inclusive selection with Male, Female, and Custom options using neutral styling
 */
export function GenderSelector({ value, onChange }: GenderSelectorProps) {
  const normalizedValue = value.toLowerCase();
  const isPreset = PRESETS.some((p) => p.id === normalizedValue);
  const isCustom = !!value && !isPreset;
  const [showCustomInput, setShowCustomInput] = useState(isCustom);

  const handlePresetClick = (preset: (typeof PRESETS)[number]) => {
    setShowCustomInput(false);
    onChange(preset.label);
  };

  const handleCustomClick = () => {
    setShowCustomInput(true);
    if (!isCustom) {
      onChange('');
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">Gender</label>
      <div className="flex gap-3">
        {PRESETS.map((preset) => {
          const isSelected = normalizedValue === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
                isSelected
                  ? 'bg-cyan-900/30 border-cyan-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
              )}
            >
              <CircleUser size={24} />
              <span className="text-sm font-medium">{preset.label}</span>
            </button>
          );
        })}

        {/* Custom option */}
        <button
          type="button"
          onClick={handleCustomClick}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
            showCustomInput
              ? 'bg-cyan-900/30 border-cyan-500 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
          )}
        >
          <Pen size={24} />
          <span className="text-sm font-medium">Custom</span>
        </button>
      </div>

      {/* Custom text input */}
      {showCustomInput && (
        <input
          type="text"
          value={isCustom ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter gender identity..."
          autoFocus
          className="w-full mt-3 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
        />
      )}
    </div>
  );
}
