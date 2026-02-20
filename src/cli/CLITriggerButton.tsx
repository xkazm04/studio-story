'use client';

/**
 * CLITriggerButton — Standard button for launching CLI skills
 *
 * Drop-in replacement for existing "Generate" buttons.
 * Shows a spinner while the CLI is running and disables interaction.
 *
 * Usage:
 *   const cli = useCLIFeature({ ... });
 *
 *   <CLITriggerButton
 *     label="Generate Backstory"
 *     skillId="character-backstory"
 *     contextParams={{ characterId: selectedCharacter }}
 *     execute={cli.execute}
 *     isRunning={cli.isRunning}
 *   />
 */

import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type { SkillId } from './skills';

export interface CLITriggerButtonProps {
  /** Button label */
  label: string;
  /** Skill to execute on click */
  skillId: SkillId;
  /** Context params to pass to the skill */
  contextParams?: Record<string, string>;
  /** Execute function from useCLIFeature */
  execute: (skillId: SkillId, contextParams?: Record<string, string>) => void;
  /** Whether a CLI task is currently running */
  isRunning: boolean;
  /** Optional icon (defaults to Sparkles) */
  icon?: React.ElementType;
  /** Button variant */
  variant?: 'default' | 'ghost' | 'outline';
  /** Button size */
  size?: 'sm' | 'md';
  /** Additional class names */
  className?: string;
  /** Disabled state (independent of isRunning) */
  disabled?: boolean;
}

export default function CLITriggerButton({
  label,
  skillId,
  contextParams,
  execute,
  isRunning,
  icon: Icon = Sparkles,
  variant = 'default',
  size = 'sm',
  className,
  disabled = false,
}: CLITriggerButtonProps) {
  const handleClick = () => {
    if (isRunning || disabled) return;
    execute(skillId, contextParams);
  };

  const isDisabled = isRunning || disabled;

  const variantClasses = {
    default: 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-300 border-transparent',
    outline: 'bg-transparent hover:bg-slate-800/50 text-slate-300 border-slate-700',
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-sm gap-2',
  };

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center rounded-md border font-medium transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {isRunning ? (
        <Loader2 className={cn('animate-spin', size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')} />
      ) : (
        <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      )}
      <span>{isRunning ? 'Running...' : label}</span>
    </button>
  );
}
