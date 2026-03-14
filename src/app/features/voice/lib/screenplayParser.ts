/**
 * Screenplay Parser — TipTap JSON to ScriptLine[] conversion
 *
 * Parses TipTap screenplay JSON (characterCue, dialogue, action, paragraph,
 * sceneHeading nodes) into an array of ScriptLines with correct
 * character-to-voice mapping.
 */

import type { ScriptLine } from '../types';

// ── TipTap JSON Types ────────────────────────────────────────────────────────

export interface JSONContent {
  type?: string;
  text?: string;
  content?: JSONContent[];
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

let lineCounter = 0;

function generateId(): string {
  lineCounter++;
  return `sl-${Date.now()}-${lineCounter}`;
}

/**
 * Recursively extract all text content from a TipTap node tree.
 */
export function extractText(node: JSONContent): string {
  if (node.text) return node.text;
  if (!node.content) return '';
  return node.content.map(extractText).join('');
}

// ── Core Parser ──────────────────────────────────────────────────────────────

/**
 * Parse TipTap screenplay JSON into an array of ScriptLines.
 *
 * Node mapping:
 * - `characterCue` -> sets current character for following dialogue nodes
 * - `dialogue` -> creates ScriptLine with current character + voice from map
 * - `action` / `paragraph` -> creates NARRATOR ScriptLine
 * - `sceneHeading` -> skipped (not narrated)
 *
 * Characters not in the voice map fall back to the narrator voice ID.
 */
export function parseScreenplayToScriptLines(
  tiptapJson: JSONContent,
  characterVoiceMap: Record<string, string>,
  narratorVoiceId: string,
): ScriptLine[] {
  const lines: ScriptLine[] = [];
  let currentCharacter: string | null = null;

  const nodes = tiptapJson.content ?? [];

  for (const node of nodes) {
    const nodeType = node.type;

    switch (nodeType) {
      case 'characterCue': {
        // Extract character name (uppercase) for following dialogue nodes
        currentCharacter = extractText(node).trim().toUpperCase();
        break;
      }

      case 'dialogue': {
        const text = extractText(node).trim();
        if (!text) break;

        const character = currentCharacter ?? 'NARRATOR';
        const voiceId = characterVoiceMap[character] ?? narratorVoiceId;

        lines.push({
          id: generateId(),
          character,
          voiceId,
          text,
          emotion: '',
          delivery: '',
          status: 'pending',
        });
        break;
      }

      case 'action':
      case 'paragraph': {
        const text = extractText(node).trim();
        if (!text) break;

        lines.push({
          id: generateId(),
          character: 'NARRATOR',
          voiceId: narratorVoiceId,
          text,
          emotion: '',
          delivery: '',
          status: 'pending',
        });
        // Reset current character after action/paragraph block
        currentCharacter = null;
        break;
      }

      case 'sceneHeading': {
        // Scene headings are not narrated -- skip
        currentCharacter = null;
        break;
      }

      default:
        // Unknown node types are ignored
        break;
    }
  }

  return lines;
}

// ── Voice Assignment Detection ───────────────────────────────────────────────

/**
 * Detect character names that appear in characterCue nodes but are
 * not present in the voice map. Returns unique character names.
 */
export function detectUnassignedVoices(
  tiptapJson: JSONContent,
  characterVoiceMap: Record<string, string>,
): string[] {
  const unassigned = new Set<string>();
  const nodes = tiptapJson.content ?? [];

  for (const node of nodes) {
    if (node.type === 'characterCue') {
      const name = extractText(node).trim().toUpperCase();
      if (name && !(name in characterVoiceMap)) {
        unassigned.add(name);
      }
    }
  }

  return Array.from(unassigned);
}
