/**
 * FountainExporter - Plain Text Screenplay Format
 *
 * Exports scripts in Fountain format (.fountain), the industry-standard
 * plain text markup for screenplays. Compatible with:
 * - Final Draft
 * - Highland
 * - Slugline
 * - WriterSolo
 * - And most screenplay software
 *
 * @see https://fountain.io/syntax
 */

// ============================================================================
// Types
// ============================================================================

export type FountainElementType =
  | 'title-page'
  | 'scene-heading'
  | 'action'
  | 'character'
  | 'dialogue'
  | 'parenthetical'
  | 'transition'
  | 'centered'
  | 'section'
  | 'synopsis'
  | 'note'
  | 'boneyard'
  | 'page-break'
  | 'line-break';

export interface FountainElement {
  type: FountainElementType;
  content: string;
  metadata?: {
    dual?: boolean;           // Dual dialogue
    forced?: boolean;         // Forced element type
    sceneNumber?: string;     // Scene number for production scripts
    level?: number;           // Section level (1-6)
  };
}

export interface FountainTitlePage {
  title: string;
  credit?: string;           // "Written by" or custom
  author: string;
  source?: string;           // Based on
  draftDate?: string;
  contact?: string;
  copyright?: string;
  notes?: string;
  revision?: string;
  [key: string]: string | undefined;  // Custom fields
}

export interface FountainExportOptions {
  // Content
  includeTitlePage: boolean;
  includeSceneNumbers: boolean;
  includeNotes: boolean;
  includeSynopsis: boolean;

  // Formatting
  uppercaseSceneHeadings: boolean;
  uppercaseCharacterNames: boolean;
  uppercaseTransitions: boolean;
  forceElements: boolean;      // Use forced markers (!Scene, @Character, etc.)

  // Scene numbers
  sceneNumberPosition: 'left' | 'right' | 'both' | 'none';
  startingSceneNumber: number;

  // Line endings
  lineEnding: 'lf' | 'crlf';

  // Export variants
  variant: 'standard' | 'minimal' | 'verbose';
}

export interface FountainExportResult {
  content: string;
  filename: string;
  elementCount: number;
  sceneCount: number;
  pageEstimate: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_EXPORT_OPTIONS: FountainExportOptions = {
  includeTitlePage: true,
  includeSceneNumbers: false,
  includeNotes: false,
  includeSynopsis: false,
  uppercaseSceneHeadings: true,
  uppercaseCharacterNames: true,
  uppercaseTransitions: true,
  forceElements: false,
  sceneNumberPosition: 'none',
  startingSceneNumber: 1,
  lineEnding: 'lf',
  variant: 'standard',
};

// Scene heading prefixes
const SCENE_PREFIXES = ['INT.', 'EXT.', 'INT./EXT.', 'EXT./INT.', 'I/E.', 'E/I.'];

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
  'WIPE TO:',
  'TIME CUT:',
  'INTERCUT:',
];

// ============================================================================
// Fountain Exporter Class
// ============================================================================

export class FountainExporter {
  private options: FountainExportOptions;
  private sceneCounter: number = 0;

  constructor(options: Partial<FountainExportOptions> = {}) {
    this.options = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  }

  /**
   * Export script to Fountain format
   */
  export(
    elements: FountainElement[],
    titlePage?: FountainTitlePage
  ): FountainExportResult {
    this.sceneCounter = this.options.startingSceneNumber;
    const lines: string[] = [];

    // Generate title page
    if (this.options.includeTitlePage && titlePage) {
      lines.push(this.generateTitlePage(titlePage));
      lines.push(''); // Blank line after title page
    }

    // Generate script content
    for (const element of elements) {
      const output = this.renderElement(element);
      if (output) {
        lines.push(output);
      }
    }

    // Join with appropriate line endings
    const lineEnding = this.options.lineEnding === 'crlf' ? '\r\n' : '\n';
    const content = lines.join(lineEnding);

    // Calculate statistics
    const sceneCount = elements.filter(e => e.type === 'scene-heading').length;
    const pageEstimate = Math.ceil(content.split('\n').length / 55); // ~55 lines per page

    return {
      content,
      filename: titlePage?.title
        ? this.sanitizeFilename(titlePage.title) + '.fountain'
        : 'screenplay.fountain',
      elementCount: elements.length,
      sceneCount,
      pageEstimate,
    };
  }

