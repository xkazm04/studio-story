/**
 * Canonical Advisor Tool Schema — Single Source of Truth
 *
 * All advisor tool declarations live here. Projection functions generate
 * the format-specific variants consumed by:
 *   - Gemini Live WebSocket (plain-string types)
 *   - Gemini SDK / HTTP route (Type.OBJECT enum values)
 *   - System instruction text (markdown reference)
 *
 * Adding or changing a tool here automatically propagates to all consumers.
 */

import type { GeminiToolDeclaration, GeminiFunctionDeclaration } from './types';
import { TOOL_NAMES } from './types';

// ─── Canonical Schema Types ─────────────────────

export type ParamType = 'string' | 'object' | 'array' | 'number' | 'boolean';

export interface CanonicalParam {
  type: ParamType;
  description: string;
  enum?: string[];
}

export interface CanonicalToolDef {
  name: string;
  description: string;
  executionSide: 'client' | 'server';
  parameters: Record<string, CanonicalParam>;
  required: string[];
}

// ─── Shared Constants ───────────────────────────

export const PANEL_TYPES = [
  'scene-editor', 'scene-metadata', 'dialogue-view', 'scene-list', 'scene-gallery',
  'character-cards', 'character-detail', 'character-creator', 'relationship-map',
  'story-map', 'beats-manager', 'story-evaluator', 'story-graph', 'script-editor',
  'theme-manager', 'beats-sidebar',
  'image-canvas', 'image-generator', 'art-style',
  'voice-manager', 'voice-casting', 'audio-production', 'voice-performance',
  'writing-desk', 'cast-sidebar', 'audio-toolbar',
  'advisor', 'storyboard', 'narrative-suggestions', 'reader-view',
] as const;

export const LAYOUT_OPTIONS = [
  'stack', 'single', 'split-2', 'split-3', 'grid-4', 'primary-sidebar', 'triptych', 'studio',
] as const;

export const COMPOSE_ACTIONS = ['show', 'hide', 'replace', 'clear'] as const;

export const CLI_DOMAINS = ['scene', 'character', 'story', 'image', 'general'] as const;

// ─── Canonical Tool Definitions ─────────────────

export const CANONICAL_ADVISOR_TOOLS: CanonicalToolDef[] = [
  // ── Client-side tools ──
  {
    name: TOOL_NAMES.COMPOSE_WORKSPACE,
    description:
      'Rearrange workspace panels for the current user task. Keep composition focused and role-consistent. ' +
      'Story authoring patterns: use primary-sidebar for scene editing (scene-editor + scene-metadata/beats-sidebar), ' +
      'split-2 for story structure (story-map + beats-manager), show action for smart merge when adding context panels. ' +
      'Use relationship-map when discussing character relationships or factions. ' +
      'Visual pipeline patterns: split-2 scene-editor + image-generator for illustration, ' +
      'primary-sidebar art-style + scene-gallery for style setup, ' +
      'triptych scene-editor + image-generator + character-detail for character-referenced illustration. ' +
      'Always pass entityId in dataSlice when opening a specific entity.',
    executionSide: 'client',
    parameters: {
      action: {
        type: 'string',
        description:
          'show: add panels without removing existing. hide: remove specific panels. ' +
          'replace: clear all and set new panels. clear: remove all panels.',
        enum: [...COMPOSE_ACTIONS],
      },
      layout: {
        type: 'string',
        description: 'Optional layout preset. Omit unless a specific structure is clearly needed.',
        enum: [...LAYOUT_OPTIONS],
      },
      panels: {
        type: 'string',
        description:
          'JSON array of panel objects: [{"type":"panel-type","role":"primary|secondary|tertiary|sidebar",' +
          '"density":"full|compact|micro","dataSlice":{"entityId":"...","filter":"...","view":"...","highlight":["..."],"sort":"..."}}]. ' +
          'Recommended 1-3 panels (max 5) with one primary panel. Sidebar role only for compact/context panels. ' +
          'density defaults to "full" — use "compact" for sidebars, "micro" for badge-only reference. ' +
          'dataSlice tells the panel what specific data to show. ' +
          `Panel types: ${PANEL_TYPES.join(', ')}. ` +
          'Story intelligence examples: Show suggestions alongside editing: ' +
          '{ panels: [{ type: "scene-editor" }, { type: "narrative-suggestions" }], layout: "primary-sidebar" }. ' +
          'Test branching story: { panels: [{ type: "reader-view" }, { type: "story-graph" }], layout: "split-2" }. ' +
          'Visual pipeline examples: Illustrate a scene: ' +
          '{ panels: [{ type: "image-generator", dataSlice: { entityId: "scene-id" } }, { type: "scene-editor" }], layout: "split-2" }. ' +
          'Set art style: { panels: [{ type: "art-style" }, { type: "scene-gallery" }], layout: "primary-sidebar" }. ' +
          'Illustrate with character reference: ' +
          '{ panels: [{ type: "scene-editor" }, { type: "image-generator" }, { type: "character-detail" }], layout: "triptych" }',
      },
      reasoning: {
        type: 'string',
        description: 'Brief explanation of why these panels were chosen. Shown to the user.',
      },
    },
    required: ['action'],
  },
  {
    name: TOOL_NAMES.SUGGEST_ACTION,
    description:
      'Send a proactive suggestion to the user. The suggestion appears as a dismissible card in the advisor panel. ' +
      'Use for creative tips, workflow improvements, or observations. ' +
      'Story examples: "Open character relationships" with compose_on_accept to show relationship-map, ' +
      '"Edit this scene" to compose scene-editor with primary-sidebar, ' +
      '"Show story structure" to compose story-map + beats-manager. ' +
      'Visual pipeline examples: "Illustrate this scene" to compose image-generator + scene-editor, ' +
      '"Set up art style first" to compose art-style panel, ' +
      '"Upload character reference for consistency" to compose character-detail.',
    executionSide: 'client',
    parameters: {
      content: {
        type: 'string',
        description: 'The suggestion text. Keep it concise (1-3 sentences).',
      },
      compose_on_accept: {
        type: 'string',
        description:
          'Optional JSON for a compose_workspace call to execute if the user accepts the suggestion. ' +
          'Format: {"action":"replace","panels":[...],"layout":"..."}',
      },
    },
    required: ['content'],
  },

  // ── Server-side orchestrator tools ──
  {
    name: TOOL_NAMES.CREATE_CLI_SESSION,
    description:
      'Spawn a new Claude Code CLI session to perform a creative storytelling task. ' +
      'The session runs autonomously and can use MCP tools.',
    executionSide: 'server',
    parameters: {
      prompt: {
        type: 'string',
        description: 'The task prompt for Claude Code. Be specific about what to create/edit.',
      },
      domain: {
        type: 'string',
        description: 'Task domain for UI tab categorization.',
        enum: [...CLI_DOMAINS],
      },
    },
    required: ['prompt'],
  },
  {
    name: TOOL_NAMES.GET_CLI_SESSIONS,
    description:
      'List all active (running) CLI sessions. Check this before spawning new sessions to respect the concurrent limit.',
    executionSide: 'server',
    parameters: {},
    required: [],
  },
  {
    name: TOOL_NAMES.GET_CLI_STATUS,
    description: 'Check the status of a specific CLI execution.',
    executionSide: 'server',
    parameters: {
      executionId: {
        type: 'string',
        description: 'The execution ID returned by create_cli_session.',
      },
    },
    required: ['executionId'],
  },
  {
    name: TOOL_NAMES.STOP_CLI_SESSION,
    description: 'Abort a running CLI session.',
    executionSide: 'server',
    parameters: {
      executionId: {
        type: 'string',
        description: 'The execution ID to abort.',
      },
    },
    required: ['executionId'],
  },
];

