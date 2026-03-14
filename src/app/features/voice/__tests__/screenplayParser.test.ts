/**
 * Screenplay Parser & Audio Stitcher Tests
 *
 * Tests TipTap JSON -> ScriptLine[] conversion with character-to-voice mapping,
 * plus gap computation for audio stitching.
 */

import { describe, it, expect } from 'vitest';
import {
  parseScreenplayToScriptLines,
  extractText,
  detectUnassignedVoices,
} from '../lib/screenplayParser';
import { computeGaps, GAP_SAME_CHARACTER, GAP_CHAR_CHANGE } from '../lib/audioStitcher';
import type { ScriptLine } from '../types';

// ── Test Fixtures ────────────────────────────────────────────────────────────

const characterVoiceMap: Record<string, string> = {
  ALICE: 'voice-alice-001',
  BOB: 'voice-bob-002',
};

const narratorVoiceId = 'voice-narrator-000';

function makeTiptapDoc(...nodes: unknown[]) {
  return { type: 'doc', content: nodes };
}

function characterCue(name: string) {
  return {
    type: 'characterCue',
    content: [{ type: 'text', text: name }],
  };
}

function dialogue(text: string) {
  return {
    type: 'dialogue',
    content: [{ type: 'text', text }],
  };
}

function action(text: string) {
  return {
    type: 'action',
    content: [{ type: 'text', text }],
  };
}

function paragraph(text: string) {
  return {
    type: 'paragraph',
    content: [{ type: 'text', text }],
  };
}

function sceneHeading(text: string) {
  return {
    type: 'sceneHeading',
    content: [{ type: 'text', text }],
  };
}

// ── parseScreenplayToScriptLines ─────────────────────────────────────────────

describe('parseScreenplayToScriptLines', () => {
  it('characterCue followed by dialogue produces ScriptLine with correct character and voiceId', () => {
    const doc = makeTiptapDoc(
      characterCue('ALICE'),
      dialogue('Hello, how are you?'),
    );

    const lines = parseScreenplayToScriptLines(doc, characterVoiceMap, narratorVoiceId);

    expect(lines).toHaveLength(1);
    expect(lines[0].character).toBe('ALICE');
    expect(lines[0].voiceId).toBe('voice-alice-001');
    expect(lines[0].text).toBe('Hello, how are you?');
    expect(lines[0].status).toBe('pending');
  });

  it('action node produces NARRATOR ScriptLine', () => {
    const doc = makeTiptapDoc(
      action('The door slams shut.'),
    );

    const lines = parseScreenplayToScriptLines(doc, characterVoiceMap, narratorVoiceId);

    expect(lines).toHaveLength(1);
    expect(lines[0].character).toBe('NARRATOR');
    expect(lines[0].voiceId).toBe(narratorVoiceId);
    expect(lines[0].text).toBe('The door slams shut.');
  });

  it('paragraph node produces NARRATOR ScriptLine', () => {
    const doc = makeTiptapDoc(
      paragraph('It was a dark and stormy night.'),
    );

    const lines = parseScreenplayToScriptLines(doc, characterVoiceMap, narratorVoiceId);

    expect(lines).toHaveLength(1);
    expect(lines[0].character).toBe('NARRATOR');
    expect(lines[0].voiceId).toBe(narratorVoiceId);
  });

  it('missing voice in map falls back to narrator voiceId', () => {
    const doc = makeTiptapDoc(
      characterCue('CHARLIE'),
      dialogue('I am not in the voice map.'),
    );

    const lines = parseScreenplayToScriptLines(doc, characterVoiceMap, narratorVoiceId);

    expect(lines).toHaveLength(1);
    expect(lines[0].character).toBe('CHARLIE');
    expect(lines[0].voiceId).toBe(narratorVoiceId);
  });

  it('sceneHeading nodes are skipped', () => {
    const doc = makeTiptapDoc(
      sceneHeading('INT. OFFICE - DAY'),
      characterCue('ALICE'),
      dialogue('Good morning.'),
    );

    const lines = parseScreenplayToScriptLines(doc, characterVoiceMap, narratorVoiceId);

    expect(lines).toHaveLength(1);
    expect(lines[0].character).toBe('ALICE');
  });

  it('handles multiple characters in sequence', () => {
    const doc = makeTiptapDoc(
      characterCue('ALICE'),
      dialogue('Hello Bob.'),
      characterCue('BOB'),
      dialogue('Hello Alice.'),
    );

    const lines = parseScreenplayToScriptLines(doc, characterVoiceMap, narratorVoiceId);

    expect(lines).toHaveLength(2);
    expect(lines[0].character).toBe('ALICE');
    expect(lines[0].voiceId).toBe('voice-alice-001');
    expect(lines[1].character).toBe('BOB');
    expect(lines[1].voiceId).toBe('voice-bob-002');
  });

  it('generates unique ids for each line', () => {
    const doc = makeTiptapDoc(
      characterCue('ALICE'),
      dialogue('Line one.'),
      characterCue('ALICE'),
      dialogue('Line two.'),
    );

    const lines = parseScreenplayToScriptLines(doc, characterVoiceMap, narratorVoiceId);

    expect(lines).toHaveLength(2);
    expect(lines[0].id).not.toBe(lines[1].id);
  });
});

