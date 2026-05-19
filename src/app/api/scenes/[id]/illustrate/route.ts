/**
 * Scene Illustration API Endpoint
 *
 * Orchestrates the full scene illustration pipeline:
 * - POST: Parse scene, assemble prompt, upload refs, generate 4 images
 * - GET:  Poll generation status and retrieve image URLs
 * - PUT:  Persist selected image to Supabase Storage and update scene record
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { withApiHandler, HTTP_STATUS, createErrorResponse, handleDatabaseError } from '@/app/utils/apiErrorHandling';
import { sceneParser } from '@/lib/image';
import { assembleIllustrationPrompt, buildControlnets } from '@/app/lib/ai/prompt-assembly';
import { getLeonardoProvider } from '@/app/lib/ai/providers/leonardo';
import { uploadToStorage } from '@/lib/supabase/storage';
import type { Scene } from '@/app/types/Scene';
import type { Character } from '@/app/types/Character';
import type { Project } from '@/app/types/Project';

// ============================================================================
// POST /api/scenes/[id]/illustrate
// Start scene illustration generation
// ============================================================================

export const POST = withApiHandler('POST /api/scenes/[id]/illustrate', async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
    const { id: sceneId } = await context.params;

    // 1. Fetch the scene
    const { data: scene, error: sceneError } = await supabaseServer
      .from('scenes')
      .select('*')
      .eq('id', sceneId)
      .single();

    if (sceneError || !scene) {
      return handleDatabaseError('fetch scene for illustration', sceneError || new Error('Scene not found'));
    }

    const typedScene = scene as Scene;

    // 2. Fetch the project (for art style settings)
    const { data: project, error: projectError } = await supabaseServer
      .from('projects')
      .select('*')
      .eq('id', typedScene.project_id)
      .single();

    if (projectError || !project) {
      return handleDatabaseError('fetch project for illustration', projectError || new Error('Project not found'));
    }

    const typedProject = project as Project;

    // 3. Fetch characters for this project (for reference images)
    const { data: characters, error: charsError } = await supabaseServer
      .from('characters')
      .select('*')
      .eq('project_id', typedScene.project_id);

    if (charsError) {
      return handleDatabaseError('fetch characters for illustration', charsError);
    }

    const typedCharacters = (characters || []) as Character[];

    // 4. Parse the scene context
    const parsedContext = sceneParser.parseScene(typedScene, typedCharacters);

    // 5. Assemble the prompt
    const assembledPrompt = assembleIllustrationPrompt({
      scene: parsedContext,
      artStylePrompt: typedProject.customArtStylePrompt || null,
    });

    // 6. Upload character reference images to Leonardo
    const leonardo = getLeonardoProvider();
    const characterRefIds: Array<{ leonardoImageId: string }> = [];

    for (const char of typedCharacters) {
      if (!char.avatar_url) continue;
      // Limit to 2 character refs (buildControlnets also enforces this)
      if (characterRefIds.length >= 2) break;

      try {
        // Download the avatar image
        const imgResponse = await fetch(char.avatar_url);
        if (!imgResponse.ok) continue;

        const buffer = Buffer.from(await imgResponse.arrayBuffer());
        const extension = char.avatar_url.endsWith('.png') ? 'png' : 'jpg';
        const leonardoImageId = await leonardo.uploadInitImage(buffer, extension);
        characterRefIds.push({ leonardoImageId });
      } catch (err) {
        console.warn(`[Illustrate] Failed to upload character ref for ${char.name}:`, err);
        // Continue without this ref -- non-blocking
      }
    }

    // 7. Upload style reference image if available
    let styleRefId: string | undefined;
    if (typedProject.extractedStyleImageUrl) {
      try {
        const styleResponse = await fetch(typedProject.extractedStyleImageUrl);
        if (styleResponse.ok) {
          const buffer = Buffer.from(await styleResponse.arrayBuffer());
          const extension = typedProject.extractedStyleImageUrl.endsWith('.png') ? 'png' : 'jpg';
          styleRefId = await leonardo.uploadInitImage(buffer, extension);
        }
      } catch (err) {
        console.warn('[Illustrate] Failed to upload style reference:', err);
        // Continue without style ref -- non-blocking
      }
    }

    // 8. Build controlnets array
    const controlnets = buildControlnets({ characterRefIds, styleRefId });

    // 9. Start generation (4 images)
    const { generationId } = await leonardo.generateSceneIllustration(
      assembledPrompt,
      1024,
      768,
      controlnets
    );

    // 10. Return generation info
    return NextResponse.json({
      success: true,
      generationId,
      prompt: assembledPrompt,
      controlnetsUsed: controlnets.length,
      characterRefsUsed: characterRefIds.length,
      hasStyleRef: !!styleRefId,
    });
});

// ============================================================================
// GET /api/scenes/[id]/illustrate?generationId=xxx
// Poll generation status
// ============================================================================

export const GET = withApiHandler('GET /api/scenes/[id]/illustrate', async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
    const { id: sceneId } = await context.params;
    const { searchParams } = new URL(request.url);
    const generationId = searchParams.get('generationId');

    if (!generationId) {
      return createErrorResponse(
        'Missing generationId query parameter',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const leonardo = getLeonardoProvider();
    const result = await leonardo.checkGeneration(generationId);

    return NextResponse.json({
      sceneId,
      generationId,
      status: result.status,
      images: result.images || [],
      error: result.error,
    });
});

// ============================================================================
// PUT /api/scenes/[id]/illustrate
// Persist selected image to Supabase Storage and update scene record
// ============================================================================

export const PUT = withApiHandler('PUT /api/scenes/[id]/illustrate', async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
    const { id: sceneId } = await context.params;
    const body = await request.json();
    const { imageUrl, generationId } = body;

    if (!imageUrl) {
      return createErrorResponse(
        'Missing imageUrl in request body',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // 1. Fetch the scene to get project_id
    const { data: scene, error: sceneError } = await supabaseServer
      .from('scenes')
      .select('project_id, image_prompt')
      .eq('id', sceneId)
      .single();

    if (sceneError || !scene) {
      return handleDatabaseError('fetch scene for image persist', sceneError || new Error('Scene not found'));
    }

    // 2. Download the image from Leonardo CDN
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) {
      return createErrorResponse(
        'Failed to download image from CDN',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        `CDN returned ${imgResponse.status}`
      );
    }

    const buffer = Buffer.from(await imgResponse.arrayBuffer());
    const timestamp = Date.now();
    const storagePath = `illustrations/${scene.project_id}/${sceneId}/${timestamp}.jpg`;

    // 3. Upload to Supabase Storage
    const permanentUrl = await uploadToStorage(
      'illustrations',
      `${scene.project_id}/${sceneId}/${timestamp}.jpg`,
      buffer,
      'image/jpeg'
    );

    // 4. Update scene record with permanent URL and prompt
    const updatePayload: Record<string, unknown> = {
      image_url: permanentUrl,
    };

    // Optionally store the generation info
    if (generationId) {
      updatePayload.image_description = `Generated via Leonardo AI (generation: ${generationId})`;
    }

    const { data: updatedScene, error: updateError } = await supabaseServer
      .from('scenes')
      .update(updatePayload)
      .eq('id', sceneId)
      .select()
      .single();

    if (updateError) {
      return handleDatabaseError('update scene with illustration', updateError);
    }

    return NextResponse.json({
      success: true,
      permanentUrl,
      sceneId,
      storagePath,
    });
});
