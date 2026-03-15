/**
 * GET /api/datasets/[id]/images — List all images in a dataset
 * POST /api/datasets/[id]/images — Add an image to a dataset
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { handleDatabaseError, handleUnexpectedError, validateRequiredParams } from '@/app/utils/apiErrorHandling';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { data, error } = await supabaseServer
      .from('dataset_images')
      .select('*')
      .eq('dataset_id', id)
      .order('created_at', { ascending: false });

    if (error) return handleDatabaseError('fetch dataset images', error, `GET /api/datasets/${id}/images`);
    return NextResponse.json(data);
  } catch (error) {
    return handleUnexpectedError('GET /api/datasets/[id]/images', error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const validation = validateRequiredParams(body, ['image_url']);
    if (validation) return validation;

    const { image_url, internal_id, thumbnail_url, tags, description, prompt, width, height } = body;
    const insertData: Record<string, unknown> = { dataset_id: id, image_url };
    if (internal_id) insertData.internal_id = internal_id;
    if (thumbnail_url) insertData.thumbnail_url = thumbnail_url;
    if (tags) insertData.tags = tags;
    if (description) insertData.description = description;
    if (prompt) insertData.prompt = prompt;
    if (width) insertData.width = width;
    if (height) insertData.height = height;

    const { data, error } = await supabaseServer
      .from('dataset_images')
      .insert(insertData)
      .select()
      .single();

    if (error) return handleDatabaseError('add dataset image', error, `POST /api/datasets/${id}/images`);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleUnexpectedError('POST /api/datasets/[id]/images', error);
  }
}
