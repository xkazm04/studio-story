import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { handleDatabaseError, withApiHandler } from '@/app/utils/apiErrorHandling';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/scene-choices/[id]
 * Fetch a single scene choice by ID
 */
export const GET = withApiHandler('GET /api/scene-choices/[id]', async (_request: NextRequest, context: RouteContext) => {
  const { id } = await context.params;

  const { data, error } = await supabaseServer
    .from('scene_choices')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return handleDatabaseError('fetch scene choice', error);
  }

  return NextResponse.json(data);
});

/**
 * PUT /api/scene-choices/[id]
 * Update a scene choice
 */
export const PUT = withApiHandler('PUT /api/scene-choices/[id]', async (request: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.target_scene_id !== undefined) updates.target_scene_id = body.target_scene_id;
  if (body.label !== undefined) updates.label = body.label;
  if (body.order_index !== undefined) updates.order_index = body.order_index;
  if (body.condition !== undefined) updates.condition = body.condition;
  if (body.condition_enabled !== undefined) updates.condition_enabled = body.condition_enabled;

  const { data, error } = await supabaseServer
    .from('scene_choices')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return handleDatabaseError('update scene choice', error);
  }

  return NextResponse.json(data);
});

/**
 * DELETE /api/scene-choices/[id]
 * Delete a scene choice
 */
export const DELETE = withApiHandler('DELETE /api/scene-choices/[id]', async (_request: NextRequest, context: RouteContext) => {
  const { id } = await context.params;

  const { error } = await supabaseServer
    .from('scene_choices')
    .delete()
    .eq('id', id);

  if (error) {
    return handleDatabaseError('delete scene choice', error);
  }

  return NextResponse.json({ success: true });
});
