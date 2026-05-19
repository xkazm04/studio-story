/**
 * GET /api/datasets/[id] — Get single dataset
 * PUT /api/datasets/[id] — Update dataset
 * DELETE /api/datasets/[id] — Delete dataset (cascades to images)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { handleDatabaseError, HTTP_STATUS, withApiHandler } from '@/app/utils/apiErrorHandling';

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiHandler('GET /api/datasets/[id]', async (_request: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const { data, error } = await supabaseServer
    .from('datasets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return handleDatabaseError('fetch dataset', error, `GET /api/datasets/${id}`);
  return NextResponse.json(data);
});

export const PUT = withApiHandler('PUT /api/datasets/[id]', async (request: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const body = await request.json();
  const { data, error } = await supabaseServer
    .from('datasets')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return handleDatabaseError('update dataset', error, `PUT /api/datasets/${id}`);
  return NextResponse.json(data);
});

export const DELETE = withApiHandler('DELETE /api/datasets/[id]', async (_request: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const { error } = await supabaseServer
    .from('datasets')
    .delete()
    .eq('id', id);

  if (error) return handleDatabaseError('delete dataset', error, `DELETE /api/datasets/${id}`);
  return NextResponse.json({ success: true }, { status: HTTP_STATUS.OK });
});
