import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { logger } from '@/app/utils/logger';
import { createErrorResponse, HTTP_STATUS } from '@/app/utils/apiErrorHandling';

interface BeatSceneMappingUpdate {
  status?: string;
  scene_id?: string;
  suggested_scene_name?: string;
  suggested_scene_description?: string;
  suggested_scene_script?: string;
  suggested_location?: string;
  user_feedback?: string;
  user_modified?: boolean;
}

/**
 * Fetches a beat-scene mapping by ID from the database
 */
async function fetchBeatSceneMapping(id: string) {
  const { data, error } = await supabaseServer
    .from('beat_scene_mappings')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}

/**
 * Updates a beat-scene mapping in the database
 */
async function updateBeatSceneMapping(id: string, updates: BeatSceneMappingUpdate) {
  const { data, error } = await supabaseServer
    .from('beat_scene_mappings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

/**
 * Deletes a beat-scene mapping from the database
 */
async function deleteBeatSceneMapping(id: string) {
  const { error } = await supabaseServer
    .from('beat_scene_mappings')
    .delete()
    .eq('id', id);

  return { error };
}

/**
 * Filters request body to only allowed fields
 */
function filterAllowedFields(body: Record<string, unknown>): BeatSceneMappingUpdate {
  const allowedFields = [
    'status',
    'scene_id',
    'suggested_scene_name',
    'suggested_scene_description',
    'suggested_scene_script',
    'suggested_location',
    'user_feedback',
    'user_modified',
  ];

  const updates: BeatSceneMappingUpdate = {};
  Object.keys(body).forEach((key) => {
    if (allowedFields.includes(key)) {
      updates[key as keyof BeatSceneMappingUpdate] = body[key] as never;
    }
  });

  return updates;
}

/**
 * Checks if user is modifying suggestions
 */
function isUserModifyingSuggestions(body: Record<string, unknown>): boolean {
  return !!(
    body.suggested_scene_name ||
    body.suggested_scene_description ||
    body.suggested_scene_script ||
    body.suggested_location
  );
}

// GET - Fetch single beat-scene mapping by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { data, error } = await fetchBeatSceneMapping(id);

    if (error) {
      logger.error('Error fetching beat-scene mapping', error, { id });
      return createErrorResponse(error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    if (!data) {
      return createErrorResponse('Beat-scene mapping not found', HTTP_STATUS.NOT_FOUND);
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.error('Error in GET /api/beat-scene-mappings/[id]', error);
    return createErrorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// PUT - Update beat-scene mapping
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();

    // Filter to only allowed fields
    const updates = filterAllowedFields(body);

    // If user is modifying the suggestion, mark it
    if (isUserModifyingSuggestions(body)) {
      updates.user_modified = true;
    }

    const { data, error } = await updateBeatSceneMapping(id, updates);

    if (error) {
      logger.error('Error updating beat-scene mapping', error, { id });
      return createErrorResponse(error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.error('Error in PUT /api/beat-scene-mappings/[id]', error);
    return createErrorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// DELETE - Delete beat-scene mapping
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { error } = await deleteBeatSceneMapping(id);

    if (error) {
      logger.error('Error deleting beat-scene mapping', error, { id });
      return createErrorResponse(error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error in DELETE /api/beat-scene-mappings/[id]', error);
    return createErrorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}
