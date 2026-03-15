/**
 * Story Structure Tools — Acts, Beats, and narrative structure (direct Supabase)
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpConfig } from '../config.js';
import { dbSelect, dbSelectOne, dbInsert, dbUpdate } from '../db.js';

const textContent = (text: string) => ({ content: [{ type: 'text' as const, text }] });
const errorContent = (text: string) => ({ content: [{ type: 'text' as const, text }], isError: true });

export function registerStoryStructureTools(server: McpServer, config: McpConfig) {
  // ---- Acts ----

  server.tool(
    'list_acts',
    `List all acts in a project, ordered by sequence. Returns array with fields: id, project_id, name, description, order, created_at, updated_at.`,
    {
      projectId: z.string().optional().describe('Project UUID. Auto-filled from server config if omitted.'),
    },
    async ({ projectId }) => {
      const pid = projectId || config.projectId;
      if (!pid) return errorContent('No projectId available. Pass projectId explicitly.');

      const result = await dbSelect('acts', {
        eq: { project_id: pid },
        order: { column: 'order', ascending: true },
      });
      if (!result.success) return errorContent(`Failed to list acts: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  server.tool(
    'create_act',
    `Create a new act. Required: name. Optional: description, order. The project_id is auto-filled. DB columns: id (auto), project_id, name, description, order, created_at, updated_at.`,
    {
      projectId: z.string().optional().describe('Project UUID. Auto-filled from server config if omitted.'),
      name: z.string().describe('Act name (required). Example: "Act 1: The Discovery".'),
      description: z.string().optional().describe('What happens in this act.'),
      order: z.number().optional().describe('Position in sequence (0-based). Auto-increments if omitted.'),
    },
    async ({ projectId, name, description, order }) => {
      const pid = projectId || config.projectId;
      if (!pid) return errorContent('No projectId available. Pass projectId explicitly.');

      const row: Record<string, unknown> = { name, project_id: pid };
      if (description) row.description = description;
      if (order !== undefined) row.order = order;

      const result = await dbInsert('acts', row);
      if (!result.success) return errorContent(`Failed to create act: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  // ---- Beats ----

  server.tool(
    'list_beats',
    `List beats for a project or specific act, ordered by sequence. Returns: id, project_id, act_id, name, type, description, order, completed, default_flag, paragraph_id, paragraph_title, created_at, updated_at.`,
    {
      projectId: z.string().optional().describe('Project UUID. Auto-filled from server config if omitted.'),
      actId: z.string().optional().describe('Act UUID to filter beats by.'),
    },
    async ({ projectId, actId }) => {
      const pid = projectId || config.projectId;
      const eq: Record<string, string> = {};
      if (actId) eq.act_id = actId;
      else if (pid) eq.project_id = pid;
      else return errorContent('No projectId or actId available.');

      const result = await dbSelect('beats', {
        eq,
        order: { column: 'order', ascending: true },
      });
      if (!result.success) return errorContent(`Failed to list beats: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  server.tool(
    'get_beat',
    `Get full beat details. Returns: id, project_id, act_id, name, type, description, order, completed, default_flag, paragraph_id, paragraph_title, created_at, updated_at.`,
    {
      beatId: z.string().describe('Beat UUID.'),
    },
    async ({ beatId }) => {
      const result = await dbSelectOne('beats', beatId);
      if (!result.success) return errorContent(`Failed to get beat: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  server.tool(
    'create_beat',
    `Create a new beat. Required: act_id, name, type. Optional: description, order. The project_id is auto-filled. Beat types: "setup", "conflict", "resolution", "climax", "transition", "reveal", "action".`,
    {
      actId: z.string().describe('Act UUID this beat belongs to (required).'),
      projectId: z.string().optional().describe('Project UUID. Auto-filled from server config if omitted.'),
      name: z.string().describe('Beat name (required).'),
      type: z.string().describe('Beat type (required): setup, conflict, resolution, climax, transition, reveal, action.'),
      description: z.string().optional().describe('What happens in this beat.'),
      order: z.number().optional().describe('Position in sequence (0-based).'),
    },
    async ({ actId, projectId, name, type, description, order }) => {
      const pid = projectId || config.projectId;
      const row: Record<string, unknown> = { name, type, act_id: actId };
      if (pid) row.project_id = pid;
      if (description) row.description = description;
      if (order !== undefined) row.order = order;

      const result = await dbInsert('beats', row);
      if (!result.success) return errorContent(`Failed to create beat: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  server.tool(
    'update_beat',
    `Update beat fields. Updatable columns: name, type, description, order, completed (boolean), paragraph_id, paragraph_title. Pass JSON with only changed fields.`,
    {
      beatId: z.string().describe('Beat UUID to update.'),
      updates: z.string().describe('JSON string of fields to update. Example: {"name":"The Revelation","type":"climax","completed":true}'),
    },
    async ({ beatId, updates }) => {
      let parsed: Record<string, unknown>;
      try { parsed = JSON.parse(updates); } catch { return errorContent('Invalid JSON in updates.'); }
      const result = await dbUpdate('beats', beatId, parsed);
      if (!result.success) return errorContent(`Failed to update beat: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );
}
