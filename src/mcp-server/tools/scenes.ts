/**
 * Scene Tools — CRUD for scenes and relationships (direct Supabase)
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpConfig } from '../config.js';
import { dbSelect, dbSelectOne, dbInsert, dbUpdate } from '../db.js';
import { textContent, errorContent } from './helpers.js';

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
    `Get full scene details. Returns: id, project_id, act_id, name, description, order, script, location, image_url, image_prompt, metadata (JSONB with timeOfDay, weather, season, mood, temperature, lighting, soundscape, customNotes), created_at, updated_at.`,
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
    `Update scene fields. Pass a JSON object with only the fields to change. Updatable columns: name, description, order, script (dialogue/screenplay text), location (setting like "INT. CASTLE - NIGHT"), image_url, image_prompt, metadata (JSONB object with optional keys: timeOfDay, weather, season, mood, temperature, lighting, soundscape, customNotes). Use "description" for narrative prose, "script" for screenplay format.`,
    {
      sceneId: z.string().describe('Scene UUID to update.'),
      updates: z.string().describe('JSON string of fields to update. Example: {"description":"A tense confrontation","script":"@scene\\nINT. CASTLE - NIGHT\\n\\n@dialogue[GUARD]\\nHalt! Who goes there?","location":"INT. CASTLE - NIGHT","metadata":{"timeOfDay":"night","weather":"stormy","mood":"tense"}}'),
    },
    async ({ sceneId, updates }) => {
      let parsed: Record<string, unknown>;
      try { parsed = JSON.parse(updates); } catch { return errorContent('Invalid JSON in updates.'); }
      const result = await dbUpdate('scenes', sceneId, parsed);
      if (!result.success) return errorContent(`Failed to update scene: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  // ---- Choice & Branch Creation ----

  server.tool(
    'create_choice',
    `Create a narrative choice linking one scene to another. The choice appears as a clickable option for the reader.`,
    {
      sceneId: z.string().describe('Source scene UUID.'),
      targetSceneId: z.string().optional().describe('Target scene UUID. Null if unconnected.'),
      label: z.string().describe('Choice text shown to reader.'),
      orderIndex: z.number().optional().describe('Position in choice list (0-based).'),
    },
    async ({ sceneId, targetSceneId, label, orderIndex }) => {
      const row: Record<string, unknown> = {
        scene_id: sceneId,
        target_scene_id: targetSceneId || null,
        label,
        order_index: orderIndex ?? 0,
      };

      const result = await dbInsert('scene_choices', row);
      if (!result.success) return errorContent(`Failed to create choice: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  server.tool(
    'create_branch',
    `Create a branching choice point with multiple options. Creates target scenes and linking choices in one operation. Use when user says things like "add a choice where Elena can fight or flee".`,
    {
      sceneId: z.string().describe('Source scene UUID to branch from.'),
      choices: z.array(z.object({
        label: z.string().describe('Choice text shown to reader.'),
        sceneName: z.string().describe('Name for the new target scene.'),
        sceneDescription: z.string().optional().describe('Description for the new scene.'),
      })).describe('Branches to create. Each entry creates a target scene + linking choice.'),
    },
    async ({ sceneId, choices }) => {
      // Look up source scene to get project_id and act_id
      const sourceResult = await dbSelectOne('scenes', sceneId);
      if (!sourceResult.success) return errorContent(`Failed to find source scene: ${sourceResult.error}`);

      const sourceScene = sourceResult.data as Record<string, unknown>;
      const project_id = sourceScene.project_id;
      const act_id = sourceScene.act_id;

      const branches: Array<{ sceneId: string; sceneName: string; choiceId: string; label: string }> = [];

      for (let idx = 0; idx < choices.length; idx++) {
        const choice = choices[idx];

        // Create target scene
        const sceneRow: Record<string, unknown> = {
          project_id,
          act_id,
          name: choice.sceneName,
        };
        if (choice.sceneDescription) sceneRow.description = choice.sceneDescription;

        const sceneResult = await dbInsert('scenes', sceneRow);
        if (!sceneResult.success) return errorContent(`Failed to create scene "${choice.sceneName}": ${sceneResult.error}`);

        const newScene = sceneResult.data as Record<string, unknown>;

        // Create linking choice
        const choiceRow: Record<string, unknown> = {
          scene_id: sceneId,
          target_scene_id: newScene.id,
          label: choice.label,
          order_index: idx,
        };

        const choiceResult = await dbInsert('scene_choices', choiceRow);
        if (!choiceResult.success) return errorContent(`Failed to create choice "${choice.label}": ${choiceResult.error}`);

        const newChoice = choiceResult.data as Record<string, unknown>;

        branches.push({
          sceneId: newScene.id as string,
          sceneName: choice.sceneName,
          choiceId: newChoice.id as string,
          label: choice.label,
        });
      }

      return textContent(JSON.stringify({ sourceScene: sceneId, branches }, null, 2));
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
