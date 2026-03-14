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
import { registerMultimodalTools } from './multimodal.js';
import { registerVoiceTools } from './voice.js';

/**
 * Register all Story MCP tools
 */
export function registerTools(server: McpServer, config: McpConfig) {
  // HTTP client still used for image/AI tools that call external APIs
  const client = new StoryHttpClient(config.baseUrl);

  // CRUD tools use direct Supabase access (db.ts), no HTTP client needed
  registerProjectTools(server, config);
  registerCharacterTools(server, config);
  registerFactionTools(server, config);
  registerStoryStructureTools(server, config);
  registerSceneTools(server, config);

  // Image/AI tools still use HTTP client (they wrap external APIs, not DB queries)
  registerImageTools(server, config, client);

  // Workspace tools are client-side only (no DB or HTTP needed)
  registerWorkspaceTools(server, config, client);

  // Multimodal tools (Gemini delegation via API routes)
  registerMultimodalTools(server);

  // Voice/narration tools (TTS generation, voice assignment, cloning)
  registerVoiceTools(server, config, client);

  const tools = [
    'get_project', 'list_projects', 'create_project', 'update_project',
    'list_characters', 'get_character', 'create_character', 'update_character', 'list_traits', 'create_trait', 'update_trait',
    'create_relationship', 'list_relationships',
    'list_factions', 'get_faction', 'create_faction', 'update_faction',
    'list_acts', 'create_act', 'list_beats', 'get_beat', 'create_beat', 'update_beat',
    'list_scenes', 'get_scene', 'create_scene', 'update_scene',
    'generate_image_gemini', 'generate_image_leonardo', 'evaluate_image', 'describe_image',
    'update_workspace', 'compose_workspace', 'get_panel_manifests',
    'analyze_image', 'generate_image_multimodal', 'extract_audio',
    'generate_scene_narration', 'check_voice_assignments', 'list_voices', 'assign_character_voice',
  ];

  console.error(`[story-mcp] Registered ${tools.length} tools: ${tools.join(', ')}`);
}
