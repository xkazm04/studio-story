/**
 * FormatExporter
 * Industry-standard exports for screenplay, prose, and comic formats
 * Supports PDF, Final Draft XML, Fountain, RTF, and more
 */

import { ScreenplayFormatter, ScreenplayDocument, ScreenplayElement } from './ScreenplayFormatter';
import { ProseFormatter, ProseDocument, ProseElement } from './ProseFormatter';
import { ComicFormatter, ComicDocument, ComicPage, ComicPanel } from './ComicFormatter';

export type ExportFormat =
  | 'fountain'       // Screenplay - Plain text Fountain
  | 'fdx'            // Screenplay - Final Draft XML
  | 'pdf'            // Universal - PDF
  | 'rtf'            // Universal - Rich Text Format
  | 'markdown'       // Universal - Markdown
  | 'html'           // Universal - HTML
  | 'docx'           // Prose - Word document
  | 'epub'           // Prose - E-book format
  | 'celtx';         // Comic - Celtx format

export interface ExportOptions {
  format: ExportFormat;
  includeTitle?: boolean;
  includeToc?: boolean;
  pageSize?: 'letter' | 'a4';
  margins?: { top: number; bottom: number; left: number; right: number };
  fontSize?: number;
  fontFamily?: string;
  lineSpacing?: number;
}

export interface ExportResult {
  content: string;
  mimeType: string;
  filename: string;
  blob?: Blob;
}

const DEFAULT_OPTIONS: ExportOptions = {
  format: 'fountain',
  includeTitle: true,
  includeToc: false,
  pageSize: 'letter',
  margins: { top: 1, bottom: 1, left: 1.5, right: 1 },
  fontSize: 12,
  fontFamily: 'Courier Prime',
  lineSpacing: 1,
};

// Screenplay CSS for HTML/PDF export
const SCREENPLAY_CSS = `
  body { font-family: 'Courier Prime', Courier, monospace; font-size: 12pt; line-height: 1; }
  .scene-heading { text-transform: uppercase; margin-top: 24pt; margin-bottom: 12pt; }
  .action { margin: 12pt 0; }
  .character { text-transform: uppercase; text-align: center; margin-top: 12pt; padding-left: 2in; }
  .dialogue { margin: 0 1.5in; }
  .parenthetical { margin: 0 1.7in; font-style: italic; }
  .transition { text-transform: uppercase; text-align: right; margin: 12pt 0; }
  .centered { text-align: center; margin: 12pt 0; }
  @page { size: letter; margin: 1in 1in 1in 1.5in; }
`;

// Prose CSS for HTML/PDF export
const PROSE_CSS = `
  body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 2; }
  .chapter-heading { font-size: 18pt; text-align: center; margin: 48pt 0 24pt; page-break-before: always; }
  .chapter-heading:first-child { page-break-before: avoid; }
  .section-break { text-align: center; margin: 24pt 0; }
  .paragraph { text-indent: 0.5in; margin: 0; }
  .dialogue { margin: 12pt 0; }
  .thought { font-style: italic; }
  .letter { margin: 24pt 1in; font-style: italic; }
  .quote { margin: 12pt 0.5in; font-style: italic; }
  @page { size: letter; margin: 1in; }
`;

// Comic CSS for HTML export
const COMIC_CSS = `
  body { font-family: 'Comic Sans MS', cursive, sans-serif; font-size: 11pt; line-height: 1.4; }
  .page-header { font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 24pt 0 12pt; border-bottom: 2px solid #000; }
  .panel-header { font-weight: bold; margin: 12pt 0 6pt; background: #f0f0f0; padding: 4pt 8pt; }
  .description { margin: 6pt 0 6pt 20pt; }
  .dialogue { margin: 6pt 0 6pt 40pt; }
  .dialogue .character { font-weight: bold; text-transform: uppercase; }
  .caption { margin: 6pt 0 6pt 40pt; font-style: italic; }
  .sfx { margin: 6pt 0 6pt 40pt; font-weight: bold; text-transform: uppercase; color: #c00; }
  .note { margin: 6pt 0 6pt 40pt; color: #666; font-style: italic; }
  @page { size: letter; margin: 0.75in; }
`;

