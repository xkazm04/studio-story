import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { Beat } from '@/app/types/Beat';
import { logger } from '@/app/utils/logger';
import { HTTP_STATUS } from '@/app/utils/apiErrorHandling';

/**
 * PUT /api/beats/[id]
 * Update a beat
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const { data, error } = await supabaseServer
      .from('beats')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.apiError('PUT /api/beats/[id]', error, { beatId: id });
      return NextResponse.json(
        { error: 'Failed to update beat' },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    return NextResponse.json(data as Beat);
  } catch (error) {
    logger.apiError('PUT /api/beats/[id]', error, { beatId: await context.params.then(p => p.id) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * DELETE /api/beats/[id]
 * Delete a beat
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const { error } = await supabaseServer
      .from('beats')
      .delete()
      .eq('id', id);

    if (error) {
      logger.apiError('DELETE /api/beats/[id]', error, { beatId: id });
      return NextResponse.json(
        { error: 'Failed to delete beat' },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    return NextResponse.json({ success: true }, { status: HTTP_STATUS.OK });
  } catch (error) {
    logger.apiError('DELETE /api/beats/[id]', error, { beatId: await context.params.then(p => p.id) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}


