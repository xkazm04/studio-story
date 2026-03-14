import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { McpConfig } from '../config.js';
import type { StoryHttpClient } from '../http-client.js';

const PANEL_TYPES = [
  'scene-editor', 'scene-metadata', 'dialogue-view', 'scene-list', 'scene-gallery',
  'character-cards', 'character-detail', 'character-creator', 'relationship-map',
  'story-map', 'beats-manager', 'story-evaluator', 'story-graph', 'script-editor', 'theme-manager', 'beats-sidebar',
  'image-canvas', 'image-generator', 'art-style', 'storyboard',
  'voice-manager', 'voice-casting', 'script-dialog', 'narration', 'voice-performance',
  'writing-desk', 'cast-sidebar', 'audio-toolbar', 'advisor',
  'narrative-suggestions', 'reader-view',
] as const;

const LAYOUT_TYPES = [
  'stack', 'single', 'split-2', 'split-3', 'grid-4', 'primary-sidebar', 'triptych', 'studio',
] as const;

const ROLE_TYPES = ['primary', 'secondary', 'tertiary', 'sidebar'] as const;
const DENSITY_TYPES = ['micro', 'compact', 'full'] as const;

// Compact panel manifest descriptions for LLM context
const PANEL_MANIFESTS = `WORKSPACE PANELS (use compose_workspace to arrange these):

## SCENE
- **scene-editor** [primary/wide/high]: Block-based editor for composing scenes with screenplay formatting. Use when: User wants to write or edit a scene; User wants to compose dialogue. Pairs with: scene-metadata, scene-list, character-cards
- **scene-metadata** [sidebar/compact/low]: Displays and edits scene metadata (name, location, mood). Use when: User wants to see scene properties. Pairs with: scene-editor
- **dialogue-view** [secondary/standard/medium]: Focused dialogue view with character avatars. Use when: User wants to review conversation flow. Pairs with: scene-editor, character-cards
- **scene-list** [sidebar/compact/low]: Sidebar list of all scenes with selection and reordering. Use when: User needs to navigate between scenes. Pairs with: scene-editor
- **scene-gallery** [secondary/compact/low]: Visual gallery of scene images. Use when: User wants visual overview of scenes.

## CHARACTER
- **character-cards** [secondary/compact/low]: Grid of all project characters with avatars. Use when: User wants to browse characters. Pairs with: character-detail
- **character-detail** [primary/wide/high]: Full character profile editor (backstory, traits, appearance). Use when: User wants to create or edit a character in depth. Pairs with: character-cards
- **character-creator** [primary/wide/high]: Visual character design tool with category-based options. Use when: User wants to visually design a character. Pairs with: character-cards, image-generator
- **relationship-map** [primary/wide/medium]: Interactive character relationship graph showing connections, factions, and alliances. Use when: User wants to visualize character relationships, factions, or power dynamics. Pairs with: character-detail, character-cards, cast-sidebar

## STORY
- **story-map** [secondary/standard/medium]: Visual overview of story structure (acts/scenes). Use when: User wants to see overall story structure. Pairs with: beats-manager
- **beats-manager** [primary/wide/high]: Full beat management with creation, editing, ordering. Use when: User wants to plan or edit story beats. Pairs with: story-map, story-evaluator
- **story-evaluator** [secondary/standard/medium]: Story quality analysis (pacing, themes, arcs). Use when: User wants to evaluate story quality.
- **story-graph** [primary/wide/high]: Interactive node graph of story elements via ReactFlow. Use when: User wants to visualize story connections.
- **script-editor** [primary/wide/high]: Rich text script editor with TipTap. Use when: User wants to write formatted screenplay content.
- **theme-manager** [secondary/compact/medium]: Manage story themes and motifs. Use when: User wants to manage story themes.
- **beats-sidebar** [sidebar/compact/low]: Compact beat list for quick navigation. Use when: Sidebar companion for scene editing.

## IMAGE
- **art-style** [secondary/standard/medium]: Art style reference panel. Use when: User is setting up visual direction.
- **image-canvas** [secondary/standard/medium]: Image viewing and comparison canvas. Use when: User wants to review generated images.
- **image-generator** [primary/wide/high]: AI image generation interface. Supports scene illustration mode: auto-drafts prompts from scene context, generates 4 alternatives with character and style consistency, select and confirm flow. Use when: User wants to generate images or illustrate a scene.
- **storyboard** [secondary/standard/medium]: Scene-to-canvas storyboard pipeline. Auto-generates image prompts from story scenes with beat-type mood/lighting. Use when: User wants to create a visual storyboard from their story. Pairs with: image-generator, scene-list, art-style

## VOICE
- **voice-manager** [primary/standard/medium]: Voice profile management. Use when: User wants to define character voices.
- **voice-casting** [secondary/standard/medium]: Match characters to voice profiles. Use when: User is assigning voices.
- **script-dialog** [primary/wide/high]: Script with voice direction annotations. Use when: User is preparing script for voice recording.
- **narration** [primary/wide/high]: Narration editor and player. Use when: User is writing narration.
- **voice-performance** [sidebar/compact/low]: Voice delivery parameter controls. Use when: User is fine-tuning voice delivery.

## COMPOSITE
- **writing-desk** [primary/wide/high]: Multi-tab workspace (Content, Blocks, Image). Use when: User wants a comprehensive writing environment.
- **cast-sidebar** [sidebar/compact/low]: Compact character list for current scene. Use when: Sidebar companion during scene writing.
- **audio-toolbar** [tertiary/compact/low]: Audio control toolbar. Use when: Audio production workflow.

## STORY INTELLIGENCE
- **narrative-suggestions** [sidebar/compact/medium]: AI-driven narrative suggestions sidebar. Shows prioritized creative insights based on story analysis (relationship tensions, plot gaps, pacing issues). Each card has accept (composes relevant panels) and dismiss actions. Best as sidebar alongside editing panels.
- **reader-view** [primary/wide/high]: Interactive branching story reader simulation. Displays scene text with clickable choice buttons, variable state sidebar, path history with rewind support. Use when: User wants to test/preview their branching narrative. Best as primary panel, optionally paired with story-graph.

## AGENT
- **advisor** [sidebar/compact/low]: AI advisor panel with Gemini Live chat, proactive suggestions, and workspace observation. Use when: User wants AI guidance or creative suggestions.

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
- High-complexity panels need wide slots; low-complexity panels are ideal for sidebars.

## DENSITY MODES
Every panel supports up to 3 density levels: full, compact, micro.
- **full** (default) — all features visible, needs full slot space
- **compact** — key info only, reduced chrome, good for sidebars and secondary panels
- **micro** — badge/chip view (~48px), shows one summary metric, minimal space
Set density per panel in the panels array. Use compact for sidebars. Use micro for reference-only panels.

## DATA SLICES
Pass dataSlice per panel to control what data it shows:
- entityId: specific entity to display (scene ID, character ID)
- filter: filter expression ("faction:villain", "scene-participants", "incomplete")
- view: which tab/view to show ("traits", "relationships", "dialogue", "image")
- highlight: entity IDs to visually highlight
- sort: sort order ("type", "name", "order")

## ROLES
primary (main focus), secondary (supporting), tertiary (minor), sidebar (narrow navigation)

## STORY AUTHORING COMPOSITION PATTERNS

When the user describes a story idea:
1. First call create_project (or update_project) with premise, genre, setting extracted from their description.
2. Then compose_workspace with action 'replace', layout 'split-2', panels: [story-map (primary), character-cards (secondary)].

When the user asks about a character (e.g., "show me Elena"):
- Use action 'show' (smart merge — keeps existing panels, adds new ones alongside).
- Primary: character-detail with dataSlice { entityId: '<character-id>' }.
- If the character has many relationships: add relationship-map as secondary.
- If the character appears in scenes: add scene-list as sidebar.

When the user asks about a scene (e.g., "show the castle scene"):
- Use action 'replace', layout 'primary-sidebar'.
- Primary: scene-editor with dataSlice { entityId: '<scene-id>' }.
- Sidebar: choose contextually — scene-metadata for editing details, character-cards if multiple characters, beats-sidebar for structuring beats.

When the user asks about story structure:
- Use action 'replace', layout 'split-2' or 'triptych'.
- Include: story-map (primary), beats-manager (secondary).
- If evaluating quality: add story-evaluator as a third panel in triptych layout.

When the user asks about relationships or factions:
- Use action 'show' or 'replace' with relationship-map as primary.
- If a specific character is the focus, include character-detail as secondary with their entityId.

COMPOSITION ACTIONS:
- 'show': ADD panels alongside existing ones. Preferred for "also show me X" requests. Keeps user context.
- 'replace': FULL context switch. Use when user clearly changes topic (e.g., from characters to story structure).
- 'hide': Remove specific panels by type.
- 'clear': Remove all panels.

LAYOUT SELECTION:
- 'primary-sidebar': Scene editing (editor ~70% + contextual sidebar ~30%).
- 'split-2': Two panels (story-map + beats, or character-detail + relationship-map).
- 'triptych': Three panels (e.g., story-map + beats-manager + story-evaluator).
- 'single': Focused distraction-free work (writing or reading).
- 'grid-4': Overview mode (story-map + character-cards + scene-list + beats-manager).

DENSITY: More panels = more compact. Set density 'compact' for secondary/sidebar panels when 3+ panels are visible. Use 'full' for the primary panel. Use 'micro' for reference-only panels in studio layout.

DATA SLICES: Always pass entityId in dataSlice when opening a specific entity. Example: { entityId: 'scene-uuid' } for scene-editor, { entityId: 'char-uuid' } for character-detail.

## STORY INTELLIGENCE COMPOSITION PATTERNS

When user is writing or editing story content:
- Add narrative-suggestions as sidebar: layout=primary-sidebar, panels=[{editing panel}, narrative-suggestions]
- Example: user editing a scene -> [scene-editor, narrative-suggestions]

When user wants to test branching story:
- Reader view as primary: layout=split-2, panels=[reader-view, story-graph]
- The story-graph highlights current position during simulation

When user asks "what should happen next?" or "suggest plot ideas":
- Show narrative-suggestions panel: layout=primary-sidebar, panels=[narrative-suggestions, story-graph]
- The suggestions come from StoryAnalyzer rules (relationship tensions, plot gaps, etc.)

When user wants to create branches:
- Use create_branch CLI tool to create scenes + choices atomically
- Then show: layout=split-2, panels=[story-graph, scene-editor] (graph shows new branches, editor focuses on new scene)

When user wants to review story structure with suggestions:
- layout=triptych, panels=[narrative-suggestions, story-graph, scene-editor]

Layout selection rules:
- narrative-suggestions is always sidebar role (sizeClass sm)
- reader-view is always primary role (sizeClass lg)
- story-graph pairs well with both narrative-suggestions and reader-view

## VISUAL PIPELINE COMPOSITION PATTERNS

### Scene Illustration
When user wants to illustrate a scene or generate scene images:
- Layout: split-2 (scene-editor | image-generator)
- image-generator: role primary, pass sceneId in dataSlice
- scene-editor: role secondary, shows the scene being illustrated
- Example: "illustrate this scene", "generate an image for the castle scene"

### Art Style Definition
When user wants to define or adjust the project's visual style:
- Layout: primary-sidebar (art-style | scene-gallery)
- art-style: role primary, shows style editor with reference upload
- scene-gallery: role sidebar, shows existing scene images for comparison
- Example: "set up the art style", "change the visual style"

### Visual Review
When user wants to review all scene illustrations:
- Layout: split-2 (scene-gallery | image-canvas)
- scene-gallery: role primary, shows all illustrated scenes
- image-canvas: role secondary, shows selected image detail
- Example: "show me all scene illustrations", "review the images"

### Illustration with Character Reference
When illustrating scenes with specific characters:
- Layout: triptych (scene-editor | image-generator | character-detail)
- image-generator: role primary with sceneId
- scene-editor: role secondary
- character-detail: role sidebar, shows character whose reference is being used
- Example: "illustrate the scene with Elena's reference", "generate with character consistency"`;

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
    'Compose workspace panels for the user task. Keep layouts focused, choose role-appropriate panels from manifests, and set layout only when explicit structure is needed. For story authoring: use primary-sidebar for scene editing, split-2 for story structure, show action for smart merge when adding context. See STORY AUTHORING COMPOSITION PATTERNS in get_panel_manifests output.',
    {
      action: z.enum(['show', 'hide', 'replace', 'clear']).describe('show: add panels, hide: remove panels, replace: clear and set new panels, clear: remove all'),
      layout: z.enum(LAYOUT_TYPES).optional().describe('Optional explicit layout. Omit unless a specific arrangement is required.'),
      panels: z.array(z.object({
        type: z.enum(PANEL_TYPES).describe('Panel type from manifests'),
        role: z.enum(ROLE_TYPES).optional().describe('Panel role. Use sidebar only for compact/context panels; use one primary panel maximum.'),
        props: z.record(z.string(), z.unknown()).optional().describe('Props to pass to the panel'),
        density: z.enum(DENSITY_TYPES).optional().describe('Rendering density: full (default), compact (reduced UI), micro (badge only)'),
        dataSlice: z.object({
          entityId: z.string().optional().describe('Specific entity ID to display'),
          filter: z.string().optional().describe('Filter expression (e.g. "faction:villain", "incomplete")'),
          view: z.string().optional().describe('Tab/view to show (e.g. "traits", "dialogue")'),
          highlight: z.array(z.string()).optional().describe('Entity IDs to highlight'),
          sort: z.string().optional().describe('Sort order'),
        }).optional().describe('Data slice to control what the panel displays'),
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
