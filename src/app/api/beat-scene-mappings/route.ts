import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { HTTP_STATUS, handleDatabaseError, withApiHandler } from '@/app/utils/apiErrorHandling';
import { beatSceneMappingCreateSchema } from '@/lib/beats/schemas';

/**
 * GET /api/beat-scene-mappings
 * Fetch beat-scene mappings with optional filters
 */
export const GET = withApiHandler('GET /api/beat-scene-mappings', async (request: NextRequest) => {
  const supabase = supabaseServer;
  const { searchParams } = new URL(request.url);

  const beatId = searchParams.get('beatId');
  const projectId = searchParams.get('projectId');
  const status = searchParams.get('status');

  let query = supabase
    .from('beat_scene_mappings')
    .select('*')
    .order('created_at', { ascending: false });

  if (beatId) {
    query = query.eq('beat_id', beatId);
  }

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return handleDatabaseError('fetch beat-scene mappings', error, 'GET /api/beat-scene-mappings');
  }

  return NextResponse.json(data || []);
});

/**
 * POST /api/beat-scene-mappings
 * Create new beat-scene mapping
 */
export const POST = withApiHandler('POST /api/beat-scene-mappings', async (request: NextRequest) => {
  const supabase = supabaseServer;
  const body = await request.json();

  const parsed = beatSceneMappingCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  const { data, error } = await supabase
    .from('beat_scene_mappings')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    return handleDatabaseError('create beat-scene mapping', error, 'POST /api/beat-scene-mappings');
  }

  return NextResponse.json(data, { status: HTTP_STATUS.CREATED });
});
