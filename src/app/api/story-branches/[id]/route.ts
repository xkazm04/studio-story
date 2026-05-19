import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { handleDatabaseError, withApiHandler } from '@/app/utils/apiErrorHandling';

/**
 * GET /api/story-branches/[id]
 * Get a specific story branch
 */
export const GET = withApiHandler('GET /api/story-branches/[id]', async (
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  const { id } = await context.params;

  const { data, error } = await supabaseServer
    .from('story_branches')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return handleDatabaseError('fetch story branch', error);

  return NextResponse.json(data);
});

/**
 * PUT /api/story-branches/[id]
 * Update a story branch (name, description, is_active)
 */
export const PUT = withApiHandler('PUT /api/story-branches/[id]', async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  const { id } = await context.params;
  const body = await request.json();

  const { data, error } = await supabaseServer
    .from('story_branches')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return handleDatabaseError('update story branch', error);

  return NextResponse.json(data);
});

/**
 * DELETE /api/story-branches/[id]
 * Delete a story branch (and all its commits via CASCADE)
 */
export const DELETE = withApiHandler('DELETE /api/story-branches/[id]', async (
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  const { id } = await context.params;

  const { error } = await supabaseServer
    .from('story_branches')
    .delete()
    .eq('id', id);

  if (error) return handleDatabaseError('delete story branch', error);

  return NextResponse.json({ success: true });
});
