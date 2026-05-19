import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import type { AudioTake } from '@/app/types/NarrationSession';
import { createErrorResponse, HTTP_STATUS, withApiHandler } from '@/app/utils/apiErrorHandling';

/**
 * GET /api/audio-takes/[id]
 */
export const GET = withApiHandler('GET /api/audio-takes/[id]', async (request: NextRequest, context) => {
  const { id } = await context.params;

  const { data, error } = await supabaseServer
    .from('audio_takes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return createErrorResponse('Audio take not found', HTTP_STATUS.NOT_FOUND);
  }

  return NextResponse.json(data as AudioTake);
});

/**
 * PUT /api/audio-takes/[id]
 * Typically used to update rating or selected status.
 */
export const PUT = withApiHandler('PUT /api/audio-takes/[id]', async (request: NextRequest, context) => {
  const { id } = await context.params;
  const body = await request.json();

  const { data, error } = await supabaseServer
    .from('audio_takes')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return createErrorResponse('Failed to update audio take', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  return NextResponse.json(data as AudioTake);
});

/**
 * DELETE /api/audio-takes/[id]
 */
export const DELETE = withApiHandler('DELETE /api/audio-takes/[id]', async (request: NextRequest, context) => {
  const { id } = await context.params;

  const { error } = await supabaseServer
    .from('audio_takes')
    .delete()
    .eq('id', id);

  if (error) {
    return createErrorResponse('Failed to delete audio take', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  return NextResponse.json({ success: true }, { status: HTTP_STATUS.OK });
});
