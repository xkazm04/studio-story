/**
 * MCP Tools Registry
 * Registers all Story MCP tools with the server
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpConfig } from '../config.js';
import { StoryHttpClient } from '../http-client.js';
import { registerProjectTools } from './projects.js';
import { registerCharacterTools } from './characters.js';
import { registerFactionTools } from './factions.js';
import { registerStoryStructureTools } from './story-structure.js';
import { registerSceneTools } from './scenes.js';
import { registerImageTools } from './images.js';
import { registerWorkspaceTools } from './workspace.js';

/**
 * Register all Story MCP tools
 */
export function registerTools(server: McpServer, config: McpConfig) {
  const client = new StoryHttpClient(config.baseUrl);

  registerProjectTools(server, config, client);
  registerCharacterTools(server, config, client);
  registerFactionTools(server, config, client);
  registerStoryStructureTools(server, config, client);
  registerSceneTools(server, config, client);
  registerImageTools(server, config, client);
  registerWorkspaceTools(server, config, client);

  const tools = [
    'get_project', 'list_projects',
    'list_characters', 'get_character', 'create_character', 'update_character', 'list_traits', 'create_trait', 'update_trait',
    'list_factions', 'get_faction', 'update_faction',
    'list_acts', 'list_beats', 'get_beat', 'create_beat', 'update_beat',
    'list_scenes', 'get_scene', 'update_scene', 'list_relationships',
    'generate_image_gemini', 'generate_image_leonardo', 'evaluate_image', 'describe_image',
    'update_workspace', 'compose_workspace', 'get_panel_manifests',
  ];

  console.error(`[story-mcp] Registered ${tools.length} tools: ${tools.join(', ')}`);
}
