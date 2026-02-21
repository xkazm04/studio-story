/**
 * PDFGenerator - Professional Screenplay PDF Creation
 *
 * Generates industry-standard screenplay PDFs following:
 * - Standard screenplay format (12pt Courier)
 * - Proper margins and spacing
 * - Scene headers, action, dialogue, parentheticals
 * - Page numbers and headers
 * - Title page and cover generation
 */

// ============================================================================
// Types
// ============================================================================

export type ScriptElementType =
  | 'scene-header'
  | 'action'
  | 'character'
  | 'dialogue'
  | 'parenthetical'
  | 'transition'
  | 'note'
  | 'centered'
  | 'page-break';

export interface ScriptElement {
  type: ScriptElementType;
  content: string;
  sceneNumber?: number;
  dualDialogue?: 'left' | 'right';
  metadata?: Record<string, string>;
}

export interface TitlePageInfo {
  title: string;
  subtitle?: string;
  author: string;
  basedOn?: string;
  contact?: {
    name?: string;
    address?: string[];
    phone?: string;
    email?: string;
  };
  date?: string;
  draft?: string;
  copyright?: string;
}

export interface PDFExportOptions {
  // Document settings
  pageSize: 'letter' | 'a4';
  includePageNumbers: boolean;
  includeTitlePage: boolean;
  includeSceneNumbers: boolean;
  startingPageNumber: number;

  // Draft settings
  draftMode: 'spec' | 'shooting' | 'revision';
  revisionColor?: string;
  revisionDate?: string;

  // Header/Footer
  headerText?: string;
  showDate: boolean;

  // Typography
  fontFamily: 'courier' | 'courier-prime';
  fontSize: number;
}

export interface PDFGeneratorResult {
  blob: Blob;
  pageCount: number;
  filename: string;
}

// ============================================================================
// Constants - Industry Standard Measurements
// ============================================================================

// All measurements in points (72 points = 1 inch)
const SCREENPLAY_FORMAT = {
  // Page dimensions (Letter: 8.5 x 11 inches)
  pageWidth: 612,   // 8.5 inches
  pageHeight: 792,  // 11 inches

  // Margins
  marginTop: 72,    // 1 inch
  marginBottom: 72, // 1 inch
  marginLeft: 108,  // 1.5 inches
  marginRight: 72,  // 1 inch

  // Element-specific left margins (from page edge)
  sceneHeaderLeft: 108,     // 1.5 inches
  actionLeft: 108,          // 1.5 inches
  characterLeft: 252,       // 3.5 inches
  dialogueLeft: 180,        // 2.5 inches
  parentheticalLeft: 216,   // 3 inches
  transitionLeft: 432,      // 6 inches

  // Element widths
  actionWidth: 432,         // 6 inches
  dialogueWidth: 216,       // 3 inches
  parentheticalWidth: 144,  // 2 inches
  characterWidth: 252,      // 3.5 inches

  // Typography
  fontSize: 12,
  lineHeight: 12,           // Single-spaced Courier
  linesPerPage: 55,         // Approximately 1 minute per page

  // Spacing (in lines)
  spaceAfterSceneHeader: 1,
  spaceAfterAction: 1,
  spaceAfterCharacter: 0,
  spaceAfterDialogue: 1,
  spaceAfterParenthetical: 0,
  spaceBeforeTransition: 1,
  spaceAfterTransition: 1,
};

const DEFAULT_EXPORT_OPTIONS: PDFExportOptions = {
  pageSize: 'letter',
  includePageNumbers: true,
  includeTitlePage: true,
  includeSceneNumbers: true,
  startingPageNumber: 1,
  draftMode: 'spec',
  showDate: false,
  fontFamily: 'courier',
  fontSize: 12,
};

// ============================================================================
// PDF Document Builder
// ============================================================================

interface PDFPage {
  content: PDFElement[];
  pageNumber: number;
}

interface PDFElement {
  type: 'text' | 'line' | 'rect' | 'image';
  x: number;
  y: number;
  text?: string;
  width?: number;
  height?: number;
  fontSize?: number;
  fontStyle?: 'normal' | 'bold' | 'italic';
  align?: 'left' | 'center' | 'right';
  color?: string;
}

class PDFDocumentBuilder {
  private pages: PDFPage[] = [];
  private currentPage: PDFPage | null = null;
  private currentY: number = SCREENPLAY_FORMAT.marginTop;
  private options: PDFExportOptions;
  private format = SCREENPLAY_FORMAT;

  constructor(options: PDFExportOptions) {
    this.options = options;
  }

