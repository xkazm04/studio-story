/**
 * CLI Skill Type Definitions
 *
 * Skills are specialized instruction sets that guide Claude Code CLI
 * for specific storytelling tasks. Each skill provides:
 * - System instructions (expertise framing)
 * - Tool guidance (which MCP tools to use and in what order)
 * - Output format (how the client should parse the result)
 */

import type { LucideIcon } from 'lucide-react';

/**
 * Skill domains — organize skills by feature area
 */
export type SkillDomain =
  | 'character'
  | 'faction'
  | 'story'
  | 'scene'
  | 'image'
  | 'simulator'
  | 'sound'
  | 'utility';

/**
 * Panel directive for V2 workspace — declares which panels to show when a skill runs.
 */
export interface SkillPanelDirective {
  type: string;
  role?: 'primary' | 'secondary' | 'tertiary' | 'sidebar';
  props?: Record<string, unknown>;
}

/**
 * Panel configuration for V2 dynamic workspace.
 * Defines the default panels shown when a skill starts executing.
 */
export interface SkillPanelConfig {
  panels: SkillPanelDirective[];
  preferredLayout?: string;
  clearExisting?: boolean;
}

/**
 * Output format — tells the client how to parse ResultEvent.data
 *
 * - json: Parse as JSON, feed into component state (suggestions, structured data)
 * - text: Plain text result (backstory, description, dialogue)
 * - streaming: Long-form streaming content, displayed in terminal as it arrives
 */
export type SkillOutputFormat = 'json' | 'text' | 'streaming';

/**
 * Full skill definition
 */
export interface CLISkill {
  /** Unique skill identifier */
  id: string;
  /** Display name */
  name: string;
  /** Short name for compact UI (badges, chips) */
  shortName: string;
  /** One-line description of what this skill does */
  description: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Tailwind color name for theming */
  color: string;
  /** Feature domain this skill belongs to */
  domain: SkillDomain;
  /** How the client should parse the CLI result */
  outputFormat: SkillOutputFormat;
  /**
   * System instructions prepended to CLI prompt.
   * Includes: expertise framing, quality standards, tool usage guidance,
   * output format instructions.
   */
  prompt: string;
  /**
   * V2 workspace panel configuration.
   * Defines which panels to show when this skill starts executing.
   */
  panelConfig?: SkillPanelConfig;
}

/**
 * Skill ID type — union of all registered skill IDs.
 * Kept as string to allow dynamic registration without
 * requiring a discriminated union update for each skill.
 */
export type SkillId = string;
