// Category system
export type CategoryId =
  | 'hair' | 'eyes' | 'nose' | 'mouth' | 'expression'
  | 'makeup' | 'markings' | 'accessories' | 'facialHair'
  | 'skinTone' | 'age' | 'bodyType' | 'lighting' | 'background';

export interface Category {
  id: CategoryId;
  label: string;
  icon: string; // Lucide icon name
  promptTemplate: string; // e.g., "with {value} hair"
  group: 'face' | 'features' | 'body' | 'environment';
}

// Option for each category
export interface CategoryOption {
  id: string | number;
  name: string;
  /** Icon registry key rendered by CreatorIcon (e.g. 'hair-longWavy') */
  preview?: string;
  description?: string;
  promptValue: string; // The value used in prompt composition
  metadata?: Record<string, unknown>;
}

// Selection state
export interface CategorySelection {
  categoryId: CategoryId;
  optionId: string | number | null;
  customPrompt?: string; // User override
  isCustom: boolean;
}
