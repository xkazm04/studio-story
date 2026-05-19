import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { Voice } from '@/app/types/Voice';
import { createErrorResponse, HTTP_STATUS, withApiHandler } from '@/app/utils/apiErrorHandling';

/**
 * GET /api/voices/[id]
 * Get a single voice by ID
 */
export const GET = withApiHandler('GET /api/voices/[id]', async (request: NextRequest, context) => {
  const { id } = await context.params;

  const { data, error } = await supabaseServer
    .from('voices')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return createErrorResponse('Voice not found', HTTP_STATUS.NOT_FOUND);
  }

  return NextResponse.json(data as Voice);
});

/**
 * PUT /api/voices/[id]
 * Update a voice
 */
export const PUT = withApiHandler('PUT /api/voices/[id]', async (request: NextRequest, context) => {
  const { id } = await context.params;
  const body = await request.json();

  const { data, error } = await supabaseServer
    .from('voices')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return createErrorResponse('Failed to update voice', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  return NextResponse.json(data as Voice);
});

/**
 * DELETE /api/voices/[id]
 * Delete a voice (cascades to voice_configs and audio_samples)
 */
export const DELETE = withApiHandler('DELETE /api/voices/[id]', async (request: NextRequest, context) => {
  const { id } = await context.params;

  const { error } = await supabaseServer
    .from('voices')
    .delete()
    .eq('id', id);

  if (error) {
    return createErrorResponse('Failed to delete voice', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  return NextResponse.json({ success: true }, { status: HTTP_STATUS.OK });
});
