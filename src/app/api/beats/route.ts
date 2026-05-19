import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { Beat } from '@/app/types/Beat';
import { handleDatabaseError, withApiHandler } from '@/app/utils/apiErrorHandling';
import { beatGetParamsSchema, beatCreateSchema } from '@/lib/beats/schemas';

/**
 * GET /api/beats?projectId=xxx&actId=yyy
 * Get beats for a project or specific act
 */
export const GET = withApiHandler('GET /api/beats', async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;

  const parsed = beatGetParamsSchema.safeParse({
    projectId: searchParams.get('projectId') || undefined,
    actId: searchParams.get('actId') || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { projectId, actId } = parsed.data;

  let query = supabaseServer.from('beats').select('*');

  if (actId) {
    query = query.eq('act_id', actId);
  } else if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query.order('order', { ascending: true });

  if (error) {
    return handleDatabaseError('fetch beats', error, 'GET /api/beats');
  }

  return NextResponse.json(data as Beat[]);
});

/**
 * POST /api/beats
 * Create a new beat
 */
export const POST = withApiHandler('POST /api/beats', async (request: NextRequest) => {
  const body = await request.json();

  const parsed = beatCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { name, type, project_id, act_id, description, order } = parsed.data;

  const { data, error } = await supabaseServer
    .from('beats')
    .insert({
      name,
      type,
      project_id,
      act_id,
      description,
      order: order || 0,
      completed: false,
    })
    .select()
    .single();

  if (error) {
    return handleDatabaseError('create beat', error, 'POST /api/beats');
  }

  return NextResponse.json(data as Beat, { status: 201 });
});
