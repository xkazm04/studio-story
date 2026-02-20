import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { Trait } from '@/app/types/Character';
import { logger } from '@/app/utils/logger';
import { HTTP_STATUS, createErrorResponse } from '@/app/utils/apiErrorHandling';

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
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const { data, error } = await updateTrait(id, body);

    if (error) {
      logger.apiError('PUT /api/traits/[id]', error, { traitId: id });
      return createErrorResponse('Failed to update trait', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return NextResponse.json(data as Trait);
  } catch (error) {
    logger.apiError('PUT /api/traits/[id]', error);
    return createErrorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * DELETE /api/traits/[id]
 * Delete a trait
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const { error } = await deleteTrait(id);

    if (error) {
      logger.apiError('DELETE /api/traits/[id]', error, { traitId: id });
      return createErrorResponse('Failed to delete trait', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return NextResponse.json({ success: true }, { status: HTTP_STATUS.OK });
  } catch (error) {
    logger.apiError('DELETE /api/traits/[id]', error);
    return createErrorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}
