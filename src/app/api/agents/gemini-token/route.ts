/**
 * Gemini Token API Route
 *
 * Returns the Gemini API key from server environment.
 * This keeps the key server-side and lets the client
 * establish a direct WebSocket to Gemini Live.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Gemini API key not configured' },
      { status: 503 }
    );
  }

  return NextResponse.json({ apiKey });
}
