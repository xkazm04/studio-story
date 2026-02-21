/**
 * ProseFormatter
 * Novel conventions handler for prose formatting
 * Supports chapter structure, paragraph formatting, and dialogue conventions
 */

export type ProseElementType =
  | 'chapter_heading'
  | 'section_break'
  | 'paragraph'
  | 'dialogue'
  | 'thought'
  | 'letter'
  | 'quote'
  | 'flashback'
  | 'note'
  | 'epigraph';

export interface ProseElement {
  type: ProseElementType;
  content: string;
  raw: string;
  lineNumber: number;
  speaker?: string; // For dialogue attribution
  style?: ProseStyle;
}

export interface ProseStyle {
  italic?: boolean;
  bold?: boolean;
  smallCaps?: boolean;
  centered?: boolean;
  indented?: boolean;
}

export interface ProseDocument {
  title?: string;
  subtitle?: string;
  author?: string;
  chapter?: string;
  elements: ProseElement[];
  metadata: ProseMetadata;
}

export interface ProseMetadata {
  wordCount: number;
  paragraphCount: number;
  dialogueCount: number;
  averageSentenceLength: number;
  readingTimeMinutes: number;
}

export interface ProseSettings {
  dialogueStyle: 'american' | 'british'; // "quotes" vs 'quotes'
  paragraphIndent: boolean;
  sceneBreakStyle: '***' | '* * *' | '---' | '###';
  chapterFormat: 'number' | 'title' | 'both';
  thoughtStyle: 'italic' | 'quotes';
}

