import { Node, mergeAttributes } from '@tiptap/core';

/**
 * TipTap custom node extensions for screenplay formatting.
 *
 * Each node renders a distinct visual block with a CSS class in
 * `globals.css` (`.screenplay-*`).  The nodes participate in the
 * standard TipTap block group so StarterKit and prose formatting
 * can coexist.
 */

// ── Scene Heading ───────────────────────────────────────────

export const SceneHeading = Node.create({
  name: 'sceneHeading',
  group: 'block',
  content: 'text*',
  defining: true,

  addAttributes() {
    return {
      locationType: {
        default: 'INT',
        parseHTML: (element) =>
          element.getAttribute('data-location-type') || 'INT',
        renderHTML: (attributes) => ({
          'data-location-type': attributes.locationType as string,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="scene-heading"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'scene-heading',
        class: 'screenplay-scene-heading',
      }),
      0,
    ];
  },
});

// ── Action Line ─────────────────────────────────────────────

export const ActionLine = Node.create({
  name: 'actionLine',
  group: 'block',
  content: 'text*',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="action-line"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'action-line',
        class: 'screenplay-action',
      }),
      0,
    ];
  },
});

// ── Character Cue ───────────────────────────────────────────

export const CharacterCue = Node.create({
  name: 'characterCue',
  group: 'block',
  content: 'text*',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="character-cue"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'character-cue',
        class: 'screenplay-character-cue',
      }),
      0,
    ];
  },
});

// ── Dialogue ────────────────────────────────────────────────

export const Dialogue = Node.create({
  name: 'dialogue',
  group: 'block',
  content: 'text*',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="dialogue"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'dialogue',
        class: 'screenplay-dialogue',
      }),
      0,
    ];
  },
});

// ── Parenthetical ───────────────────────────────────────────

export const Parenthetical = Node.create({
  name: 'parenthetical',
  group: 'block',
  content: 'text*',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="parenthetical"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'parenthetical',
        class: 'screenplay-parenthetical',
      }),
      0,
    ];
  },
});
