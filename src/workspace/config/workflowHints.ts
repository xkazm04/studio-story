import type { PanelDirective, WorkspacePanelType } from '../types';

export const TOOL_PANEL_HINTS: Record<string, PanelDirective[]> = {
  // Scene
  create_scene: [{ type: 'scene-editor', role: 'primary' }, { type: 'scene-list', role: 'sidebar' }],
  update_scene: [{ type: 'scene-editor', role: 'primary' }],

  // Character
  create_character: [{ type: 'character-detail', role: 'primary' }, { type: 'character-cards', role: 'sidebar' }],
  update_character: [{ type: 'character-detail', role: 'primary' }, { type: 'character-cards', role: 'sidebar' }],
  create_trait: [{ type: 'character-detail', role: 'primary' }],
  update_trait: [{ type: 'character-detail', role: 'primary' }],

  // Story structure
  create_act: [{ type: 'story-map', role: 'primary' }, { type: 'beats-manager', role: 'secondary' }],
  create_beat: [{ type: 'beats-manager', role: 'primary' }],
  update_beat: [{ type: 'beats-manager', role: 'primary' }],

  // Factions
  update_faction: [{ type: 'story-map', role: 'secondary' }],
  create_faction: [{ type: 'story-map', role: 'secondary' }],

  // Image generation — show gallery/canvas when images are created
  generate_image_gemini: [{ type: 'scene-gallery', role: 'primary' }, { type: 'image-canvas', role: 'secondary' }],
  generate_image_leonardo: [{ type: 'scene-gallery', role: 'primary' }, { type: 'image-generator', role: 'secondary' }],
  evaluate_image: [{ type: 'image-canvas', role: 'primary' }],
  describe_image: [{ type: 'image-canvas', role: 'primary' }],

  // Art style
  extract_art_style: [{ type: 'art-style', role: 'primary' }],

  // Scene illustration
  generate_scene_illustration: [
    { type: 'image-generator', role: 'primary' },
    { type: 'scene-editor', role: 'secondary' },
  ],
  check_illustration_status: [
    { type: 'image-generator', role: 'primary' },
  ],
  save_scene_illustration: [
    { type: 'scene-gallery', role: 'primary' },
    { type: 'scene-editor', role: 'secondary' },
  ],

  // Voice/narration — narrate scenes, assign voices, manage voice pipeline
  generate_scene_narration: [
    { type: 'narration', role: 'primary' },
    { type: 'script-dialog', role: 'secondary' },
  ],
  check_voice_assignments: [
    { type: 'voice-casting', role: 'primary' },
    { type: 'voice-manager', role: 'secondary' },
  ],
  list_voices: [
    { type: 'voice-manager', role: 'primary' },
  ],
  assign_character_voice: [
    { type: 'voice-casting', role: 'primary' },
    { type: 'character-detail', role: 'secondary' },
  ],
};

/**
 * Narration composition patterns — maps natural language intents
 * to recommended panel layouts for voice/narration workflows.
 *
 * Used by the advisor system instruction and TOOL_PANEL_HINTS for
 * contextual panel suggestions when the user works with voice features.
 */
export const NARRATION_COMPOSITION_PATTERNS = {
  'narrate this scene': {
    layout: 'split-2' as const,
    panels: [
      { type: 'narration' as WorkspacePanelType, role: 'primary' as const },
      { type: 'script-dialog' as WorkspacePanelType, role: 'secondary' as const },
    ],
    description: 'Narration pipeline alongside script dialogue view',
  },
  'assign voices': {
    layout: 'split-2' as const,
    panels: [
      { type: 'voice-casting' as WorkspacePanelType, role: 'primary' as const },
      { type: 'voice-manager' as WorkspacePanelType, role: 'secondary' as const },
    ],
    description: 'Voice casting with voice library browser',
  },
  'record audio drama': {
    layout: 'triptych' as const,
    panels: [
      { type: 'narration' as WorkspacePanelType, role: 'primary' as const },
      { type: 'voice-performance' as WorkspacePanelType, role: 'secondary' as const },
      { type: 'script-dialog' as WorkspacePanelType, role: 'tertiary' as const },
    ],
    description: 'Full audio drama workspace: narration + performance controls + script',
  },
} as const;

export const TOOL_PRIMARY_PANEL_TYPES: Record<string, WorkspacePanelType[]> = Object.fromEntries(
  Object.entries(TOOL_PANEL_HINTS).map(([tool, directives]) => [tool, directives.map((d) => d.type)])
);
