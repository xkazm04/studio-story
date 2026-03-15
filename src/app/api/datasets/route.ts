/**
 * GET /api/datasets?projectId=xxx — List all datasets for a project
 * POST /api/datasets — Create a new dataset
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { handleDatabaseError, handleUnexpectedError, validateRequiredParams } from '@/app/utils/apiErrorHandling';

export async function GET(request: NextRequest) {
  try {
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
  } catch (error) {
    return handleUnexpectedError('GET /api/datasets', error);
  }
}

export async function POST(request: NextRequest) {
  try {
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
  } catch (error) {
    return handleUnexpectedError('POST /api/datasets', error);
  }
}
