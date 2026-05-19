import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { validateRequiredParams, handleDatabaseError, withApiHandler } from '@/app/utils/apiErrorHandling';

/**
 * GET /api/scene-choices?projectId=xxx or ?sceneId=yyy
 * List scene choices filtered by project or scene
 */
export const GET = withApiHandler('GET /api/scene-choices', async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('projectId');
  const sceneId = searchParams.get('sceneId');

  if (!projectId && !sceneId) {
    return NextResponse.json(
      { error: 'Either projectId or sceneId query parameter is required' },
      { status: 400 }
    );
  }

  let query;

  if (sceneId) {
    query = supabaseServer
      .from('scene_choices')
      .select('*')
      .eq('scene_id', sceneId)
      .order('order_index', { ascending: true });
  } else {
    // Join through scenes to filter by project
    query = supabaseServer
      .from('scene_choices')
      .select('*, scenes!inner(project_id)')
      .eq('scenes.project_id', projectId!)
      .order('order_index', { ascending: true });
  }

  const { data, error } = await query;

  if (error) {
    return handleDatabaseError('fetch scene choices', error);
  }

  return NextResponse.json(data);
});

/**
 * POST /api/scene-choices
 * Create a new scene choice
 */
export const POST = withApiHandler('POST /api/scene-choices', async (request: NextRequest) => {
  const body = await request.json();

  const validationError = validateRequiredParams(body, ['scene_id', 'label']);
  if (validationError) return validationError;

  const { scene_id, target_scene_id, label, order_index, condition, condition_enabled } = body;

  const { data, error } = await supabaseServer
    .from('scene_choices')
    .insert({
      scene_id,
      target_scene_id: target_scene_id ?? null,
      label,
      order_index: order_index ?? 0,
      condition: condition ?? null,
      condition_enabled: condition_enabled ?? false,
    })
    .select()
    .single();

  if (error) {
    return handleDatabaseError('create scene choice', error);
  }

  return NextResponse.json(data, { status: 201 });
});
