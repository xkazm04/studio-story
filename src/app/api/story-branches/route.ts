import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { validateRequiredParams, handleDatabaseError, withApiHandler } from '@/app/utils/apiErrorHandling';

/**
 * GET /api/story-branches?projectId=xxx
 * List all story branches for a project
 */
export const GET = withApiHandler('GET /api/story-branches', async (request: NextRequest) => {
  const projectId = request.nextUrl.searchParams.get('projectId');

  const validationError = validateRequiredParams({ projectId }, ['projectId']);
  if (validationError) return validationError;

  const { data, error } = await supabaseServer
    .from('story_branches')
    .select('*')
    .eq('project_id', projectId!)
    .order('created_at', { ascending: true });

  if (error) return handleDatabaseError('fetch story branches', error);

  return NextResponse.json(data);
});

/**
 * POST /api/story-branches
 * Create a new story branch
 */
export const POST = withApiHandler('POST /api/story-branches', async (request: NextRequest) => {
  const body = await request.json();
  const { projectId, name, description, parentBranchId, forkCommitId } = body;

  const validationError = validateRequiredParams({ projectId, name }, ['projectId', 'name']);
  if (validationError) return validationError;

  const row: Record<string, unknown> = {
    project_id: projectId,
    name,
    is_active: false,
  };
  if (description) row.description = description;
  if (parentBranchId) row.parent_branch_id = parentBranchId;
  if (forkCommitId) row.fork_commit_id = forkCommitId;

  const { data, error } = await supabaseServer
    .from('story_branches')
    .insert(row)
    .select()
    .single();

  if (error) return handleDatabaseError('create story branch', error);

  return NextResponse.json(data, { status: 201 });
});
