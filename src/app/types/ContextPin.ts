/**
 * Context Pin types for the Persistent Context Pins & Story Rules Engine.
 *
 * Pins are typed directives (world rules, character constraints, tone directives,
 * plot boundaries) that auto-inject into every AI generation at priority 1.0.
 * They can be scoped to the entire project, specific acts, or specific characters.
 */

export type ContextPinType =
  | 'world_rule'
  | 'character_constraint'
  | 'tone_directive'
  | 'plot_boundary';

export type ContextPinScope = 'project' | 'act' | 'character';

export interface ContextPin {
  id: string;
  project_id: string;
  /** The type of persistent rule */
  pin_type: ContextPinType;
  /** Human-readable label for this pin */
  label: string;
  /** The rule/constraint content that gets injected into AI context */
  content: string;
  /** Scope determines where this pin applies */
  scope: ContextPinScope;
  /** Target ID — act UUID when scope='act', character UUID when scope='character', null for 'project' */
  scope_target_id: string | null;
  /** Whether this pin is currently active */
  enabled: boolean;
  /** Display order for UI sorting */
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const PIN_TYPE_LABELS: Record<ContextPinType, string> = {
  world_rule: 'World Rule',
  character_constraint: 'Character Constraint',
  tone_directive: 'Tone Directive',
  plot_boundary: 'Plot Boundary',
};

export const PIN_SCOPE_LABELS: Record<ContextPinScope, string> = {
  project: 'Entire Project',
  act: 'Specific Act',
  character: 'Specific Character',
};
