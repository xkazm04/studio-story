/**
 * AIWritingExtension
 *
 * TipTap extension that manages the AI writing tool lifecycle:
 * - Captures the current selection
 * - Calls POST /api/ai/writing with tool type + selection
 * - On success, delegates to InlineDiffExtension.showDiff for inline preview
 * - On error, stores error message in storage
 *
 * Works in tandem with InlineDiffExtension for the accept/reject UI.
 */

import { Extension } from '@tiptap/core';
import type { WritingToolType, ContinueLength } from '@/lib/ai/writingPrompts';

interface AIWritingStorage {
  isProcessing: boolean;
  currentTool: WritingToolType | null;
  error: string | null;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    aiWriting: {
      runWritingTool: (params: {
        tool: WritingToolType;
        projectId: string;
        sceneId: string;
        options?: { length?: ContinueLength };
      }) => ReturnType;
      clearWritingState: () => ReturnType;
    };
  }
}

export const AIWritingExtension = Extension.create<Record<string, never>, AIWritingStorage>({
  name: 'aiWriting',

  addStorage() {
    return {
      isProcessing: false,
      currentTool: null,
      error: null,
    };
  },

  addCommands() {
    return {
      runWritingTool:
        ({ tool, projectId, sceneId, options }) =>
        ({ editor }) => {
          const { from, to } = editor.state.selection;
          const selectedText = editor.state.doc.textBetween(from, to, '\n');

          // For 'continue' tool, selection can be empty (uses cursor position context)
          if (!selectedText && tool !== 'continue') {
            this.storage.error = 'Please select text to use this tool.';
            return false;
          }

          this.storage.isProcessing = true;
          this.storage.currentTool = tool;
          this.storage.error = null;

          // Async API call -- run outside of the synchronous command chain
          (async () => {
            try {
              const response = await fetch('/api/ai/writing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  projectId,
                  sceneId,
                  tool,
                  selectedText: selectedText || editor.state.doc.textBetween(
                    Math.max(0, from - 500),
                    from,
                    '\n'
                  ),
                  selectionFrom: from,
                  selectionTo: to,
                  options,
                }),
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                  (errorData as { error?: string }).error ||
                    `API error: ${response.status}`
                );
              }

              const data = (await response.json()) as {
                result: string;
                tool: string;
                originalText: string;
              };

              // For 'continue', insert at cursor position (no diff needed)
              if (tool === 'continue') {
                editor
                  .chain()
                  .insertContentAt(from, data.result, { updateSelection: false })
                  .run();
              } else {
                // Show inline diff for transform tools
                editor.commands.showDiff({
                  originalText: selectedText,
                  newText: data.result,
                  from,
                  to,
                });
              }
            } catch (err) {
              this.storage.error =
                err instanceof Error ? err.message : 'An unexpected error occurred';
            } finally {
              this.storage.isProcessing = false;
              this.storage.currentTool = null;
            }
          })();

          return true;
        },

      clearWritingState:
        () =>
        () => {
          this.storage.isProcessing = false;
          this.storage.currentTool = null;
          this.storage.error = null;
          return true;
        },
    };
  },
});
