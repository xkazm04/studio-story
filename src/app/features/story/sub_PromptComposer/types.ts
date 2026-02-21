/**
 * Prompt Composer Types
 * Types for the visual image prompt builder
 */

export type PromptDimension = 'style' | 'setting' | 'mood';

export interface PromptOption {
  id: string;
  label: string;
  description: string;
  tags: string[];
  icon: string;
  prompt: string;
  isCustom?: boolean;
}

export interface PromptColumn {
  id: PromptDimension;
  label: string;
  icon: string;
  description: string;
  options: PromptOption[];
}

export interface SelectionState {
  style?: PromptOption;
  setting?: PromptOption;
  mood?: PromptOption;
}

export const MAX_PROMPT_LENGTH = 1500;
