/**
 * Audit Tools — Query MCP tool call history
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { queryAuditLog, getAuditSessions, getAuditToolNames, getCurrentSessionId } from '../audit.js';
import { textContent } from './helpers.js';

export function registerAuditTools(server: McpServer) {
  server.tool(
    'list_tool_history',
    'Query the MCP tool call audit log. Returns tool invocations with inputs, outputs, timing, and success status. Use to review what tools were called, debug failures, or replay sequences.',
    {
      tool: z.string().optional().describe('Filter by tool name (exact match).'),
      success: z.boolean().optional().describe('Filter by success (true) or failure (false).'),
      since: z.string().optional().describe('ISO timestamp — only entries after this time.'),
      until: z.string().optional().describe('ISO timestamp — only entries before this time.'),
      sessionId: z.string().optional().describe('Filter by session ID. Use "current" for the active session.'),
      limit: z.number().optional().describe('Max entries to return (default 50, max 200).'),
      offset: z.number().optional().describe('Pagination offset (default 0).'),
      mode: z.enum(['entries', 'sessions', 'tools', 'summary']).optional().describe(
        'Response mode: "entries" (default) = full audit entries, "sessions" = list sessions, "tools" = list tool names, "summary" = aggregate stats.'
      ),
    },
    async (inputs) => {
      const mode = inputs.mode ?? 'entries';

      if (mode === 'sessions') {
        const sessions = getAuditSessions();
        return textContent(JSON.stringify({
          currentSessionId: getCurrentSessionId(),
          sessions,
        }, null, 2));
      }

      if (mode === 'tools') {
        const tools = getAuditToolNames();
        return textContent(JSON.stringify({ tools }, null, 2));
      }

      const resolvedSessionId = inputs.sessionId === 'current' ? getCurrentSessionId() : inputs.sessionId;
      const limit = Math.min(inputs.limit ?? 50, 200);

      const result = queryAuditLog({
        tool: inputs.tool,
        success: inputs.success,
        since: inputs.since,
        until: inputs.until,
        sessionId: resolvedSessionId,
        limit,
        offset: inputs.offset,
      });

      if (mode === 'summary') {
        const toolCounts: Record<string, { total: number; success: number; failed: number; avgMs: number }> = {};
        for (const entry of result.entries) {
          if (!toolCounts[entry.tool]) {
            toolCounts[entry.tool] = { total: 0, success: 0, failed: 0, avgMs: 0 };
          }
          const tc = toolCounts[entry.tool];
          tc.total++;
          if (entry.success) tc.success++;
          else tc.failed++;
          tc.avgMs = Math.round(((tc.avgMs * (tc.total - 1)) + entry.durationMs) / tc.total);
        }

        return textContent(JSON.stringify({
          totalEntries: result.total,
          returned: result.entries.length,
          toolCounts,
        }, null, 2));
      }

      return textContent(JSON.stringify({
        totalMatching: result.total,
        returned: result.entries.length,
        offset: inputs.offset ?? 0,
        entries: result.entries,
      }, null, 2));
    }
  );
}