  startNewPage(pageNumber: number): void {
    if (this.currentPage) {
      this.pages.push(this.currentPage);
    }

    this.currentPage = {
      content: [],
      pageNumber,
    };

    this.currentY = this.format.marginTop;

    // Add page number (except on title page, which is page 0)
    if (this.options.includePageNumbers && pageNumber > 0) {
      this.addElement({
        type: 'text',
        x: this.format.pageWidth - this.format.marginRight,
        y: this.format.marginTop - 24,
        text: `${pageNumber}.`,
        fontSize: this.format.fontSize,
        align: 'right',
      });
    }

    // Add header if specified
    if (this.options.headerText && pageNumber > 0) {
      this.addElement({
        type: 'text',
        x: this.format.marginLeft,
        y: this.format.marginTop - 24,
        text: this.options.headerText,
        fontSize: this.format.fontSize,
        align: 'left',
      });
    }
  }

  addElement(element: PDFElement): void {
    if (!this.currentPage) {
      this.startNewPage(this.options.startingPageNumber);
    }
    this.currentPage!.content.push(element);
  }

  addText(
    text: string,
    x: number,
    maxWidth: number,
    options: {
      fontSize?: number;
      fontStyle?: 'normal' | 'bold' | 'italic';
      align?: 'left' | 'center' | 'right';
      uppercase?: boolean;
    } = {}
  ): number {
    const { fontSize = this.format.fontSize, fontStyle = 'normal', align = 'left', uppercase = false } = options;

    const displayText = uppercase ? text.toUpperCase() : text;

    // Simple word wrapping (approximate - character-based for Courier)
    const charsPerLine = Math.floor(maxWidth / (fontSize * 0.6));
    const lines = this.wrapText(displayText, charsPerLine);

    for (const line of lines) {
      // Check if we need a new page
      if (this.currentY + this.format.lineHeight > this.format.pageHeight - this.format.marginBottom) {
        const nextPage = (this.currentPage?.pageNumber || 0) + 1;
        this.startNewPage(nextPage);
      }

      this.addElement({
        type: 'text',
        x,
        y: this.currentY,
        text: line,
        fontSize,
        fontStyle,
        align,
      });

      this.currentY += this.format.lineHeight;
    }

    return lines.length;
  }

  addVerticalSpace(lines: number): void {
    this.currentY += lines * this.format.lineHeight;
  }

  private wrapText(text: string, maxChars: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;

      if (testLine.length <= maxChars) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        // Handle very long words
        if (word.length > maxChars) {
          let remaining = word;
          while (remaining.length > maxChars) {
            lines.push(remaining.slice(0, maxChars));
            remaining = remaining.slice(maxChars);
          }
          currentLine = remaining;
        } else {
          currentLine = word;
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [''];
  }

  getCurrentY(): number {
    return this.currentY;
  }

  setCurrentY(y: number): void {
    this.currentY = y;
  }

  finalize(): PDFPage[] {
    if (this.currentPage) {
      this.pages.push(this.currentPage);
    }
    return this.pages;
  }

  getPageCount(): number {
    return this.pages.length + (this.currentPage ? 1 : 0);
  }
}

// ============================================================================
// PDF Generator Class
// ============================================================================

export class PDFGenerator {
  private options: PDFExportOptions;
  private format = SCREENPLAY_FORMAT;
  private sceneCount: number = 0;

  constructor(options: Partial<PDFExportOptions> = {}) {
    this.options = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  }

  /**
   * Generate a screenplay PDF from script elements
   */
  async generateScreenplay(
    elements: ScriptElement[],
    titleInfo: TitlePageInfo
  ): Promise<PDFGeneratorResult> {
    const builder = new PDFDocumentBuilder(this.options);
    this.sceneCount = 0;

    // Generate title page
    if (this.options.includeTitlePage) {
      this.generateTitlePage(builder, titleInfo);
    }

    // Generate script content
    for (const element of elements) {
      this.renderElement(builder, element);
    }

    // Finalize and create blob
    const pages = builder.finalize();
    const pdfContent = this.serializeToPDFFormat(pages, titleInfo.title);

    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const filename = this.sanitizeFilename(titleInfo.title) + '.pdf';

    return {
      blob,
      pageCount: pages.length,
      filename,
    };
  }

