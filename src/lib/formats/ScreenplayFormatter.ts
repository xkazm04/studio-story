/**
 * ScreenplayFormatter
 * Fountain syntax support for screenplay formatting
 * Implements industry-standard screenplay conventions
 */

export type ScreenplayElementType =
  | 'scene_heading'
  | 'action'
  | 'character'
  | 'dialogue'
  | 'parenthetical'
  | 'transition'
  | 'centered'
  | 'note'
  | 'section'
  | 'synopsis'
  | 'page_break'
  | 'blank';

export interface ScreenplayElement {
  type: ScreenplayElementType;
  content: string;
  raw: string;
  lineNumber: number;
  dual?: boolean; // For dual dialogue
  extension?: string; // Character extensions like (V.O.), (O.S.)
}

export interface ScreenplayDocument {
  title?: string;
  credit?: string;
  author?: string;
  source?: string;
  draftDate?: string;
  contact?: string;
  elements: ScreenplayElement[];
}

// Fountain syntax patterns
const PATTERNS = {
  // Scene headings: INT./EXT. or forced with .
  sceneHeading: /^(\.(?![.])|\s*(?:INT|EXT|EST|INT\.?\/EXT|I\/E)[\.\s])/i,
  // Forced scene heading with leading period
  forcedSceneHeading: /^\./,
  // Character name: all caps, may have extension
  character: /^([A-Z][A-Z0-9 .'_-]+)(\s*\(.*\))?(\s*\^)?$/,
  // Parenthetical: wrapped in parentheses
  parenthetical: /^\s*\(.*\)\s*$/,
  // Transition: ends with TO: or forced with >
  transition: /(?:^>|TO:$)/,
  // Centered text: wrapped in > <
  centered: /^>.*<$/,
  // Note: [[note text]]
  note: /\[\[.*?\]\]/g,
  // Section: starts with #
  section: /^#{1,6}\s/,
  // Synopsis: starts with =
  synopsis: /^=/,
  // Page break: ===
  pageBreak: /^={3,}$/,
  // Title page key: key:
  titlePageKey: /^([A-Za-z][A-Za-z0-9 ]+):\s*(.*)$/,
  // Emphasis patterns
  bold: /\*\*(.+?)\*\*/g,
  italic: /\*(.+?)\*/g,
  underline: /_(.+?)_/g,
  boldItalic: /\*{3}(.+?)\*{3}/g,
  // Character extension
  characterExtension: /\(([A-Z.]+(?:\s+[A-Z.]+)*)\)$/i,
  // Dual dialogue marker
  dualDialogue: /\^$/,
};

// Scene heading prefixes for auto-detection
const SCENE_PREFIXES = [
  'INT.',
  'EXT.',
  'INT/EXT.',
  'I/E.',
  'INT ',
  'EXT ',
  'INT/EXT ',
  'I/E ',
  'EST.',
  'EST ',
];

// Common transitions
const TRANSITIONS = [
  'CUT TO:',
  'FADE IN:',
  'FADE OUT.',
  'FADE TO:',
  'DISSOLVE TO:',
  'SMASH CUT TO:',
  'MATCH CUT TO:',
  'JUMP CUT TO:',
  'TIME CUT:',
  'INTERCUT:',
];

// Character extensions
const CHARACTER_EXTENSIONS = [
  'V.O.',
  'O.S.',
  'O.C.',
  'CONT\'D',
  'CONT',
  'PRE-LAP',
  'FILTER',
];

export class ScreenplayFormatter {
  private document: ScreenplayDocument;

  constructor() {
    this.document = { elements: [] };
  }

  /**
   * Parse Fountain text into structured elements
   */
  parse(text: string): ScreenplayDocument {
    const lines = text.split('\n');
    const elements: ScreenplayElement[] = [];
    let inDialogue = false;
    let lastCharacterLine = -1;

    // Check for title page
    const titlePageEnd = this.parseTitlePage(lines);

    for (let i = titlePageEnd; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines but track them
      if (!trimmed) {
        inDialogue = false;
        elements.push({
          type: 'blank',
          content: '',
          raw: line,
          lineNumber: i,
        });
        continue;
      }

      // Check for page break
      if (PATTERNS.pageBreak.test(trimmed)) {
        elements.push({
          type: 'page_break',
          content: '',
          raw: line,
          lineNumber: i,
        });
        continue;
      }

      // Check for section
      if (PATTERNS.section.test(trimmed)) {
        elements.push({
          type: 'section',
          content: trimmed.replace(/^#+\s*/, ''),
          raw: line,
          lineNumber: i,
        });
        continue;
      }

      // Check for synopsis
      if (PATTERNS.synopsis.test(trimmed)) {
        elements.push({
          type: 'synopsis',
          content: trimmed.replace(/^=\s*/, ''),
          raw: line,
          lineNumber: i,
        });
        continue;
      }

      // Check for centered text
      if (PATTERNS.centered.test(trimmed)) {
        elements.push({
          type: 'centered',
          content: trimmed.slice(1, -1).trim(),
          raw: line,
          lineNumber: i,
        });
        continue;
      }

      // Check for transition
      if (PATTERNS.transition.test(trimmed)) {
        inDialogue = false;
        elements.push({
          type: 'transition',
          content: trimmed.startsWith('>') ? trimmed.slice(1).trim() : trimmed,
          raw: line,
          lineNumber: i,
        });
        continue;
      }

      // Check for scene heading
      if (this.isSceneHeading(trimmed)) {
        inDialogue = false;
        elements.push({
          type: 'scene_heading',
          content: trimmed.startsWith('.') ? trimmed.slice(1) : trimmed,
          raw: line,
          lineNumber: i,
        });
        continue;
      }

      // Check for character (all caps, possibly with extension)
      if (this.isCharacter(trimmed, lines, i)) {
        inDialogue = true;
        lastCharacterLine = i;
        const { name, extension, dual } = this.parseCharacter(trimmed);
        elements.push({
          type: 'character',
          content: name,
          raw: line,
          lineNumber: i,
          extension,
          dual,
        });
        continue;
      }

      // Check for parenthetical (within dialogue)
      if (inDialogue && PATTERNS.parenthetical.test(trimmed)) {
        elements.push({
          type: 'parenthetical',
          content: trimmed,
          raw: line,
          lineNumber: i,
        });
        continue;
      }

      // If in dialogue context, this is dialogue
      if (inDialogue && i - lastCharacterLine <= 2) {
        elements.push({
          type: 'dialogue',
          content: trimmed,
          raw: line,
          lineNumber: i,
        });
        continue;
      }

      // Default: action
      inDialogue = false;
      elements.push({
        type: 'action',
        content: trimmed.startsWith('!') ? trimmed.slice(1) : trimmed,
        raw: line,
        lineNumber: i,
      });
    }

    this.document = { ...this.document, elements };
    return this.document;
  }

  /**
   * Parse title page from beginning of document
   */
  private parseTitlePage(lines: string[]): number {
    let i = 0;
    let foundTitlePage = false;

    while (i < lines.length) {
      const line = lines[i].trim();

      if (!line) {
        if (foundTitlePage) {
          return i + 1; // End of title page
        }
        i++;
        continue;
      }

      const match = line.match(PATTERNS.titlePageKey);
      if (match) {
        foundTitlePage = true;
        const [, key, value] = match;
        const keyLower = key.toLowerCase();

        if (keyLower === 'title') this.document.title = value;
        else if (keyLower === 'credit') this.document.credit = value;
        else if (keyLower === 'author' || keyLower === 'authors') this.document.author = value;
        else if (keyLower === 'source') this.document.source = value;
        else if (keyLower === 'draft date') this.document.draftDate = value;
        else if (keyLower === 'contact') this.document.contact = value;

        i++;
      } else if (foundTitlePage) {
        // Check if this is a continuation of a multi-line value
        i++;
      } else {
        break;
      }
    }

    return i;
  }

  /**
   * Check if line is a scene heading
   */
  private isSceneHeading(line: string): boolean {
    // Forced scene heading with period
    if (line.startsWith('.') && !line.startsWith('..')) {
      return true;
    }

    // Standard scene heading prefixes
    const upper = line.toUpperCase();
    return SCENE_PREFIXES.some(prefix => upper.startsWith(prefix));
  }

  /**
   * Check if line is a character name
   */
  private isCharacter(line: string, lines: string[], index: number): boolean {
    // Must be all uppercase (allowing extensions)
    const withoutExtension = line.replace(/\s*\(.*\)\s*$/, '').replace(/\s*\^$/, '');
    if (withoutExtension !== withoutExtension.toUpperCase()) {
      return false;
    }

    // Must have at least one letter
    if (!/[A-Z]/.test(withoutExtension)) {
      return false;
    }

    // Must be followed by dialogue or parenthetical
    const nextLine = lines[index + 1]?.trim();
    if (!nextLine) {
      return false;
    }

    // Check if next line could be dialogue or parenthetical
    return !this.isSceneHeading(nextLine) &&
           !PATTERNS.transition.test(nextLine) &&
           nextLine !== nextLine.toUpperCase();
  }

  /**
   * Parse character name and extension
   */
  private parseCharacter(line: string): { name: string; extension?: string; dual?: boolean } {
    const dual = PATTERNS.dualDialogue.test(line);
    const withoutDual = line.replace(/\s*\^$/, '');

    const extMatch = withoutDual.match(PATTERNS.characterExtension);
    if (extMatch) {
      return {
        name: withoutDual.replace(PATTERNS.characterExtension, '').trim(),
        extension: extMatch[1],
        dual,
      };
    }

    return { name: withoutDual.trim(), dual };
  }

  /**
   * Format content according to screenplay element type
   */
  formatElement(element: ScreenplayElement): string {
    switch (element.type) {
      case 'scene_heading':
        return element.content.toUpperCase();
      case 'character':
        return element.extension
          ? `${element.content} (${element.extension})`
          : element.content;
      case 'parenthetical':
        return element.content;
      case 'dialogue':
        return element.content;
      case 'action':
        return element.content;
      case 'transition':
        return element.content.toUpperCase();
      case 'centered':
        return `> ${element.content} <`;
      default:
        return element.content;
    }
  }

  /**
   * Convert parsed document back to Fountain text
   */
  toFountain(): string {
    const lines: string[] = [];

    // Title page
    if (this.document.title) {
      lines.push(`Title: ${this.document.title}`);
    }
    if (this.document.credit) {
      lines.push(`Credit: ${this.document.credit}`);
    }
    if (this.document.author) {
      lines.push(`Author: ${this.document.author}`);
    }
    if (this.document.draftDate) {
      lines.push(`Draft date: ${this.document.draftDate}`);
    }
    if (this.document.contact) {
      lines.push(`Contact: ${this.document.contact}`);
    }

    if (lines.length > 0) {
      lines.push('');
    }

    // Elements
    for (const element of this.document.elements) {
      switch (element.type) {
        case 'scene_heading':
          lines.push('');
          lines.push(element.content.toUpperCase());
          break;
        case 'character':
          lines.push('');
          const charLine = element.extension
            ? `${element.content} (${element.extension})${element.dual ? ' ^' : ''}`
            : `${element.content}${element.dual ? ' ^' : ''}`;
          lines.push(charLine);
          break;
        case 'parenthetical':
          lines.push(element.content);
          break;
        case 'dialogue':
          lines.push(element.content);
          break;
        case 'action':
          lines.push('');
          lines.push(element.content);
          break;
        case 'transition':
          lines.push('');
          lines.push(`> ${element.content}`);
          break;
        case 'centered':
          lines.push(`> ${element.content} <`);
          break;
        case 'page_break':
          lines.push('===');
          break;
        case 'section':
          lines.push(`# ${element.content}`);
          break;
        case 'synopsis':
          lines.push(`= ${element.content}`);
          break;
        default:
          lines.push(element.content);
      }
    }

    return lines.join('\n');
  }

  /**
   * Apply emphasis formatting
   */
  applyEmphasis(text: string): string {
    return text
      .replace(PATTERNS.boldItalic, '<strong><em>$1</em></strong>')
      .replace(PATTERNS.bold, '<strong>$1</strong>')
      .replace(PATTERNS.italic, '<em>$1</em>')
      .replace(PATTERNS.underline, '<u>$1</u>');
  }

  /**
   * Get keyboard shortcuts for screenplay mode
   */
  static getShortcuts(): { key: string; action: string; description: string }[] {
    return [
      { key: 'Ctrl+1', action: 'scene_heading', description: 'Insert scene heading' },
      { key: 'Ctrl+2', action: 'action', description: 'Insert action line' },
      { key: 'Ctrl+3', action: 'character', description: 'Insert character name' },
      { key: 'Ctrl+4', action: 'dialogue', description: 'Insert dialogue' },
      { key: 'Ctrl+5', action: 'parenthetical', description: 'Insert parenthetical' },
      { key: 'Ctrl+6', action: 'transition', description: 'Insert transition' },
      { key: 'Tab', action: 'auto_complete', description: 'Auto-complete element' },
      { key: 'Enter+Enter', action: 'next_element', description: 'Start next element' },
    ];
  }

  /**
   * Get auto-complete suggestions based on element type
   */
  static getSuggestions(type: ScreenplayElementType): string[] {
    switch (type) {
      case 'scene_heading':
        return SCENE_PREFIXES;
      case 'transition':
        return TRANSITIONS;
      case 'character':
        return CHARACTER_EXTENSIONS.map(ext => `(${ext})`);
      default:
        return [];
    }
  }

  /**
   * Insert a new element at cursor position
   */
  insertElement(type: ScreenplayElementType): string {
    switch (type) {
      case 'scene_heading':
        return '\nINT. ';
      case 'character':
        return '\n\n';
      case 'parenthetical':
        return '()';
      case 'transition':
        return '\n\n> CUT TO:';
      case 'centered':
        return '\n>  <';
      case 'page_break':
        return '\n\n===\n\n';
      default:
        return '\n';
    }
  }
}

export default ScreenplayFormatter;
