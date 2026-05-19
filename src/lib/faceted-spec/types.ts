/**
 * Generic Faceted Specification Builder
 *
 * A domain-agnostic system for composing structured outputs from
 * named dimensions (facets), each with preset options and custom overrides.
 *
 * Used by: character creator, scene environment design, art style definition,
 * voice character profiles, beat mood boards, etc.
 */

// ── Core dimension types ──────────────────────────────────────────────

/** A single named dimension (facet) in the spec */
export interface FacetDimension<GroupId extends string = string> {
  id: string;
  label: string;
  icon: string; // Lucide icon name
  promptTemplate: string; // e.g., "with {value} hair" — {value} is replaced
  group: GroupId;
}

/** A group of related dimensions */
export interface FacetGroup {
  id: string;
  label: string;
  icon: string;
}

/** A selectable option within a dimension */
export interface FacetOption {
  id: string | number;
  name: string;
  preview?: string; // Icon registry key or image URL
  description?: string;
  promptValue: string; // Substituted into promptTemplate's {value}
  metadata?: Record<string, unknown>;
}

/** The user's selection state for one dimension */
export interface FacetSelection {
  dimensionId: string;
  optionId: string | number | null;
  customPrompt?: string;
  isCustom: boolean;
}

// ── Configuration ─────────────────────────────────────────────────────

/** Full configuration for a faceted spec domain */
export interface FacetedSpecConfig<GroupId extends string = string> {
  /** Human-readable name for this spec type (e.g., "Character Appearance") */
  name: string;
  /** Prefix for the composed prompt (e.g., "A character portrait of") */
  promptPrefix: string;
  /** All dimensions in this spec */
  dimensions: FacetDimension<GroupId>[];
  /** Dimension groups for sidebar organization */
  groups: FacetGroup[];
  /** Options per dimension ID */
  options: Record<string, FacetOption[]>;
  /** Order of dimensions when composing the final prompt */
  compositionOrder: string[];
  /** Separator between prompt parts (default: ", ") */
  separator?: string;
  /** Suffix appended to composed prompt (default: ".") */
  suffix?: string;
  /** Max characters for custom prompt input (default: 1000) */
  maxCustomChars?: number;
}

// ── Store shape ───────────────────────────────────────────────────────

export interface FacetedSpecState {
  /** Current label/name for the item being composed */
  label: string;
  /** Selection state per dimension ID */
  selections: Record<string, FacetSelection>;
  /** Currently active dimension in the UI */
  activeDimensionId: string | null;

  // Actions
  setSelection: (dimensionId: string, optionId: string | number | null) => void;
  setCustomPrompt: (dimensionId: string, customPrompt: string) => void;
  clearCustomPrompt: (dimensionId: string) => void;
  setLabel: (label: string) => void;
  setActiveDimension: (dimensionId: string | null) => void;
  reset: () => void;
  /** Apply bulk updates (e.g., from CLI or LLM) */
  applyBulkUpdate: (update: Record<string, { optionId?: string | number; customPrompt?: string }>) => void;
  /** Load from existing data (tries to match options, falls back to custom) */
  loadFromData: (label: string, data: Record<string, string>) => void;
}

// ── Selectors ─────────────────────────────────────────────────────────

/** Selector factories bound to a config */
export interface FacetedSpecSelectors {
  selectComposedPrompt: (state: FacetedSpecState) => string;
  selectActiveSelectionCount: (state: FacetedSpecState) => number;
}

// ── Component props ───────────────────────────────────────────────────

export interface FacetOptionCardProps {
  option: FacetOption;
  isSelected: boolean;
  onSelect: () => void;
}

export interface FacetOptionsListProps {
  searchQuery: string;
  config: FacetedSpecConfig;
  activeDimensionId: string | null;
  selections: Record<string, FacetSelection>;
  onSelect: (dimensionId: string, optionId: string | number | null) => void;
  onClearCustom: (dimensionId: string) => void;
}

export interface FacetHeaderProps {
  config: FacetedSpecConfig;
  activeDimensionId: string | null;
  selections: Record<string, FacetSelection>;
  onClear: (dimensionId: string) => void;
}

export interface FacetPromptEditorProps {
  config: FacetedSpecConfig;
  activeDimensionId: string | null;
  selections: Record<string, FacetSelection>;
  composedPrompt: string;
  onSetCustomPrompt: (dimensionId: string, prompt: string) => void;
  onClearCustomPrompt: (dimensionId: string) => void;
}
