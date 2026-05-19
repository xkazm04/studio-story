import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { Act } from '@/app/types/Act';
import { HTTP_STATUS, withApiHandler } from '@/app/utils/apiErrorHandling';

/**
 * GET /api/acts/[id]
 * Get a single act by ID
 */
export const GET = withApiHandler('GET /api/acts/[id]', async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params;

  const { data, error } = await supabaseServer
    .from('acts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Act not found' },
      { status: HTTP_STATUS.NOT_FOUND }
    );
  }

  return NextResponse.json(data as Act);
});

/**
 * PUT /api/acts/[id]
 * Update an act
 */
export const PUT = withApiHandler('PUT /api/acts/[id]', async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params;
  const body = await request.json();

  const { data, error } = await supabaseServer
    .from('acts')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to update act' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }

  return NextResponse.json(data as Act);
});

/**
 * DELETE /api/acts/[id]
 * Delete an act
 */
export const DELETE = withApiHandler('DELETE /api/acts/[id]', async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params;

  const { error } = await supabaseServer
    .from('acts')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to delete act' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }

  return NextResponse.json({ success: true }, { status: HTTP_STATUS.OK });
});