// ─── Projection Helpers ─────────────────────────

function projectParam(
  param: CanonicalParam,
  mapType: (t: ParamType) => string,
): Record<string, unknown> {
  return {
    type: mapType(param.type),
    description: param.description,
    ...(param.enum ? { enum: param.enum } : {}),
  };
}

function projectTool(
  tool: CanonicalToolDef,
  mapType: (t: ParamType) => string,
): { name: string; description: string; parameters: Record<string, unknown> } {
  return {
    name: tool.name,
    description: tool.description,
    parameters: {
      type: mapType('object'),
      properties: Object.fromEntries(
        Object.entries(tool.parameters).map(([key, param]) => [
          key,
          projectParam(param, mapType),
        ]),
      ),
      ...(tool.required.length > 0 ? { required: tool.required } : {}),
    },
  };
}

// ─── Projection: Gemini Live (WebSocket) ────────
// Uses lowercase string types ('object', 'string') per the Live API protocol.

export function toGeminiLiveDeclarations(
  tools: CanonicalToolDef[],
): GeminiToolDeclaration[] {
  const declarations = tools.map(t => projectTool(t, type => type));
  return [{ functionDeclarations: declarations as GeminiFunctionDeclaration[] }];
}

// ─── Projection: Gemini SDK (HTTP / generateContent) ────
// Uses uppercase string types ('OBJECT', 'STRING') matching the @google/genai Type enum.
// The consumer casts the result to FunctionDeclaration[] from the SDK.

const SDK_TYPE_MAP: Record<ParamType, string> = {
  string: 'STRING',
  object: 'OBJECT',
  array: 'ARRAY',
  number: 'NUMBER',
  boolean: 'BOOLEAN',
};

export function toGeminiSDKDeclarations(
  tools: CanonicalToolDef[],
) {
  return tools.map(t => projectTool(t, type => SDK_TYPE_MAP[type] ?? 'STRING'));
}

// ─── Projection: System Instruction Tool Reference ─

export function toSystemInstructionToolDocs(tools: CanonicalToolDef[]): string {
  const lines: string[] = ['## Tool Quick Reference'];
  for (const tool of tools) {
    const params = Object.entries(tool.parameters);
    const sig = params.length > 0
      ? `(${params.map(([k]) => (tool.required.includes(k) ? k : `${k}?`)).join(', ')})`
      : '()';
    // First sentence of description as brief summary
    const brief = tool.description.split('. ')[0] + '.';
    lines.push(`- **${tool.name}**${sig}: ${brief}`);
  }
  return lines.join('\n');
}

// ─── Convenience Filters ────────────────────────

export function getClientTools(): CanonicalToolDef[] {
  return CANONICAL_ADVISOR_TOOLS.filter(t => t.executionSide === 'client');
}

export function getServerTools(): CanonicalToolDef[] {
  return CANONICAL_ADVISOR_TOOLS.filter(t => t.executionSide === 'server');
}

/** Pre-computed name sets for fast tool classification in the route handler. */
export const CLIENT_TOOL_NAMES: ReadonlySet<string> = new Set(
  CANONICAL_ADVISOR_TOOLS.filter(t => t.executionSide === 'client').map(t => t.name),
);
export const SERVER_TOOL_NAMES: ReadonlySet<string> = new Set(
  CANONICAL_ADVISOR_TOOLS.filter(t => t.executionSide === 'server').map(t => t.name),
);
