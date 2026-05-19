/**
 * Multimodal MCP Tools
 *
 * Provides analyze_image, generate_image, and extract_audio tools
 * that delegate to Gemini via the app's existing API routes.
 * Each tool returns structured data on success or { error: string } on failure.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MultimodalToolInputSchema {
  type: 'object';
  properties: Record<string, { type: string; description: string; enum?: string[]; default?: unknown }>;
  required: string[];
}

export interface MultimodalTool {
  name: string;
  description: string;
  inputSchema: MultimodalToolInputSchema;
  handler: (input: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBaseUrl(): string {
  return process.env.STORY_BASE_URL || 'http://localhost:3000';
}

async function fetchAPI(
  path: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    return { error: `HTTP ${response.status}: ${data.error ?? data.message ?? 'Unknown error'}` };
  }

  return data;
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const analyzeImage: MultimodalTool = {
  name: 'analyze_image',
  description:
    'Analyze an image using Gemini vision. Returns structured analysis of the image content.',
  inputSchema: {
    type: 'object',
    properties: {
      imageUrl: {
        type: 'string',
        description: 'URL of the image to analyze',
      },
      prompt: {
        type: 'string',
        description: 'Analysis prompt (default: "Describe this image in detail")',
      },
    },
    required: ['imageUrl'],
  },
  async handler(input) {
    try {
      const imageUrl = input.imageUrl as string;
      const prompt = (input.prompt as string) ?? 'Describe this image in detail';

      return await fetchAPI('/api/ai/evaluate-image', { imageUrl, prompt });
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },
};

const generateImage: MultimodalTool = {
  name: 'generate_image',
  description:
    'Generate an image using AI. Returns the generated image URL.',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Image generation prompt',
      },
      style: {
        type: 'string',
        description: 'Art style (optional)',
      },
      width: {
        type: 'number',
        description: 'Image width in pixels (default: 1024)',
        default: 1024,
      },
      height: {
        type: 'number',
        description: 'Image height in pixels (default: 1024)',
        default: 1024,
      },
    },
    required: ['prompt'],
  },
  async handler(input) {
    try {
      const prompt = input.prompt as string;
      const style = input.style as string | undefined;
      const width = (input.width as number) ?? 1024;
      const height = (input.height as number) ?? 1024;

      const body: Record<string, unknown> = { prompt, width, height };
      if (style) body.style = style;

      return await fetchAPI('/api/ai/generate-images', body);
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },
};

const extractAudio: MultimodalTool = {
  name: 'extract_audio',
  description:
    'Extract information from audio using Gemini. Supports transcription and description tasks.',
  inputSchema: {
    type: 'object',
    properties: {
      audioUrl: {
        type: 'string',
        description: 'URL of the audio file to process',
      },
      task: {
        type: 'string',
        description: 'Processing task: transcribe or describe',
        enum: ['transcribe', 'describe'],
      },
    },
    required: ['audioUrl', 'task'],
  },
  async handler(input) {
    try {
      const audioUrl = input.audioUrl as string;
      const task = input.task as 'transcribe' | 'describe';

      return await fetchAPI('/api/agents/advisor', { audioUrl, task });
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },
};

// ---------------------------------------------------------------------------
// Registration (for MCP server integration)
// ---------------------------------------------------------------------------

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { textContent, errorContent } from './helpers.js';

/**
 * Register multimodal tools with the MCP server.
 * This bridges the standalone tool definitions into the McpServer.tool() API.
 */
export function registerMultimodalTools(server: McpServer): void {
  server.tool(
    'analyze_image',
    analyzeImage.description,
    {
      imageUrl: z.string().describe('URL of the image to analyze'),
      prompt: z.string().optional().describe('Analysis prompt (default: "Describe this image in detail")'),
    },
    async ({ imageUrl, prompt }) => {
      const result = await analyzeImage.handler({ imageUrl, prompt });
      if (result.error) return errorContent(String(result.error));
      return textContent(JSON.stringify(result, null, 2));
    },
  );

  server.tool(
    'generate_image_multimodal',
    generateImage.description,
    {
      prompt: z.string().describe('Image generation prompt'),
      style: z.string().optional().describe('Art style'),
      width: z.number().optional().describe('Image width (default: 1024)'),
      height: z.number().optional().describe('Image height (default: 1024)'),
    },
    async ({ prompt, style, width, height }) => {
      const result = await generateImage.handler({ prompt, style, width, height });
      if (result.error) return errorContent(String(result.error));
      return textContent(JSON.stringify(result, null, 2));
    },
  );

  server.tool(
    'extract_audio',
    extractAudio.description,
    {
      audioUrl: z.string().describe('URL of the audio file to process'),
      task: z.enum(['transcribe', 'describe']).describe('Processing task'),
    },
    async ({ audioUrl, task }) => {
      const result = await extractAudio.handler({ audioUrl, task });
      if (result.error) return errorContent(String(result.error));
      return textContent(JSON.stringify(result, null, 2));
    },
  );
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const multimodalTools: MultimodalTool[] = [
  analyzeImage,
  generateImage,
  extractAudio,
];
