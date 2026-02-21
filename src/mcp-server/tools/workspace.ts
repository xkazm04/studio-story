import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { McpConfig } from '../config.js';
import type { StoryHttpClient } from '../http-client.js';

const PANEL_TYPES = [
  'scene-editor', 'scene-metadata', 'dialogue-view', 'scene-list', 'scene-gallery',
  'character-cards', 'character-detail', 'character-creator',
  'story-map', 'beats-manager', 'story-evaluator', 'story-graph', 'script-editor', 'theme-manager', 'beats-sidebar',
  'image-canvas', 'image-generator', 'art-style',
  'voice-manager', 'voice-casting', 'script-dialog', 'narration', 'voice-performance',
  'writing-desk', 'cast-sidebar', 'audio-toolbar', 'advisor',
] as const;

const LAYOUT_TYPES = [
  'single', 'split-2', 'split-3', 'grid-4', 'primary-sidebar', 'triptych', 'studio',
] as const;

const ROLE_TYPES = ['primary', 'secondary', 'tertiary', 'sidebar'] as const;

// Compact panel manifest descriptions for LLM context
const PANEL_MANIFESTS = `WORKSPACE PANELS (use compose_workspace to arrange these):

## SCENE
- **scene-editor** [primary/wide]: Block-based editor for composing scenes with screenplay formatting. Use when: User wants to write or edit a scene; User wants to compose dialogue. Pairs with: scene-metadata, scene-list, character-cards
- **scene-metadata** [sidebar/compact]: Displays and edits scene metadata (name, location, mood). Use when: User wants to see scene properties. Pairs with: scene-editor
- **dialogue-view** [secondary/standard]: Focused dialogue view with character avatars. Use when: User wants to review conversation flow. Pairs with: scene-editor, character-cards
- **scene-list** [sidebar/compact]: Sidebar list of all scenes with selection and reordering. Use when: User needs to navigate between scenes. Pairs with: scene-editor
- **scene-gallery** [secondary/compact]: Visual gallery of scene images. Use when: User wants visual overview of scenes.

## CHARACTER
- **character-cards** [secondary/compact]: Grid of all project characters with avatars. Use when: User wants to browse characters. Pairs with: character-detail
- **character-detail** [primary/wide]: Full character profile editor (backstory, traits, appearance). Use when: User wants to create or edit a character in depth. Pairs with: character-cards
- **character-creator** [primary/wide]: Visual character design tool with category-based options. Use when: User wants to visually design a character. Pairs with: character-cards, image-generator

## STORY
- **story-map** [secondary/standard]: Visual overview of story structure (acts/scenes). Use when: User wants to see overall story structure. Pairs with: beats-manager
- **beats-manager** [primary/wide]: Full beat management with creation, editing, ordering. Use when: User wants to plan or edit story beats. Pairs with: story-map, story-evaluator
- **story-evaluator** [secondary/standard]: Story quality analysis (pacing, themes, arcs). Use when: User wants to evaluate story quality.
- **story-graph** [primary/wide]: Interactive node graph of story elements via ReactFlow. Use when: User wants to visualize story connections.
- **script-editor** [primary/wide]: Rich text script editor with TipTap. Use when: User wants to write formatted screenplay content.
- **theme-manager** [secondary/compact]: Manage story themes and motifs. Use when: User wants to manage story themes.
- **beats-sidebar** [sidebar/compact]: Compact beat list for quick navigation. Use when: Sidebar companion for scene editing.

## IMAGE
- **art-style** [secondary/standard]: Art style reference panel. Use when: User is setting up visual direction.
- **image-canvas** [secondary/standard]: Image viewing and comparison canvas. Use when: User wants to review generated images.
- **image-generator** [primary/wide]: AI image generation interface. Use when: User wants to generate images.

## VOICE
- **voice-manager** [primary/standard]: Voice profile management. Use when: User wants to define character voices.
- **voice-casting** [secondary/standard]: Match characters to voice profiles. Use when: User is assigning voices.
- **script-dialog** [primary/wide]: Script with voice direction annotations. Use when: User is preparing script for voice recording.
- **narration** [primary/wide]: Narration editor and player. Use when: User is writing narration.
- **voice-performance** [sidebar/compact]: Voice delivery parameter controls. Use when: User is fine-tuning voice delivery.

## COMPOSITE
- **writing-desk** [primary/wide]: Multi-tab workspace (Content, Blocks, Image). Use when: User wants a comprehensive writing environment.
- **cast-sidebar** [sidebar/compact]: Compact character list for current scene. Use when: Sidebar companion during scene writing.
- **audio-toolbar** [tertiary/compact]: Audio control toolbar. Use when: Audio production workflow.

## AGENT
- **advisor** [sidebar/compact]: AI advisor panel with Gemini Live chat, proactive suggestions, and workspace observation. Use when: User wants AI guidance or creative suggestions.

## LAYOUTS
Available: single, split-2, split-3, grid-4, primary-sidebar, triptych, studio
- single: One full-width panel
- split-2: Two panels side by side (3fr / 2fr)
- split-3: Left column (3fr) + right column stacked (2fr)
- grid-4: 2x2 grid
- primary-sidebar: Wide primary + 280px sidebar
- triptych: 250px sidebar + center + 280px sidebar
- studio: Top bar + left sidebar + center + right sidebar + bottom gallery

## COMPOSITION POLICY
- Keep workspace focused: prefer 1-3 panels unless user asks for a broad multi-view.
- Always include at most one primary panel in each composition.
- Sidebar role is for compact navigation/context panels only.
- Prefer action=show/hide for incremental updates; use replace when user clearly changes task context.
- Omit layout by default and let runtime auto-resolve; set layout only when specific structure is required.
- If uncertain between two panels, choose the one explicitly requested by user language.

## ROLES
primary (main focus), secondary (supporting), tertiary (minor), sidebar (narrow navigation)`;