export class FormatExporter {
  /**
   * Export screenplay document
   */
  static exportScreenplay(
    document: ScreenplayDocument,
    options: Partial<ExportOptions> = {}
  ): ExportResult {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    switch (opts.format) {
      case 'fountain':
        return this.screenplayToFountain(document, opts);
      case 'fdx':
        return this.screenplayToFdx(document, opts);
      case 'html':
        return this.screenplayToHtml(document, opts);
      case 'pdf':
        return this.screenplayToPdfHtml(document, opts);
      case 'markdown':
        return this.screenplayToMarkdown(document, opts);
      default:
        return this.screenplayToFountain(document, opts);
    }
  }

  /**
   * Export prose document
   */
  static exportProse(
    document: ProseDocument,
    options: Partial<ExportOptions> = {}
  ): ExportResult {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    switch (opts.format) {
      case 'markdown':
        return this.proseToMarkdown(document, opts);
      case 'html':
        return this.proseToHtml(document, opts);
      case 'rtf':
        return this.proseToRtf(document, opts);
      case 'pdf':
        return this.proseToPdfHtml(document, opts);
      default:
        return this.proseToMarkdown(document, opts);
    }
  }

  /**
   * Export comic document
   */
  static exportComic(
    document: ComicDocument,
    options: Partial<ExportOptions> = {}
  ): ExportResult {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    switch (opts.format) {
      case 'markdown':
        return this.comicToMarkdown(document, opts);
      case 'html':
        return this.comicToHtml(document, opts);
      case 'pdf':
        return this.comicToPdfHtml(document, opts);
      default:
        return this.comicToMarkdown(document, opts);
    }
  }

  // ===== SCREENPLAY EXPORTERS =====

  private static screenplayToFountain(
    document: ScreenplayDocument,
    _options: ExportOptions
  ): ExportResult {
    const lines: string[] = [];

    // Title page
    if (document.title) {
      lines.push(`Title: ${document.title}`);
      if (document.credit) lines.push(`Credit: ${document.credit}`);
      if (document.author) lines.push(`Author: ${document.author}`);
      if (document.draftDate) lines.push(`Draft date: ${document.draftDate}`);
      lines.push('');
    }

    // Elements
    for (const el of document.elements) {
      switch (el.type) {
        case 'scene_heading':
          lines.push('', el.content.toUpperCase());
          break;
        case 'action':
          lines.push('', el.content);
          break;
        case 'character':
          lines.push('', el.extension ? `${el.content} (${el.extension})` : el.content);
          break;
        case 'dialogue':
          lines.push(el.content);
          break;
        case 'parenthetical':
          lines.push(el.content);
          break;
        case 'transition':
          lines.push('', `> ${el.content}`);
          break;
        case 'centered':
          lines.push(`> ${el.content} <`);
          break;
        case 'page_break':
          lines.push('', '===', '');
          break;
      }
    }

    return {
      content: lines.join('\n'),
      mimeType: 'text/plain',
      filename: `${document.title || 'screenplay'}.fountain`,
    };
  }

  private static screenplayToFdx(
    document: ScreenplayDocument,
    _options: ExportOptions
  ): ExportResult {
    const xmlParts: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<FinalDraft DocumentType="Script" Template="No" Version="1">',
      '<Content>',
    ];

    // Title page
    if (document.title) {
      xmlParts.push('<TitlePage>');
      xmlParts.push(`<Content><Paragraph><Text>${this.escapeXml(document.title)}</Text></Paragraph></Content>`);
      xmlParts.push('</TitlePage>');
    }

    // Elements
    for (const el of document.elements) {
      const type = this.mapToFdxType(el.type);
      if (type) {
        xmlParts.push(`<Paragraph Type="${type}">`);
        xmlParts.push(`<Text>${this.escapeXml(el.content)}</Text>`);
        xmlParts.push('</Paragraph>');
      }
    }

