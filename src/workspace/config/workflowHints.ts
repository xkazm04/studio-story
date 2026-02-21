import type { PanelDirective, WorkspacePanelType } from '../types';

export const TOOL_PANEL_HINTS: Record<string, PanelDirective[]> = {
  create_scene: [{ type: 'scene-editor', role: 'primary' }, { type: 'scene-list', role: 'sidebar' }],
  update_scene: [{ type: 'scene-editor', role: 'primary' }],
  create_character: [{ type: 'character-detail', role: 'primary' }, { type: 'character-cards', role: 'sidebar' }],
  update_character: [{ type: 'character-detail', role: 'primary' }],
  create_beat: [{ type: 'beats-manager', role: 'primary' }],
  update_beat: [{ type: 'beats-manager', role: 'primary' }],
  create_trait: [{ type: 'character-detail', role: 'primary' }],
  update_trait: [{ type: 'character-detail', role: 'primary' }],
  update_faction: [{ type: 'story-map', role: 'secondary' }],
  create_faction: [{ type: 'story-map', role: 'secondary' }],
};

export const TOOL_PRIMARY_PANEL_TYPES: Record<string, WorkspacePanelType[]> = Object.fromEntries(
  Object.entries(TOOL_PANEL_HINTS).map(([tool, directives]) => [tool, directives.map((d) => d.type)])
);
