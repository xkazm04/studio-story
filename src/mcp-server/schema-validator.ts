/**
 * Schema-aware tool validation at MCP server startup.
 *
 * Queries information_schema.columns from Supabase and compares against
 * the columns that MCP tools expect. Surfaces mismatches as startup warnings
 * so they're caught immediately rather than at runtime (PGRST errors).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface SchemaWarning {
  table: string;
  type: 'missing_table' | 'missing_column' | 'extra_column';
  column?: string;
  message: string;
}

/**
 * Expected columns per table, derived from MCP tool implementations.
 * Only includes columns that tools actively read or write via
 * dbSelect/dbInsert/dbUpdate/dbSelectOne calls.
 */
const EXPECTED_SCHEMA: Record<string, string[]> = {
  characters: [
    'id', 'project_id', 'faction_id', 'name', 'type', 'voice',
    'avatar_url', 'transparent_avatar_url', 'body_url', 'transparent_body_url',
    'story_stack_id', 'created_at', 'updated_at',
  ],
  traits: [
    'id', 'character_id', 'type', 'description', 'created_at', 'updated_at',
  ],
  character_relationships: [
    'id', 'character_a_id', 'character_b_id', 'relationship_type',
    'act_id', 'event_date', 'description', 'created_at', 'updated_at',
  ],
  projects: [
    'id', 'name', 'description', 'premise', 'genre', 'setting',
    'type', 'user_id', 'created_at', 'updated_at',
  ],
  factions: [
    'id', 'project_id', 'name', 'description', 'color', 'logo_url',
    'created_at', 'updated_at',
  ],
  acts: [
    'id', 'project_id', 'name', 'description', 'order',
    'created_at', 'updated_at',
  ],
  beats: [
    'id', 'project_id', 'act_id', 'name', 'type', 'description',
    'order', 'completed', 'default_flag', 'paragraph_id', 'paragraph_title',
    'created_at', 'updated_at',
  ],
  scenes: [
    'id', 'project_id', 'act_id', 'name', 'description', 'order',
    'script', 'location', 'image_url', 'image_prompt',
    'created_at', 'updated_at',
  ],
  scene_choices: [
    'id', 'scene_id', 'target_scene_id', 'label', 'order_index',
    'created_at', 'updated_at',
  ],
  story_stacks: ['id'],
};

interface ColumnRow {
  table_name: string;
  column_name: string;
}

/**
 * Validate that the live Supabase schema matches what MCP tools expect.
 * Returns an array of warnings (empty = all good).
 */
export async function validateSchema(client: SupabaseClient): Promise<SchemaWarning[]> {
  const tableNames = Object.keys(EXPECTED_SCHEMA);

  // Query information_schema.columns for all tracked tables in one call
  const { data, error } = await client
    .from('information_schema.columns' as never)
    .select('table_name, column_name')
    .eq('table_schema', 'public')
    .in('table_name', tableNames);

  if (error) {
    // information_schema query via PostgREST may not work — fall back to raw SQL
    return validateSchemaViaRpc(client);
  }

  return compareSchema(data as unknown as ColumnRow[]);
}

/**
 * Fallback: use a raw SQL query via Supabase rpc or direct query
 * if information_schema isn't exposed through PostgREST.
 */
async function validateSchemaViaRpc(client: SupabaseClient): Promise<SchemaWarning[]> {
  const tableNames = Object.keys(EXPECTED_SCHEMA);
  const placeholders = tableNames.map(t => `'${t}'`).join(', ');

  const { data, error } = await client.rpc('_schema_columns' as never, {} as never).select('*');

  if (!error && data) {
    return compareSchema(data as unknown as ColumnRow[]);
  }

  // Last resort: query each table with LIMIT 0 to discover columns from response shape
  return validateSchemaViaProbe(client);
}

/**
 * Probe-based validation: SELECT * LIMIT 0 per table to discover columns.
 */
