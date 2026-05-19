/**
 * GET /api/datasets?projectId=xxx — List all datasets for a project
 * POST /api/datasets — Create a new dataset
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { handleDatabaseError, validateRequiredParams, withApiHandler } from '@/app/utils/apiErrorHandling';

export const GET = withApiHandler('GET /api/datasets', async (request: NextRequest) => {
  const projectId = request.nextUrl.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from('datasets')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) return handleDatabaseError('fetch datasets', error, 'GET /api/datasets');
  return NextResponse.json(data);
});

export const POST = withApiHandler('POST /api/datasets', async (request: NextRequest) => {
  const body = await request.json();
  const validation = validateRequiredParams(body, ['name', 'project_id']);
  if (validation) return validation;

  const { name, project_id, type = 'image', description } = body;
  const insertData: Record<string, unknown> = { name, project_id, type };
  if (description) insertData.description = description;

  const { data, error } = await supabaseServer
    .from('datasets')
    .insert(insertData)
    .select()
    .single();

  if (error) return handleDatabaseError('create dataset', error, 'POST /api/datasets');
  return NextResponse.json(data, { status: 201 });
});
