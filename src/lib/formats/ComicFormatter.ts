/**
 * ComicFormatter
 * Panel and page structure for comic script formatting
 * Supports industry-standard comic script conventions
 */

export type ComicElementType =
  | 'page_header'
  | 'panel_header'
  | 'description'
  | 'dialogue'
  | 'caption'
  | 'sfx'
  | 'note'
  | 'splash'
  | 'spread';

export interface ComicElement {
  type: ComicElementType;
  content: string;
  raw: string;
  lineNumber: number;
  pageNumber?: number;
  panelNumber?: number;
  character?: string;
  position?: BalloonPosition;
}

export interface ComicPage {
  pageNumber: number;
  type: 'regular' | 'splash' | 'spread';
  panels: ComicPanel[];
}

export interface ComicPanel {
  panelNumber: number;
  elements: ComicElement[];
  size?: PanelSize;
  layout?: PanelLayout;
}

export type PanelSize = 'small' | 'medium' | 'large' | 'full' | 'half' | 'third' | 'quarter';
export type PanelLayout = 'horizontal' | 'vertical' | 'diagonal' | 'inset';
export type BalloonPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

export interface ComicDocument {
  title?: string;
  issue?: string;
  writer?: string;
  artist?: string;
  pages: ComicPage[];
  metadata: ComicMetadata;
}

export interface ComicMetadata {
  pageCount: number;
  panelCount: number;
  dialogueCount: number;
  captionCount: number;
  sfxCount: number;
  averagePanelsPerPage: number;
}

export interface ComicSettings {
  defaultPanelsPerPage: number;
  numberingStyle: 'continuous' | 'per-page';
  dialogueFormat: 'standard' | 'manga';
  includePageHeaders: boolean;
}

