import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import type { NarrationSession } from '@/app/types/NarrationSession';
import {
  handleDatabaseError,
  createErrorResponse,
  validateRequiredParams,
  withApiHandler,
} from '@/app/utils/apiErrorHandling';

/**
 * GET /api/narration-sessions?projectId=xxx[&sceneId=xxx]
 */
export const GET = withApiHandler('GET /api/narration-sessions', async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('projectId');
  const sceneId = searchParams.get('sceneId');

  if (!projectId) {
    return createErrorResponse('projectId is required', 400);
  }

  let query = supabaseServer
    .from('narration_sessions')
    .select('*')
    .eq('project_id', projectId)
    .order('updated_at', { ascending: false });

  if (sceneId) {
    query = query.eq('scene_id', sceneId);
  }

  const { data, error } = await query;

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') {
      return NextResponse.json([]);
    }
    return handleDatabaseError('fetch narration sessions', error, 'GET /api/narration-sessions');
  }

  return NextResponse.json(data as NarrationSession[]);
});

/**
 * POST /api/narration-sessions
 */
export const POST = withApiHandler('POST /api/narration-sessions', async (request: NextRequest) => {
  const body = await request.json();
  const { project_id, scene_id, name, status, voice_settings, script_lines, placement, total_duration, lines_total, lines_done } = body;

  const paramValidation = validateRequiredParams({ project_id }, ['project_id']);
  if (paramValidation) return paramValidation;

  const { data, error } = await supabaseServer
    .from('narration_sessions')
    .insert({
      project_id,
      scene_id: scene_id ?? null,
      name: name ?? 'Untitled Session',
      status: status ?? 'draft',
      voice_settings: voice_settings ?? {},
      script_lines: script_lines ?? [],
      placement: placement ?? null,
      total_duration: total_duration ?? 0,
      lines_total: lines_total ?? 0,
      lines_done: lines_done ?? 0,
    })
    .select()
    .single();

  if (error) {
    return handleDatabaseError('create narration session', error, 'POST /api/narration-sessions');
  }

  return NextResponse.json(data as NarrationSession, { status: 201 });
});
