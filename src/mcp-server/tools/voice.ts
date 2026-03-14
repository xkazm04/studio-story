/**
 * Voice Tools — MCP tools for voice/narration operations
 *
 * Follows the trio pattern: generate/check/list/assign
 * Uses HTTP client to call API routes for TTS and voice management.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { StoryHttpClient } from '../http-client.js';
import type { McpConfig } from '../config.js';
import { getDb } from '../db.js';

const textContent = (text: string) => ({ content: [{ type: 'text' as const, text }] });
const errorContent = (text: string) => ({ content: [{ type: 'text' as const, text }], isError: true });

export function registerVoiceTools(server: McpServer, config: McpConfig, client: StoryHttpClient) {
  /**
   * generate_scene_narration — Generate TTS audio for all screenplay lines in a scene
   */
  server.tool(
    'generate_scene_narration',
    'Generate narration audio for all screenplay lines in a scene. Calls TTS for each line with the assigned voice. Returns script lines with audio URLs.',
    {
      scene_id: z.string().describe('Scene ID to generate narration for.'),
      takes_count: z.number().optional().describe('Number of takes per line (default: 1, max: 3).'),
    },
    async ({ scene_id, takes_count }) => {
      try {
        const db = getDb(config);

        // Get scene content
        const { data: scene, error: sceneErr } = await db
          .from('scenes')
          .select('id, name, script, project_id')
          .eq('id', scene_id)
          .single();

        if (sceneErr || !scene) return errorContent(`Scene not found: ${scene_id}`);
        if (!scene.script) return errorContent('Scene has no script content');

        // Get characters with voice assignments for this project
        const { data: characters } = await db
          .from('characters')
          .select('id, name, voice')
          .eq('project_id', scene.project_id);

        // Build voice map
        const voiceMap: Record<string, string> = {};
        for (const char of characters ?? []) {
          if (char.voice) {
            voiceMap[char.name.toUpperCase()] = char.voice;
          }
        }

        // Parse script content (TipTap JSON)
        const scriptJson = typeof scene.script === 'string'
          ? JSON.parse(scene.script)
          : scene.script;
        const nodes = scriptJson?.content ?? [];

        // Extract dialogue lines
        const lines: Array<{ character: string; text: string; voiceId: string }> = [];
        let currentCharacter: string | null = null;

        for (const node of nodes) {
          if (node.type === 'characterCue') {
            currentCharacter = extractText(node).trim().toUpperCase();
          } else if (node.type === 'dialogue') {
            const text = extractText(node).trim();
            if (text) {
              const character = currentCharacter ?? 'NARRATOR';
              lines.push({
                character,
                text,
                voiceId: voiceMap[character] ?? '',
              });
            }
          } else if (node.type === 'action' || node.type === 'paragraph') {
            const text = extractText(node).trim();
            if (text) {
              lines.push({ character: 'NARRATOR', text, voiceId: '' });
              currentCharacter = null;
            }
          }
        }

        if (lines.length === 0) return textContent('No dialogue lines found in scene script.');

        // Generate TTS for each line
        const numTakes = Math.min(takes_count ?? 1, 3);
        const results: Array<{ character: string; text: string; audioUrls: string[] }> = [];

        for (const line of lines) {
          if (!line.voiceId) {
            results.push({ ...line, audioUrls: [] });
            continue;
          }

          const audioUrls: string[] = [];
          for (let t = 0; t < numTakes; t++) {
            try {
              const ttsResult = await client.post('/api/ai/audio/tts', {
                text: line.text,
                voice_id: line.voiceId,
                project_id: scene.project_id,
              });
              if (ttsResult.success && (ttsResult.data as Record<string, unknown>).audioUrl) {
                audioUrls.push((ttsResult.data as Record<string, unknown>).audioUrl as string);
              }
            } catch {
              // Continue on individual TTS failure
            }
          }
          results.push({ ...line, audioUrls });
        }

        return textContent(JSON.stringify({
          scene_id,
          total_lines: lines.length,
          generated: results.filter((r) => r.audioUrls.length > 0).length,
          lines: results,
        }, null, 2));
      } catch (err) {
        return errorContent(`Narration generation failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  );

  /**
   * check_voice_assignments — Check which characters have voice assignments
   */
  server.tool(
    'check_voice_assignments',
    'Check voice assignment status for characters in a scene. Returns list of characters and whether they have a voice assigned.',
    {
      scene_id: z.string().describe('Scene ID to check voice assignments for.'),
    },
    async ({ scene_id }) => {
      try {
        const db = getDb(config);

        // Get scene to find project_id
        const { data: scene, error: sceneErr } = await db
          .from('scenes')
          .select('id, script, project_id')
          .eq('id', scene_id)
          .single();

        if (sceneErr || !scene) return errorContent(`Scene not found: ${scene_id}`);

        // Get characters for this project
        const { data: characters } = await db
          .from('characters')
          .select('id, name, voice')
          .eq('project_id', scene.project_id);

        // Extract character names from script
        const scriptJson = typeof scene.script === 'string'
          ? JSON.parse(scene.script ?? '{}')
          : (scene.script ?? {});
        const nodes = scriptJson?.content ?? [];

        const sceneCharacters = new Set<string>();
        for (const node of nodes) {
          if (node.type === 'characterCue') {
            sceneCharacters.add(extractText(node).trim().toUpperCase());
          }
        }

        // Build assignment status
        const charMap = new Map((characters ?? []).map((c) => [c.name.toUpperCase(), c]));
        const assignments = Array.from(sceneCharacters).map((name) => {
          const char = charMap.get(name);
          return {
            character: name,
            character_id: char?.id ?? null,
            has_voice: !!char?.voice,
            voice_id: char?.voice ?? null,
          };
        });

        return textContent(JSON.stringify({
          scene_id,
          total_characters: assignments.length,
          assigned: assignments.filter((a) => a.has_voice).length,
          unassigned: assignments.filter((a) => !a.has_voice).length,
          characters: assignments,
        }, null, 2));
      } catch (err) {
        return errorContent(`Voice check failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  );

  /**
   * list_voices — List available ElevenLabs voices
   */
  server.tool(
    'list_voices',
    'List all available voices (ElevenLabs premade + cloned). Returns voice IDs and names.',
    {},
    async () => {
      try {
        const result = await client.get('/api/ai/audio/voices');
        if (!result.success) return errorContent(`Failed to list voices: ${result.error}`);
        return textContent(JSON.stringify(result.data, null, 2));
      } catch (err) {
        return errorContent(`Voice listing failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  );

  /**
   * assign_character_voice — Assign a voice to a character
   */
  server.tool(
    'assign_character_voice',
    'Assign an ElevenLabs voice to a character. Updates the character record with the voice ID.',
    {
      character_id: z.string().describe('Character ID to assign voice to.'),
      voice_id: z.string().describe('ElevenLabs voice ID to assign.'),
    },
    async ({ character_id, voice_id }) => {
      try {
        const db = getDb(config);

        const { data, error } = await db
          .from('characters')
          .update({ voice: voice_id })
          .eq('id', character_id)
          .select('id, name, voice')
          .single();

        if (error) return errorContent(`Failed to assign voice: ${error.message}`);

        return textContent(JSON.stringify({
          success: true,
          character_id: data.id,
          character_name: data.name,
          voice_id: data.voice,
        }, null, 2));
      } catch (err) {
        return errorContent(`Voice assignment failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  );
}

/** Extract text from a TipTap node tree */
function extractText(node: Record<string, unknown>): string {
  if (typeof node.text === 'string') return node.text;
  if (!Array.isArray(node.content)) return '';
  return (node.content as Record<string, unknown>[]).map(extractText).join('');
}