    xmlParts.push('</Content>');
    xmlParts.push('</FinalDraft>');

    return {
      content: xmlParts.join('\n'),
      mimeType: 'application/xml',
      filename: `${document.title || 'screenplay'}.fdx`,
    };
  }

  private static screenplayToHtml(
    document: ScreenplayDocument,
    options: ExportOptions
  ): ExportResult {
    const html = this.buildHtml(
      document.title || 'Screenplay',
      SCREENPLAY_CSS,
      this.screenplayElementsToHtml(document.elements)
    );

    return {
      content: html,
      mimeType: 'text/html',
      filename: `${document.title || 'screenplay'}.html`,
    };
  }

  private static screenplayToPdfHtml(
    document: ScreenplayDocument,
    options: ExportOptions
  ): ExportResult {
    // Return HTML optimized for PDF printing
    return this.screenplayToHtml(document, options);
  }

  private static screenplayToMarkdown(
    document: ScreenplayDocument,
    _options: ExportOptions
  ): ExportResult {
    const lines: string[] = [];

    if (document.title) {
      lines.push(`# ${document.title}`, '');
      if (document.author) lines.push(`*By ${document.author}*`, '');
    }

    for (const el of document.elements) {
      switch (el.type) {
        case 'scene_heading':
          lines.push('', `## ${el.content.toUpperCase()}`, '');
          break;
        case 'action':
          lines.push(el.content, '');
          break;
        case 'character':
          lines.push('', `**${el.content}${el.extension ? ` (${el.extension})` : ''}**`);
          break;
        case 'dialogue':
          lines.push(`> ${el.content}`);
          break;
        case 'parenthetical':
          lines.push(`> *${el.content}*`);
          break;
        case 'transition':
          lines.push('', `---`, '', `*${el.content}*`, '');
          break;
      }
    }

    return {
      content: lines.join('\n'),
      mimeType: 'text/markdown',
      filename: `${document.title || 'screenplay'}.md`,
    };
  }

  private static screenplayElementsToHtml(elements: ScreenplayElement[]): string {
    const parts: string[] = [];

    for (const el of elements) {
      switch (el.type) {
        case 'scene_heading':
          parts.push(`<p class="scene-heading">${this.escapeHtml(el.content)}</p>`);
          break;
        case 'action':
          parts.push(`<p class="action">${this.escapeHtml(el.content)}</p>`);
          break;
        case 'character':
          const ext = el.extension ? ` (${el.extension})` : '';
          parts.push(`<p class="character">${this.escapeHtml(el.content)}${ext}</p>`);
          break;
        case 'dialogue':
          parts.push(`<p class="dialogue">${this.escapeHtml(el.content)}</p>`);
          break;
        case 'parenthetical':
          parts.push(`<p class="parenthetical">${this.escapeHtml(el.content)}</p>`);
          break;
        case 'transition':
          parts.push(`<p class="transition">${this.escapeHtml(el.content)}</p>`);
          break;
        case 'centered':
          parts.push(`<p class="centered">${this.escapeHtml(el.content)}</p>`);
          break;
      }
    }

    return parts.join('\n');
  }

  // ===== PROSE EXPORTERS =====

  private static proseToMarkdown(
    document: ProseDocument,
    _options: ExportOptions
  ): ExportResult {
    const lines: string[] = [];

    if (document.title) {
      lines.push(`# ${document.title}`, '');
      if (document.author) lines.push(`*By ${document.author}*`, '');
      lines.push('---', '');
    }

    for (const el of document.elements) {
      switch (el.type) {
        case 'chapter_heading':
          lines.push('', `## ${el.content}`, '');
          break;
        case 'section_break':
          lines.push('', '***', '');
          break;
        case 'paragraph':
          lines.push(el.content, '');
          break;
        case 'dialogue':
          lines.push(el.content, '');
          break;
        case 'thought':
          lines.push(`*${el.content}*`, '');
          break;
        case 'quote':
          lines.push(`> ${el.content}`, '');
          break;
        case 'letter':
          lines.push('', '> ---', `> ${el.content.split('\n').join('\n> ')}`, '> ---', '');
          break;
      }
    }

    return {
      content: lines.join('\n'),
      mimeType: 'text/markdown',
      filename: `${document.title || 'prose'}.md`,
    };
  }

  private static proseToHtml(
    document: ProseDocument,
    _options: ExportOptions
  ): ExportResult {
    const html = this.buildHtml(
      document.title || 'Document',
      PROSE_CSS,
      this.proseElementsToHtml(document.elements)
    );

    return {
      content: html,
      mimeType: 'text/html',
      filename: `${document.title || 'prose'}.html`,
    };
  }

  private static proseToPdfHtml(
    document: ProseDocument,
    options: ExportOptions
  ): ExportResult {
    return this.proseToHtml(document, options);
  }

  private static proseToRtf(
    document: ProseDocument,
    _options: ExportOptions
  ): ExportResult {
    const rtfParts: string[] = [
      '{\\rtf1\\ansi\\deff0',
      '{\\fonttbl{\\f0 Times New Roman;}}',
      '\\f0\\fs24',
    ];

    if (document.title) {
      rtfParts.push(`\\qc\\b\\fs36 ${this.escapeRtf(document.title)}\\b0\\fs24\\par\\par`);
    }

    for (const el of document.elements) {
      switch (el.type) {
        case 'chapter_heading':
          rtfParts.push(`\\page\\qc\\b\\fs28 ${this.escapeRtf(el.content)}\\b0\\fs24\\ql\\par\\par`);
          break;
        case 'section_break':
          rtfParts.push('\\qc * * *\\ql\\par\\par');
          break;
        case 'paragraph':
          rtfParts.push(`\\fi720 ${this.escapeRtf(el.content)}\\par\\par`);
          break;
        case 'dialogue':
          rtfParts.push(`${this.escapeRtf(el.content)}\\par\\par`);
          break;
        case 'thought':
          rtfParts.push(`\\i ${this.escapeRtf(el.content)}\\i0\\par\\par`);
          break;
      }
    }

    rtfParts.push('}');

    return {
      content: rtfParts.join('\n'),
      mimeType: 'application/rtf',
      filename: `${document.title || 'prose'}.rtf`,
    };
  }

  private static proseElementsToHtml(elements: ProseElement[]): string {
    const parts: string[] = [];

    for (const el of elements) {
      switch (el.type) {
        case 'chapter_heading':
          parts.push(`<h2 class="chapter-heading">${this.escapeHtml(el.content)}</h2>`);
          break;
        case 'section_break':
          parts.push('<p class="section-break">* * *</p>');
          break;
        case 'paragraph':
          parts.push(`<p class="paragraph">${this.escapeHtml(el.content)}</p>`);
          break;
        case 'dialogue':
          parts.push(`<p class="dialogue">${this.escapeHtml(el.content)}</p>`);
          break;
        case 'thought':
          parts.push(`<p class="thought">${this.escapeHtml(el.content)}</p>`);
          break;
        case 'quote':
          parts.push(`<blockquote class="quote">${this.escapeHtml(el.content)}</blockquote>`);
          break;
        case 'letter':
          parts.push(`<div class="letter">${this.escapeHtml(el.content).replace(/\n/g, '<br>')}</div>`);
          break;
      }
    }

    return parts.join('\n');
  }

  // ===== COMIC EXPORTERS =====

  private static comicToMarkdown(
    document: ComicDocument,
    _options: ExportOptions
  ): ExportResult {
    const lines: string[] = [];

    if (document.title) {
      lines.push(`# ${document.title}`, '');
      if (document.writer) lines.push(`*Writer: ${document.writer}*`);
      if (document.artist) lines.push(`*Artist: ${document.artist}*`);
      lines.push('---', '');
    }

    for (const page of document.pages) {
      const pageType = page.type !== 'regular' ? ` (${page.type.toUpperCase()})` : '';
      lines.push('', `## PAGE ${page.pageNumber}${pageType}`, '');

      for (const panel of page.panels) {
        const size = panel.size ? ` (${panel.size})` : '';
        lines.push(`### Panel ${panel.panelNumber}${size}`, '');

        for (const el of panel.elements) {
          switch (el.type) {
            case 'description':
              lines.push(el.content, '');
              break;
            case 'dialogue':
              lines.push(`**${el.character}:** ${el.content}`, '');
              break;
            case 'caption':
              lines.push(`*CAP: ${el.content}*`, '');
              break;
            case 'sfx':
              lines.push(`**SFX:** ${el.content}`, '');
              break;
            case 'note':
              lines.push(`> [${el.content}]`, '');
              break;
          }
        }
      }
    }

    return {
      content: lines.join('\n'),
      mimeType: 'text/markdown',
      filename: `${document.title || 'comic'}.md`,
    };
  }

  private static comicToHtml(
    document: ComicDocument,
    _options: ExportOptions
  ): ExportResult {
    const html = this.buildHtml(
      document.title || 'Comic Script',
      COMIC_CSS,
      this.comicPagesToHtml(document.pages)
    );

    return {
      content: html,
      mimeType: 'text/html',
      filename: `${document.title || 'comic'}.html`,
    };
  }

  private static comicToPdfHtml(
    document: ComicDocument,
    options: ExportOptions
  ): ExportResult {
    return this.comicToHtml(document, options);
  }

  private static comicPagesToHtml(pages: ComicPage[]): string {
    const parts: string[] = [];

    for (const page of pages) {
      const pageType = page.type !== 'regular' ? ` (${page.type.toUpperCase()})` : '';
      parts.push(`<div class="page-header">PAGE ${page.pageNumber}${pageType}</div>`);

      for (const panel of page.panels) {
        const size = panel.size ? ` - ${panel.size}` : '';
        parts.push(`<div class="panel-header">Panel ${panel.panelNumber}${size}</div>`);

        for (const el of panel.elements) {
          switch (el.type) {
            case 'description':
              parts.push(`<p class="description">${this.escapeHtml(el.content)}</p>`);
              break;
            case 'dialogue':
              parts.push(`<p class="dialogue"><span class="character">${el.character}:</span> ${this.escapeHtml(el.content)}</p>`);
              break;
            case 'caption':
              parts.push(`<p class="caption">CAP: ${this.escapeHtml(el.content)}</p>`);
              break;
            case 'sfx':
              parts.push(`<p class="sfx">SFX: ${this.escapeHtml(el.content)}</p>`);
              break;
            case 'note':
              parts.push(`<p class="note">[${this.escapeHtml(el.content)}]</p>`);
              break;
          }
        }
      }
    }

    return parts.join('\n');
  }

  // ===== UTILITIES =====

  private static buildHtml(title: string, css: string, body: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)}</title>
  <style>${css}</style>
</head>
<body>
${body}
</body>
</html>`;
  }

  private static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private static escapeXml(text: string): string {
    return this.escapeHtml(text);
  }

  private static escapeRtf(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}');
  }

  private static mapToFdxType(type: string): string | null {
    const mapping: Record<string, string> = {
      'scene_heading': 'Scene Heading',
      'action': 'Action',
      'character': 'Character',
      'dialogue': 'Dialogue',
      'parenthetical': 'Parenthetical',
      'transition': 'Transition',
    };
    return mapping[type] || null;
  }

  /**
   * Create downloadable blob from export result
   */
  static createBlob(result: ExportResult): Blob {
    return new Blob([result.content], { type: result.mimeType });
  }

  /**
   * Trigger download of export result
   */
  static download(result: ExportResult): void {
    const blob = this.createBlob(result);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export default FormatExporter;
