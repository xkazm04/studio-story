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
    { type: 'audio-production', role: 'primary' },
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

  // Prompt templates — show writing desk as closest equivalent
  save_prompt_template: [{ type: 'writing-desk', role: 'primary' }],
  list_prompt_templates: [{ type: 'writing-desk', role: 'primary' }],
  fill_prompt_template: [{ type: 'writing-desk', role: 'primary' }],
};

export const TOOL_PRIMARY_PANEL_TYPES: Record<string, WorkspacePanelType[]> = Object.fromEntries(
  Object.entries(TOOL_PANEL_HINTS).map(([tool, directives]) => [tool, directives.map((d) => d.type)])
);