// ── extractText ──────────────────────────────────────────────────────────────

describe('extractText', () => {
  it('extracts text from simple text node', () => {
    const node = { type: 'text', text: 'Hello' };
    expect(extractText(node)).toBe('Hello');
  });

  it('extracts text from nested nodes', () => {
    const node = {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Hello ' },
        { type: 'text', text: 'World' },
      ],
    };
    expect(extractText(node)).toBe('Hello World');
  });

  it('returns empty string for node without text', () => {
    const node = { type: 'hardBreak' };
    expect(extractText(node)).toBe('');
  });
});

// ── detectUnassignedVoices ───────────────────────────────────────────────────

describe('detectUnassignedVoices', () => {
  it('returns characters not in map', () => {
    const doc = makeTiptapDoc(
      characterCue('ALICE'),
      dialogue('Hi.'),
      characterCue('CHARLIE'),
      dialogue('Hi.'),
      characterCue('DAVE'),
      dialogue('Hi.'),
    );

    const unassigned = detectUnassignedVoices(doc, characterVoiceMap);

    expect(unassigned).toContain('CHARLIE');
    expect(unassigned).toContain('DAVE');
    expect(unassigned).not.toContain('ALICE');
  });

  it('returns empty array when all characters are assigned', () => {
    const doc = makeTiptapDoc(
      characterCue('ALICE'),
      dialogue('Hi.'),
      characterCue('BOB'),
      dialogue('Hi.'),
    );

    const unassigned = detectUnassignedVoices(doc, characterVoiceMap);
    expect(unassigned).toHaveLength(0);
  });

  it('returns unique character names (no duplicates)', () => {
    const doc = makeTiptapDoc(
      characterCue('CHARLIE'),
      dialogue('First line.'),
      characterCue('CHARLIE'),
      dialogue('Second line.'),
    );

    const unassigned = detectUnassignedVoices(doc, characterVoiceMap);
    expect(unassigned).toEqual(['CHARLIE']);
  });
});

// ── computeGaps ──────────────────────────────────────────────────────────────

describe('computeGaps', () => {
  it('returns correct gap values for same character', () => {
    const lines: ScriptLine[] = [
      { id: '1', character: 'ALICE', voiceId: 'v1', text: 'Hi', emotion: '', delivery: '', status: 'pending' },
      { id: '2', character: 'ALICE', voiceId: 'v1', text: 'There', emotion: '', delivery: '', status: 'pending' },
    ];

    const gaps = computeGaps(lines);

    expect(gaps).toEqual([GAP_SAME_CHARACTER, 0]);
  });

  it('returns correct gap values for different characters', () => {
    const lines: ScriptLine[] = [
      { id: '1', character: 'ALICE', voiceId: 'v1', text: 'Hi', emotion: '', delivery: '', status: 'pending' },
      { id: '2', character: 'BOB', voiceId: 'v2', text: 'Hey', emotion: '', delivery: '', status: 'pending' },
    ];

    const gaps = computeGaps(lines);

    expect(gaps).toEqual([GAP_CHAR_CHANGE, 0]);
  });

  it('returns 0 for last line', () => {
    const lines: ScriptLine[] = [
      { id: '1', character: 'ALICE', voiceId: 'v1', text: 'Solo line', emotion: '', delivery: '', status: 'pending' },
    ];

    const gaps = computeGaps(lines);

    expect(gaps).toEqual([0]);
  });

  it('handles mixed same/different character transitions', () => {
    const lines: ScriptLine[] = [
      { id: '1', character: 'ALICE', voiceId: 'v1', text: 'A', emotion: '', delivery: '', status: 'pending' },
      { id: '2', character: 'ALICE', voiceId: 'v1', text: 'B', emotion: '', delivery: '', status: 'pending' },
      { id: '3', character: 'BOB', voiceId: 'v2', text: 'C', emotion: '', delivery: '', status: 'pending' },
      { id: '4', character: 'BOB', voiceId: 'v2', text: 'D', emotion: '', delivery: '', status: 'pending' },
    ];

    const gaps = computeGaps(lines);

    expect(gaps).toEqual([
      GAP_SAME_CHARACTER,   // ALICE -> ALICE
      GAP_CHAR_CHANGE,      // ALICE -> BOB
      GAP_SAME_CHARACTER,   // BOB -> BOB
      0,                    // last line
    ]);
  });

  it('exports correct constant values', () => {
    expect(GAP_SAME_CHARACTER).toBe(500);
    expect(GAP_CHAR_CHANGE).toBe(1500);
  });
});
