import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { FactionRelationship } from '@/app/types/Faction';
import { logger } from '@/app/utils/logger';
import { createErrorResponse, HTTP_STATUS } from '@/app/utils/apiErrorHandling';

/**
 * Updates a faction relationship in the database
 */
async function updateFactionRelationship(id: string, body: Partial<FactionRelationship>) {
  const { data, error } = await supabaseServer
    .from('faction_relationships')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

/**
 * Deletes a faction relationship from the database
 */
async function deleteFactionRelationship(id: string) {
  const { error } = await supabaseServer
    .from('faction_relationships')
    .delete()
    .eq('id', id);

  return { error };
}

/**
 * PUT /api/faction-relationships/[id]
 * Update a faction relationship
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const { data, error } = await updateFactionRelationship(id, body);

    if (error) {
      logger.error('Error updating faction relationship', error, { id });
      return createErrorResponse('Failed to update faction relationship', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return NextResponse.json(data as FactionRelationship);
  } catch (error) {
    logger.error('Unexpected error in PUT /api/faction-relationships/[id]', error);
    return createErrorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * DELETE /api/faction-relationships/[id]
 * Delete a faction relationship
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const { error } = await deleteFactionRelationship(id);

    if (error) {
      logger.error('Error deleting faction relationship', error, { id });
      return createErrorResponse('Failed to delete faction relationship', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return NextResponse.json({ success: true }, { status: HTTP_STATUS.OK });
  } catch (error) {
    logger.error('Unexpected error in DELETE /api/faction-relationships/[id]', error);
    return createErrorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}
