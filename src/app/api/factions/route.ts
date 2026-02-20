import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { Faction } from '@/app/types/Faction';
import { validateFactionBrandingColors, validateFactionColor } from '@/app/utils/colorValidation';
import {
  logger,
  handleDatabaseError,
  handleUnexpectedError,
  createErrorResponse,
  validateRequiredParams,
} from '@/app/utils/apiErrorHandling';

/**
 * Validates faction color if provided
 */
function validateColor(color: string | undefined): NextResponse | null {
  if (!color) return null;

  const colorValidation = validateFactionColor(color, {
    required: false,
    fieldName: 'color',
  });

  if (!colorValidation.isValid) {
    return createErrorResponse('Invalid color', 400, colorValidation.error);
  }

  return null;
}

/**
 * Validates and sanitizes branding colors
 */
function validateBranding(branding: any): { error?: NextResponse; sanitized?: any } {
  if (!branding) return {};

  const brandingValidation = validateFactionBrandingColors({
    primary_color: branding.primary_color,
    secondary_color: branding.secondary_color,
    accent_color: branding.accent_color,
  });

  if (!brandingValidation.isValid) {
    const errorMessages = Object.values(brandingValidation.errors).join(', ');
    return {
      error: createErrorResponse(
        'Invalid branding colors',
        400,
        errorMessages
      ),
    };
  }

  return { sanitized: brandingValidation.sanitized };
}

/**
 * GET /api/factions?projectId=xxx
 * Get all factions for a project
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return createErrorResponse('projectId is required', 400);
    }

    const { data, error } = await supabaseServer
      .from('factions')
      .select('*')
      .eq('project_id', projectId)
      .order('name', { ascending: true });

    if (error) {
      return handleDatabaseError('fetch factions', error, 'GET /api/factions');
    }

    return NextResponse.json(data as Faction[]);
  } catch (error) {
    return handleUnexpectedError('GET /api/factions', error);
  }
}

/**
 * POST /api/factions
 * Create a new faction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, project_id, description, color, logo_url, branding } = body;

    // Validate required parameters
    const paramValidation = validateRequiredParams(
      { name, project_id },
      ['name', 'project_id']
    );
    if (paramValidation) return paramValidation;

    // Validate color if provided
    const colorError = validateColor(color);
    if (colorError) return colorError;

    // Validate and sanitize branding colors if provided
    const brandingValidation = validateBranding(branding);
    if (brandingValidation.error) return brandingValidation.error;

    // Use sanitized branding colors if available
    const sanitizedBranding = brandingValidation.sanitized
      ? {
          ...branding,
          primary_color: brandingValidation.sanitized.primary_color,
          secondary_color: brandingValidation.sanitized.secondary_color,
          accent_color: brandingValidation.sanitized.accent_color,
        }
      : branding;

    const { data, error } = await supabaseServer
      .from('factions')
      .insert({
        name,
        project_id,
        description,
        color,
        logo_url,
        branding: sanitizedBranding,
      })
      .select()
      .single();

    if (error) {
      return handleDatabaseError('create faction', error, 'POST /api/factions');
    }

    return NextResponse.json(data as Faction, { status: 201 });
  } catch (error) {
    return handleUnexpectedError('POST /api/factions', error);
  }
}
