/**
 * SelectionPanel - Archetype/Pose/Expression selectors
 * Design: Clean Manuscript style with cyan accents
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ARCHETYPE_OPTIONS,
  POSE_OPTIONS,
  EXPRESSION_OPTIONS,
  GenerationSelections,
} from '../../lib/promptComposer';
import { cn } from '@/app/lib/utils';

interface SelectionPanelProps {
  selections: GenerationSelections;
  onUpdateSelection: (key: keyof GenerationSelections, value: string) => void;
  disabled?: boolean;
}

interface SelectionGroupProps {
  title: string;
  options: ReadonlyArray<{ id: string; label: string; description: string }>;
  selectedId?: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

const SelectionGroup: React.FC<SelectionGroupProps> = ({
  title,
  options,
  selectedId,
  onSelect,
  disabled,
}) => (
  <div className="space-y-2">
    <h4 className="font-mono text-xs uppercase tracking-wide text-slate-400">
      // {title}
    </h4>
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const isSelected = selectedId === option.id;
        return (
          <motion.button
            key={option.id}
            onClick={() => onSelect(option.id)}
            disabled={disabled}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            className={cn(
              'px-2.5 py-1.5 rounded-md font-mono text-xs transition-all duration-200',
              isSelected
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-slate-200 hover:border-slate-600',
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            )}
            title={option.description}
          >
            <span className="uppercase tracking-wide">{option.label}</span>
          </motion.button>
        );
      })}
    </div>
  </div>
);

const SelectionPanel: React.FC<SelectionPanelProps> = ({
  selections,
  onUpdateSelection,
  disabled = false,
}) => {
  return (
    <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
          generation_options
        </h3>
      </div>

      <SelectionGroup
        title="archetype"
        options={ARCHETYPE_OPTIONS}
        selectedId={selections.archetype}
        onSelect={(id) => onUpdateSelection('archetype', id)}
        disabled={disabled}
      />

      <SelectionGroup
        title="pose"
        options={POSE_OPTIONS}
        selectedId={selections.pose}
        onSelect={(id) => onUpdateSelection('pose', id)}
        disabled={disabled}
      />

      <SelectionGroup
        title="expression"
        options={EXPRESSION_OPTIONS}
        selectedId={selections.expression}
        onSelect={(id) => onUpdateSelection('expression', id)}
        disabled={disabled}
      />
    </div>
  );
};

export default SelectionPanel;
