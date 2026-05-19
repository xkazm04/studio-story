/**
 * Character Tools — CRUD for characters and traits (direct Supabase)
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpConfig } from '../config.js';
import { dbSelect, dbSelectOne, dbInsert, dbUpdate, resolveStoryStackId } from '../db.js';
import { textContent, errorContent } from './helpers.js';

export function registerCharacterTools(server: McpServer, config: McpConfig) {
  server.tool(
    'list_characters',
    `List all characters in a project. Returns array of character objects with fields: id, project_id, faction_id, name, type, voice, avatar_url, created_at, updated_at. Ordered by name.`,
    {
      projectId: z.string().optional().describe('Project UUID. Auto-filled from server config if omitted.'),
    },
    async ({ projectId }) => {
      const pid = projectId || config.projectId;
      if (!pid) return errorContent('No projectId available. Pass projectId explicitly.');

      const result = await dbSelect('characters', {
        eq: { project_id: pid },
        order: { column: 'name', ascending: true },
      });
      if (!result.success) return errorContent(`Failed to list characters: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  server.tool(
    'get_character',
    `Get full details for one character by ID. Returns: id, project_id, faction_id, faction_hierarchy_node_id, name, type, voice, avatar_url, transparent_avatar_url, body_url, transparent_body_url, created_at, updated_at.`,
    {
      characterId: z.string().describe('Character UUID.'),
    },
    async ({ characterId }) => {
      const result = await dbSelectOne('characters', characterId);
      if (!result.success) return errorContent(`Failed to get character: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  server.tool(
    'create_character',
    `Create a new character. Required fields: name. Optional: type, voice, faction_id. The project_id is auto-filled from server config. DB columns: id (auto), project_id, name, type, voice, faction_id, avatar_url, created_at, updated_at.`,
    {
      projectId: z.string().optional().describe('Project UUID. Auto-filled from server config if omitted.'),
      name: z.string().describe('Character name (required).'),
      type: z.string().optional().describe('Role type: "protagonist", "antagonist", "supporting", "minor", etc.'),
      voice: z.string().optional().describe('Voice/personality description for dialogue generation.'),
      factionId: z.string().optional().describe('Faction UUID to assign this character to (must exist).'),
      factionHierarchyNodeId: z.string().optional().describe('Hierarchy node UUID to bind this character to a specific position in the faction org chart.'),
    },
    async ({ projectId, name, type, voice, factionId, factionHierarchyNodeId }) => {
      const pid = projectId || config.projectId;
      if (!pid) return errorContent('No projectId available. Pass projectId explicitly.');

      const row: Record<string, unknown> = { name, project_id: pid };
      if (type) row.type = type;
      if (voice) row.voice = voice;
      if (factionId) row.faction_id = factionId;
      if (factionHierarchyNodeId) row.faction_hierarchy_node_id = factionHierarchyNodeId;

      // Resolve story_stack_id (mirrors POST /api/characters logic)
      const stackId = await resolveStoryStackId();
      if (stackId) row.story_stack_id = stackId;

      const result = await dbInsert('characters', row);
      if (!result.success) return errorContent(`Failed to create character: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  server.tool(
    'update_character',
    `Update character fields. Pass a JSON object with only the fields to change. Updatable columns: name, type, voice, faction_id, faction_hierarchy_node_id, avatar_url, transparent_avatar_url, body_url, transparent_body_url.`,
    {
      characterId: z.string().describe('Character UUID to update.'),
      updates: z.string().describe('JSON string of fields to update. Example: {"voice":"gruff warrior","type":"antagonist"}'),
    },
    async ({ characterId, updates }) => {
      let parsed: Record<string, unknown>;
      try { parsed = JSON.parse(updates); } catch { return errorContent('Invalid JSON in updates.'); }
      const result = await dbUpdate('characters', characterId, parsed);
      if (!result.success) return errorContent(`Failed to update character: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  server.tool(
    'list_traits',
    `List all traits for a character. Traits have: id, character_id, type, description. Types: background, personality, motivations, strengths, weaknesses, relationships.`,
    {
      characterId: z.string().describe('Character UUID to get traits for.'),
    },
    async ({ characterId }) => {
      const result = await dbSelect('traits', {
        eq: { character_id: characterId },
      });
      if (!result.success) return errorContent(`Failed to list traits: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  server.tool(
    'create_trait',
    `Create a character trait. Types: background, personality, motivations, strengths, weaknesses, relationships. Each type should have one trait per character — check list_traits first to avoid duplicates.`,
    {
      characterId: z.string().describe('Character UUID.'),
      type: z.string().describe('Trait type: background, personality, motivations, strengths, weaknesses, relationships.'),
      description: z.string().describe('Trait description text (1-3 paragraphs).'),
    },
    async ({ characterId, type, description }) => {
      const result = await dbInsert('traits', { character_id: characterId, type, description });
      if (!result.success) return errorContent(`Failed to create trait: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  server.tool(
    'update_trait',
    `Update an existing trait's description. Use list_traits first to get the trait ID.`,
    {
      traitId: z.string().describe('Trait UUID to update.'),
      description: z.string().describe('New description text.'),
    },
    async ({ traitId, description }) => {
      const result = await dbUpdate('traits', traitId, { description });
      if (!result.success) return errorContent(`Failed to update trait: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  // ---- Relationships ----

  server.tool(
    'create_relationship',
    `Create a relationship between two characters. Required: sourceId (character_a), targetId (character_b), description. Optional: type (relationship_type), actId (when the relationship begins), eventDate. Table: character_relationships.`,
    {
      sourceId: z.string().describe('Source character UUID (character_a_id).'),
      targetId: z.string().describe('Target character UUID (character_b_id).'),
      description: z.string().describe('Description of the relationship (required).'),
      type: z.string().optional().describe('Relationship type: ally, enemy, family, rival, mentor, romantic, neutral, etc.'),
      actId: z.string().optional().describe('Act UUID where this relationship begins.'),
      eventDate: z.string().optional().describe('In-story date of the relationship event.'),
    },
    async ({ sourceId, targetId, description, type, actId, eventDate }) => {
      const row: Record<string, unknown> = {
        character_a_id: sourceId,
        character_b_id: targetId,
        description,
      };
      if (type) row.relationship_type = type;
      if (actId) row.act_id = actId;
      if (eventDate) row.event_date = eventDate;

      const result = await dbInsert('character_relationships', row);
      if (!result.success) return errorContent(`Failed to create relationship: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );
}
