import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { Voice } from '@/app/types/Voice';
import { logger } from '@/app/utils/logger';
import { createErrorResponse, HTTP_STATUS } from '@/app/utils/apiErrorHandling';

/**
 * GET /api/voices/[id]
 * Get a single voice by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const { data, error } = await supabaseServer
      .from('voices')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      logger.error('Error fetching voice', error, { id });
      return createErrorResponse('Voice not found', HTTP_STATUS.NOT_FOUND);
    }

    return NextResponse.json(data as Voice);
  } catch (error) {
    logger.error('Unexpected error in GET /api/voices/[id]', error);
    return createErrorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * PUT /api/voices/[id]
 * Update a voice
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const { data, error } = await supabaseServer
      .from('voices')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating voice', error, { id });
      return createErrorResponse('Failed to update voice', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return NextResponse.json(data as Voice);
  } catch (error) {
    logger.error('Unexpected error in PUT /api/voices/[id]', error);
    return createErrorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * DELETE /api/voices/[id]
 * Delete a voice (cascades to voice_configs and audio_samples)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const { error } = await supabaseServer
      .from('voices')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error deleting voice', error, { id });
      return createErrorResponse('Failed to delete voice', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return NextResponse.json({ success: true }, { status: HTTP_STATUS.OK });
  } catch (error) {
    logger.error('Unexpected error in DELETE /api/voices/[id]', error);
    return createErrorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}
