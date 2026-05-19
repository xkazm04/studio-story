import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { Trait } from '@/app/types/Character';
import { HTTP_STATUS, createErrorResponse, withApiHandler } from '@/app/utils/apiErrorHandling';

/**
 * Updates a trait in the database
 */
async function updateTrait(id: string, body: Partial<Trait>) {
  const { data, error } = await supabaseServer
    .from('traits')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

/**
 * Deletes a trait from the database
 */
async function deleteTrait(id: string) {
  const { error } = await supabaseServer
    .from('traits')
    .delete()
    .eq('id', id);

  return { error };
}

/**
 * PUT /api/traits/[id]
 * Update a trait
 */
export const PUT = withApiHandler('PUT /api/traits/[id]', async (request: NextRequest, context) => {
  const { id } = await context.params;
  const body = await request.json();

  const { data, error } = await updateTrait(id, body);

  if (error) {
    return createErrorResponse('Failed to update trait', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  return NextResponse.json(data as Trait);
});

/**
 * DELETE /api/traits/[id]
 * Delete a trait
 */
export const DELETE = withApiHandler('DELETE /api/traits/[id]', async (request: NextRequest, context) => {
  const { id } = await context.params;

  const { error } = await deleteTrait(id);

  if (error) {
    return createErrorResponse('Failed to delete trait', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  return NextResponse.json({ success: true }, { status: HTTP_STATUS.OK });
});
