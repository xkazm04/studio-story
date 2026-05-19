/**
 * Slash Command Definitions for Advisor Chat
 *
 * Commands prefixed with `/` in the advisor input field.
 * "local" commands execute instantly via workspace dispatch (no Gemini round-trip).
 * "llm" commands prepend structured context to the Gemini call.
 */

import type { WorkspaceLayout } from '@/workspace/types';

// ─── Types ───────────────────────────────────────

export type SlashCommandMode = 'local' | 'llm';

export interface SlashCommandDef {
  /** The slash trigger (without leading `/`), e.g. "compose" */
  name: string;
  /** One-line description shown in the autocomplete menu */
  description: string;
  /** Hint shown after the command name, e.g. "<panel-type>" */
  argHint?: string;
  /** Whether the command resolves locally or goes to the LLM */
  mode: SlashCommandMode;
  /** Lucide icon name for the menu */
  icon: string;
  /** Keyboard shortcut hint (display only) */
  shortcut?: string;
}

export interface SlashCommandMatch {
  command: SlashCommandDef;
  /** Raw argument string after the command name */
  args: string;
}

// ─── Command Registry ────────────────────────────

export const SLASH_COMMANDS: SlashCommandDef[] = [
  // Local-dispatch commands (no Gemini round-trip)
  {
    name: 'compose',
    description: 'Open panels by type',
    argHint: '<panel-type> [panel-type...]',
    mode: 'local',
    icon: 'LayoutGrid',
  },
  {
    name: 'layout',
    description: 'Switch workspace layout',
    argHint: '<template>',
    mode: 'local',
    icon: 'Columns',
  },
  {
    name: 'focus',
    description: 'Focus a specific panel',
    argHint: '<panel-type>',
    mode: 'local',
    icon: 'Maximize2',
  },
  {
    name: 'close',
    description: 'Close panels by type',
    argHint: '<panel-type> [panel-type...]',
    mode: 'local',
    icon: 'X',
  },
  {
    name: 'clear',
    description: 'Clear all panels from workspace',
    mode: 'local',
    icon: 'Trash2',
  },
  {
    name: 'undo',
    description: 'Undo last workspace change',
    mode: 'local',
    icon: 'Undo2',
  },
  {
    name: 'redo',
    description: 'Redo last undone change',
    mode: 'local',
    icon: 'Redo2',
  },

  // LLM-prefixed commands (prepend context to Gemini call)
  {
    name: 'ask',
    description: 'Ask a specific question about the story',
    argHint: '<question>',
    mode: 'llm',
    icon: 'HelpCircle',
  },
  {
    name: 'brainstorm',
    description: 'Brainstorm ideas for a topic',
    argHint: '<topic>',
    mode: 'llm',
    icon: 'Lightbulb',
  },
  {
    name: 'analyze',
    description: 'Analyze story structure, pacing, or characters',
    argHint: '<aspect>',
    mode: 'llm',
    icon: 'BarChart3',
  },
  {
    name: 'suggest',
    description: 'Get suggestions for improving the current scene',
    argHint: '[context]',
    mode: 'llm',
    icon: 'Sparkles',
  },
];

// ─── Helpers ─────────────────────────────────────

/** Known panel types for argument validation */
const KNOWN_PANEL_TYPES = new Set([
  'scene-editor', 'scene-metadata', 'dialogue-view', 'scene-list', 'scene-gallery',
  'character-cards', 'character-detail', 'character-creator', 'cast-sidebar',
  'story-map', 'beats-manager', 'story-evaluator', 'story-graph',
  'script-editor', 'theme-manager', 'beats-sidebar',
  'image-canvas', 'image-generator', 'art-style',
  'voice-manager', 'voice-casting', 'voice-performance',
  'writing-desk', 'relationship-map', 'reader-view', 'narrative-suggestions',
  'storyboard',
]);

const KNOWN_LAYOUTS = new Set<string>([
  'single', 'split-2', 'split-3', 'grid-4', 'primary-sidebar', 'triptych', 'studio',
]);

/**
 * Filter commands by a partial query string (typed after `/`).
 * Returns commands whose name starts with the query, sorted by match quality.
 */
export function filterCommands(query: string): SlashCommandDef[] {
  const q = query.toLowerCase();
  if (!q) return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter((cmd) => cmd.name.startsWith(q));
}

/**
 * Try to parse a full input string as a slash command.
 * Returns the matched command + remaining args, or null if not a slash command.
 */
export function parseSlashCommand(input: string): SlashCommandMatch | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return null;

  const withoutSlash = trimmed.slice(1);
  const spaceIdx = withoutSlash.indexOf(' ');
  const cmdName = spaceIdx >= 0 ? withoutSlash.slice(0, spaceIdx) : withoutSlash;
  const args = spaceIdx >= 0 ? withoutSlash.slice(spaceIdx + 1).trim() : '';

  const command = SLASH_COMMANDS.find((c) => c.name === cmdName.toLowerCase());
  if (!command) return null;

  return { command, args };
}

/**
 * Build the structured LLM prefix for an LLM-mode slash command.
 * This wraps the user's text with context so Gemini understands the intent.
 */
export function buildLLMPrefix(command: SlashCommandDef, args: string): string {
  switch (command.name) {
    case 'ask':
      return `[Direct Question] ${args}`;
    case 'brainstorm':
      return `[Brainstorm Request] Please brainstorm creative ideas about: ${args}`;
    case 'analyze':
      return `[Analysis Request] Please analyze the following aspect of the story: ${args}`;
    case 'suggest':
      return args
        ? `[Suggestion Request] Please suggest improvements for: ${args}`
        : `[Suggestion Request] Please suggest improvements for the current scene and workspace context.`;
    default:
      return args;
  }
}

/**
 * Build a workspace action payload for a local-dispatch slash command.
 * Returns the action payload or null if the command can't be locally resolved.
 */
export function buildLocalAction(
  commandName: string,
  args: string,
): { action: string; panels?: Array<{ type: string }>; layout?: string } | null {
  switch (commandName) {
    case 'compose': {
      const types = args.split(/\s+/).filter((t) => KNOWN_PANEL_TYPES.has(t));
      if (types.length === 0) return null;
      return { action: 'show', panels: types.map((t) => ({ type: t })) };
    }
    case 'close': {
      const types = args.split(/\s+/).filter((t) => KNOWN_PANEL_TYPES.has(t));
      if (types.length === 0) return null;
      return { action: 'hide', panels: types.map((t) => ({ type: t })) };
    }
    case 'layout': {
      const template = args.trim();
      if (!KNOWN_LAYOUTS.has(template)) return null;
      return { action: 'replace', layout: template as WorkspaceLayout };
    }
    case 'focus': {
      const panelType = args.trim();
      if (!KNOWN_PANEL_TYPES.has(panelType)) return null;
      return { action: 'replace', panels: [{ type: panelType }], layout: 'single' };
    }
    case 'clear':
      return { action: 'clear' };
    default:
      return null;
  }
}
