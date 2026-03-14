/**
 * Scene Tools — CRUD for scenes and relationships (direct Supabase)
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpConfig } from '../config.js';
import { dbSelect, dbSelectOne, dbInsert, dbUpdate } from '../db.js';

const textContent = (text: string) => ({ content: [{ type: 'text' as const, text }] });
const errorContent = (text: string) => ({ content: [{ type: 'text' as const, text }], isError: true });

export function registerSceneTools(server: McpServer, config: McpConfig) {
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

      const eq: Record<string, string> = { project_id: pid };
      if (actId) eq.act_id = actId;

      const result = await dbSelect('scenes', {
        eq,
        order: { column: 'order', ascending: true },
      });
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
      const result = await dbSelectOne('scenes', sceneId);
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

      const row: Record<string, unknown> = { name, project_id: pid, act_id: actId };
      if (description) row.description = description;
      if (order !== undefined) row.order = order;

      const result = await dbInsert('scenes', row);
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
      const result = await dbUpdate('scenes', sceneId, parsed);
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
      // Relationships can be on either side (character_a or character_b)
      const resultA = await dbSelect('character_relationships', {
        eq: { character_a_id: characterId },
      });
      const resultB = await dbSelect('character_relationships', {
        eq: { character_b_id: characterId },
      });

      if (!resultA.success) return errorContent(`Failed to list relationships: ${resultA.error}`);
      if (!resultB.success) return errorContent(`Failed to list relationships: ${resultB.error}`);

      // Merge and deduplicate by id
      const allRels = [...(resultA.data as Array<{ id: string }>), ...(resultB.data as Array<{ id: string }>)];
      const seen = new Set<string>();
      const deduped = allRels.filter(r => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });

      return textContent(JSON.stringify(deduped, null, 2));
    }
  );
}
