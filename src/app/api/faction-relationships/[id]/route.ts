import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { FactionRelationship } from '@/app/types/Faction';
import { handleDatabaseError, HTTP_STATUS, withApiHandler } from '@/app/utils/apiErrorHandling';

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
export const PUT = withApiHandler('PUT /api/faction-relationships/[id]', async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params;
  const body = await request.json();

  const { data, error } = await updateFactionRelationship(id, body);

  if (error) {
    return handleDatabaseError('update faction relationship', error, 'PUT /api/faction-relationships/[id]');
  }

  return NextResponse.json(data as FactionRelationship);
});

/**
 * DELETE /api/faction-relationships/[id]
 * Delete a faction relationship
 */
export const DELETE = withApiHandler('DELETE /api/faction-relationships/[id]', async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params;

  const { error } = await deleteFactionRelationship(id);

  if (error) {
    return handleDatabaseError('delete faction relationship', error, 'DELETE /api/faction-relationships/[id]');
  }

  return NextResponse.json({ success: true }, { status: HTTP_STATUS.OK });
});
