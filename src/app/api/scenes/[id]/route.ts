import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { Scene } from '@/app/types/Scene';
import { HTTP_STATUS, handleDatabaseError, withApiHandler } from '@/app/utils/apiErrorHandling';

/**
 * Fetches a scene by ID from the database
 */
async function fetchScene(id: string) {
  const { data, error } = await supabaseServer
    .from('scenes')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}

/**
 * Updates a scene in the database
 */
async function updateScene(id: string, body: Partial<Scene>) {
  const { data, error } = await supabaseServer
    .from('scenes')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

/**
 * Deletes a scene from the database
 */
async function deleteScene(id: string) {
  const { error } = await supabaseServer
    .from('scenes')
    .delete()
    .eq('id', id);

  return { error };
}

/**
 * GET /api/scenes/[id]
 * Get a single scene by ID
 */
export const GET = withApiHandler('GET /api/scenes/[id]', async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params;

  const { data, error } = await fetchScene(id);

  if (error) {
    return handleDatabaseError('fetch scene', error, `GET /api/scenes/${id}`);
  }

  return NextResponse.json(data as Scene);
});

/**
 * PUT /api/scenes/[id]
 * Update a scene
 */
export const PUT = withApiHandler('PUT /api/scenes/[id]', async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params;
  const body = await request.json();

  const { data, error } = await updateScene(id, body);

  if (error) {
    return handleDatabaseError('update scene', error, `PUT /api/scenes/${id}`);
  }

  return NextResponse.json(data as Scene);
});

/**
 * DELETE /api/scenes/[id]
 * Delete a scene
 */
export const DELETE = withApiHandler('DELETE /api/scenes/[id]', async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params;

  const { error } = await deleteScene(id);

  if (error) {
    return handleDatabaseError('delete scene', error, `DELETE /api/scenes/${id}`);
  }

  return NextResponse.json({ success: true }, { status: HTTP_STATUS.OK });
});
