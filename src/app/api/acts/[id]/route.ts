import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { Act } from '@/app/types/Act';
import { logger } from '@/app/utils/logger';
import { HTTP_STATUS } from '@/app/utils/apiErrorHandling';

/**
 * GET /api/acts/[id]
 * Get a single act by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const { data, error } = await supabaseServer
      .from('acts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      logger.apiError('GET /api/acts/[id]', error, { actId: id });
      return NextResponse.json(
        { error: 'Act not found' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    return NextResponse.json(data as Act);
  } catch (error) {
    logger.apiError('GET /api/acts/[id]', error, { actId: await context.params.then(p => p.id) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * PUT /api/acts/[id]
 * Update an act
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const { data, error } = await supabaseServer
      .from('acts')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.apiError('PUT /api/acts/[id]', error, { actId: id });
      return NextResponse.json(
        { error: 'Failed to update act' },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    return NextResponse.json(data as Act);
  } catch (error) {
    logger.apiError('PUT /api/acts/[id]', error, { actId: await context.params.then(p => p.id) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * DELETE /api/acts/[id]
 * Delete an act
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const { error } = await supabaseServer
      .from('acts')
      .delete()
      .eq('id', id);

    if (error) {
      logger.apiError('DELETE /api/acts/[id]', error, { actId: id });
      return NextResponse.json(
        { error: 'Failed to delete act' },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    return NextResponse.json({ success: true }, { status: HTTP_STATUS.OK });
  } catch (error) {
    logger.apiError('DELETE /api/acts/[id]', error, { actId: await context.params.then(p => p.id) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}


