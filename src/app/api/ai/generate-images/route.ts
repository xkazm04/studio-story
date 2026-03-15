/**
 * POST /api/ai/generate-images
 * Start image generation for multiple prompts using Leonardo AI
 *
 * GET /api/ai/generate-images?generationId=xxx
 * Check status of a generation
 *
 * DELETE /api/ai/generate-images
 * Delete multiple generations (cleanup)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getLeonardoProvider,
  isLeonardoAvailable,
  checkGenerationStatus,
  deleteGenerations,
} from '@/app/lib/ai';
import type { AIError } from '@/app/lib/ai';

interface GenerateRequest {
  prompts: Array<{ id: string; text: string }>;
  width?: number;
  height?: number;
}

export async function POST(request: NextRequest) {
  try {
    if (!isLeonardoAvailable()) {
      return NextResponse.json(
        { success: false, error: 'Leonardo API key not configured. Set LEONARDO_API_KEY in .env' },
        { status: 503 }
      );
    }

    const body: GenerateRequest = await request.json();
    const { prompts, width = 768, height = 768 } = body;

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'prompts array is required' },
        { status: 400 }
      );
    }

    const leonardo = getLeonardoProvider();

    const generationPromises = prompts.map(async (prompt) => {
      try {
        const result = await leonardo.startGeneration({
          type: 'image-generation',
          prompt: prompt.text,
          width,
          height,
          numImages: 1,
          metadata: { feature: 'generate-images', promptId: prompt.id },
        });
        return {
          promptId: prompt.id,
          generationId: result.generationId,
          status: 'started' as const,
        };
      } catch (error) {
        const err = error as AIError;
        return {
          promptId: prompt.id,
          generationId: '',
          status: 'failed' as const,
          error: err.message || 'Unknown error',
        };
      }
    });

    const generations = await Promise.all(generationPromises);
    return NextResponse.json({ success: true, generations });
  } catch (error) {
    console.error('Generate images error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to start image generation' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const generationId = new URL(request.url).searchParams.get('generationId');
  return checkGenerationStatus(generationId, 'image');
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await deleteGenerations(body.generationIds);
    if (result.error === 'generationIds array is required') {
      return NextResponse.json(result, { status: 400 });
    }
    if (result.error === 'Leonardo API is not configured') {
      return NextResponse.json(result, { status: 503 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Delete generations error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete generations' },
      { status: 500 }
    );
  }
}