  /**
   * Generate title page in Fountain format
   */
  private generateTitlePage(titlePage: FountainTitlePage): string {
    const lines: string[] = [];

    // Title is required
    lines.push(`Title: ${titlePage.title}`);

    // Credit line
    if (titlePage.credit) {
      lines.push(`Credit: ${titlePage.credit}`);
    }

    // Author
    lines.push(`Author: ${titlePage.author}`);

    // Source material
    if (titlePage.source) {
      lines.push(`Source: ${titlePage.source}`);
    }

    // Draft date
    if (titlePage.draftDate) {
      lines.push(`Draft date: ${titlePage.draftDate}`);
    }

    // Contact info
    if (titlePage.contact) {
      // Multi-line contact info uses indentation
      const contactLines = titlePage.contact.split('\n');
      lines.push(`Contact:`);
      for (const line of contactLines) {
        lines.push(`   ${line}`);
      }
    }

    // Copyright
    if (titlePage.copyright) {
      lines.push(`Copyright: ${titlePage.copyright}`);
    }

    // Revision
    if (titlePage.revision) {
      lines.push(`Revision: ${titlePage.revision}`);
    }

    // Notes
    if (titlePage.notes) {
      lines.push(`Notes:`);
      const noteLines = titlePage.notes.split('\n');
      for (const line of noteLines) {
        lines.push(`   ${line}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Render a single script element
   */
  private renderElement(element: FountainElement): string {
    switch (element.type) {
      case 'scene-heading':
        return this.renderSceneHeading(element);
      case 'action':
        return this.renderAction(element);
      case 'character':
        return this.renderCharacter(element);
      case 'dialogue':
        return this.renderDialogue(element);
      case 'parenthetical':
        return this.renderParenthetical(element);
      case 'transition':
        return this.renderTransition(element);
      case 'centered':
        return this.renderCentered(element);
      case 'section':
        return this.renderSection(element);
      case 'synopsis':
        return this.renderSynopsis(element);
      case 'note':
        return this.renderNote(element);
      case 'boneyard':
        return this.renderBoneyard(element);
      case 'page-break':
        return '===';
      case 'line-break':
        return '';
      default:
        return element.content;
    }
  }

  private renderSceneHeading(element: FountainElement): string {
    let content = element.content;

    // Uppercase if option set
    if (this.options.uppercaseSceneHeadings) {
      content = content.toUpperCase();
    }

    // Check if it starts with a recognized prefix
    const hasPrefix = SCENE_PREFIXES.some(prefix =>
      content.toUpperCase().startsWith(prefix)
    );

    // Force scene heading if needed
    let output = '';
    if (this.options.forceElements || !hasPrefix) {
      output = `.${content}`;
    } else {
      output = content;
    }

    // Add scene numbers
    if (this.options.includeSceneNumbers || element.metadata?.sceneNumber) {
      const sceneNum = element.metadata?.sceneNumber || String(this.sceneCounter++);

      switch (this.options.sceneNumberPosition) {
        case 'left':
          output = `${output} #${sceneNum}#`;
          break;
        case 'right':
          output = `${output} #${sceneNum}#`;
          break;
        case 'both':
          output = `${output} #${sceneNum}#`;
          break;
      }
    }

    return '\n' + output + '\n';
  }

  private renderAction(element: FountainElement): string {
    let content = element.content;

    // Force action if needed (starts with !)
    if (this.options.forceElements || element.metadata?.forced) {
      return `!${content}\n`;
    }

    return `${content}\n`;
  }

  private renderCharacter(element: FountainElement): string {
    let content = element.content;

    // Uppercase if option set
    if (this.options.uppercaseCharacterNames) {
      content = content.toUpperCase();
    }

    // Force character if needed (starts with @)
    if (this.options.forceElements || element.metadata?.forced) {
      content = `@${content}`;
    }

    // Dual dialogue marker
    if (element.metadata?.dual) {
      content = `${content} ^`;
    }

    return '\n' + content + '\n';
  }

  private renderDialogue(element: FountainElement): string {
    // Dialogue is simply indented text following a character
    return element.content + '\n';
  }

  private renderParenthetical(element: FountainElement): string {
    let content = element.content;

    // Ensure parentheses
    if (!content.startsWith('(')) {
      content = `(${content}`;
    }
    if (!content.endsWith(')')) {
      content = `${content})`;
    }

    return content + '\n';
  }

  private renderTransition(element: FountainElement): string {
    let content = element.content;

    // Uppercase if option set
    if (this.options.uppercaseTransitions) {
      content = content.toUpperCase();
    }

    // Check if it's a recognized transition
    const isRecognized = TRANSITIONS.some(t =>
      content.toUpperCase() === t ||
      content.toUpperCase().startsWith(t.replace(':', ''))
    );

    // Force transition if needed (starts with >)
    if (this.options.forceElements || !isRecognized) {
      return `\n> ${content}\n`;
    }

    return `\n${content}\n`;
  }

  private renderCentered(element: FountainElement): string {
    return `>${element.content}<\n`;
  }

  private renderSection(element: FountainElement): string {
    const level = element.metadata?.level || 1;
    const hashes = '#'.repeat(level);
    return `\n${hashes} ${element.content}\n`;
  }

  private renderSynopsis(element: FountainElement): string {
    if (!this.options.includeSynopsis) return '';
    return `= ${element.content}\n`;
  }

  private renderNote(element: FountainElement): string {
    if (!this.options.includeNotes) return '';

    // Multi-line notes
    if (element.content.includes('\n')) {
      return `[[\n${element.content}\n]]\n`;
    }

    return `[[${element.content}]]\n`;
  }

  private renderBoneyard(element: FountainElement): string {
    // Boneyard comments (omitted from output)
    return `/*\n${element.content}\n*/\n`;
  }

  private sanitizeFilename(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9\s-_]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase();
  }

