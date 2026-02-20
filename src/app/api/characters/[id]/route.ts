import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { Character } from '@/app/types/Character';
import { createErrorResponse, handleDatabaseError, HTTP_STATUS } from '@/app/utils/apiErrorHandling';

/**
 * Fetches a character by ID from the database
 */
async function fetchCharacter(id: string) {
  const { data, error } = await supabaseServer
    .from('characters')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}

/**
 * Updates a character in the database
 */
async function updateCharacter(id: string, body: Partial<Character>) {
  const { data, error } = await supabaseServer
    .from('characters')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

/**
 * Deletes a character from the database
 */
async function deleteCharacter(id: string) {
  const { error } = await supabaseServer
    .from('characters')
    .delete()
    .eq('id', id);

  return { error };
}

/**
 * GET /api/characters/[id]
 * Get a single character by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const { data, error } = await fetchCharacter(id);

    if (error) {
      return handleDatabaseError('fetch character', error, `GET /api/characters/${id}`);
    }

    return NextResponse.json(data as Character);
  } catch (error) {
    console.error('Unexpected error in GET /api/characters/[id]', error);
    return createErrorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * PUT /api/characters/[id]
 * Update a character
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const { data, error } = await updateCharacter(id, body);

    if (error) {
      return handleDatabaseError('update character', error, `PUT /api/characters/${id}`);
    }

    return NextResponse.json(data as Character);
  } catch (error) {
    console.error('Unexpected error in PUT /api/characters/[id]', error);
    return createErrorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * DELETE /api/characters/[id]
 * Delete a character
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const { error } = await deleteCharacter(id);

    if (error) {
      return handleDatabaseError('delete character', error, `DELETE /api/characters/${id}`);
    }

    return NextResponse.json({ success: true }, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/characters/[id]', error);
    return createErrorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}
