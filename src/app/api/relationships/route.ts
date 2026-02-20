import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { CharRelationship } from '@/app/types/Character';
import { validateRequiredParams, handleDatabaseError, handleUnexpectedError } from '@/app/utils/apiErrorHandling';

/**
 * GET /api/relationships?characterId=xxx
 * Get all relationships for a character
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const characterId = searchParams.get('characterId');

    const validationError = validateRequiredParams({ characterId }, ['characterId']);
    if (validationError) return validationError;

    const { data, error } = await supabaseServer
      .from('character_relationships')
      .select('*')
      .or(`character_a_id.eq.${characterId},character_b_id.eq.${characterId}`);

    if (error) {
      return handleDatabaseError('fetch relationships', error);
    }

    return NextResponse.json(data as CharRelationship[]);
  } catch (error) {
    return handleUnexpectedError('GET /api/relationships', error);
  }
}

/**
 * POST /api/relationships
 * Create a new character relationship
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { character_a_id, character_b_id, description, relationship_type, act_id, event_date } = body;

    const validationError = validateRequiredParams(
      { character_a_id, character_b_id, description },
      ['character_a_id', 'character_b_id', 'description']
    );
    if (validationError) return validationError;

    const { data, error } = await supabaseServer
      .from('character_relationships')
      .insert({
        character_a_id,
        character_b_id,
        description,
        relationship_type,
        act_id,
        event_date,
      })
      .select()
      .single();

    if (error) {
      return handleDatabaseError('create relationship', error);
    }

    return NextResponse.json(data as CharRelationship, { status: 201 });
  } catch (error) {
    return handleUnexpectedError('POST /api/relationships', error);
  }
}


