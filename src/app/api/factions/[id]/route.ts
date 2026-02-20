import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { Faction } from '@/app/types/Faction';
import { validateFactionBrandingColors, validateFactionColor } from '@/app/utils/colorValidation';
import { logger } from '@/app/utils/logger';
import { createErrorResponse, HTTP_STATUS } from '@/app/utils/apiErrorHandling';

/**
 * Fetches a faction by ID from the database
 */
async function fetchFaction(id: string) {
  const { data, error } = await supabaseServer
    .from('factions')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}

/**
 * Updates a faction in the database
 */
async function updateFaction(id: string, body: Partial<Faction>) {
  const { data, error } = await supabaseServer
    .from('factions')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

/**
 * Deletes a faction from the database
 */
async function deleteFaction(id: string) {
  const { error } = await supabaseServer
    .from('factions')
    .delete()
    .eq('id', id);

  return { error };
}

/**
 * Fetches related data counts for a faction
 */
async function fetchRelatedDataCounts(id: string) {
  return Promise.all([
    supabaseServer.from('faction_lore').select('id', { count: 'exact', head: true }).eq('faction_id', id),
    supabaseServer.from('faction_events').select('id', { count: 'exact', head: true }).eq('faction_id', id),
    supabaseServer.from('faction_achievements').select('id', { count: 'exact', head: true }).eq('faction_id', id),
    supabaseServer.from('faction_media').select('id', { count: 'exact', head: true }).eq('faction_id', id),
    supabaseServer.from('faction_relationships').select('id', { count: 'exact', head: true }).or(`faction_a_id.eq.${id},faction_b_id.eq.${id}`),
    supabaseServer.from('characters').select('id', { count: 'exact', head: true }).eq('faction_id', id),
  ]);
}

/**
 * GET /api/factions/[id]
 * Get a single faction by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const { data, error } = await fetchFaction(id);

    if (error) {
      logger.error('Error fetching faction', error, { id });
      return createErrorResponse('Faction not found', HTTP_STATUS.NOT_FOUND);
    }

    return NextResponse.json(data as Faction);
  } catch (error) {
    logger.error('Unexpected error in GET /api/factions/[id]', error);
    return createErrorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * PUT /api/factions/[id]
 * Update a faction
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Validate color if provided
    if (body.color) {
      const colorValidation = validateFactionColor(body.color, {
        required: false,
        fieldName: 'color',
      });
      if (!colorValidation.isValid) {
        return createErrorResponse(colorValidation.error || 'Invalid color', HTTP_STATUS.BAD_REQUEST);
      }
    }

    // Validate branding colors if provided
    if (body.branding) {
      const brandingValidation = validateFactionBrandingColors({
        primary_color: body.branding.primary_color,
        secondary_color: body.branding.secondary_color,
        accent_color: body.branding.accent_color,
      });

      if (!brandingValidation.isValid) {
        const errorMessages = Object.values(brandingValidation.errors).join(', ');
        return createErrorResponse(`Invalid branding colors: ${errorMessages}`, HTTP_STATUS.BAD_REQUEST);
      }

      // Use sanitized colors
      body.branding.primary_color = brandingValidation.sanitized.primary_color;
      body.branding.secondary_color = brandingValidation.sanitized.secondary_color;
      body.branding.accent_color = brandingValidation.sanitized.accent_color;
    }

    const { data, error } = await updateFaction(id, body);

    if (error) {
      logger.error('Error updating faction', error, { id });
      return createErrorResponse('Failed to update faction', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return NextResponse.json(data as Faction);
  } catch (error) {
    logger.error('Unexpected error in PUT /api/factions/[id]', error);
    return createErrorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * DELETE /api/factions/[id]
 * Delete a faction and all related data
 *
 * Related data deleted via ON DELETE CASCADE:
 * - faction_lore
 * - faction_events
 * - faction_achievements
 * - faction_media
 * - faction_relationships (where faction is either faction_a or faction_b)
 *
 * Characters linked to this faction will have their faction_id set to NULL
 * (ON DELETE SET NULL constraint)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Verify faction exists before attempting delete
    const { data: faction, error: fetchError } = await fetchFaction(id);

    if (fetchError || !faction) {
      logger.error('Faction not found', fetchError, { id });
      return createErrorResponse('Faction not found', HTTP_STATUS.NOT_FOUND);
    }

    // Log counts of related data before deletion (for audit/debugging)
    const relatedCounts = await fetchRelatedDataCounts(id);

    logger.info(`Deleting faction "${faction.name}" (${id})`, {
      lore: relatedCounts[0].count || 0,
      events: relatedCounts[1].count || 0,
      achievements: relatedCounts[2].count || 0,
      media: relatedCounts[3].count || 0,
      relationships: relatedCounts[4].count || 0,
      affectedCharacters: relatedCounts[5].count || 0,
    });

    // Delete the faction - ON DELETE CASCADE will handle all related data
    // This is a single atomic operation in PostgreSQL
    const { error: deleteError } = await deleteFaction(id);

    if (deleteError) {
      logger.error('Error deleting faction', deleteError, { id });
      return createErrorResponse('Failed to delete faction', HTTP_STATUS.INTERNAL_SERVER_ERROR, deleteError.message);
    }

    logger.info(`Successfully deleted faction "${faction.name}" (${id}) and all related data`);

    return NextResponse.json({
      success: true,
      message: 'Faction and all related data deleted successfully',
      deletedFaction: {
        id: faction.id,
        name: faction.name,
      },
    }, { status: HTTP_STATUS.OK });
  } catch (error) {
    logger.error('Unexpected error in DELETE /api/factions/[id]', error);
    return createErrorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}
