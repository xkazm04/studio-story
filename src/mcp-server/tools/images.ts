/**
 * Image Tools — wrappers for image generation and evaluation APIs
 * These remain as API calls (not CLI-native) because they require vision models or async polling.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { StoryHttpClient } from '../http-client.js';
import { textContent, errorContent } from './helpers.js';

export function registerImageTools(server: McpServer, client: StoryHttpClient) {
  server.tool(
    'generate_image_gemini',
    'Generate or transform an image using Gemini. Requires a source image URL and a prompt describing the desired result. Returns a base64 image data URL.',
    {
      prompt: z.string().describe('Image generation/transformation prompt.'),
      sourceImageUrl: z.string().describe('Source image URL to transform.'),
      aspectRatio: z.enum(['16:9', '9:16', '1:1', '4:3', '3:4']).optional().describe('Output aspect ratio. Default: 16:9.'),
      mode: z.enum(['transform', 'overlay']).optional().describe('transform: redesign completely. overlay: add elements preserving original. Default: transform.'),
    },
    async ({ prompt, sourceImageUrl, aspectRatio, mode }) => {
      const body: Record<string, unknown> = { prompt, sourceImageUrl };
      if (aspectRatio) body.aspectRatio = aspectRatio;
      if (mode) body.mode = mode;

      const result = await client.post('/api/ai/gemini', body);
      if (!result.success) return errorContent(`Gemini image gen failed: ${result.error}`);

      const data = result.data as Record<string, unknown>;
      if (data.imageUrl) {
        const urlStr = data.imageUrl as string;
        // Return truncated URL for display (full base64 is too large for text)
        return textContent(`Image generated successfully.\nURL length: ${urlStr.length} chars\nFirst 100 chars: ${urlStr.slice(0, 100)}...`);
      }
      return textContent(JSON.stringify(data, null, 2));
    }
  );

  server.tool(
    'generate_image_leonardo',
    'Generate images via Leonardo AI. Async operation — returns generationId for polling. Supports multiple prompts in one call.',
    {
      prompts: z.array(z.object({
        id: z.string().describe('Unique prompt ID for tracking.'),
        text: z.string().describe('Image generation prompt text.'),
      })).describe('Array of prompts to generate images for.'),
      width: z.number().optional().describe('Image width in pixels. Default: 768.'),
      height: z.number().optional().describe('Image height in pixels. Default: 768.'),
    },
    async ({ prompts, width, height }) => {
      const body: Record<string, unknown> = { prompts };
      if (width) body.width = width;
      if (height) body.height = height;

      const result = await client.post('/api/ai/generate-images', body);
      if (!result.success) return errorContent(`Leonardo image gen failed: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  server.tool(
    'evaluate_image',
    'Evaluate an image against a prompt using Gemini vision. Returns quality score (0-100), approval status, and feedback.',
    {
      imageUrl: z.string().describe('URL of the image to evaluate.'),
      promptId: z.string().describe('ID of the prompt that generated this image.'),
      originalPrompt: z.string().describe('The original prompt used to generate the image.'),
    },
    async ({ imageUrl, promptId, originalPrompt }) => {
      const result = await client.post('/api/ai/evaluate-image', {
        imageUrl,
        promptId,
        criteria: { originalPrompt },
      });
      if (!result.success) return errorContent(`Image evaluation failed: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  server.tool(
    'describe_image',
    'Describe an image using Gemini vision. Extracts structured data like characters, setting, mood, and composition.',
    {
      imageUrl: z.string().describe('URL of the image to describe.'),
      extractionType: z.enum(['character', 'scene', 'general']).optional().describe('What type of data to extract. Default: general.'),
    },
    async ({ imageUrl, extractionType }) => {
      const params: Record<string, string> = {};
      if (extractionType) params.type = extractionType;

      const result = await client.post('/api/image-extraction/gemini', {
        imageUrl,
        ...params,
      });
      if (!result.success) return errorContent(`Image description failed: ${result.error}`);

      return textContent(JSON.stringify(result.data, null, 2));
    }
  );

  // ============================================================================
  // Scene Illustration Pipeline Tools
  // ============================================================================

  server.tool(
    'generate_scene_illustration',
    'Generate 4 illustration alternatives for a scene. Uses scene context (characters, location, mood) to auto-draft a prompt, applies project art style and character reference images for visual consistency. Returns a generationId for polling status.',
    {
      sceneId: z.string().describe('ID of the scene to illustrate.'),
      promptOverride: z.string().optional().describe('Optional custom prompt to use instead of auto-generated one.'),
    },
    async ({ sceneId, promptOverride }) => {
      const body: Record<string, unknown> = {};
      if (promptOverride) body.promptOverride = promptOverride;

      const result = await client.post(`/api/scenes/${sceneId}/illustrate`, body);
      if (!result.success) return errorContent(`Scene illustration failed: ${result.error}`);

      const data = result.data as Record<string, unknown>;
      const lines = [
        `Scene illustration started.`,
        `Generation ID: ${data.generationId}`,
        `Prompt: ${data.prompt}`,
        `Controlnets used: ${data.controlnetsUsed}`,
        `Character refs: ${data.characterRefsUsed}`,
        `Style ref: ${data.hasStyleRef ? 'yes' : 'no'}`,
        ``,
        `Use check_illustration_status to poll for completion.`,
      ];
      return textContent(lines.join('\n'));
    }
  );

  server.tool(
    'check_illustration_status',
    'Check the status of a scene illustration generation. Returns pending, complete (with image URLs), or failed.',
    {
      sceneId: z.string().describe('ID of the scene being illustrated.'),
      generationId: z.string().describe('Generation ID returned by generate_scene_illustration.'),
    },
    async ({ sceneId, generationId }) => {
      const result = await client.get(`/api/scenes/${sceneId}/illustrate`, { generationId });
      if (!result.success) return errorContent(`Status check failed: ${result.error}`);

      const data = result.data as Record<string, unknown>;
      if (data.status === 'complete' && Array.isArray(data.images)) {
        const images = data.images as Array<{ id: string; url: string }>;
        const lines = [
          `Generation complete! ${images.length} images available.`,
          ``,
          ...images.map((img, i) => `Image ${i + 1}: ${img.url}`),
          ``,
          `Use save_scene_illustration with one of the image URLs to persist it.`,
        ];
        return textContent(lines.join('\n'));
      }

      return textContent(JSON.stringify(data, null, 2));
    }
  );

  server.tool(
    'save_scene_illustration',
    'Save a selected illustration as the scene\'s image. Downloads from CDN, uploads to permanent storage, and updates the scene record.',
    {
      sceneId: z.string().describe('ID of the scene to save the illustration for.'),
      imageUrl: z.string().describe('URL of the selected image from the generation results.'),
      generationId: z.string().describe('Generation ID for tracking.'),
    },
    async ({ sceneId, imageUrl, generationId }) => {
      const result = await client.put(`/api/scenes/${sceneId}/illustrate`, { imageUrl, generationId });
      if (!result.success) return errorContent(`Save illustration failed: ${result.error}`);

      const data = result.data as Record<string, unknown>;
      return textContent(`Illustration saved successfully.\nPermanent URL: ${data.permanentUrl}\nScene: ${data.sceneId}`);
    }
  );
}
