/**
 * Faction Tools — CRUD for factions
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { StoryHttpClient } from '../http-client.js';
import type { McpConfig } from '../config.js';

const textContent = (text: string) => ({ content: [{ type: 'text' as const, text }] });
const errorContent = (text: string) => ({ content: [{ type: 'text' as const, text }], isError: true });

export function registerFactionTools(server: McpServer, config: McpConfig, client: StoryHttpClient) {
  server.tool(
    'list_factions',
    `List all factions in a project. Returns: id, project_id, name, description, color, logo_url, created_at, updated_at. Factions represent groups/organizations in the story.`,
    {
      projectId: z.string().optional().describe('Project UUID. Auto-filled from server config if omitted.'),
    },
    async ({ projectId }) => {
      const pid = projectId || config.projectId;
      if (!pid) return errorContent('No projectId available. Pass projectId explicitly.');

      const result = await client.get('/api/factions', { projectId: pid });
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
      const result = await client.get(`/api/factions/${factionId}`);
      if (!result.success) return errorContent(`Failed to get faction: ${result.error}`);

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
      const result = await client.put(`/api/factions/${factionId}`, parsed);
      if (!result.success) return errorContent(`Failed to update faction: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );
}
