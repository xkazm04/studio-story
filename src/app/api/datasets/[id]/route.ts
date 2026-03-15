/**
 * GET /api/datasets/[id] — Get single dataset
 * PUT /api/datasets/[id] — Update dataset
 * DELETE /api/datasets/[id] — Delete dataset (cascades to images)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { handleDatabaseError, handleUnexpectedError, HTTP_STATUS } from '@/app/utils/apiErrorHandling';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { data, error } = await supabaseServer
      .from('datasets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return handleDatabaseError('fetch dataset', error, `GET /api/datasets/${id}`);
    return NextResponse.json(data);
  } catch (error) {
    return handleUnexpectedError('GET /api/datasets/[id]', error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
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
  } catch (error) {
    return handleUnexpectedError('PUT /api/datasets/[id]', error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { error } = await supabaseServer
      .from('datasets')
      .delete()
      .eq('id', id);

    if (error) return handleDatabaseError('delete dataset', error, `DELETE /api/datasets/${id}`);
    return NextResponse.json({ success: true }, { status: HTTP_STATUS.OK });
  } catch (error) {
    return handleUnexpectedError('DELETE /api/datasets/[id]', error);
  }
}
