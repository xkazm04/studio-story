import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { ContextPin } from '@/app/types/ContextPin';
import { HTTP_STATUS, createErrorResponse, withApiHandler } from '@/app/utils/apiErrorHandling';

/**
 * PUT /api/context-pins/[id]
 * Update a context pin.
 */
export const PUT = withApiHandler('PUT /api/context-pins/[id]', async (request: NextRequest, context) => {
  const { id } = await context.params;
  const body = await request.json();

  const { data, error } = await supabaseServer
    .from('context_pins')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return createErrorResponse('Failed to update context pin', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  return NextResponse.json(data as ContextPin);
});

/**
 * DELETE /api/context-pins/[id]
 * Delete a context pin.
 */
export const DELETE = withApiHandler('DELETE /api/context-pins/[id]', async (request: NextRequest, context) => {
  const { id } = await context.params;

  const { error } = await supabaseServer
    .from('context_pins')
    .delete()
    .eq('id', id);

  if (error) {
    return createErrorResponse('Failed to delete context pin', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  return NextResponse.json({ success: true }, { status: HTTP_STATUS.OK });
});
