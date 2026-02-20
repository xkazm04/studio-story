/**
 * Project Tools — read project metadata
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { StoryHttpClient } from '../http-client.js';
import type { McpConfig } from '../config.js';

const textContent = (text: string) => ({ content: [{ type: 'text' as const, text }] });
const errorContent = (text: string) => ({ content: [{ type: 'text' as const, text }], isError: true });

export function registerProjectTools(server: McpServer, config: McpConfig, client: StoryHttpClient) {
  server.tool(
    'get_project',
    'Get project metadata (title, description, genre, themes). Use this to understand the creative context before generating content.',
    {
      projectId: z.string().optional().describe('Project ID. Uses configured project if not provided.'),
    },
    async ({ projectId }) => {
      const id = projectId || config.projectId;
      if (!id) return errorContent('No projectId available.');

      const result = await client.get(`/api/projects/${id}`);
      if (!result.success) return errorContent(`Failed to get project: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  server.tool(
    'list_projects',
    'List all projects. Returns project names and IDs.',
    {},
    async () => {
      // Projects endpoint requires userId; for local use we list all
      const result = await client.get('/api/projects', { userId: '' });
      if (!result.success) return errorContent(`Failed to list projects: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );
}
