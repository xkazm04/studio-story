import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { createErrorResponse, handleDatabaseError, HTTP_STATUS, withApiHandler } from '@/app/utils/apiErrorHandling';
import { beatSceneMappingUpdateSchema } from '@/lib/beats/schemas';

// GET - Fetch single beat-scene mapping by ID
export const GET = withApiHandler('GET /api/beat-scene-mappings/[id]', async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params;

  const { data, error } = await supabaseServer
    .from('beat_scene_mappings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return handleDatabaseError('fetch beat-scene mapping', error, 'GET /api/beat-scene-mappings/[id]');
  }

  if (!data) {
    return createErrorResponse('Beat-scene mapping not found', HTTP_STATUS.NOT_FOUND);
  }

  return NextResponse.json(data);
});

// PUT - Update beat-scene mapping
export const PUT = withApiHandler('PUT /api/beat-scene-mappings/[id]', async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params;
  const body = await request.json();

  const parsed = beatSceneMappingUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  const updates = parsed.data;

  // If user is modifying suggestions, mark it
  if (
    updates.suggested_scene_name ||
    updates.suggested_scene_description ||
    updates.suggested_scene_script ||
    updates.suggested_location
  ) {
    updates.user_modified = true;
  }

  const { data, error } = await supabaseServer
    .from('beat_scene_mappings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return handleDatabaseError('update beat-scene mapping', error, 'PUT /api/beat-scene-mappings/[id]');
  }

  return NextResponse.json(data);
});

// DELETE - Delete beat-scene mapping
export const DELETE = withApiHandler('DELETE /api/beat-scene-mappings/[id]', async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params;

  const { error } = await supabaseServer
    .from('beat_scene_mappings')
    .delete()
    .eq('id', id);

  if (error) {
    return handleDatabaseError('delete beat-scene mapping', error, 'DELETE /api/beat-scene-mappings/[id]');
  }

  return NextResponse.json({ success: true });
});
