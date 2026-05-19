import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { ContextPin } from '@/app/types/ContextPin';
import { validateRequiredParams, handleDatabaseError, withApiHandler } from '@/app/utils/apiErrorHandling';

/**
 * GET /api/context-pins?projectId=xxx[&scope=xxx][&scopeTargetId=xxx][&enabledOnly=true]
 * List context pins for a project with optional filtering.
 */
export const GET = withApiHandler('GET /api/context-pins', async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('projectId');
  const scope = searchParams.get('scope');
  const scopeTargetId = searchParams.get('scopeTargetId');
  const enabledOnly = searchParams.get('enabledOnly');

  const validationError = validateRequiredParams({ projectId }, ['projectId']);
  if (validationError) return validationError;

  let query = supabaseServer
    .from('context_pins')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true });

  if (scope) {
    query = query.eq('scope', scope);
  }

  if (scopeTargetId) {
    query = query.eq('scope_target_id', scopeTargetId);
  }

  if (enabledOnly === 'true') {
    query = query.eq('enabled', true);
  }

  const { data, error } = await query;

  if (error) {
    return handleDatabaseError('fetch context pins', error);
  }

  return NextResponse.json(data as ContextPin[]);
});

/**
 * POST /api/context-pins
 * Create a new context pin.
 */
export const POST = withApiHandler('POST /api/context-pins', async (request: NextRequest) => {
  const body = await request.json();
  const { project_id, pin_type, label, content, scope, scope_target_id, enabled, sort_order } = body;

  const validationError = validateRequiredParams(
    { project_id, pin_type, label, content },
    ['project_id', 'pin_type', 'label', 'content']
  );
  if (validationError) return validationError;

  const row: Record<string, unknown> = {
    project_id,
    pin_type,
    label,
    content,
  };

  if (scope) row.scope = scope;
  if (scope_target_id !== undefined) row.scope_target_id = scope_target_id;
  if (enabled !== undefined) row.enabled = enabled;
  if (sort_order !== undefined) row.sort_order = sort_order;

  const { data, error } = await supabaseServer
    .from('context_pins')
    .insert(row)
    .select()
    .single();

  if (error) {
    return handleDatabaseError('create context pin', error);
  }

  return NextResponse.json(data as ContextPin, { status: 201 });
});
