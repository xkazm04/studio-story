import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { Scene } from '@/app/types/Scene';
import { validateRequiredParams, handleDatabaseError, handleUnexpectedError } from '@/app/utils/apiErrorHandling';

/**
 * GET /api/scenes?projectId=xxx&actId=yyy
 * Get scenes for a project or specific act
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const actId = searchParams.get('actId');

    const validationError = validateRequiredParams({ projectId }, ['projectId']);
    if (validationError) return validationError;

    let query = supabaseServer
      .from('scenes')
      .select('*')
      .eq('project_id', projectId);

    if (actId) {
      query = query.eq('act_id', actId);
    }

    const { data, error } = await query.order('order', { ascending: true });

    if (error) {
      return handleDatabaseError('fetch scenes', error);
    }

    return NextResponse.json(data as Scene[]);
  } catch (error) {
    return handleUnexpectedError('GET /api/scenes', error);
  }
}

/**
 * POST /api/scenes
 * Create a new scene
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, project_id, act_id, description, order } = body;

    const validationError = validateRequiredParams(
      { project_id, act_id },
      ['project_id', 'act_id']
    );
    if (validationError) return validationError;

    const { data, error } = await supabaseServer
      .from('scenes')
      .insert({
        name: name || 'Untitled Scene',
        project_id,
        act_id,
        description,
        order: order || 0,
      })
      .select()
      .single();

    if (error) {
      return handleDatabaseError('create scene', error);
    }

    return NextResponse.json(data as Scene, { status: 201 });
  } catch (error) {
    return handleUnexpectedError('POST /api/scenes', error);
  }
}


