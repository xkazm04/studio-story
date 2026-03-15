/**
 * POST /api/image-extraction/gemini
 * Describe an image using Gemini Vision.
 * Extracts structured data like characters, setting, mood, and composition.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGeminiProvider, parseJsonFromGeminiResponse } from '@/app/lib/ai';
import { fetchImageAsDataUrl } from '@/app/lib/ai/image-utils';

const EXTRACTION_PROMPTS: Record<string, string> = {
  character: `Analyze this image and extract character information. Return JSON only:
{
  "characters": [{ "name": "<if identifiable>", "appearance": "<detailed description>", "clothing": "<outfit details>", "expression": "<facial expression>", "pose": "<body language>" }],
  "artStyle": "<art style description>",
  "mood": "<overall mood>"
}`,
  scene: `Analyze this image and extract scene information. Return JSON only:
{
  "setting": "<location description>",
  "timeOfDay": "<time of day>",
  "weather": "<weather/atmosphere>",
  "lighting": "<lighting description>",
  "mood": "<emotional tone>",
  "keyElements": ["<element 1>", "<element 2>"],
  "composition": "<composition description>",
  "colorPalette": ["<color 1>", "<color 2>"]
}`,
  general: `Analyze this image comprehensively. Return JSON only:
{
  "description": "<overall description>",
  "subjects": ["<subject 1>", "<subject 2>"],
  "setting": "<location/background>",
  "mood": "<emotional tone>",
  "artStyle": "<style description>",
  "colorPalette": ["<dominant color 1>", "<dominant color 2>"],
  "composition": "<composition notes>",
  "quality": "<quality assessment>"
}`,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, type = 'general' } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'imageUrl is required' },
        { status: 400 }
      );
    }

    const gemini = getGeminiProvider();
    if (!gemini.isAvailable()) {
      return NextResponse.json(
        { success: false, error: 'Gemini API not configured' },
        { status: 503 }
      );
    }

    const imageDataUrl = await fetchImageAsDataUrl(imageUrl);
    const prompt = EXTRACTION_PROMPTS[type] || EXTRACTION_PROMPTS.general;

    const visionResponse = await gemini.analyzeImage({
      type: 'vision',
      imageDataUrl,
      prompt,
      systemInstruction: 'You are an expert visual analyst. Always respond with valid JSON only, no markdown or extra text.',
      temperature: 0.3,
      maxTokens: 2048,
      metadata: { feature: 'image-extraction' },
    });

    const parsed = parseJsonFromGeminiResponse<Record<string, unknown>>(visionResponse.text);

    return NextResponse.json({
      success: true,
      data: parsed,
      extractionType: type,
    });
  } catch (error) {
    console.error('Image extraction error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
