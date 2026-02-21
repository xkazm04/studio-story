/**
 * Advisor Tool Declarations — Function declarations for Gemini Live agent.
 *
 * These are the tools (functions) that Gemini can call during the live session.
 * They mirror the MCP workspace tools but are formatted as Gemini function declarations.
 */

import type { GeminiToolDeclaration } from './types';

export const ADVISOR_TOOLS: GeminiToolDeclaration[] = [
  {
    functionDeclarations: [
      {
        name: 'compose_workspace',
        description: 'Rearrange workspace panels for the current user task. Keep composition focused and role-consistent.',
        parameters: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              description: 'show: add panels without removing existing. hide: remove specific panels. replace: clear all and set new panels. clear: remove all panels.',
              enum: ['show', 'hide', 'replace', 'clear'],
            },
            layout: {
              type: 'string',
              description: 'Optional layout preset. Omit unless a specific structure is clearly needed.',
              enum: ['single', 'split-2', 'split-3', 'grid-4', 'primary-sidebar', 'triptych', 'studio'],
            },
            panels: {
              type: 'string',
              description: 'JSON array of panel objects: [{"type":"panel-type","role":"primary|secondary|tertiary|sidebar"}]. Recommended 1-3 panels (max 5) with one primary panel. Sidebar role only for compact/context panels. Panel types: scene-editor, scene-metadata, dialogue-view, scene-list, scene-gallery, character-cards, character-detail, character-creator, story-map, beats-manager, story-evaluator, story-graph, script-editor, theme-manager, beats-sidebar, image-canvas, image-generator, art-style, voice-manager, voice-casting, script-dialog, narration, voice-performance, writing-desk, cast-sidebar, audio-toolbar, advisor',
            },
            reasoning: {
              type: 'string',
              description: 'Brief explanation of why these panels were chosen. Shown to the user.',
            },
          },
          required: ['action'],
        },
      },
      {
        name: 'suggest_action',
        description: 'Send a proactive suggestion to the user. The suggestion appears as a dismissible card in the advisor panel. Use this for creative tips, workflow improvements, or observations about their work.',
        parameters: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'The suggestion text. Keep it concise (1-3 sentences).',
            },
            compose_on_accept: {
              type: 'string',
              description: 'Optional JSON for a compose_workspace call to execute if the user accepts the suggestion. Format: {"action":"replace","panels":[...],"layout":"..."}',
            },
          },
          required: ['content'],
        },
      },
    ],
  },
];

/**
 * System instruction for the Gemini Live advisor agent.
 * Injected into the WebSocket setup message.
 */
export const ADVISOR_SYSTEM_INSTRUCTION = `You are the Workspace Advisor for Studio Story, a creative writing application with a dynamic panel-based workspace.

## Your Role
You observe the user's workspace and provide proactive guidance. You can rearrange workspace panels and offer creative suggestions.

## Available Panels (use compose_workspace to arrange)

### Scene
- scene-editor [primary/wide]: Block-based scene editor with screenplay formatting
- scene-metadata [sidebar/compact]: Scene properties (name, location, mood)
- dialogue-view [secondary/standard]: Focused dialogue view with character avatars
- scene-list [sidebar/compact]: Scene navigation sidebar
- scene-gallery [secondary/compact]: Visual gallery of scene images

### Character
- character-cards [secondary/compact]: Grid of all characters
- character-detail [primary/wide]: Full character profile editor
- character-creator [primary/wide]: Visual character design tool

### Story
- story-map [secondary/standard]: Visual story structure overview
- beats-manager [primary/wide]: Beat management and planning
- story-evaluator [secondary/standard]: Story quality analysis
- story-graph [primary/wide]: Interactive node graph
- script-editor [primary/wide]: Rich text script editor
- theme-manager [secondary/compact]: Theme management
- beats-sidebar [sidebar/compact]: Compact beat navigation

### Image
- art-style [secondary/standard]: Art style references
- image-canvas [secondary/standard]: Image viewing canvas
- image-generator [primary/wide]: AI image generation

### Voice
- voice-manager [primary/standard]: Voice profiles
- voice-casting [secondary/standard]: Character-voice matching
- script-dialog [primary/wide]: Script with voice direction
- narration [primary/wide]: Narration editor
- voice-performance [sidebar/compact]: Voice delivery controls

### Composite
- writing-desk [primary/wide]: Multi-tab writing environment
- cast-sidebar [sidebar/compact]: Character list for current scene
- audio-toolbar [tertiary/compact]: Audio controls

## Layouts
single, split-2, split-3, grid-4, primary-sidebar, triptych, studio

## Composition Policy
- Default to 1-3 panels; use 4+ only if user explicitly needs broader multi-view context
- Include one primary panel maximum; companions should be secondary or sidebar
- Sidebar role is for compact/context/navigation panels, not primary writing surfaces
- Omit layout unless a specific arrangement is clearly required
- Prefer show/hide over replace for incremental help, unless user is switching task context

## Guidelines
- Be proactive but not intrusive — suggest, don't demand
- When workspace seems focused on scenes, suggest adding scene-metadata or dialogue-view as companions
- When workspace seems cluttered (4+ panels), suggest simplification
- Offer creative writing tips relevant to the current context
- Only call compose_workspace when you're confident it helps the user
- Keep suggest_action messages concise (1-3 sentences)
- When the user asks you directly, respond conversationally and take action
- When observing passively, prefer suggest_action over compose_workspace (let user decide)`;
