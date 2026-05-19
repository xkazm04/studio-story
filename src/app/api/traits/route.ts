import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { Trait } from '@/app/types/Character';
import { validateRequiredParams, handleDatabaseError, withApiHandler } from '@/app/utils/apiErrorHandling';

/**
 * GET /api/traits?characterId=xxx
 * Get all traits for a character
 */
export const GET = withApiHandler('GET /api/traits', async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const characterId = searchParams.get('characterId');

  const validationError = validateRequiredParams({ characterId }, ['characterId']);
  if (validationError) return validationError;

  const { data, error } = await supabaseServer
    .from('traits')
    .select('*')
    .eq('character_id', characterId);

  if (error) {
    return handleDatabaseError('fetch traits', error);
  }

  return NextResponse.json(data as Trait[]);
});

/**
 * POST /api/traits
 * Create a new trait
 */
export const POST = withApiHandler('POST /api/traits', async (request: NextRequest) => {
  const body = await request.json();
  const { character_id, type, description } = body;

  const validationError = validateRequiredParams(
    { character_id, type, description },
    ['character_id', 'type', 'description']
  );
  if (validationError) return validationError;

  const { data, error } = await supabaseServer
    .from('traits')
    .insert({
      character_id,
      type,
      description,
    })
    .select()
    .single();

  if (error) {
    return handleDatabaseError('create trait', error);
  }

  return NextResponse.json(data as Trait, { status: 201 });
});
