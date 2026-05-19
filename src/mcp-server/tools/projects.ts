/**
 * Project Tools — CRUD for projects (direct Supabase)
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpConfig } from '../config.js';
import { dbSelectOne, dbSelect, dbInsert, dbUpdate } from '../db.js';
import { textContent, errorContent } from './helpers.js';

/** Default user_id for MCP-created projects (service role bypasses RLS) */
const MCP_DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

export function registerProjectTools(server: McpServer, config: McpConfig) {
  server.tool(
    'get_project',
    'Get project metadata (title, description, premise, genre, setting). Use this to understand the creative context before generating content.',
    {
      projectId: z.string().optional().describe('Project ID. Uses configured project if not provided.'),
    },
    async ({ projectId }) => {
      const id = projectId || config.projectId;
      if (!id) return errorContent('No projectId available.');

      const result = await dbSelectOne('projects', id);
      if (!result.success) return errorContent(`Failed to get project: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  server.tool(
    'list_projects',
    'List all projects. Returns project names and IDs.',
    {},
    async () => {
      const result = await dbSelect('projects');
      if (!result.success) return errorContent(`Failed to list projects: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  server.tool(
    'create_project',
    `Create a new project. Required: name. Optional: description, premise, genre, setting, type. Returns the created project with its generated ID. The user_id column (NOT NULL) uses a default MCP user UUID unless explicitly provided.`,
    {
      name: z.string().describe('Project name (required).'),
      description: z.string().optional().describe('Project description / summary.'),
      premise: z.string().optional().describe('Story premise or logline — the core "what if" of the project.'),
      genre: z.string().optional().describe('Primary genre: fantasy, sci-fi, romance, thriller, horror, mystery, etc.'),
      setting: z.string().optional().describe('World / setting description for the story.'),
      type: z.string().optional().describe('Project type: "novel", "screenplay", "comic", "game", etc.'),
      userId: z.string().optional().describe('User UUID. Defaults to MCP system user if omitted.'),
    },
    async ({ name, description, premise, genre, setting, type, userId }) => {
      const row: Record<string, unknown> = {
        name,
        user_id: userId || MCP_DEFAULT_USER_ID,
      };
      if (description) row.description = description;
      if (premise) row.premise = premise;
      if (genre) row.genre = genre;
      if (setting) row.setting = setting;
      if (type) row.type = type;

      const result = await dbInsert('projects', row);
      if (!result.success) return errorContent(`Failed to create project: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  server.tool(
    'update_project',
    `Update project fields. Pass only the fields to change. Updatable: name, description, premise, genre, setting, type.`,
    {
      projectId: z.string().optional().describe('Project UUID. Uses configured project if not provided.'),
      name: z.string().optional().describe('New project name.'),
      description: z.string().optional().describe('Updated description.'),
      premise: z.string().optional().describe('Updated story premise / logline.'),
      genre: z.string().optional().describe('Updated genre.'),
      setting: z.string().optional().describe('Updated world / setting description.'),
      type: z.string().optional().describe('Updated project type.'),
    },
    async ({ projectId, name, description, premise, genre, setting, type }) => {
      const id = projectId || config.projectId;
      if (!id) return errorContent('No projectId available. Pass projectId explicitly.');

      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (premise !== undefined) updates.premise = premise;
      if (genre !== undefined) updates.genre = genre;
      if (setting !== undefined) updates.setting = setting;
      if (type !== undefined) updates.type = type;

      if (Object.keys(updates).length === 0) {
        return errorContent('No fields to update. Provide at least one field.');
      }

      const result = await dbUpdate('projects', id, updates);
      if (!result.success) return errorContent(`Failed to update project: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );
}
