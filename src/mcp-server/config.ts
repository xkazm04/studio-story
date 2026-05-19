/**
 * MCP Server Configuration
 * Parses environment variables for Story app integration
 */

export interface McpConfig {
  /** Base URL for Story Next.js API (default: http://localhost:3000) */
  baseUrl: string;
  /** Active project ID — required for most CRUD operations */
  projectId: string;
  /** Supabase URL for direct database access */
  supabaseUrl: string;
  /** Supabase service role key for direct database access */
  supabaseServiceRoleKey: string;
}

/**
 * Parse configuration from environment variables
 *
 * Environment variables:
 * - STORY_BASE_URL: API base URL (default: http://localhost:3000) — used for image/AI tools
 * - STORY_PROJECT_ID: Active project ID (required for data tools)
 * - SUPABASE_URL: Supabase project URL (required for direct DB access)
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key (required for direct DB access)
 */
export function parseConfig(): McpConfig {
  const config: McpConfig = {
    baseUrl: process.env.STORY_BASE_URL || 'http://localhost:3000',
    projectId: process.env.STORY_PROJECT_ID || '',
    supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  };

  if (!config.projectId) {
    console.error('[story-mcp] Warning: STORY_PROJECT_ID not set. CRUD tools will require explicit projectId parameters.');
  }

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    console.error('[story-mcp] Warning: Supabase env vars not set (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY). Falling back to HTTP client.');
  }

  return config;
}

/**
 * Validate that STORY_BASE_URL is reachable by pinging /api/health.
 * Logs a clear, actionable error if the dev server is unreachable.
 * Non-blocking — logs a warning instead of crashing the process.
 */
export async function validateBaseUrl(config: McpConfig): Promise<boolean> {
  const url = `${config.baseUrl}/api/health`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error(
        `[story-mcp] ⚠ Base URL check failed: ${url} returned HTTP ${res.status}.\n` +
        `  Ensure the Next.js dev server is running ("npm run dev") and STORY_BASE_URL in .mcp.json matches its port.`
      );
      return false;
    }

    console.error(`[story-mcp] ✓ Base URL validated: ${config.baseUrl}`);
    return true;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error(
      `[story-mcp] ⚠ Cannot reach ${url} — ${reason}\n` +
      `  Ensure the Next.js dev server is running ("npm run dev") and STORY_BASE_URL in .mcp.json matches its port.\n` +
      `  Current STORY_BASE_URL: ${config.baseUrl}`
    );
    return false;
  }
}