function textContent(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

export function registerWorkspaceTools(server: McpServer, _config: McpConfig, _client: StoryHttpClient) {
  // ─── get_panel_manifests ─────────────────────────
  server.tool(
    'get_panel_manifests',
    'Get all available workspace panel manifests. Returns capabilities, inputs, and use cases for each panel. Use this to decide which panels to compose.',
    {},
    async () => {
      return textContent(PANEL_MANIFESTS);
    }
  );

  // ─── compose_workspace ───────────────────────────
  server.tool(
    'compose_workspace',
    'Compose workspace panels for the user task. Keep layouts focused, choose role-appropriate panels from manifests, and set layout only when explicit structure is needed.',
    {
      action: z.enum(['show', 'hide', 'replace', 'clear']).describe('show: add panels, hide: remove panels, replace: clear and set new panels, clear: remove all'),
      layout: z.enum(LAYOUT_TYPES).optional().describe('Optional explicit layout. Omit unless a specific arrangement is required.'),
      panels: z.array(z.object({
        type: z.enum(PANEL_TYPES).describe('Panel type from manifests'),
        role: z.enum(ROLE_TYPES).optional().describe('Panel role. Use sidebar only for compact/context panels; use one primary panel maximum.'),
        props: z.record(z.string(), z.unknown()).optional().describe('Props to pass to the panel'),
      })).max(5).optional().describe('Panels to show/hide (recommended 1-3, hard limit 5)'),
      reasoning: z.string().optional().describe('Brief explanation of why these panels were chosen'),
    },
    async ({ action, layout, panels, reasoning }) => {
      return textContent(JSON.stringify({
        applied: true,
        action,
        layout: layout ?? 'auto',
        panelCount: panels?.length ?? 0,
        reasoning: reasoning ?? 'No reasoning provided',
      }));
    }
  );

  // ─── update_workspace (backward compat) ──────────
  server.tool(
    'update_workspace',
    'Update workspace panels. Legacy tool — prefer compose_workspace for new implementations.',
    {
      action: z.enum(['show', 'hide', 'replace', 'clear']),
      panels: z.array(z.object({
        type: z.enum(PANEL_TYPES),
        role: z.enum(ROLE_TYPES).optional(),
        props: z.record(z.string(), z.unknown()).optional(),
      })).optional(),
    },
    async ({ action, panels }) => {
      return textContent(JSON.stringify({ applied: true, action, panelCount: panels?.length ?? 0 }));
    }
  );
}
