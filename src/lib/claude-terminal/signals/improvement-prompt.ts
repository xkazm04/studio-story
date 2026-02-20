/**
 * Improvement Prompt Builder — Creates the prompt for the meta-agent
 * that fixes detected patterns in the codebase.
 *
 * Unlike creative mode (MCP tools only), the improvement agent has full
 * codebase access via Read/Edit/Write/Bash tools.
 */

import type { Pattern } from './signal-types';

// ============ Codebase Context ============

const CODEBASE_CONTEXT = `
## Codebase Structure

- **MCP tools**: \`src/mcp-server/tools/\` — Tool definitions with Zod schemas
- **MCP tool index**: \`src/mcp-server/tools/index.ts\` — Registers all tools
- **Database types**: \`src/lib/supabase/database.types.ts\` — TypeScript types matching DB schema
- **DB migrations**: \`db/migrations/\` — SQL migration files
- **CLI prompt**: \`src/app/components/cli/skills/index.ts\` — \`buildBaseSystemPrompt()\` that instructs the creative CLI
- **Query hooks**: \`src/app/hooks/integration/\` — TanStack Query hooks
- **Cache sync**: \`src/app/features/v2/hooks/useCLIDataSync.ts\` — Maps MCP tools → query cache keys
- **API routes**: \`src/app/api/\` — Next.js API route handlers
- **Signal types**: \`src/lib/claude-terminal/signals/signal-types.ts\` — Signal taxonomy
`.trim();

// ============ Category-specific Guidance ============

const CATEGORY_GUIDANCE: Record<string, string> = {
  schema: `For schema issues:
1. Check if the column exists in \`database.types.ts\` — if not, add it
2. Check if a DB migration is needed — create one in \`db/migrations/\`
3. Verify the MCP tool description matches the actual DB schema
4. Update \`buildBaseSystemPrompt()\` if it references wrong columns`,

  prompt: `For prompt issues:
1. Read \`src/app/components/cli/skills/index.ts\` — find the incorrect reference
2. Cross-reference with actual MCP tools in \`src/mcp-server/tools/\`
3. Fix the tool name, parameter, or column reference in the prompt
4. Ensure tool descriptions match their Zod schemas`,

  tooling: `For tooling issues:
1. Check if the MCP tool exists in \`src/mcp-server/tools/\`
2. If missing, create it following the pattern of existing tools
3. Register it in \`src/mcp-server/tools/index.ts\`
4. Add it to \`buildBaseSystemPrompt()\` in skills/index.ts
5. Add cache invalidation entry in \`useCLIDataSync.ts\``,

  cache: `For cache issues:
1. Open \`src/app/features/v2/hooks/useCLIDataSync.ts\`
2. Add the missing tool → query key mapping to TOOL_INVALIDATION_MAP
3. Ensure both prefix-based and URL-predicate invalidation cover the key`,

  performance: `For performance issues:
1. Check if multiple sequential tool calls could be replaced with a batch tool
2. Consider if the prompt could be more specific to reduce steps
3. Look for missing list/batch endpoints in \`src/app/api/\``,
};

// ============ Main Builder ============

/**
 * Build the improvement prompt for the meta-agent.
 * This prompt instructs Claude to fix specific detected patterns using
 * full codebase access (Read/Edit/Write/Bash — NOT MCP tools).
 */
export function buildImprovementPrompt(patterns: Pattern[]): string {
  const patternDescriptions = patterns.map((p, i) => {
    const lines = [
      `### Pattern ${i + 1}: ${p.type} (severity: ${p.severity}, seen ${p.count}x)`,
      p.toolName ? `- **Tool**: ${p.toolName}` : '',
      p.errorMessage ? `- **Error**: ${p.errorMessage.slice(0, 300)}` : '',
      p.suggestedFix ? `- **Suggested fix**: ${p.suggestedFix}` : '',
    ].filter(Boolean);
    return lines.join('\n');
  }).join('\n\n');

  // Collect unique categories for targeted guidance
  const categories = [...new Set(patterns.map(p => p.category))];
  const guidance = categories
    .map(cat => CATEGORY_GUIDANCE[cat])
    .filter(Boolean)
    .join('\n\n');

  return `You are a code improvement agent for the Story app. Your job is to fix specific issues detected during CLI usage.

## Detected Patterns

${patternDescriptions}

${CODEBASE_CONTEXT}

## Category-Specific Guidance

${guidance}

## Instructions

1. Read the relevant files for each pattern
2. Fix the root cause — make minimal, focused changes
3. After all fixes, run \`npx tsc --noEmit\` to verify no type errors
4. Summarize what you changed in a structured list

## Constraints

- ONLY fix the listed patterns — do not refactor unrelated code
- Keep changes minimal and focused
- If a DB migration is needed, create it in \`db/migrations/\` with the next sequence number
- If adding a new MCP tool, register it in \`tools/index.ts\` and update the CLI prompt
- Do not modify test files unless the pattern specifically involves tests
- After modifying MCP tools, note that \`npm run build:mcp\` needs to be run
`;
}