// Comic script patterns
const PATTERNS = {
  // Page header: PAGE 1, PAGE ONE, P1
  pageHeader: /^(?:PAGE|P|PG)\s*(\d+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)(?:\s*[-–]\s*(.+))?$/i,

  // Panel header: PANEL 1, Panel 1:, 1.
  panelHeader: /^(?:PANEL|PNL)?\s*(\d+)(?:\s*[-–:.])?(?:\s*\((.+)\))?$/i,

  // Character dialogue: CHARACTER: or CHARACTER (position):
  dialogue: /^([A-Z][A-Z0-9\s'.-]+?)(?:\s*\(([^)]+)\))?\s*[:]\s*(.+)$/,

  // Caption: CAP: or CAPTION:
  caption: /^(?:CAP(?:TION)?|NARR(?:ATION)?)\s*(?:\(([^)]+)\))?\s*[:]\s*(.+)$/i,

  // Sound effects: SFX: or sound effects in asterisks
  sfx: /^(?:SFX|SOUND)\s*[:]\s*(.+)$/i,
  sfxInline: /\*([^*]+)\*/g,

  // Panel size indicators
  panelSize: /\((?:SMALL|MEDIUM|LARGE|FULL|HALF|THIRD|QUARTER|INSET)\)/i,

  // Splash page indicator
  splash: /^(?:SPLASH|FULL\s*PAGE)\s*(?:PAGE)?/i,

  // Double-page spread
  spread: /^(?:SPREAD|DOUBLE\s*PAGE|TWO[\s-]PAGE)/i,

  // Note/direction
  note: /^\[(.+)\]$/,

  // Panel description (anything else in the panel)
  description: /^[A-Z]/,
};

const NUMBER_WORDS: Record<string, number> = {
  'ONE': 1, 'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5,
  'SIX': 6, 'SEVEN': 7, 'EIGHT': 8, 'NINE': 9, 'TEN': 10,
};

const DEFAULT_SETTINGS: ComicSettings = {
  defaultPanelsPerPage: 6,
  numberingStyle: 'per-page',
  dialogueFormat: 'standard',
  includePageHeaders: true,
};

export class ComicFormatter {
  private document: ComicDocument;
  private settings: ComicSettings;

  constructor(settings: Partial<ComicSettings> = {}) {
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    this.document = {
      pages: [],
      metadata: {
        pageCount: 0,
        panelCount: 0,
        dialogueCount: 0,
        captionCount: 0,
        sfxCount: 0,
        averagePanelsPerPage: 0,
      },
    };
  }

  /**
   * Parse comic script text into structured elements
   */
  parse(text: string): ComicDocument {
    const lines = text.split('\n');
    const pages: ComicPage[] = [];
    let currentPage: ComicPage | null = null;
    let currentPanel: ComicPanel | null = null;
    let pageNumber = 0;
    let panelNumber = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) {
        continue;
      }

      // Check for page header
      const pageMatch = trimmed.match(PATTERNS.pageHeader);
      if (pageMatch) {
        // Save current panel to current page
        if (currentPage && currentPanel) {
          currentPage.panels.push(currentPanel);
        }
        // Save current page
        if (currentPage) {
          pages.push(currentPage);
        }

        pageNumber = this.parsePageNumber(pageMatch[1]);
        const pageType = this.detectPageType(trimmed);

        currentPage = {
          pageNumber,
          type: pageType,
          panels: [],
        };
        currentPanel = null;
        panelNumber = 0;
        continue;
      }

      // Check for splash page
      if (PATTERNS.splash.test(trimmed)) {
        if (currentPage && currentPanel) {
          currentPage.panels.push(currentPanel);
        }
        if (currentPage) {
          pages.push(currentPage);
        }

        pageNumber++;
        currentPage = {
          pageNumber,
          type: 'splash',
          panels: [],
        };
        currentPanel = null;
        panelNumber = 0;
        continue;
      }

      // Check for spread
      if (PATTERNS.spread.test(trimmed)) {
        if (currentPage && currentPanel) {
          currentPage.panels.push(currentPanel);
        }
        if (currentPage) {
          pages.push(currentPage);
        }

        pageNumber++;
        currentPage = {
          pageNumber,
          type: 'spread',
          panels: [],
        };
        currentPanel = null;
        panelNumber = 0;
        continue;
      }

      // Ensure we have a page
      if (!currentPage) {
        pageNumber = 1;
        currentPage = {
          pageNumber,
          type: 'regular',
          panels: [],
        };
      }

      // Check for panel header
      const panelMatch = trimmed.match(PATTERNS.panelHeader);
      if (panelMatch) {
        // Save current panel
        if (currentPanel) {
          currentPage.panels.push(currentPanel);
        }

        panelNumber = parseInt(panelMatch[1], 10);
        const size = this.detectPanelSize(trimmed);

        currentPanel = {
          panelNumber,
          elements: [],
          size,
        };
        continue;
      }

      // Ensure we have a panel
      if (!currentPanel) {
        panelNumber++;
        currentPanel = {
          panelNumber,
          elements: [],
        };
      }

      // Check for dialogue
      const dialogueMatch = trimmed.match(PATTERNS.dialogue);
      if (dialogueMatch) {
        currentPanel.elements.push({
          type: 'dialogue',
          content: dialogueMatch[3],
          raw: line,
          lineNumber: i,
          pageNumber,
          panelNumber,
          character: dialogueMatch[1].trim(),
          position: this.parsePosition(dialogueMatch[2]),
        });
        continue;
      }

      // Check for caption
      const captionMatch = trimmed.match(PATTERNS.caption);
      if (captionMatch) {
        currentPanel.elements.push({
          type: 'caption',
          content: captionMatch[2],
          raw: line,
          lineNumber: i,
          pageNumber,
          panelNumber,
          position: this.parsePosition(captionMatch[1]),
        });
        continue;
      }

      // Check for SFX
      const sfxMatch = trimmed.match(PATTERNS.sfx);
      if (sfxMatch) {
        currentPanel.elements.push({
          type: 'sfx',
          content: sfxMatch[1],
          raw: line,
          lineNumber: i,
          pageNumber,
          panelNumber,
        });
        continue;
      }

      // Check for note
      const noteMatch = trimmed.match(PATTERNS.note);
      if (noteMatch) {
        currentPanel.elements.push({
          type: 'note',
          content: noteMatch[1],
          raw: line,
          lineNumber: i,
          pageNumber,
          panelNumber,
        });
        continue;
      }

      // Default: panel description
      currentPanel.elements.push({
        type: 'description',
        content: trimmed,
        raw: line,
        lineNumber: i,
        pageNumber,
        panelNumber,
      });
    }

    // Save final panel and page
    if (currentPage) {
      if (currentPanel) {
        currentPage.panels.push(currentPanel);
      }
      pages.push(currentPage);
    }

    this.document.pages = pages;
    this.document.metadata = this.calculateMetadata(pages);
    return this.document;
  }

  /**
   * Parse page number from text
   */
  private parsePageNumber(text: string): number {
    const upper = text.toUpperCase();
    if (NUMBER_WORDS[upper]) {
      return NUMBER_WORDS[upper];
    }
    return parseInt(text, 10) || 1;
  }

  /**
   * Detect page type from header
   */
  private detectPageType(header: string): 'regular' | 'splash' | 'spread' {
    if (PATTERNS.splash.test(header)) {
      return 'splash';
    }
    if (PATTERNS.spread.test(header)) {
      return 'spread';
    }
    return 'regular';
  }

  /**
   * Detect panel size from header
   */
  private detectPanelSize(header: string): PanelSize | undefined {
    const match = header.match(PATTERNS.panelSize);
    if (match) {
      return match[0].replace(/[()]/g, '').toLowerCase() as PanelSize;
    }
    return undefined;
  }

  /**
   * Parse balloon position
   */
  private parsePosition(text?: string): BalloonPosition | undefined {
    if (!text) return undefined;

    const lower = text.toLowerCase();
    if (lower.includes('top') && lower.includes('left')) return 'top-left';
    if (lower.includes('top') && lower.includes('right')) return 'top-right';
    if (lower.includes('bottom') && lower.includes('left')) return 'bottom-left';
    if (lower.includes('bottom') && lower.includes('right')) return 'bottom-right';
    if (lower.includes('center')) return 'center';

    return undefined;
  }

  /**
   * Calculate document metadata
   */
  private calculateMetadata(pages: ComicPage[]): ComicMetadata {
    let panelCount = 0;
    let dialogueCount = 0;
    let captionCount = 0;
    let sfxCount = 0;

    for (const page of pages) {
      panelCount += page.panels.length;

      for (const panel of page.panels) {
        for (const element of panel.elements) {
          if (element.type === 'dialogue') dialogueCount++;
          if (element.type === 'caption') captionCount++;
          if (element.type === 'sfx') sfxCount++;
        }
      }
    }

    return {
      pageCount: pages.length,
      panelCount,
      dialogueCount,
      captionCount,
      sfxCount,
      averagePanelsPerPage: pages.length > 0 ? Math.round(panelCount / pages.length * 10) / 10 : 0,
    };
  }

  /**
   * Format element for display
   */
  formatElement(element: ComicElement): string {
    switch (element.type) {
      case 'dialogue':
        const charName = element.character || 'CHARACTER';
        const position = element.position ? ` (${element.position})` : '';
        return `${charName}${position}: ${element.content}`;

      case 'caption':
        return `CAP: ${element.content}`;

      case 'sfx':
        return `SFX: ${element.content}`;

      case 'note':
        return `[${element.content}]`;

      default:
        return element.content;
    }
  }

  /**
   * Convert to comic script format
   */
  toScript(): string {
    const lines: string[] = [];

    // Title page info
    if (this.document.title) {
      lines.push(this.document.title.toUpperCase());
      if (this.document.issue) {
        lines.push(`Issue #${this.document.issue}`);
      }
      if (this.document.writer) {
        lines.push(`Written by: ${this.document.writer}`);
      }
      if (this.document.artist) {
        lines.push(`Art by: ${this.document.artist}`);
      }
      lines.push('');
    }

    for (const page of this.document.pages) {
      // Page header
      lines.push('');
      const pageType = page.type !== 'regular' ? ` (${page.type.toUpperCase()})` : '';
      lines.push(`PAGE ${page.pageNumber}${pageType}`);
      lines.push('');

      for (const panel of page.panels) {
        // Panel header
        const sizeIndicator = panel.size ? ` (${panel.size.toUpperCase()})` : '';
        lines.push(`PANEL ${panel.panelNumber}${sizeIndicator}`);

        for (const element of panel.elements) {
          switch (element.type) {
            case 'description':
              lines.push(element.content);
              break;
            case 'dialogue':
              const pos = element.position ? ` (${element.position})` : '';
              lines.push(`${element.character}${pos}: ${element.content}`);
              break;
            case 'caption':
              lines.push(`CAP: ${element.content}`);
              break;
            case 'sfx':
              lines.push(`SFX: ${element.content}`);
              break;
            case 'note':
              lines.push(`[${element.content}]`);
              break;
          }
        }

        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Get keyboard shortcuts for comic mode
   */
  static getShortcuts(): { key: string; action: string; description: string }[] {
    return [
      { key: 'Ctrl+1', action: 'page', description: 'Insert new page' },
      { key: 'Ctrl+2', action: 'panel', description: 'Insert new panel' },
      { key: 'Ctrl+3', action: 'dialogue', description: 'Insert dialogue' },
      { key: 'Ctrl+4', action: 'caption', description: 'Insert caption' },
      { key: 'Ctrl+5', action: 'sfx', description: 'Insert sound effect' },
      { key: 'Ctrl+6', action: 'note', description: 'Insert note' },
      { key: 'Ctrl+Shift+S', action: 'splash', description: 'Insert splash page' },
      { key: 'Ctrl+Shift+D', action: 'spread', description: 'Insert double-page spread' },
    ];
  }

  /**
   * Insert a new element
   */
  insertElement(type: ComicElementType, options?: {
    pageNumber?: number;
    panelNumber?: number;
    character?: string;
  }): string {
    switch (type) {
      case 'page_header':
        return `\n\nPAGE ${options?.pageNumber || 1}\n\n`;
      case 'panel_header':
        return `\nPANEL ${options?.panelNumber || 1}\n`;
      case 'dialogue':
        return `\n${options?.character || 'CHARACTER'}: `;
      case 'caption':
        return '\nCAP: ';
      case 'sfx':
        return '\nSFX: ';
      case 'note':
        return '\n[]';
      case 'splash':
        return '\n\nSPLASH PAGE\n\n';
      case 'spread':
        return '\n\nDOUBLE-PAGE SPREAD\n\n';
      default:
        return '\n';
    }
  }

  /**
   * Get page/panel count for a specific page
   */
  getPageInfo(pageNumber: number): { panelCount: number; type: string } | null {
    const page = this.document.pages.find(p => p.pageNumber === pageNumber);
    if (!page) return null;

    return {
      panelCount: page.panels.length,
      type: page.type,
    };
  }

  /**
   * Get character list from document
   */
  getCharacters(): string[] {
    const characters = new Set<string>();

    for (const page of this.document.pages) {
      for (const panel of page.panels) {
        for (const element of panel.elements) {
          if (element.type === 'dialogue' && element.character) {
            characters.add(element.character);
          }
        }
      }
    }

    return Array.from(characters).sort();
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<ComicSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Get current settings
   */
  getSettings(): ComicSettings {
    return { ...this.settings };
  }

  /**
   * Get document metadata
   */
  getMetadata(): ComicMetadata {
    return { ...this.document.metadata };
  }
}

export default ComicFormatter;
