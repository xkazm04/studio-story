import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { Project } from '@/app/types/Project';
import { validateRequiredParams, handleDatabaseError, withApiHandler } from '@/app/utils/apiErrorHandling';

/**
 * GET /api/projects?userId=xxx
 * Get all projects for a user
 */
export const GET = withApiHandler('GET /api/projects', async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');

  const validationError = validateRequiredParams({ userId }, ['userId']);
  if (validationError) return validationError;

  const { data, error } = await supabaseServer
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return handleDatabaseError('fetch projects', error);
  }

  return NextResponse.json(data as Project[]);
});

/**
 * POST /api/projects
 * Create a new project
 */
export const POST = withApiHandler('POST /api/projects', async (request: NextRequest) => {
  const body = await request.json();
  const { name, description, user_id } = body;

  const validationError = validateRequiredParams(
    { name, user_id },
    ['name', 'user_id']
  );
  if (validationError) return validationError;

  const { data, error } = await supabaseServer
    .from('projects')
    .insert({
      name,
      description,
      user_id,
    })
    .select()
    .single();

  if (error) {
    return handleDatabaseError('create project', error);
  }

  return NextResponse.json(data as Project, { status: 201 });
});
