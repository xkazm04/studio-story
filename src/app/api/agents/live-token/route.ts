/**
 * POST /api/agents/live-token
 *
 * Generates an ephemeral token for the Gemini Live API.
 * The real API key stays server-side; the client gets a
 * short-lived token locked to audio mode with the advisor's
 * system instruction and tools.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Modality, Type, type FunctionDeclaration } from '@google/genai';

// ─── Shared advisor function declarations (same as HTTP advisor) ─────

const VOICE_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'compose_workspace',
    description: 'Rearrange workspace panels for the current user task.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          description: 'show: add panels. hide: remove panels. replace: clear and set new. clear: remove all.',
          enum: ['show', 'hide', 'replace', 'clear'],
        },
        layout: {
          type: Type.STRING,
          description: 'Optional layout preset.',
          enum: ['stack', 'single', 'split-2', 'split-3', 'grid-4', 'primary-sidebar', 'triptych', 'studio'],
        },
        panels: {
          type: Type.STRING,
          description: 'JSON array of panel objects: [{"type":"panel-type","role":"primary|secondary|sidebar"}]. Panel types: scene-editor, scene-metadata, dialogue-view, scene-list, scene-gallery, character-cards, character-detail, character-creator, story-map, beats-manager, story-evaluator, story-graph, script-editor, theme-manager, beats-sidebar, image-canvas, image-generator, art-style, voice-manager, voice-casting, writing-desk, cast-sidebar',
        },
        reasoning: {
          type: Type.STRING,
          description: 'Brief explanation of why these panels were chosen.',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'suggest_action',
    description: 'Send a proactive suggestion to the user as a dismissible card.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        content: {
          type: Type.STRING,
          description: 'The suggestion text (1-3 sentences).',
        },
        compose_on_accept: {
          type: Type.STRING,
          description: 'Optional JSON for a compose_workspace call if user accepts.',
        },
      },
      required: ['content'],
    },
  },
];

const VOICE_SYSTEM_INSTRUCTION = `You are the Voice Advisor for Studio Story. You help users arrange their workspace and manage their storytelling project through voice conversation.

## Available Actions
- Use compose_workspace to show relevant panels based on what the user is working on
- Use suggest_action for proactive suggestions

## Panel Mapping
- Scenes: scene-editor (primary) + scene-list (sidebar)
- Characters: character-detail (primary) + character-cards (sidebar)
- Story structure: story-map (primary) + beats-manager (secondary)
- Images: scene-gallery (primary) + image-canvas (secondary)
- Scripts: script-editor (primary) + dialogue-view (secondary)

## Voice Conversation Rules
- Keep responses short and conversational (1-3 sentences max)
- Be proactive — suggest workspace layouts based on what the user describes
- When the user mentions a task, compose the workspace immediately
- Use natural, friendly tone`;

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

export async function POST(request: NextRequest) {
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

  try {
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
  } catch (error) {
    console.error('[live-token] Token creation failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create ephemeral token' },
      { status: 502 }
    );
  }
}

/** GET — health check */
export async function GET() {
  const client = getClient();
  return NextResponse.json({
    available: !!client,
    service: 'gemini-live-token',
    voices: VALID_VOICES,
  });
}
