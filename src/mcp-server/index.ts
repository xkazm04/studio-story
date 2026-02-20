#!/usr/bin/env node
/**
 * Story MCP Server
 *
 * Provides tools for Claude Code CLI to interact with Story app's internal APIs:
 *
 * CRUD Tools:
 *   get_project, list_projects
 *   get_character, list_characters, update_character, create_character
 *   get_faction, list_factions, update_faction
 *   list_acts, list_beats, get_beat, update_beat, create_beat
 *   get_scene, list_scenes, update_scene
 *   list_relationships, list_traits
 *
 * Image Tools:
 *   generate_image_gemini, generate_image_leonardo, evaluate_image, describe_image
 *
 * Communicates with Claude Code via stdio transport.
 * Calls Story Next.js APIs over HTTP (localhost).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { parseConfig } from './config.js';
import { registerTools } from './tools/index.js';

async function main() {
  const config = parseConfig();

  const server = new McpServer({
    name: 'story',
    version: '1.0.0',
  }, {
    capabilities: {
      tools: {},
    },
    instructions: `Story MCP server provides tools for reading and writing storytelling project data.

CRUD Tools (use projectId from config or pass explicitly):
- get_project / list_projects: Read project metadata
- get_character / list_characters / update_character / create_character: Character CRUD
- get_faction / list_factions / update_faction: Faction CRUD
- list_acts / list_beats / get_beat / update_beat / create_beat: Story structure
- get_scene / list_scenes / update_scene: Scene CRUD
- list_relationships / list_traits: Read relationships and traits

Image Tools:
- generate_image_gemini: Generate/transform images via Gemini
- generate_image_leonardo: Generate images via Leonardo AI
- evaluate_image: Evaluate image quality via Gemini vision

Always read existing data before generating new content to maintain consistency.`,
  });

  registerTools(server, config);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[story-mcp] Server started successfully');
  console.error(`[story-mcp] Project ID: ${config.projectId || '(not set)'}`);
  console.error(`[story-mcp] Base URL: ${config.baseUrl}`);
}

main().catch((error) => {
  console.error('[story-mcp] Fatal error:', error);
  process.exit(1);
});
