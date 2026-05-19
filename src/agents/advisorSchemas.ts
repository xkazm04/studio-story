/**
 * Zod schemas for runtime validation of Gemini tool call arguments.
 *
 * Gemini is a probabilistic model — it can return unexpected argument shapes
 * (e.g., panels as an array instead of a JSON string, missing required fields).
 * These schemas catch malformed args at the boundary with actionable errors
 * instead of silent data corruption from `as` casts.
 */

import { z } from 'zod';

// ─── Panel Data Slice ────────────────────────────

const dataSliceSchema = z.object({
  entityId: z.string().optional(),
  filter: z.string().optional(),
  view: z.string().optional(),
  highlight: z.array(z.string()).optional(),
  sort: z.string().optional(),
}).optional();

// ─── compose_workspace ───────────────────────────

export const composeWorkspaceArgsSchema = z.object({
  action: z.enum(['show', 'hide', 'replace', 'clear']),
  layout: z.enum([
    'stack', 'single', 'split-2', 'split-3',
    'grid-4', 'primary-sidebar', 'triptych', 'studio',
  ]).optional(),
  // Gemini may return panels as a JSON string OR as an array directly
  panels: z.union([
    z.string(),
    z.array(z.object({
      type: z.string(),
      role: z.string().optional(),
      props: z.record(z.string(), z.unknown()).optional(),
      density: z.enum(['full', 'compact', 'micro']).optional(),
      dataSlice: dataSliceSchema,
    })),
  ]).optional(),
  reasoning: z.string().optional(),
});

export type ComposeWorkspaceArgs = z.infer<typeof composeWorkspaceArgsSchema>;

// ─── suggest_action ──────────────────────────────

export const suggestActionArgsSchema = z.object({
  content: z.string(),
  compose_on_accept: z.string().optional(),
});

export type SuggestActionArgs = z.infer<typeof suggestActionArgsSchema>;

// ─── _session_spawned (pseudo-tool) ──────────────

export const sessionSpawnedArgsSchema = z.object({
  executionId: z.string().optional(),
  sessionId: z.string().optional(),
  domain: z.string().optional(),
  streamUrl: z.string().optional(),
  prompt: z.string().optional(),
});

export type SessionSpawnedArgs = z.infer<typeof sessionSpawnedArgsSchema>;

// ─── Server-side tool args ───────────────────────

export const createCliSessionArgsSchema = z.object({
  prompt: z.string(),
  domain: z.enum(['scene', 'character', 'story', 'image', 'general']).optional(),
});

export type CreateCliSessionArgs = z.infer<typeof createCliSessionArgsSchema>;

export const getCliStatusArgsSchema = z.object({
  executionId: z.string(),
});

export type GetCliStatusArgs = z.infer<typeof getCliStatusArgsSchema>;

export const stopCliSessionArgsSchema = z.object({
  executionId: z.string(),
});

export type StopCliSessionArgs = z.infer<typeof stopCliSessionArgsSchema>;

// ─── Validation helper ──────────────────────────

/**
 * Validate tool call args against the appropriate schema.
 * Returns the parsed (and potentially coerced) args on success,
 * or null with a console warning on failure.
 */
export function validateToolArgs<T>(
  schema: z.ZodType<T>,
  args: Record<string, unknown>,
  toolName: string,
): T | null {
  const result = schema.safeParse(args);
  if (result.success) {
    return result.data;
  }
  console.warn(
    `[advisor] Invalid ${toolName} args from Gemini:`,
    result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '),
    'Raw args:', args,
  );
  return null;
}
