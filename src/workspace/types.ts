/**
 * Workspace Type Definitions
 *
 * All types for the dynamic workspace system.
 */

// ============ Skill Domain (standalone) ============

export type SkillDomain =
  | 'character'
  | 'faction'
  | 'story'
  | 'scene'
  | 'image'
  | 'simulator'
  | 'sound'
  | 'voice'
  | 'utility';

// ============ Panel Types ============

export type PanelRole = 'primary' | 'secondary' | 'tertiary' | 'sidebar';

export type PanelSizeClass = 'compact' | 'standard' | 'wide';

export type PanelSizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type PanelComplexity = 'low' | 'medium' | 'high';

/** Density mode controls how much information a panel renders */
export type PanelDensity = 'micro' | 'compact' | 'full';

export type WorkspaceLayout =
  | 'stack'
  | 'single'
  | 'split-2'
  | 'split-3'
  | 'grid-4'
  | 'primary-sidebar'
  | 'triptych'
  | 'studio';

/** Derived from PANEL_REGISTRY keys — add new panels to panelRegistry.ts, not here */
import type { WorkspacePanelType } from './engine/panelRegistry';
export type { WorkspacePanelType };

// ============ Terminal Tab (legacy, kept for type compat) ============

export interface TerminalTab {
  id: string;
  label: string;
  sessionId: string;
  domain: SkillDomain | 'general';
  contextLabel?: string;
  createdAt: number;
  isPinned: boolean;
  isAgentSpawned?: boolean;
  executionId?: string;
  streamUrl?: string;
}

// ============ Panel Instance ============

export interface WorkspacePanelInstance {
  id: string;
  type: WorkspacePanelType;
  role: PanelRole;
  props: Record<string, unknown>;
  slotIndex: number;
  /** Density mode — controls rendering fidelity. Defaults to 'full'. */
  density?: PanelDensity;
  /** Data slice — tells the panel which specific data to display */
  dataSlice?: PanelDataSlice;
}

// ============ Panel Directive ============

export interface PanelDirective {
  type: WorkspacePanelType;
  role?: PanelRole;
  props?: Record<string, unknown>;
  /** Density mode requested by the LLM */
  density?: PanelDensity;
  /** Data slice — tells the panel which specific data to display */
  dataSlice?: PanelDataSlice;
}

// ============ Data Slice ============

/** Tells a panel exactly what data to show — passed by the LLM */
export interface PanelDataSlice {
  /** Specific entity ID to display (e.g., character ID, scene ID) */
  entityId?: string;
  /** Filter expression (e.g., "scene-participants", "faction:villains") */
  filter?: string;
  /** Which view/tab to show (e.g., "traits", "relationships", "dialogue") */
  view?: string;
  /** Entity IDs to visually highlight */
  highlight?: string[];
  /** Sort order */
  sort?: string;
}

// ============ Spatial Budget ============

/** Viewport and grid dimensions sent to the LLM for spatial reasoning */
export interface SpatialBudget {
  viewport: { width: number; height: number };
  availableGrid: { width: number; height: number };
  currentComposition: Array<{
    type: WorkspacePanelType;
    density: PanelDensity;
    role: PanelRole;
  }>;
  options: SpatialOption[];
}

/** Pre-computed layout option with panel capacity */
export interface SpatialOption {
  layout: WorkspaceLayout;
  maxPanels: number;
  description: string;
  slots: Array<{
    role: PanelRole;
    acceptsDensity: PanelDensity[];
    widthPx: number;
    heightPx: number;
  }>;
}

// ============ Workspace Snapshot ============

/** A user-saved workspace configuration with named panels, layout, density, and data slices */
export interface WorkspaceSnapshot {
  id: string;
  name: string;
  panels: WorkspacePanelInstance[];
  layout: WorkspaceLayout;
  createdAt: number;
  updatedAt: number;
}

// ============ Domain Colors ============

export const DOMAIN_COLORS: Record<SkillDomain | 'general', string> = {
  scene: 'amber',
  character: 'purple',
  story: 'cyan',
  image: 'emerald',
  faction: 'rose',
  simulator: 'blue',
  sound: 'violet',
  voice: 'orange',
  utility: 'slate',
  general: 'slate',
};