// Prose patterns
const PATTERNS = {
  // Chapter heading patterns
  chapterHeading: /^(?:CHAPTER|Chapter|PART|Part)\s+[\dIVXLCDM]+(?:\s*[:.]\s*.+)?$/i,
  numberedChapter: /^(?:CHAPTER|Chapter)\s+(\d+|[IVXLCDM]+)/i,

  // Section break patterns
  sectionBreak: /^(?:\*{3}|\*\s\*\s\*|-{3}|#{3})\s*$/,

  // Dialogue patterns (American style)
  dialogueAmerican: /^[""](.+?)[""](?:\s+(.+))?$/,
  // Dialogue patterns (British style)
  dialogueBritish: /^[''](.+?)[''](?:\s+(.+))?$/,

  // Thought pattern (typically italicized)
  thought: /^_(.+)_$|^\*(.+)\*$/,

  // Letter/document format
  letterStart: /^(?:Dear\s+|To\s+Whom|RE:|Subject:)/i,
  letterEnd: /^(?:Sincerely|Best\s+regards|Yours\s+truly|Love,)/i,

  // Epigraph (centered, attributed quote)
  epigraph: /^>\s*(.+)\n>\s*[—–-]\s*(.+)$/m,

  // Quote block
  blockQuote: /^>\s+(.+)$/,

  // Emphasis
  italic: /(?:_|\*)(.+?)(?:_|\*)/g,
  bold: /(?:__|\*\*)(.+?)(?:__|\*\*)/g,
  smallCaps: /\+\+(.+?)\+\+/g,
};

const DEFAULT_SETTINGS: ProseSettings = {
  dialogueStyle: 'american',
  paragraphIndent: true,
  sceneBreakStyle: '***',
  chapterFormat: 'both',
  thoughtStyle: 'italic',
};

export class ProseFormatter {
  private document: ProseDocument;
  private settings: ProseSettings;

  constructor(settings: Partial<ProseSettings> = {}) {
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    this.document = {
      elements: [],
      metadata: {
        wordCount: 0,
        paragraphCount: 0,
        dialogueCount: 0,
        averageSentenceLength: 0,
        readingTimeMinutes: 0,
      },
    };
  }

  /**
   * Parse prose text into structured elements
   */
  parse(text: string): ProseDocument {
    const lines = text.split('\n');
    const elements: ProseElement[] = [];
    let inLetter = false;
    let letterContent: string[] = [];
    let letterStartLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines between paragraphs
      if (!trimmed) {
        if (inLetter && letterContent.length > 0) {
          // Continue collecting letter content
          letterContent.push('');
        }
        continue;
      }

      // Check for chapter heading
      if (PATTERNS.chapterHeading.test(trimmed)) {
        if (inLetter) {
          this.finalizeLetter(elements, letterContent, letterStartLine);
          inLetter = false;
          letterContent = [];
        }
        elements.push({
          type: 'chapter_heading',
          content: this.formatChapterHeading(trimmed),
          raw: line,
          lineNumber: i,
          style: { centered: true },
        });
        continue;
      }

      // Check for section break
      if (PATTERNS.sectionBreak.test(trimmed)) {
        if (inLetter) {
          this.finalizeLetter(elements, letterContent, letterStartLine);
          inLetter = false;
          letterContent = [];
        }
        elements.push({
          type: 'section_break',
          content: this.settings.sceneBreakStyle,
          raw: line,
          lineNumber: i,
          style: { centered: true },
        });
        continue;
      }

      // Check for epigraph
      if (PATTERNS.blockQuote.test(trimmed)) {
        elements.push({
          type: 'quote',
          content: trimmed.replace(/^>\s*/, ''),
          raw: line,
          lineNumber: i,
          style: { indented: true },
        });
        continue;
      }

      // Check for letter start
      if (PATTERNS.letterStart.test(trimmed) && !inLetter) {
        inLetter = true;
        letterContent = [trimmed];
        letterStartLine = i;
        continue;
      }

      // Check for letter end
      if (inLetter && PATTERNS.letterEnd.test(trimmed)) {
        letterContent.push(trimmed);
        this.finalizeLetter(elements, letterContent, letterStartLine);
        inLetter = false;
        letterContent = [];
        continue;
      }

      // If in letter, collect content
      if (inLetter) {
        letterContent.push(trimmed);
        continue;
      }

      // Check for thought (italicized internal monologue)
      if (PATTERNS.thought.test(trimmed)) {
        const match = trimmed.match(PATTERNS.thought);
        elements.push({
          type: 'thought',
          content: match?.[1] || match?.[2] || trimmed,
          raw: line,
          lineNumber: i,
          style: { italic: true },
        });
        continue;
      }

      // Check for dialogue
      const dialoguePattern = this.settings.dialogueStyle === 'american'
        ? PATTERNS.dialogueAmerican
        : PATTERNS.dialogueBritish;

      if (this.isDialogue(trimmed)) {
        const { text, attribution } = this.parseDialogue(trimmed);
        elements.push({
          type: 'dialogue',
          content: text,
          raw: line,
          lineNumber: i,
          speaker: attribution,
        });
        continue;
      }

      // Default: regular paragraph
      elements.push({
        type: 'paragraph',
        content: trimmed,
        raw: line,
        lineNumber: i,
        style: { indented: this.settings.paragraphIndent },
      });
    }

    // Finalize any remaining letter
    if (inLetter && letterContent.length > 0) {
      this.finalizeLetter(elements, letterContent, letterStartLine);
    }

    this.document.elements = elements;
    this.document.metadata = this.calculateMetadata(elements);
    return this.document;
  }

  /**
   * Check if a line is dialogue
   */
  private isDialogue(line: string): boolean {
    const openQuote = this.settings.dialogueStyle === 'american' ? /[""]/ : /['']/;
    return openQuote.test(line.charAt(0));
  }

  /**
   * Parse dialogue text and attribution
   */
  private parseDialogue(line: string): { text: string; attribution?: string } {
    const quoteChars = this.settings.dialogueStyle === 'american'
      ? { open: /[""]/, close: /[""]/ }
      : { open: /['']/, close: /['']/ };

    // Find the closing quote
    let inQuote = false;
    let quoteEnd = -1;

    for (let i = 0; i < line.length; i++) {
      if (!inQuote && quoteChars.open.test(line[i])) {
        inQuote = true;
      } else if (inQuote && quoteChars.close.test(line[i])) {
        quoteEnd = i;
        inQuote = false;
      }
    }

    if (quoteEnd > 0) {
      const text = line.substring(1, quoteEnd);
      const attribution = line.substring(quoteEnd + 1).trim();
      return {
        text,
        attribution: attribution || undefined,
      };
    }

    return { text: line };
  }

  /**
   * Finalize a letter element
   */
  private finalizeLetter(
    elements: ProseElement[],
    content: string[],
    startLine: number
  ): void {
    elements.push({
      type: 'letter',
      content: content.join('\n'),
      raw: content.join('\n'),
      lineNumber: startLine,
      style: { indented: true },
    });
  }

  /**
   * Format chapter heading based on settings
   */
  private formatChapterHeading(heading: string): string {
    const match = heading.match(PATTERNS.numberedChapter);

    if (match && this.settings.chapterFormat === 'number') {
      return `Chapter ${match[1]}`;
    }

    return heading;
  }

  /**
   * Calculate document metadata
   */
  private calculateMetadata(elements: ProseElement[]): ProseMetadata {
    let wordCount = 0;
    let paragraphCount = 0;
    let dialogueCount = 0;
    let sentenceCount = 0;
    let totalSentenceWords = 0;

    for (const element of elements) {
      const words = element.content.split(/\s+/).filter(Boolean);
      wordCount += words.length;

      if (element.type === 'paragraph') {
        paragraphCount++;
      }

      if (element.type === 'dialogue') {
        dialogueCount++;
      }

      // Count sentences (rough estimate)
      const sentences = element.content.split(/[.!?]+/).filter(s => s.trim());
      sentenceCount += sentences.length;
      totalSentenceWords += words.length;
    }

    return {
      wordCount,
      paragraphCount,
      dialogueCount,
      averageSentenceLength: sentenceCount > 0 ? Math.round(totalSentenceWords / sentenceCount) : 0,
      readingTimeMinutes: Math.ceil(wordCount / 250), // Average reading speed
    };
  }

  /**
   * Format element for display
   */
  formatElement(element: ProseElement): string {
    let content = element.content;

    // Apply emphasis
    content = this.applyEmphasis(content);

    // Wrap dialogue in quotes
    if (element.type === 'dialogue') {
      const quotes = this.settings.dialogueStyle === 'american'
        ? { open: '\u201C', close: '\u201D' }
        : { open: '\u2018', close: '\u2019' };

      content = `${quotes.open}${content}${quotes.close}`;

      if (element.speaker) {
        content += ` ${element.speaker}`;
      }
    }

    return content;
  }

  /**
   * Apply emphasis formatting
   */
  applyEmphasis(text: string): string {
    return text
      .replace(PATTERNS.bold, '<strong>$1</strong>')
      .replace(PATTERNS.italic, '<em>$1</em>')
      .replace(PATTERNS.smallCaps, '<span class="small-caps">$1</span>');
  }

  /**
   * Convert to plain prose format
   */
  toProse(): string {
    const lines: string[] = [];

    for (const element of this.document.elements) {
      switch (element.type) {
        case 'chapter_heading':
          lines.push('');
          lines.push(element.content.toUpperCase());
          lines.push('');
          break;
        case 'section_break':
          lines.push('');
          lines.push(this.settings.sceneBreakStyle);
          lines.push('');
          break;
        case 'dialogue':
          lines.push(this.formatElement(element));
          lines.push('');
          break;
        case 'paragraph':
        case 'thought':
          lines.push(element.content);
          lines.push('');
          break;
        case 'letter':
          lines.push('');
          lines.push(element.content);
          lines.push('');
          break;
        case 'quote':
          lines.push(`> ${element.content}`);
          lines.push('');
          break;
        default:
          lines.push(element.content);
      }
    }

    return lines.join('\n');
  }

  /**
   * Get keyboard shortcuts for prose mode
   */
  static getShortcuts(): { key: string; action: string; description: string }[] {
    return [
      { key: 'Ctrl+1', action: 'chapter', description: 'Insert chapter heading' },
      { key: 'Ctrl+2', action: 'scene_break', description: 'Insert scene break' },
      { key: 'Ctrl+3', action: 'dialogue', description: 'Start dialogue' },
      { key: 'Ctrl+I', action: 'italic', description: 'Italic (thought)' },
      { key: 'Ctrl+B', action: 'bold', description: 'Bold emphasis' },
      { key: 'Ctrl+Q', action: 'quote', description: 'Block quote' },
      { key: 'Tab', action: 'indent', description: 'Indent paragraph' },
    ];
  }

  /**
   * Insert a new element
   */
  insertElement(type: ProseElementType, chapterNumber?: number): string {
    switch (type) {
      case 'chapter_heading':
        return `\n\nCHAPTER ${chapterNumber || 1}\n\n`;
      case 'section_break':
        return `\n\n${this.settings.sceneBreakStyle}\n\n`;
      case 'dialogue':
        return this.settings.dialogueStyle === 'american' ? '\u201C' : '\u2018';
      case 'thought':
        return this.settings.thoughtStyle === 'italic' ? '_' : '\u201C';
      case 'quote':
        return '\n> ';
      default:
        return '\n';
    }
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<ProseSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Get current settings
   */
  getSettings(): ProseSettings {
    return { ...this.settings };
  }

  /**
   * Get document metadata
   */
  getMetadata(): ProseMetadata {
    return { ...this.document.metadata };
  }
}

export default ProseFormatter;
