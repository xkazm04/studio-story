/**
 * InlineDiffExtension
 *
 * TipTap extension that renders inline diffs (additions/deletions) as
 * ProseMirror decorations. Uses the "replace-then-decorate" approach:
 *
 * 1. showDiff: replaces the selected range with the NEW text, then applies
 *    green (addition) and red (deletion) decorations via diff-match-patch.
 * 2. acceptDiff: clears decorations -- text is already replaced.
 * 3. rejectDiff: calls editor undo to revert the replacement transaction.
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import DiffMatchPatch from 'diff-match-patch';

export interface DiffRange {
  from: number;
  to: number;
  type: 'addition' | 'deletion';
  text: string;
}

interface InlineDiffStorage {
  diffs: DiffRange[];
  originalText: string;
  originalFrom: number;
  originalTo: number;
  newText: string;
  active: boolean;
}

const INLINE_DIFF_PLUGIN_KEY = new PluginKey('inlineDiff');

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    inlineDiff: {
      showDiff: (params: {
        originalText: string;
        newText: string;
        from: number;
        to: number;
      }) => ReturnType;
      acceptDiff: () => ReturnType;
      rejectDiff: () => ReturnType;
      isDiffActive: () => ReturnType;
    };
  }
}

export const InlineDiffExtension = Extension.create<Record<string, never>, InlineDiffStorage>({
  name: 'inlineDiff',

  addStorage() {
    return {
      diffs: [],
      originalText: '',
      originalFrom: 0,
      originalTo: 0,
      newText: '',
      active: false,
    };
  },

  addCommands() {
    return {
      showDiff:
        ({ originalText, newText, from, to }) =>
        ({ editor, chain }) => {
          const dmp = new DiffMatchPatch();
          const patches = dmp.diff_main(originalText, newText);
          dmp.diff_cleanupSemantic(patches);

          // Store original state
          this.storage.originalText = originalText;
          this.storage.originalFrom = from;
          this.storage.originalTo = to;
          this.storage.newText = newText;

          // Replace the selected range with new text in a single transaction
          chain()
            .deleteRange({ from, to })
            .insertContentAt(from, newText, { updateSelection: false })
            .run();

          // Compute decoration positions mapping diff hunks to doc positions
          const diffs: DiffRange[] = [];
          let docPos = from;

          for (const [op, text] of patches) {
            if (op === DiffMatchPatch.DIFF_EQUAL) {
              docPos += text.length;
            } else if (op === DiffMatchPatch.DIFF_INSERT) {
              diffs.push({
                from: docPos,
                to: docPos + text.length,
                type: 'addition',
                text,
              });
              docPos += text.length;
            } else if (op === DiffMatchPatch.DIFF_DELETE) {
              // Deletions don't occupy space in the new text --
              // place a zero-width marker at current position
              diffs.push({
                from: docPos,
                to: docPos,
                type: 'deletion',
                text,
              });
            }
          }

          this.storage.diffs = diffs;
          this.storage.active = true;

          // Force plugin state update by dispatching a no-op transaction
          const { tr } = editor.state;
          tr.setMeta(INLINE_DIFF_PLUGIN_KEY, { diffs });
          editor.view.dispatch(tr);

          return true;
        },

      acceptDiff:
        () =>
        ({ editor }) => {
          // Text is already replaced -- just clear decorations
          this.storage.diffs = [];
          this.storage.active = false;
          this.storage.originalText = '';
          this.storage.newText = '';

          const { tr } = editor.state;
          tr.setMeta(INLINE_DIFF_PLUGIN_KEY, { diffs: [] });
          editor.view.dispatch(tr);

          return true;
        },

      rejectDiff:
        () =>
        ({ editor }) => {
          // Undo the replacement transaction to restore original text
          this.storage.diffs = [];
          this.storage.active = false;
          this.storage.originalText = '';
          this.storage.newText = '';

          const { tr } = editor.state;
          tr.setMeta(INLINE_DIFF_PLUGIN_KEY, { diffs: [] });
          editor.view.dispatch(tr);

          // Undo the text replacement
          editor.commands.undo();

          return true;
        },

      isDiffActive:
        () =>
        () => {
          return this.storage.active;
        },
    };
  },

  addProseMirrorPlugins() {
    const extensionStorage = this.storage;

    return [
      new Plugin({
        key: INLINE_DIFF_PLUGIN_KEY,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, oldSet) {
            const meta = tr.getMeta(INLINE_DIFF_PLUGIN_KEY);
            if (meta) {
              const { diffs } = meta as { diffs: DiffRange[] };
              if (!diffs || diffs.length === 0) {
                return DecorationSet.empty;
              }

              const decorations: Decoration[] = [];
              for (const diff of diffs) {
                if (diff.type === 'addition' && diff.from < diff.to) {
                  decorations.push(
                    Decoration.inline(diff.from, diff.to, {
                      class: 'bg-emerald-500/20 text-emerald-300 decoration-emerald-400',
                    })
                  );
                } else if (diff.type === 'deletion') {
                  // Widget decoration for deleted text (shown as strikethrough)
                  decorations.push(
                    Decoration.widget(diff.from, () => {
                      const span = document.createElement('span');
                      span.className =
                        'bg-red-500/20 line-through text-red-400 opacity-60';
                      span.textContent = diff.text;
                      return span;
                    })
                  );
                }
              }

              return DecorationSet.create(tr.doc, decorations);
            }

            // Map existing decorations through document changes
            if (tr.docChanged) {
              return oldSet.map(tr.mapping, tr.doc);
            }

            return oldSet;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state) ?? DecorationSet.empty;
          },
        },
      }),
    ];
  },
});
