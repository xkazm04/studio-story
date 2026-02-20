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
  | 'utility';

// ============ Panel Types ============

export type PanelRole = 'primary' | 'secondary' | 'tertiary' | 'sidebar';

export type PanelSizeClass = 'compact' | 'standard' | 'wide';

export type WorkspaceLayout =
  | 'single'
  | 'split-2'
  | 'split-3'
  | 'grid-4'
  | 'primary-sidebar'
  | 'triptych'
  | 'studio';

export type WorkspacePanelType =
  | 'scene-editor'
  | 'character-cards'
  | 'story-map'
  | 'scene-metadata'
  | 'dialogue-view'
  | 'image-canvas'
  | 'character-detail'
  | 'beats-manager'
  | 'story-evaluator'
  | 'story-graph'
  | 'script-editor'
  | 'theme-manager'
  | 'art-style'
  | 'voice-manager'
  | 'voice-casting'
  | 'image-generator'
  | 'scene-list'
  | 'writing-desk'
  | 'character-creator'
  | 'script-dialog'
  | 'narration'
  | 'voice-performance'
  | 'empty-welcome'
  | 'beats-sidebar'
  | 'cast-sidebar'
  | 'scene-gallery'
  | 'audio-toolbar'
  | 'advisor';

// ============ Terminal Tab ============

export interface TerminalTab {
  id: string;
  label: string;
  sessionId: string;
  domain: SkillDomain | 'general';
  contextLabel?: string;
  createdAt: number;
  isPinned: boolean;
}

// ============ Panel Instance ============

export interface WorkspacePanelInstance {
  id: string;
  type: WorkspacePanelType;
  role: PanelRole;
  props: Record<string, unknown>;
  slotIndex: number;
}

// ============ Panel Directive ============

export interface PanelDirective {
  type: WorkspacePanelType;
  role?: PanelRole;
  props?: Record<string, unknown>;
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
  utility: 'slate',
  general: 'slate',
};
