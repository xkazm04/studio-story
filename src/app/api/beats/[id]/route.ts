import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { Beat } from '@/app/types/Beat';
import { HTTP_STATUS, withApiHandler } from '@/app/utils/apiErrorHandling';
import { beatUpdateSchema } from '@/lib/beats/schemas';

/**
 * PUT /api/beats/[id]
 * Update a beat
 */
export const PUT = withApiHandler('PUT /api/beats/[id]', async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params;
  const body = await request.json();

  const parsed = beatUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  const { data, error } = await supabaseServer
    .from('beats')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to update beat' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }

  return NextResponse.json(data as Beat);
});

/**
 * DELETE /api/beats/[id]
 * Delete a beat
 */
export const DELETE = withApiHandler('DELETE /api/beats/[id]', async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params;

  const { error } = await supabaseServer
    .from('beats')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to delete beat' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }

  return NextResponse.json({ success: true }, { status: HTTP_STATUS.OK });
});
