/**
 * Scene Tools — CRUD for scenes and relationships
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { StoryHttpClient } from '../http-client.js';
import type { McpConfig } from '../config.js';

const textContent = (text: string) => ({ content: [{ type: 'text' as const, text }] });
const errorContent = (text: string) => ({ content: [{ type: 'text' as const, text }], isError: true });

export function registerSceneTools(server: McpServer, config: McpConfig, client: StoryHttpClient) {
  server.tool(
    'list_scenes',
    `List all scenes in a project or act, ordered by sequence. Returns: id, project_id, act_id, name, description, order, created_at, updated_at.`,
    {
      projectId: z.string().optional().describe('Project UUID. Auto-filled from server config if omitted.'),
      actId: z.string().optional().describe('Act UUID to filter scenes by.'),
    },
    async ({ projectId, actId }) => {
      const pid = projectId || config.projectId;
      if (!pid) return errorContent('No projectId available. Pass projectId explicitly.');

      const params: Record<string, string> = { projectId: pid };
      if (actId) params.actId = actId;

      const result = await client.get('/api/scenes', params);
      if (!result.success) return errorContent(`Failed to list scenes: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  server.tool(
    'get_scene',
    `Get full scene details. Returns: id, project_id, act_id, name, description, order, script, location, image_url, image_prompt, created_at, updated_at.`,
    {
      sceneId: z.string().describe('Scene UUID.'),
    },
    async ({ sceneId }) => {
      const result = await client.get(`/api/scenes/${sceneId}`);
      if (!result.success) return errorContent(`Failed to get scene: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  server.tool(
    'create_scene',
    `Create a new scene in an act. Required: act_id, name. Optional: description, order. The project_id is auto-filled. DB columns: id (auto), project_id, act_id, name, description, order, created_at, updated_at.`,
    {
      projectId: z.string().optional().describe('Project UUID. Auto-filled from server config if omitted.'),
      actId: z.string().describe('Act UUID this scene belongs to (required).'),
      name: z.string().describe('Scene name (required). Example: "The Council Chamber".'),
      description: z.string().optional().describe('Brief description of what happens in this scene.'),
      order: z.number().optional().describe('Position in the act sequence (0-based).'),
    },
    async ({ projectId, actId, name, description, order }) => {
      const pid = projectId || config.projectId;
      if (!pid) return errorContent('No projectId available. Pass projectId explicitly.');

      const body: Record<string, unknown> = { name, project_id: pid, act_id: actId };
      if (description) body.description = description;
      if (order !== undefined) body.order = order;

      const result = await client.post('/api/scenes', body);
      if (!result.success) return errorContent(`Failed to create scene: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  server.tool(
    'update_scene',
    `Update scene fields. Pass a JSON object with only the fields to change. Updatable columns: name, description, order, script (dialogue/screenplay text), location (setting like "INT. CASTLE - NIGHT"), image_url, image_prompt. Use "description" for narrative prose, "script" for screenplay format.`,
    {
      sceneId: z.string().describe('Scene UUID to update.'),
      updates: z.string().describe('JSON string of fields to update. Example: {"description":"A tense confrontation","script":"@scene\\nINT. CASTLE - NIGHT\\n\\n@dialogue[GUARD]\\nHalt! Who goes there?","location":"INT. CASTLE - NIGHT"}'),
    },
    async ({ sceneId, updates }) => {
      let parsed: Record<string, unknown>;
      try { parsed = JSON.parse(updates); } catch { return errorContent('Invalid JSON in updates.'); }
      const result = await client.put(`/api/scenes/${sceneId}`, parsed);
      if (!result.success) return errorContent(`Failed to update scene: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  // ---- Relationships ----

  server.tool(
    'list_relationships',
    `List all relationships for a character. Returns: id, character_a_id, character_b_id, act_id, relationship_type, description, event_date, created_at, updated_at.`,
    {
      characterId: z.string().describe('Character UUID to get relationships for.'),
    },
    async ({ characterId }) => {
      const result = await client.get('/api/relationships', { characterId });
      if (!result.success) return errorContent(`Failed to list relationships: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );
}
