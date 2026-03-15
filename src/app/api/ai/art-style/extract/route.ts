/**
 * POST /api/ai/art-style/extract
 * Extract an art style prompt from a reference image using Gemini Vision.
 * Returns a concise style description suitable for image generation prompts.
 *
 * GET /api/ai/art-style/extract
 * Check availability of the extraction service.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGeminiProvider, parseJsonFromGeminiResponse } from '@/app/lib/ai';
import { fetchImageAsDataUrl } from '@/app/lib/ai/image-utils';

const STYLE_EXTRACTION_PROMPT = `You are an expert art director. Analyze this image and extract its visual style.
Focus ONLY on HOW the image is rendered, NOT what it depicts.

Analyze these aspects:
1. Rendering technique (digital painting, pencil sketch, watercolor, cel-shading, etc.)
2. Color palette and harmony (warm/cool, muted/vibrant, specific dominant colors)
3. Lighting approach (rim lighting, chiaroscuro, flat, volumetric, etc.)
4. Texture and detail level (smooth, gritty, crosshatching, clean lines, etc.)
5. Mood and atmosphere (dark, ethereal, gritty, whimsical, etc.)
6. Linework style (bold outlines, no outlines, sketchy, precise, etc.)

Return JSON only:
{
  "stylePrompt": "<A concise prompt (max 400 chars) capturing the art style for image generation>",
  "technique": "<primary rendering technique>",
  "colorPalette": ["<color 1>", "<color 2>", "<color 3>"],
  "mood": "<overall mood>",
  "lighting": "<lighting approach>",
  "detailLevel": "<low/medium/high>",
  "influences": ["<style influence 1>", "<style influence 2>"]
}`;

export async function GET() {
  const gemini = getGeminiProvider();
  return NextResponse.json({
    available: gemini.isAvailable(),
    service: 'gemini-vision',
    model: 'gemini-2.5-flash',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: 'imageUrl is required' }, { status: 400 });
    }

    const gemini = getGeminiProvider();
    if (!gemini.isAvailable()) {
      return NextResponse.json({ success: false, error: 'Gemini API not configured' }, { status: 503 });
    }

    const imageDataUrl = await fetchImageAsDataUrl(imageUrl);

    const visionResponse = await gemini.analyzeImage({
      type: 'vision',
      imageDataUrl,
      prompt: STYLE_EXTRACTION_PROMPT,
      systemInstruction: 'You are an expert art director analyzing visual styles. Respond with valid JSON only.',
      temperature: 0.3,
      maxTokens: 1024,
      metadata: { feature: 'art-style-extraction' },
    });

    const parsed = parseJsonFromGeminiResponse<{
      stylePrompt?: string;
      technique?: string;
      colorPalette?: string[];
      mood?: string;
      lighting?: string;
      detailLevel?: string;
      influences?: string[];
    }>(visionResponse.text);

    return NextResponse.json({
      success: true,
      prompt: parsed.stylePrompt || '',
      technique: parsed.technique,
      colorPalette: parsed.colorPalette,
      mood: parsed.mood,
      lighting: parsed.lighting,
      detailLevel: parsed.detailLevel,
      influences: parsed.influences,
    });
  } catch (error) {
    console.error('Art style extraction error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
