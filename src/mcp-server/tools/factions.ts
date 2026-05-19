/**
 * Faction Tools — CRUD for factions (direct Supabase)
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpConfig } from '../config.js';
import { dbSelect, dbSelectOne, dbInsert, dbUpdate } from '../db.js';
import { textContent, errorContent } from './helpers.js';

export function registerFactionTools(server: McpServer, config: McpConfig) {
  server.tool(
    'list_factions',
    `List all factions in a project. Returns: id, project_id, name, description, color, logo_url, created_at, updated_at. Factions represent groups/organizations in the story.`,
    {
      projectId: z.string().optional().describe('Project UUID. Auto-filled from server config if omitted.'),
    },
    async ({ projectId }) => {
      const pid = projectId || config.projectId;
      if (!pid) return errorContent('No projectId available. Pass projectId explicitly.');

      const result = await dbSelect('factions', {
        eq: { project_id: pid },
      });
      if (!result.success) return errorContent(`Failed to list factions: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  server.tool(
    'get_faction',
    `Get full faction details. Returns: id, project_id, name, description, color, logo_url, created_at, updated_at.`,
    {
      factionId: z.string().describe('Faction UUID.'),
    },
    async ({ factionId }) => {
      const result = await dbSelectOne('factions', factionId);
      if (!result.success) return errorContent(`Failed to get faction: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  server.tool(
    'create_faction',
    `Create a new faction. Required fields: name. Optional: description, color (hex string). The project_id is auto-filled from server config. DB columns: id (auto), project_id, name, description, color, logo_url, created_at, updated_at.`,
    {
      name: z.string().describe('Faction name (required).'),
      description: z.string().optional().describe('Faction description.'),
      color: z.string().optional().describe('Hex color string (e.g., "#ff0000").'),
      projectId: z.string().optional().describe('Project UUID. Auto-filled from server config if omitted.'),
    },
    async ({ name, description, color, projectId }) => {
      const pid = projectId || config.projectId;
      if (!pid) return errorContent('No projectId available. Pass projectId explicitly.');

      const row: Record<string, unknown> = { name, project_id: pid };
      if (description) row.description = description;
      if (color) row.color = color;

      const result = await dbInsert('factions', row);
      if (!result.success) return errorContent(`Failed to create faction: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  server.tool(
    'update_faction',
    `Update faction fields. Updatable columns: name, description, color (hex string), logo_url. Pass JSON with only changed fields.`,
    {
      factionId: z.string().describe('Faction UUID to update.'),
      updates: z.string().describe('JSON string of fields to update. Example: {"name":"The Order","color":"#ff0000","description":"A secretive organization"}'),
    },
    async ({ factionId, updates }) => {
      let parsed: Record<string, unknown>;
      try { parsed = JSON.parse(updates); } catch { return errorContent('Invalid JSON in updates.'); }
      const result = await dbUpdate('factions', factionId, parsed);
      if (!result.success) return errorContent(`Failed to update faction: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );
}