  /**
   * Generate title page
   */
  private generateTitlePage(builder: PDFDocumentBuilder, info: TitlePageInfo): void {
    builder.startNewPage(0); // Title page is page 0

    // Title (centered, 1/3 down the page)
    const titleY = this.format.pageHeight / 3;
    builder.setCurrentY(titleY);

    builder.addText(info.title.toUpperCase(), this.format.pageWidth / 2, 400, {
      fontSize: 24,
      fontStyle: 'bold',
      align: 'center',
    });

    builder.addVerticalSpace(2);

    // Subtitle if present
    if (info.subtitle) {
      builder.addText(info.subtitle, this.format.pageWidth / 2, 400, {
        fontSize: 14,
        align: 'center',
      });
      builder.addVerticalSpace(1);
    }

    // "Written by" or "by"
    builder.addVerticalSpace(2);
    builder.addText('Written by', this.format.pageWidth / 2, 400, {
      align: 'center',
    });
    builder.addVerticalSpace(1);

    // Author
    builder.addText(info.author, this.format.pageWidth / 2, 400, {
      align: 'center',
    });

    // Based on
    if (info.basedOn) {
      builder.addVerticalSpace(2);
      builder.addText(`Based on ${info.basedOn}`, this.format.pageWidth / 2, 400, {
        align: 'center',
      });
    }

    // Draft info (lower left)
    if (info.draft || info.date) {
      builder.setCurrentY(this.format.pageHeight - this.format.marginBottom - 72);
      if (info.draft) {
        builder.addText(info.draft, this.format.marginLeft, 200, { align: 'left' });
      }
      if (info.date) {
        builder.addText(info.date, this.format.marginLeft, 200, { align: 'left' });
      }
    }

    // Contact info (lower right)
    if (info.contact) {
      const contactStartY = this.format.pageHeight - this.format.marginBottom - 100;
      builder.setCurrentY(contactStartY);

      const rightX = this.format.pageWidth - this.format.marginRight - 150;

      if (info.contact.name) {
        builder.addText(info.contact.name, rightX, 200, { align: 'left' });
      }
      if (info.contact.address) {
        for (const line of info.contact.address) {
          builder.addText(line, rightX, 200, { align: 'left' });
        }
      }
      if (info.contact.phone) {
        builder.addText(info.contact.phone, rightX, 200, { align: 'left' });
      }
      if (info.contact.email) {
        builder.addText(info.contact.email, rightX, 200, { align: 'left' });
      }
    }

    // Copyright
    if (info.copyright) {
      builder.setCurrentY(this.format.pageHeight - this.format.marginBottom - 24);
      builder.addText(info.copyright, this.format.pageWidth / 2, 400, {
        fontSize: 10,
        align: 'center',
      });
    }

    // Start new page for actual script
    builder.startNewPage(this.options.startingPageNumber);
  }

  /**
   * Render a script element
   */
  private renderElement(builder: PDFDocumentBuilder, element: ScriptElement): void {
    switch (element.type) {
      case 'scene-header':
        this.renderSceneHeader(builder, element);
        break;
      case 'action':
        this.renderAction(builder, element);
        break;
      case 'character':
        this.renderCharacter(builder, element);
        break;
      case 'dialogue':
        this.renderDialogue(builder, element);
        break;
      case 'parenthetical':
        this.renderParenthetical(builder, element);
        break;
      case 'transition':
        this.renderTransition(builder, element);
        break;
      case 'centered':
        this.renderCentered(builder, element);
        break;
      case 'page-break':
        builder.startNewPage(builder.getPageCount() + 1);
        break;
    }
  }

  private renderSceneHeader(builder: PDFDocumentBuilder, element: ScriptElement): void {
    builder.addVerticalSpace(this.format.spaceAfterAction); // Space before

    let content = element.content.toUpperCase();

    // Add scene number if enabled
    if (this.options.includeSceneNumbers) {
      this.sceneCount++;
      const sceneNum = element.sceneNumber || this.sceneCount;

      if (this.options.draftMode === 'shooting') {
        content = `${sceneNum}    ${content}    ${sceneNum}`;
      }
    }

    builder.addText(content, this.format.sceneHeaderLeft, this.format.actionWidth, {
      fontStyle: 'bold',
      uppercase: true,
    });

    builder.addVerticalSpace(this.format.spaceAfterSceneHeader);
  }

  private renderAction(builder: PDFDocumentBuilder, element: ScriptElement): void {
    builder.addText(element.content, this.format.actionLeft, this.format.actionWidth);
    builder.addVerticalSpace(this.format.spaceAfterAction);
  }

  private renderCharacter(builder: PDFDocumentBuilder, element: ScriptElement): void {
    builder.addText(element.content.toUpperCase(), this.format.characterLeft, this.format.characterWidth, {
      uppercase: true,
    });
    builder.addVerticalSpace(this.format.spaceAfterCharacter);
  }

  private renderDialogue(builder: PDFDocumentBuilder, element: ScriptElement): void {
    builder.addText(element.content, this.format.dialogueLeft, this.format.dialogueWidth);
    builder.addVerticalSpace(this.format.spaceAfterDialogue);
  }

