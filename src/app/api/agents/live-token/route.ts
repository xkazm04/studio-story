/**
 * POST /api/agents/live-token
 *
 * Generates an ephemeral token for the Gemini Live API.
 * The real API key stays server-side; the client gets a
 * short-lived token locked to audio mode with the advisor's
 * system instruction and tools.
 *
 * Tool declarations and system instruction are derived from the
 * shared canonical schema (advisorToolSchema.ts) and composable
 * segments (advisorSystemInstruction.ts) — no local duplicates.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Modality, type FunctionDeclaration } from '@google/genai';
import { withApiHandler } from '@/app/utils/apiErrorHandling';
import {
  getClientTools,
  toGeminiSDKDeclarations,
  toSystemInstructionToolDocs,
} from '@/agents/advisorToolSchema';
import { buildVoiceSystemInstruction } from '@/agents/advisorSystemInstruction';

// ─── Tool declarations & system instruction (from shared canonical schema) ───

const CLIENT_TOOLS = getClientTools();

const VOICE_FUNCTION_DECLARATIONS = toGeminiSDKDeclarations(
  CLIENT_TOOLS,
) as FunctionDeclaration[];

const VOICE_SYSTEM_INSTRUCTION = buildVoiceSystemInstruction(
  toSystemInstructionToolDocs(CLIENT_TOOLS),
);

// ─── Voices ──────────────────────────────────────

const VALID_VOICES = ['Aoede', 'Charon', 'Fenrir', 'Kore', 'Puck'] as const;
type VoiceName = typeof VALID_VOICES[number];

// ─── Route ───────────────────────────────────────

let cachedClient: InstanceType<typeof GoogleGenAI> | null = null;

function getClient(): InstanceType<typeof GoogleGenAI> | null {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return null;
  cachedClient = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: 'v1alpha' } });
  return cachedClient;
}

export const POST = withApiHandler('POST /api/agents/live-token', async (request: NextRequest) => {
  const client = getClient();
  if (!client) {
    return NextResponse.json(
      { error: 'Gemini API key not configured. Set GEMINI_API_KEY in .env.local.' },
      { status: 503 }
    );
  }

  let voice: VoiceName = 'Puck';
  try {
    const body = await request.json();
    if (body.voice && VALID_VOICES.includes(body.voice)) {
      voice = body.voice;
    }
  } catch {
    // Default voice if no body
  }

  const expireAtIso = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const token = await client.authTokens.create({
    config: {
      uses: 20,
      expireTime: expireAtIso,
      newSessionExpireTime: expireAtIso,
      httpOptions: { apiVersion: 'v1alpha' },
      liveConnectConstraints: {
        model: 'gemini-2.0-flash-live-001',
        config: {
          responseModalities: [Modality.AUDIO, Modality.TEXT],
          systemInstruction: VOICE_SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: VOICE_FUNCTION_DECLARATIONS }],
          inputAudioTranscription: {},
          automaticActivityDetection: {
            disabled: false,
          },
          temperature: 0.7,
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice,
              },
            },
          },
        },
      },
    },
  });

  return NextResponse.json({
    token: token.name,
    voice,
    model: 'gemini-2.0-flash-live-001',
    expiresIn: 30 * 60, // seconds
    expiresAt: expireAtIso,
  });
});

/** GET — health check */
export async function GET() {
  const client = getClient();
  return NextResponse.json({
    available: !!client,
    service: 'gemini-live-token',
    voices: VALID_VOICES,
  });
}
