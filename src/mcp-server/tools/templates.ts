/**
 * Prompt Template Tools — Save, list, fill, and delete CLI prompt templates
 *
 * Templates are stored as JSON files in `.story/templates/`.
 * Variable slots like {character_name} are resolved from project context or explicit overrides.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpConfig } from '../config.js';
import {
  saveTemplate,
  getTemplate,
  listTemplates,
  deleteTemplate,
  fillTemplate,
  type TemplateContext,
} from '../templates.js';
import { dbSelectOne } from '../db.js';
import { textContent, errorContent } from './helpers.js';

/**
 * Build context from project/scene/character data for variable resolution.
 */
async function buildContext(
  config: McpConfig,
  overrides?: Record<string, string>
): Promise<TemplateContext> {
  const ctx: TemplateContext = {};

  // Project context
  const projectId = overrides?.project_id || config.projectId;
  if (projectId) {
    ctx.project_id = projectId;
    const project = await dbSelectOne('projects', projectId);
    if (project.success && project.data) {
      const p = project.data as Record<string, unknown>;
      ctx.project_name = (p.name as string) || '';
      ctx.project_genre = (p.genre as string) || '';
      ctx.project_setting = (p.setting as string) || '';
    }
  }

  // Scene context (if provided in overrides)
  if (overrides?.scene_id) {
    ctx.scene_id = overrides.scene_id;
    const scene = await dbSelectOne('scenes', overrides.scene_id);
    if (scene.success && scene.data) {
      const s = scene.data as Record<string, unknown>;
      ctx.scene_title = (s.title as string) || '';
    }
  }

  // Character context (if provided in overrides)
  if (overrides?.character_id) {
    ctx.character_id = overrides.character_id;
    const character = await dbSelectOne('characters', overrides.character_id);
    if (character.success && character.data) {
      const c = character.data as Record<string, unknown>;
      ctx.character_name = (c.name as string) || '';
    }
  }

  // Act context
  if (overrides?.act_id) {
    ctx.act_id = overrides.act_id;
    const act = await dbSelectOne('acts', overrides.act_id);
    if (act.success && act.data) {
      const a = act.data as Record<string, unknown>;
      ctx.act_title = (a.title as string) || '';
    }
  }

  return ctx;
}

export function registerTemplateTools(server: McpServer, config: McpConfig) {
  server.tool(
    'save_prompt_template',
    `Save a reusable CLI prompt template with variable slots (e.g. {character_name}, {scene_id}).
Templates are stored in .story/templates/ as JSON files. Variables are auto-extracted from the content.
Pass an existing template ID to update it.`,
    {
      id: z.string().optional().describe('Template ID for updates. Omit to create a new template.'),
      name: z.string().describe('Template name (e.g. "Character Art Generation").'),
      description: z.string().describe('What this template does.'),
      category: z.enum(['character', 'scene', 'dialogue', 'image', 'story', 'world-building', 'custom'])
        .describe('Template category for organization.'),
      tags: z.array(z.string()).optional().describe('Tags for searchability (e.g. ["art", "generation"]).'),
      content: z.string().describe('Prompt content with {variable_name} placeholders.'),
    },
    async ({ id, name, description, category, tags, content }) => {
      try {
        const template = saveTemplate({
          id: id || '',
          name,
          description,
          category,
          tags: tags || [],
          content,
          variables: [],
          createdAt: '',
          updatedAt: '',
        });

        return textContent(JSON.stringify(template, null, 2));
      } catch (err) {
        return errorContent(`Failed to save template: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  );

  server.tool(
    'list_prompt_templates',
    `List saved prompt templates. Filter by category, tag, or search query.
Returns template metadata including variable slots and categories.`,
    {
      category: z.enum(['character', 'scene', 'dialogue', 'image', 'story', 'world-building', 'custom'])
        .optional().describe('Filter by category.'),
      tag: z.string().optional().describe('Filter by tag.'),
      query: z.string().optional().describe('Search in name, description, and tags.'),
    },
    async ({ category, tag, query }) => {
      try {
        const templates = listTemplates({ category, tag, query });

        // Return compact list with key info
        const summary = templates.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category,
          tags: t.tags,
          variables: t.variables.map(v => v.name),
          updatedAt: t.updatedAt,
        }));

        return textContent(JSON.stringify(summary, null, 2));
      } catch (err) {
        return errorContent(`Failed to list templates: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  );

  server.tool(
    'get_prompt_template',
    `Get a single prompt template by ID, including its full content and variable definitions.`,
    {
      id: z.string().describe('Template ID.'),
    },
    async ({ id }) => {
      const template = getTemplate(id);
      if (!template) return errorContent(`Template not found: ${id}`);
      return textContent(JSON.stringify(template, null, 2));
    }
  );

  server.tool(
    'fill_prompt_template',
    `Fill a prompt template by resolving variable slots from project context and explicit overrides.
Variables like {project_name}, {scene_title}, {character_name} are auto-resolved from the database.
Any other variables must be passed as explicit overrides.
Returns the filled prompt ready for use.`,
    {
      id: z.string().describe('Template ID to fill.'),
      overrides: z.record(z.string(), z.string()).optional()
        .describe('Variable overrides as key-value pairs. Also accepts scene_id, character_id, act_id to load context from DB.'),
    },
    async ({ id, overrides }) => {
      const template = getTemplate(id);
      if (!template) return errorContent(`Template not found: ${id}`);

      try {
        const ctx = await buildContext(config, overrides);
        // Merge context with overrides for variable resolution
        const merged: TemplateContext = { ...ctx };
        if (overrides) {
          for (const [k, v] of Object.entries(overrides)) {
            merged[k] = v;
          }
        }
        const { filled, unresolved } = fillTemplate(template, merged);

        const result: Record<string, unknown> = {
          templateId: template.id,
          templateName: template.name,
          filledPrompt: filled,
        };

        if (unresolved.length > 0) {
          result.unresolvedVariables = unresolved;
          result.hint = 'Pass these as overrides to fill remaining variables.';
        }

        return textContent(JSON.stringify(result, null, 2));
      } catch (err) {
        return errorContent(`Failed to fill template: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  );

  server.tool(
    'delete_prompt_template',
    `Delete a prompt template by ID.`,
    {
      id: z.string().describe('Template ID to delete.'),
    },
    async ({ id }) => {
      const deleted = deleteTemplate(id);
      if (!deleted) return errorContent(`Template not found: ${id}`);
      return textContent(`Template ${id} deleted.`);
    }
  );
}
