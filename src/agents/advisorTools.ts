/**
 * Advisor Tool Declarations — Function declarations for Gemini Live agent.
 *
 * These are the tools (functions) that Gemini can call during the live session.
 * They mirror the MCP workspace tools but are formatted as Gemini function declarations.
 *
 * Tool schemas are defined once in advisorToolSchema.ts and projected here
 * via toGeminiLiveDeclarations(). Only client-side tools are exposed to Live.
 */

import type { GeminiToolDeclaration } from './types';
import {
  getClientTools,
  toGeminiLiveDeclarations,
  toSystemInstructionToolDocs,
} from './advisorToolSchema';
import { buildVoiceSystemInstruction } from './advisorSystemInstruction';

const CLIENT_TOOLS = getClientTools();

export const ADVISOR_TOOLS: GeminiToolDeclaration[] = toGeminiLiveDeclarations(CLIENT_TOOLS);

/**
 * System instruction for the Gemini Live advisor agent.
 * Injected into the WebSocket setup message.
 * Built from shared composable segments in advisorSystemInstruction.ts.
 */
export const ADVISOR_SYSTEM_INSTRUCTION = buildVoiceSystemInstruction(
  toSystemInstructionToolDocs(CLIENT_TOOLS),
);
