/**
 * MCP Server Configuration
 * Parses environment variables for Story app integration
 */

export interface McpConfig {
  /** Base URL for Story Next.js API (default: http://localhost:3000) */
  baseUrl: string;
  /** Active project ID — required for most CRUD operations */
  projectId: string;
}

/**
 * Parse configuration from environment variables
 *
 * Environment variables:
 * - STORY_BASE_URL: API base URL (default: http://localhost:3000)
 * - STORY_PROJECT_ID: Active project ID (required for data tools)
 */
export function parseConfig(): McpConfig {
  const config: McpConfig = {
    baseUrl: process.env.STORY_BASE_URL || 'http://localhost:3000',
    projectId: process.env.STORY_PROJECT_ID || '',
  };

  if (!config.projectId) {
    console.error('[story-mcp] Warning: STORY_PROJECT_ID not set. CRUD tools will require explicit projectId parameters.');
  }

  return config;
}
