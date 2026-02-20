import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { CharRelationship } from '@/app/types/Character';
import { logger } from '@/app/utils/logger';
import { HTTP_STATUS, createErrorResponse } from '@/app/utils/apiErrorHandling';

/**
 * Updates a character relationship in the database
 */
async function updateRelationship(id: string, body: Partial<CharRelationship>) {
  const { data, error } = await supabaseServer
    .from('character_relationships')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

/**
 * Deletes a character relationship from the database
 */
async function deleteRelationship(id: string) {
  const { error } = await supabaseServer
    .from('character_relationships')
    .delete()
    .eq('id', id);

  return { error };
}

/**
 * PUT /api/relationships/[id]
 * Update a character relationship
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const { data, error } = await updateRelationship(id, body);

    if (error) {
      logger.apiError('PUT /api/relationships/[id]', error, { relationshipId: id });
      return createErrorResponse('Failed to update relationship', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return NextResponse.json(data as CharRelationship);
  } catch (error) {
    logger.apiError('PUT /api/relationships/[id]', error);
    return createErrorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * DELETE /api/relationships/[id]
 * Delete a character relationship
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const { error } = await deleteRelationship(id);

    if (error) {
      logger.apiError('DELETE /api/relationships/[id]', error, { relationshipId: id });
      return createErrorResponse('Failed to delete relationship', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return NextResponse.json({ success: true }, { status: HTTP_STATUS.OK });
  } catch (error) {
    logger.apiError('DELETE /api/relationships/[id]', error);
    return createErrorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}