  private renderParenthetical(builder: PDFDocumentBuilder, element: ScriptElement): void {
    const content = element.content.startsWith('(') ? element.content : `(${element.content})`;
    builder.addText(content, this.format.parentheticalLeft, this.format.parentheticalWidth);
    builder.addVerticalSpace(this.format.spaceAfterParenthetical);
  }

  private renderTransition(builder: PDFDocumentBuilder, element: ScriptElement): void {
    builder.addVerticalSpace(this.format.spaceBeforeTransition);
    builder.addText(element.content.toUpperCase(), this.format.transitionLeft, 144, {
      uppercase: true,
      align: 'right',
    });
    builder.addVerticalSpace(this.format.spaceAfterTransition);
  }

  private renderCentered(builder: PDFDocumentBuilder, element: ScriptElement): void {
    builder.addText(element.content, this.format.pageWidth / 2, 400, {
      align: 'center',
    });
    builder.addVerticalSpace(1);
  }

  /**
   * Serialize pages to PDF format
   * This creates a simple PDF structure that can be enhanced with jsPDF
   */
  private serializeToPDFFormat(pages: PDFPage[], title: string): string {
    // Simple PDF structure (for demonstration - in production use jsPDF)
    const pdfLines: string[] = [];

    pdfLines.push('%PDF-1.4');
    pdfLines.push('%âãÏÓ');
    pdfLines.push('');

    // Object 1: Catalog
    pdfLines.push('1 0 obj');
    pdfLines.push('<< /Type /Catalog /Pages 2 0 R >>');
    pdfLines.push('endobj');
    pdfLines.push('');

    // Object 2: Pages
    const pageRefs = pages.map((_, i) => `${i + 4} 0 R`).join(' ');
    pdfLines.push('2 0 obj');
    pdfLines.push(`<< /Type /Pages /Kids [${pageRefs}] /Count ${pages.length} >>`);
    pdfLines.push('endobj');
    pdfLines.push('');

    // Object 3: Font
    pdfLines.push('3 0 obj');
    pdfLines.push('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');
    pdfLines.push('endobj');
    pdfLines.push('');

    // Page objects
    let objNum = 4;
    for (const page of pages) {
      // Page object
      pdfLines.push(`${objNum} 0 obj`);
      pdfLines.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.format.pageWidth} ${this.format.pageHeight}] /Contents ${objNum + 1} 0 R /Resources << /Font << /F1 3 0 R >> >> >>`);
      pdfLines.push('endobj');
      pdfLines.push('');

      // Content stream
      const streamContent = this.generatePageContent(page);
      pdfLines.push(`${objNum + 1} 0 obj`);
      pdfLines.push(`<< /Length ${streamContent.length} >>`);
      pdfLines.push('stream');
      pdfLines.push(streamContent);
      pdfLines.push('endstream');
      pdfLines.push('endobj');
      pdfLines.push('');

      objNum += 2;
    }

    // Cross-reference table
    const xrefStart = pdfLines.join('\n').length;
    pdfLines.push('xref');
    pdfLines.push(`0 ${objNum}`);
    pdfLines.push('0000000000 65535 f ');

    // Trailer
    pdfLines.push('trailer');
    pdfLines.push(`<< /Size ${objNum} /Root 1 0 R /Info << /Title (${title}) /Creator (Story Script Export) >> >>`);
    pdfLines.push('startxref');
    pdfLines.push(String(xrefStart));
    pdfLines.push('%%EOF');

    return pdfLines.join('\n');
  }

  private generatePageContent(page: PDFPage): string {
    const lines: string[] = [];
    lines.push('BT'); // Begin text

    for (const element of page.content) {
      if (element.type === 'text' && element.text) {
        const fontSize = element.fontSize || this.format.fontSize;
        const y = this.format.pageHeight - element.y; // PDF coordinates are bottom-up

        lines.push(`/F1 ${fontSize} Tf`);
        lines.push(`${element.x} ${y} Td`);
        lines.push(`(${this.escapeText(element.text)}) Tj`);
        lines.push(`${-element.x} ${-y} Td`); // Reset position
      }
    }

    lines.push('ET'); // End text
    return lines.join('\n');
  }

  private escapeText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/[^\x20-\x7E]/g, ''); // Remove non-ASCII
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
  setOptions(options: Partial<PDFExportOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current options
   */
  getOptions(): PDFExportOptions {
    return { ...this.options };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert script blocks to PDF elements
 */
export function convertToScriptElements(
  blocks: Array<{
    type: string;
    content: string;
    speaker?: string;
  }>
): ScriptElement[] {
  const elements: ScriptElement[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case 'scene-header':
        elements.push({ type: 'scene-header', content: block.content });
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

// Export singleton instance
export const pdfGenerator = new PDFGenerator();

// Export default options
export { DEFAULT_EXPORT_OPTIONS };