  /**
   * Update options
   */
  setOptions(options: Partial<FountainExportOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current options
   */
  getOptions(): FountainExportOptions {
    return { ...this.options };
  }
}

// ============================================================================
// Fountain Parser (for import/validation)
// ============================================================================

export class FountainParser {
  /**
   * Parse Fountain text into elements
   */
  parse(text: string): {
    titlePage: FountainTitlePage | null;
    elements: FountainElement[];
  } {
    const lines = text.split(/\r?\n/);
    const elements: FountainElement[] = [];
    let titlePage: FountainTitlePage | null = null;

    // Check for title page
    if (lines[0]?.includes(':')) {
      const titlePageEnd = lines.findIndex(line => line.trim() === '');
      if (titlePageEnd > 0) {
        titlePage = this.parseTitlePage(lines.slice(0, titlePageEnd));
        lines.splice(0, titlePageEnd + 1);
      }
    }

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) {
        i++;
        continue;
      }

      // Parse element
      const element = this.parseLine(trimmed, lines, i);
      if (element) {
        elements.push(element.element);
        i = element.nextIndex;
      } else {
        i++;
      }
    }

    return { titlePage, elements };
  }

  private parseTitlePage(lines: string[]): FountainTitlePage {
    const titlePage: FountainTitlePage = {
      title: '',
      author: '',
    };

    let currentKey = '';
    let currentValue: string[] = [];

    for (const line of lines) {
      if (line.includes(':') && !line.startsWith(' ') && !line.startsWith('\t')) {
        // Save previous key-value
        if (currentKey) {
          (titlePage as Record<string, string>)[currentKey] = currentValue.join('\n').trim();
        }

        const colonIndex = line.indexOf(':');
        currentKey = line.slice(0, colonIndex).toLowerCase().replace(/\s+/g, '');
        currentValue = [line.slice(colonIndex + 1).trim()];
      } else if (currentKey && (line.startsWith(' ') || line.startsWith('\t'))) {
        // Continuation of multi-line value
        currentValue.push(line.trim());
      }
    }

    // Save last key-value
    if (currentKey) {
      (titlePage as Record<string, string>)[currentKey] = currentValue.join('\n').trim();
    }

    return titlePage;
  }

  private parseLine(
    line: string,
    allLines: string[],
    index: number
  ): { element: FountainElement; nextIndex: number } | null {
    // Page break
    if (line === '===') {
      return {
        element: { type: 'page-break', content: '' },
        nextIndex: index + 1,
      };
    }

    // Centered text
    if (line.startsWith('>') && line.endsWith('<')) {
      return {
        element: { type: 'centered', content: line.slice(1, -1).trim() },
        nextIndex: index + 1,
      };
    }

    // Forced scene heading
    if (line.startsWith('.') && !line.startsWith('..')) {
      return {
        element: { type: 'scene-heading', content: line.slice(1), metadata: { forced: true } },
        nextIndex: index + 1,
      };
    }

    // Scene heading (auto-detected)
    if (SCENE_PREFIXES.some(prefix => line.toUpperCase().startsWith(prefix))) {
      return {
        element: { type: 'scene-heading', content: line },
        nextIndex: index + 1,
      };
    }

    // Forced character
    if (line.startsWith('@')) {
      return {
        element: { type: 'character', content: line.slice(1), metadata: { forced: true } },
        nextIndex: index + 1,
      };
    }

    // Transition (forced with >)
    if (line.startsWith('>') && !line.endsWith('<')) {
      return {
        element: { type: 'transition', content: line.slice(1).trim(), metadata: { forced: true } },
        nextIndex: index + 1,
      };
    }

    // Transition (auto-detected)
    if (TRANSITIONS.some(t => line.toUpperCase() === t)) {
      return {
        element: { type: 'transition', content: line },
        nextIndex: index + 1,
      };
    }

    // Forced action
    if (line.startsWith('!')) {
      return {
        element: { type: 'action', content: line.slice(1), metadata: { forced: true } },
        nextIndex: index + 1,
      };
    }

    // Section
    if (line.startsWith('#')) {
      const level = line.match(/^#+/)?.[0].length || 1;
      return {
        element: {
          type: 'section',
          content: line.slice(level).trim(),
          metadata: { level },
        },
        nextIndex: index + 1,
      };
    }

    // Synopsis
    if (line.startsWith('=') && !line.startsWith('===')) {
      return {
        element: { type: 'synopsis', content: line.slice(1).trim() },
        nextIndex: index + 1,
      };
    }

    // Note
    if (line.startsWith('[[')) {
      let content = line.slice(2);
      let nextIndex = index + 1;

      // Multi-line note
      if (!line.endsWith(']]')) {
        while (nextIndex < allLines.length && !allLines[nextIndex].includes(']]')) {
          content += '\n' + allLines[nextIndex];
          nextIndex++;
        }
        if (nextIndex < allLines.length) {
          content += '\n' + allLines[nextIndex].replace(']]', '');
          nextIndex++;
        }
      } else {
        content = content.slice(0, -2);
      }

      return {
        element: { type: 'note', content: content.trim() },
        nextIndex,
      };
    }

    // Parenthetical
    if (line.startsWith('(') && line.endsWith(')')) {
      return {
        element: { type: 'parenthetical', content: line },
        nextIndex: index + 1,
      };
    }

    // Character (uppercase line followed by dialogue)
    if (line === line.toUpperCase() && line.match(/^[A-Z]/) && index + 1 < allLines.length) {
      const nextLine = allLines[index + 1]?.trim();
      if (nextLine && nextLine !== nextLine.toUpperCase()) {
        const dual = line.endsWith('^');
        return {
          element: {
            type: 'character',
            content: dual ? line.slice(0, -1).trim() : line,
            metadata: { dual },
          },
          nextIndex: index + 1,
        };
      }
    }

    // Default to action
    return {
      element: { type: 'action', content: line },
      nextIndex: index + 1,
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert script blocks to Fountain elements
 */
export function convertToFountainElements(
  blocks: Array<{
    type: string;
    content: string;
    speaker?: string;
  }>
): FountainElement[] {
  const elements: FountainElement[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case 'scene-header':
        elements.push({ type: 'scene-heading', content: block.content });
        break;
      case 'description':
      case 'content':
        elements.push({ type: 'action', content: block.content });
        break;
      case 'dialogue':
        if (block.speaker) {
          elements.push({ type: 'character', content: block.speaker });
        }
        elements.push({ type: 'dialogue', content: block.content });
        break;
      case 'actor':
        elements.push({ type: 'character', content: block.content });
        break;
      case 'direction':
        elements.push({ type: 'parenthetical', content: block.content });
        break;
    }
  }

  return elements;
}

/**
 * Validate Fountain syntax
 */
export function validateFountain(text: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const lines = text.split(/\r?\n/);

  // Check for title page
  if (!lines[0]?.toLowerCase().startsWith('title:')) {
    warnings.push('No title page found. Consider adding a title page for proper formatting.');
  }

  // Check for scene headings
  const sceneHeadings = lines.filter(line =>
    SCENE_PREFIXES.some(prefix => line.toUpperCase().startsWith(prefix)) ||
    line.startsWith('.')
  );

  if (sceneHeadings.length === 0) {
    warnings.push('No scene headings found. Most screenplays include scene headings.');
  }

  // Check for unclosed notes
  const openNotes = (text.match(/\[\[/g) || []).length;
  const closeNotes = (text.match(/\]\]/g) || []).length;

  if (openNotes !== closeNotes) {
    errors.push('Unclosed note brackets found. Make sure all [[ have matching ]].');
  }

  // Check for unclosed boneyard
  const openBoneyard = (text.match(/\/\*/g) || []).length;
  const closeBoneyard = (text.match(/\*\//g) || []).length;

  if (openBoneyard !== closeBoneyard) {
    errors.push('Unclosed boneyard comment found. Make sure all /* have matching */.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// Export singleton instances
export const fountainExporter = new FountainExporter();
export const fountainParser = new FountainParser();

// Export default options
export { DEFAULT_EXPORT_OPTIONS as DEFAULT_FOUNTAIN_OPTIONS };
