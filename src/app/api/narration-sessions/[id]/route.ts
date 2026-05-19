import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import type { NarrationSession } from '@/app/types/NarrationSession';
import { createErrorResponse, HTTP_STATUS, withApiHandler } from '@/app/utils/apiErrorHandling';

/**
 * GET /api/narration-sessions/[id]
 */
export const GET = withApiHandler('GET /api/narration-sessions/[id]', async (request: NextRequest, context) => {
  const { id } = await context.params;

  const { data, error } = await supabaseServer
    .from('narration_sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return createErrorResponse('Narration session not found', HTTP_STATUS.NOT_FOUND);
  }

  return NextResponse.json(data as NarrationSession);
});

/**
 * PUT /api/narration-sessions/[id]
 */
export const PUT = withApiHandler('PUT /api/narration-sessions/[id]', async (request: NextRequest, context) => {
  const { id } = await context.params;
  const body = await request.json();

  const { data, error } = await supabaseServer
    .from('narration_sessions')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return createErrorResponse('Failed to update narration session', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  return NextResponse.json(data as NarrationSession);
});

/**
 * DELETE /api/narration-sessions/[id]
 * Cascades to audio_takes via FK constraint.
 */
export const DELETE = withApiHandler('DELETE /api/narration-sessions/[id]', async (request: NextRequest, context) => {
  const { id } = await context.params;

  const { error } = await supabaseServer
    .from('narration_sessions')
    .delete()
    .eq('id', id);

  if (error) {
    return createErrorResponse('Failed to delete narration session', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  return NextResponse.json({ success: true }, { status: HTTP_STATUS.OK });
});
