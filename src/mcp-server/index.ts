#!/usr/bin/env node
/**
 * Story MCP Server
 *
 * Provides tools for Claude Code CLI to interact with Story app's internal APIs:
 *
 * CRUD Tools:
 *   get_project, list_projects, create_project, update_project
 *   get_character, list_characters, update_character, create_character
 *   create_relationship, list_relationships
 *   get_faction, list_factions, update_faction
 *   list_acts, list_beats, get_beat, update_beat, create_beat
 *   get_scene, list_scenes, update_scene, create_choice, create_branch
 *   list_traits, create_trait, update_trait
 *
 * Image Tools:
 *   generate_image_gemini, generate_image_leonardo, evaluate_image, describe_image
 *
 * Communicates with Claude Code via stdio transport.
 * Calls Story Next.js APIs over HTTP (localhost).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { parseConfig, validateBaseUrl } from './config.js';
import { initDb, getClientOrNull } from './db.js';
import { registerTools, validateToolRegistration } from './tools/index.js';
import { validateSchemaAtStartup } from './schema-validator.js';

async function main() {
  const config = parseConfig();

  // Initialize direct Supabase client (falls back to HTTP if env vars missing)
  const dbReady = initDb(config);
  console.error(`[story-mcp] Direct DB: ${dbReady ? 'enabled' : 'disabled (falling back to HTTP)'}`);

  // Validate schema against live database (non-blocking)
  const dbClient = getClientOrNull();
  if (dbClient) {
    validateSchemaAtStartup(dbClient).catch(() => {
      // Validation is best-effort — never block startup
    });
  }

  const instructions = `Story MCP server provides tools for reading and writing storytelling project data.

CRUD Tools (use projectId from config or pass explicitly):
- get_project / list_projects / create_project / update_project: Project CRUD (premise, genre, setting)
- get_character / list_characters / update_character / create_character: Character CRUD
- create_relationship / list_relationships: Character relationship CRUD
- get_faction / list_factions / update_faction: Faction CRUD
- list_acts / list_beats / get_beat / update_beat / create_beat: Story structure
- get_scene / list_scenes / update_scene: Scene CRUD
- list_traits / create_trait / update_trait: Character trait CRUD

Image Tools:
- generate_image_gemini: Generate/transform images via Gemini
- generate_image_leonardo: Generate images via Leonardo AI
- evaluate_image: Evaluate image quality via Gemini vision

Story History Tools (git-like version control for narrative data):
- story_log: View commit history (every mutation is auto-committed)
- story_show: Inspect a specific commit's full diff
- story_diff: Compare two commits or two branches side-by-side
- story_branches: List or create story branches (alternative plotlines)
- story_checkout: Switch active branch
- story_cherry_pick: Copy a specific change between branches
- story_merge: Merge branches with conflict detection
- story_time_travel: Restore an entity to a historical state

Audit Tools:
- list_tool_history: Query the full audit trail of all MCP tool invocations with filtering, pagination, and summary modes

Prompt Template Tools:
- save_prompt_template: Save a reusable CLI prompt template with {variable} slots
- list_prompt_templates: List and search saved templates by category, tag, or query
- get_prompt_template: Get a template's full content and variable definitions
- fill_prompt_template: Fill a template by resolving variables from project context or explicit overrides
- delete_prompt_template: Delete a template

Context Pin Tools (persistent story rules engine):
- list_context_pins: List persistent context pins for a project (filterable by scope, enabled)
- create_context_pin: Create a persistent context pin (world_rule, character_constraint, tone_directive, plot_boundary)
- update_context_pin: Update a context pin's fields (label, content, scope, enabled, etc.)
- delete_context_pin: Delete a context pin permanently

Always read existing data before generating new content to maintain consistency.`;

  const server = new McpServer({
    name: 'story',
    version: '1.0.0',
  }, {
    capabilities: {
      tools: {},
    },
    instructions,
  });

  const registrations = registerTools(server, config);
  validateToolRegistration(registrations, instructions);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[story-mcp] Server started successfully');
  console.error(`[story-mcp] Project ID: ${config.projectId || '(not set)'}`);
  console.error(`[story-mcp] Base URL: ${config.baseUrl}`);

  // Validate base URL reachability (non-blocking — warn only)
  validateBaseUrl(config).catch(() => {});
}

main().catch((error) => {
  console.error('[story-mcp] Fatal error:', error);
  process.exit(1);
});
