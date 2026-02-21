'use client';

import React from 'react';
import { User, UserCheck } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface GenderSelectorProps {
  value: string;
  onChange: (value: 'Male' | 'Female') => void;
}

/**
 * Gender Selector Component
 * Icon-based selection between Male and Female
 */
export function GenderSelector({ value, onChange }: GenderSelectorProps) {
  const isMale = value.toLowerCase() === 'male';
  const isFemale = value.toLowerCase() === 'female';

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onChange('Male')}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
            isMale
              ? 'bg-blue-900/50 border-blue-500 text-white'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
          )}
        >
          <User size={24} />
          <span className="text-sm font-medium">Male</span>
        </button>
        <button
          type="button"
          onClick={() => onChange('Female')}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
            isFemale
              ? 'bg-pink-900/50 border-pink-500 text-white'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
          )}
        >
          <UserCheck size={24} />
          <span className="text-sm font-medium">Female</span>
        </button>
      </div>
    </div>
  );
}
