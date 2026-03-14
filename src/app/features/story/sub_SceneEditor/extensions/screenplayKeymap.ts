import { Extension } from '@tiptap/core';

/**
 * Keyboard shortcuts for switching the current block to a
 * screenplay node type.
 *
 * Shortcuts:
 *   Mod+Shift+H  Scene Heading
 *   Mod+Shift+A  Action Line
 *   Mod+Shift+C  Character Cue
 *   Mod+Shift+D  Dialogue
 *   Mod+Shift+P  Parenthetical
 */
export const ScreenplayKeymap = Extension.create({
  name: 'screenplayKeymap',

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-h': () =>
        this.editor.commands.setNode('sceneHeading'),
      'Mod-Shift-a': () =>
        this.editor.commands.setNode('actionLine'),
      'Mod-Shift-c': () =>
        this.editor.commands.setNode('characterCue'),
      'Mod-Shift-d': () =>
        this.editor.commands.setNode('dialogue'),
      'Mod-Shift-p': () =>
        this.editor.commands.setNode('parenthetical'),
    };
  },
});
