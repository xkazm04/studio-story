/**
 * POST /api/ai/evaluate-image
 * Evaluate a generated image against its original prompt using Gemini Vision.
 * Returns quality score (0-100), approval status, and feedback.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGeminiProvider, parseJsonFromGeminiResponse } from '@/app/lib/ai';
import { fetchImageAsDataUrl } from '@/app/lib/ai/image-utils';

interface EvaluateRequest {
  imageUrl: string;
  promptId: string;
  criteria: {
    originalPrompt: string;
    approvalThreshold?: number;
  };
}

interface ImageEvaluation {
  promptId: string;
  approved: boolean;
  score: number;
  feedback?: string;
  improvements?: string[];
  strengths?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: EvaluateRequest = await request.json();
    const { imageUrl, promptId, criteria } = body;

    if (!imageUrl || !promptId || !criteria?.originalPrompt) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: imageUrl, promptId, criteria.originalPrompt' },
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

    const evaluationPrompt = `Evaluate this image against the generation prompt below. Return JSON only.

PROMPT: "${criteria.originalPrompt}"

Evaluate on:
1. Prompt adherence (does it match what was asked?)
2. Technical quality (composition, lighting, detail)
3. Artistic quality (style consistency, appeal)

Return this exact JSON structure:
{
  "score": <0-100>,
  "feedback": "<brief overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "technicalScore": <0-100>,
  "modeCompliance": <true/false>
}`;

    const visionResponse = await gemini.analyzeImage({
      type: 'vision',
      imageDataUrl,
      prompt: evaluationPrompt,
      systemInstruction: 'You are an expert image quality evaluator. Always respond with valid JSON only, no markdown or extra text.',
      temperature: 0.3,
      maxTokens: 2048,
      metadata: { feature: 'image-evaluation' },
    });

    const parsed = parseJsonFromGeminiResponse<{
      score?: number;
      feedback?: string;
      improvements?: string[];
      strengths?: string[];
      technicalScore?: number;
      modeCompliance?: boolean;
    }>(visionResponse.text);

    const score = typeof parsed.score === 'number' ? parsed.score : 50;
    const threshold = criteria.approvalThreshold ?? 70;
    const approved = score >= threshold && parsed.modeCompliance !== false;

    const evaluation: ImageEvaluation = {
      promptId,
      approved,
      score,
      feedback: parsed.feedback,
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : undefined,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : undefined,
    };

    return NextResponse.json({ success: true, evaluation });
  } catch (error) {
    console.error('Image evaluation error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
