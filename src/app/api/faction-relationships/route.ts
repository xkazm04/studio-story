import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { FactionRelationship } from '@/app/types/Faction';
import {
  handleDatabaseError,
  createErrorResponse,
  validateRequiredParams,
  HTTP_STATUS,
  withApiHandler,
} from '@/app/utils/apiErrorHandling';

/**
 * GET /api/faction-relationships?factionId=xxx
 * Get all relationships for a faction
 */
export const GET = withApiHandler('GET /api/faction-relationships', async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const factionId = searchParams.get('factionId');

  if (!factionId) {
    return createErrorResponse('factionId is required', 400);
  }

  const { data, error } = await supabaseServer
    .from('faction_relationships')
    .select('*')
    .or(`faction_a_id.eq.${factionId},faction_b_id.eq.${factionId}`);

  if (error) {
    return handleDatabaseError('fetch faction relationships', error, 'GET /api/faction-relationships');
  }

  return NextResponse.json(data as FactionRelationship[]);
});

/**
 * POST /api/faction-relationships
 * Create a new faction relationship
 */
export const POST = withApiHandler('POST /api/faction-relationships', async (request: NextRequest) => {
  const body = await request.json();
  const { faction_a_id, faction_b_id, description, relationship_type } = body;

  // Validate required parameters
  const paramValidation = validateRequiredParams(
    { faction_a_id, faction_b_id, description },
    ['faction_a_id', 'faction_b_id', 'description']
  );
  if (paramValidation) return paramValidation;

  const { data, error } = await supabaseServer
    .from('faction_relationships')
    .insert({
      faction_a_id,
      faction_b_id,
      description,
      relationship_type,
    })
    .select()
    .single();

  if (error) {
    return handleDatabaseError('create faction relationship', error, 'POST /api/faction-relationships');
  }

  return NextResponse.json(data as FactionRelationship, { status: HTTP_STATUS.CREATED });
});