async function validateSchemaViaProbe(client: SupabaseClient): Promise<SchemaWarning[]> {
  const warnings: SchemaWarning[] = [];

  for (const [table, expectedCols] of Object.entries(EXPECTED_SCHEMA)) {
    const { data, error } = await client
      .from(table)
      .select('*')
      .limit(0);

    if (error) {
      // Table doesn't exist or isn't accessible
      warnings.push({
        table,
        type: 'missing_table',
        message: `Table "${table}" not found or not accessible: ${error.message}`,
      });
      continue;
    }

    // For LIMIT 0, Supabase returns an empty array but the response
    // headers contain column info. However, with an empty result we
    // can't introspect columns. Try fetching one row instead.
    const { data: sampleData, error: sampleError } = await client
      .from(table)
      .select('*')
      .limit(1);

    if (sampleError) {
      warnings.push({
        table,
        type: 'missing_table',
        message: `Table "${table}" query failed: ${sampleError.message}`,
      });
      continue;
    }

    if (!sampleData || sampleData.length === 0) {
      // Table exists but is empty — we can still try selecting specific columns
      for (const col of expectedCols) {
        const { error: colError } = await client
          .from(table)
          .select(col)
          .limit(0);

        if (colError) {
          warnings.push({
            table,
            type: 'missing_column',
            column: col,
            message: `Column "${table}.${col}" does not exist`,
          });
        }
      }
      continue;
    }

    // We have a sample row — check which expected columns exist
    const actualCols = new Set(Object.keys(sampleData[0] as Record<string, unknown>));

    for (const col of expectedCols) {
      if (!actualCols.has(col)) {
        warnings.push({
          table,
          type: 'missing_column',
          column: col,
          message: `Column "${table}.${col}" expected by MCP tools but not found in database`,
        });
      }
    }
  }

  return warnings;
}

/**
 * Compare fetched column metadata against expected schema.
 */
function compareSchema(rows: ColumnRow[]): SchemaWarning[] {
  const warnings: SchemaWarning[] = [];

  // Build actual schema map: table -> Set<column>
  const actualSchema = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!actualSchema.has(row.table_name)) {
      actualSchema.set(row.table_name, new Set());
    }
    actualSchema.get(row.table_name)!.add(row.column_name);
  }

  for (const [table, expectedCols] of Object.entries(EXPECTED_SCHEMA)) {
    const actualCols = actualSchema.get(table);

    if (!actualCols) {
      warnings.push({
        table,
        type: 'missing_table',
        message: `Table "${table}" expected by MCP tools but not found in database`,
      });
      continue;
    }

    for (const col of expectedCols) {
      if (!actualCols.has(col)) {
        warnings.push({
          table,
          type: 'missing_column',
          column: col,
          message: `Column "${table}.${col}" expected by MCP tools but not found in database`,
        });
      }
    }
  }

  return warnings;
}

/**
 * Run validation and log results. Non-blocking — failures don't prevent startup.
 */
export async function validateSchemaAtStartup(client: SupabaseClient): Promise<void> {
  try {
    const warnings = await validateSchema(client);

    if (warnings.length === 0) {
      console.error('[story-mcp] Schema validation: all tables and columns match ✓');
      return;
    }

    console.error(`[story-mcp] Schema validation: ${warnings.length} warning(s) found`);

    const missingTables = warnings.filter(w => w.type === 'missing_table');
    const missingCols = warnings.filter(w => w.type === 'missing_column');

    if (missingTables.length > 0) {
      console.error(`[story-mcp]   Missing tables: ${missingTables.map(w => w.table).join(', ')}`);
    }

    if (missingCols.length > 0) {
      // Group by table for readable output
      const byTable = new Map<string, string[]>();
      for (const w of missingCols) {
        if (!byTable.has(w.table)) byTable.set(w.table, []);
        byTable.get(w.table)!.push(w.column!);
      }
      for (const [table, cols] of byTable) {
        console.error(`[story-mcp]   ${table}: missing columns [${cols.join(', ')}]`);
      }
    }

    console.error('[story-mcp]   These mismatches will cause PGRST errors at runtime. Run migrations to fix.');
  } catch (err) {
    console.error('[story-mcp] Schema validation skipped:', err instanceof Error ? err.message : 'unknown error');
  }
}
