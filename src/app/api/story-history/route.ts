import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { validateRequiredParams, handleDatabaseError, withApiHandler } from '@/app/utils/apiErrorHandling';

/**
 * GET /api/story-history?projectId=xxx&branchId=yyy&entityTable=zzz&entityId=www&limit=20&offset=0
 * List story commits (narrative version history)
 */
export const GET = withApiHandler('GET /api/story-history', async (request: NextRequest) => {
  const params = request.nextUrl.searchParams;
  const projectId = params.get('projectId');
  const branchId = params.get('branchId');
  const entityTable = params.get('entityTable');
  const entityId = params.get('entityId');
  const limit = parseInt(params.get('limit') || '20', 10);
  const offset = parseInt(params.get('offset') || '0', 10);

  const validationError = validateRequiredParams({ projectId }, ['projectId']);
  if (validationError) return validationError;

  let query = supabaseServer
    .from('story_commits')
    .select('id, project_id, branch_id, entity_table, entity_id, operation, diff, message, metadata, created_at')
    .eq('project_id', projectId!)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (branchId) query = query.eq('branch_id', branchId);
  if (entityTable) query = query.eq('entity_table', entityTable);
  if (entityId) query = query.eq('entity_id', entityId);

  const { data, error } = await query;

  if (error) return handleDatabaseError('fetch story history', error);

  return NextResponse.json(data);
});
