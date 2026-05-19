/**
 * Context Pin Tools — CRUD for persistent context pins (direct Supabase)
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpConfig } from '../config.js';
import { dbSelect, dbSelectOne, dbInsert, dbUpdate, getDb } from '../db.js';
import { textContent, errorContent } from './helpers.js';

export function registerContextPinTools(server: McpServer, config: McpConfig) {
  server.tool(
    'list_context_pins',
    `List persistent context pins for a project. Pins are story rules that auto-inject into AI generation. Returns array of pin objects with fields: id, project_id, pin_type, label, content, scope, scope_target_id, enabled, sort_order, created_at, updated_at. Filter by enabledOnly to get only active pins.`,
    {
      projectId: z.string().optional().describe('Project UUID. Auto-filled from server config if omitted.'),
      enabledOnly: z.boolean().optional().describe('If true, only return enabled pins. Default: false.'),
      scope: z.enum(['project', 'act', 'character']).optional().describe('Filter by scope type.'),
      scopeTargetId: z.string().optional().describe('Filter by scope target (act or character UUID).'),
    },
    async ({ projectId, enabledOnly, scope, scopeTargetId }) => {
      const pid = projectId || config.projectId;
      if (!pid) return errorContent('No projectId available. Pass projectId explicitly.');

      const eq: Record<string, string> = { project_id: pid };
      if (enabledOnly) eq.enabled = 'true';
      if (scope) eq.scope = scope;
      if (scopeTargetId) eq.scope_target_id = scopeTargetId;

      const result = await dbSelect('context_pins', {
        eq,
        order: { column: 'sort_order', ascending: true },
      });
      if (!result.success) return errorContent(`Failed to list context pins: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  server.tool(
    'create_context_pin',
    `Create a persistent context pin (story rule). Pins auto-inject into every AI generation at highest priority. Pin types: world_rule (magic limits, physics), character_constraint (never lies, always formal), tone_directive (maintain noir tone), plot_boundary (never kill character X). Scopes: project (global), act (specific act), character (specific character).`,
    {
      projectId: z.string().optional().describe('Project UUID. Auto-filled from server config if omitted.'),
      pinType: z.enum(['world_rule', 'character_constraint', 'tone_directive', 'plot_boundary']).describe('Type of persistent rule.'),
      label: z.string().describe('Short human-readable label for this pin.'),
      content: z.string().describe('The rule/constraint content injected into AI context.'),
      scope: z.enum(['project', 'act', 'character']).optional().describe('Where this pin applies. Default: project.'),
      scopeTargetId: z.string().optional().describe('Target UUID when scope is act or character.'),
      enabled: z.boolean().optional().describe('Whether pin is active. Default: true.'),
      sortOrder: z.number().optional().describe('Display order. Default: 0.'),
    },
    async ({ projectId, pinType, label, content, scope, scopeTargetId, enabled, sortOrder }) => {
      const pid = projectId || config.projectId;
      if (!pid) return errorContent('No projectId available. Pass projectId explicitly.');

      const row: Record<string, unknown> = {
        project_id: pid,
        pin_type: pinType,
        label,
        content,
      };
      if (scope) row.scope = scope;
      if (scopeTargetId) row.scope_target_id = scopeTargetId;
      if (enabled !== undefined) row.enabled = enabled;
      if (sortOrder !== undefined) row.sort_order = sortOrder;

      const result = await dbInsert('context_pins', row);
      if (!result.success) return errorContent(`Failed to create context pin: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  server.tool(
    'update_context_pin',
    `Update a context pin. Updatable fields: pin_type, label, content, scope, scope_target_id, enabled, sort_order.`,
    {
      pinId: z.string().describe('Context pin UUID.'),
      pinType: z.enum(['world_rule', 'character_constraint', 'tone_directive', 'plot_boundary']).optional().describe('Updated pin type.'),
      label: z.string().optional().describe('Updated label.'),
      content: z.string().optional().describe('Updated rule content.'),
      scope: z.enum(['project', 'act', 'character']).optional().describe('Updated scope.'),
      scopeTargetId: z.string().optional().describe('Updated scope target UUID.'),
      enabled: z.boolean().optional().describe('Toggle pin on/off.'),
      sortOrder: z.number().optional().describe('Updated display order.'),
    },
    async ({ pinId, pinType, label, content, scope, scopeTargetId, enabled, sortOrder }) => {
      const updates: Record<string, unknown> = {};
      if (pinType !== undefined) updates.pin_type = pinType;
      if (label !== undefined) updates.label = label;
      if (content !== undefined) updates.content = content;
      if (scope !== undefined) updates.scope = scope;
      if (scopeTargetId !== undefined) updates.scope_target_id = scopeTargetId;
      if (enabled !== undefined) updates.enabled = enabled;
      if (sortOrder !== undefined) updates.sort_order = sortOrder;

      if (Object.keys(updates).length === 0) {
        return errorContent('No fields to update. Provide at least one field.');
      }

      const result = await dbUpdate('context_pins', pinId, updates);
      if (!result.success) return errorContent(`Failed to update context pin: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  server.tool(
    'delete_context_pin',
    `Delete a context pin permanently.`,
    {
      pinId: z.string().describe('Context pin UUID to delete.'),
    },
    async ({ pinId }) => {
      // Verify it exists first
      const existing = await dbSelectOne('context_pins', pinId);
      if (!existing.success) return errorContent(`Pin not found: ${existing.error}`);

      // Use raw client for delete (no dbDelete helper)
      const client = getDb(config);
      const { error } = await client.from('context_pins').delete().eq('id', pinId);
      if (error) return errorContent(`Failed to delete context pin: ${error.message}`);

      return textContent(`Deleted context pin ${pinId}`);
    }
  );
}
