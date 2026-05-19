/**
 * StoryPDFGenerator - Illustrated Story PDF Export
 *
 * Produces PDF files with:
 * - Title page with story title, author, genre
 * - Formatted prose text per scene
 * - Embedded illustration images (JPEG) between scene prose
 * - Proper page breaks and margins
 *
 * Extends the hand-rolled PDF binary approach from PDFGenerator.
 * Does NOT use any external PDF library.
 */

import type { StoryExportData, StoryExportScene } from './types';
import type { ExportResult, ExportData } from './result';
import { exportSuccess, exportFailure } from './result';
import { escapePdfText } from './utils';
import { slugify } from './types';

// ============================================================================
// Constants
// ============================================================================

const FORMAT = {
  pageWidth: 612,    // 8.5 inches in points
  pageHeight: 792,   // 11 inches in points
  marginTop: 72,     // 1 inch
  marginBottom: 72,
  marginLeft: 72,
  marginRight: 72,
  contentWidth: 468, // 612 - 72 - 72
  fontSize: 11,
  lineHeight: 14,
  headingSize: 16,
  titleSize: 28,
  subtitleSize: 14,
};

// ============================================================================
// Internal Types
// ============================================================================

interface PDFObject {
  id: number;
  content: string;
}

interface ImageData {
  bytes: Uint8Array;
  width: number;
  height: number;
}

// ============================================================================
// StoryPDFGenerator
// ============================================================================

export class StoryPDFGenerator {
  private objects: PDFObject[] = [];
  private nextObjId = 1;
  private pageObjIds: number[] = [];
  private imageObjIds: number[] = [];

  /**
   * Generate a story PDF with embedded illustrations.
   */
  async generate(data: StoryExportData): Promise<ExportResult<ExportData>> {
    try {
    // Reset state
    this.objects = [];
    this.nextObjId = 1;
    this.pageObjIds = [];
    this.imageObjIds = [];

    // Fetch all scene images in parallel
    const imageMap = new Map<string, ImageData>();
    const imagePromises = data.scenes
      .filter((s) => s.imageUrl)
      .map(async (s) => {
        try {
          const imgData = await this.fetchImage(s.imageUrl!);
          if (imgData) imageMap.set(s.id, imgData);
        } catch {
          // Skip failed image fetches gracefully
        }
      });
    await Promise.all(imagePromises);

    // Reserve object IDs: 1=catalog, 2=pages, 3=font, 4=bold font
    this.nextObjId = 5;

    // First, create image XObjects so we know their object IDs
    const sceneImageObjMap = new Map<string, number>();
    for (const scene of data.scenes) {
      const imgData = imageMap.get(scene.id);
      if (imgData) {
        const objId = this.nextObjId++;
        sceneImageObjMap.set(scene.id, objId);
        this.imageObjIds.push(objId);
      }
    }

    // Build pages
    const pages = this.buildPages(data, sceneImageObjMap);

    // Now assign object IDs for pages and their content streams
    const pageStartId = this.nextObjId;
    for (let i = 0; i < pages.length; i++) {
      this.pageObjIds.push(pageStartId + i * 2);
      this.nextObjId += 2; // page obj + content stream obj
    }

    // === Build PDF objects ===

    // Object 1: Catalog
    this.addObj(1, '<< /Type /Catalog /Pages 2 0 R >>');

    // Object 2: Pages
    const kidRefs = this.pageObjIds.map((id) => `${id} 0 R`).join(' ');
    this.addObj(2, `<< /Type /Pages /Kids [${kidRefs}] /Count ${this.pageObjIds.length} >>`);

    // Object 3: Font (Helvetica for body text)
    this.addObj(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

    // Object 4: Bold font
    this.addObj(4, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

    // Image XObjects
    for (const scene of data.scenes) {
      const imgData = imageMap.get(scene.id);
      const objId = sceneImageObjMap.get(scene.id);
      if (imgData && objId) {
        this.addImageObject(objId, imgData);
      }
    }

    // Page objects + content streams
    for (let i = 0; i < pages.length; i++) {
      const pageObjId = this.pageObjIds[i];
      const streamObjId = pageObjId + 1;
      const page = pages[i];

      // Build resource dict -- include image refs if page uses images
      let resourceDict = '/Font << /F1 3 0 R /F2 4 0 R >>';
      if (page.imageRefs.length > 0) {
        const xobjEntries = page.imageRefs
          .map((ref) => `/Img${ref} ${ref} 0 R`)
          .join(' ');
        resourceDict += ` /XObject << ${xobjEntries} >>`;
      }

      this.addObj(
        pageObjId,
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${FORMAT.pageWidth} ${FORMAT.pageHeight}] /Contents ${streamObjId} 0 R /Resources << ${resourceDict} >> >>`,
      );

      const stream = page.stream;
      this.addObj(
        streamObjId,
        `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
      );
    }

    // Serialize to PDF binary string
    const pdfContent = this.serializePDF(data.title);
    const blob = new Blob([pdfContent], { type: 'application/pdf' });

    return exportSuccess({
      blob,
      filename: `${slugify(data.title)}.pdf`,
      format: 'story-pdf',
      metadata: {
        pageCount: pages.length,
        sceneCount: data.scenes.length,
      },
    });
    } catch (err) {
      return exportFailure(
        'GENERATION_FAILED',
        err instanceof Error ? err.message : 'Story PDF generation failed',
        err,
      );
    }
  }

  // ==========================================================================
  // Page Building
  // ==========================================================================

  private buildPages(
    data: StoryExportData,
    imageObjMap: Map<string, number>,
  ): Array<{ stream: string; imageRefs: number[] }> {
    const pages: Array<{ stream: string; imageRefs: number[] }> = [];
    let currentLines: string[] = [];
    let currentImageRefs: number[] = [];
    let cursorY = FORMAT.pageHeight - FORMAT.marginTop;

    const flushPage = () => {
      const stream = ['BT', ...currentLines, 'ET'].join('\n');
      pages.push({ stream, imageRefs: [...currentImageRefs] });
      currentLines = [];
      currentImageRefs = [];
      cursorY = FORMAT.pageHeight - FORMAT.marginTop;
    };

    const ensureSpace = (needed: number) => {
      if (cursorY - needed < FORMAT.marginBottom) {
        flushPage();
      }
    };

    const addTextLine = (
      text: string,
      x: number,
      fontSize: number,
      fontKey: string,
    ) => {
      ensureSpace(fontSize + 4);
      currentLines.push(`/${fontKey} ${fontSize} Tf`);
      currentLines.push(`${x} ${cursorY} Td`);
      currentLines.push(`(${this.escapeText(text)}) Tj`);
      currentLines.push(`${-x} ${-cursorY} Td`);
      cursorY -= FORMAT.lineHeight;
    };

    const addWrappedText = (
      text: string,
      x: number,
      maxWidth: number,
      fontSize: number,
      fontKey: string,
    ) => {
      const charWidth = fontSize * 0.5;
      const charsPerLine = Math.floor(maxWidth / charWidth);
      const wrapped = this.wrapText(text, charsPerLine);
      for (const line of wrapped) {
        addTextLine(line, x, fontSize, fontKey);
      }
    };

    // === Title Page ===
    cursorY = FORMAT.pageHeight * 0.6;

    // Title
    addTextLine(data.title, FORMAT.marginLeft, FORMAT.titleSize, 'F2');
    cursorY -= FORMAT.titleSize;

    // Author
    addTextLine(`by ${data.author}`, FORMAT.marginLeft, FORMAT.subtitleSize, 'F1');
    cursorY -= FORMAT.subtitleSize;

    // Genre/description
    if (data.metadata?.genre) {
      cursorY -= 10;
      addTextLine(data.metadata.genre, FORMAT.marginLeft, FORMAT.fontSize, 'F1');
    }
    if (data.metadata?.description) {
      cursorY -= 4;
      addWrappedText(
        data.metadata.description,
        FORMAT.marginLeft,
        FORMAT.contentWidth,
        FORMAT.fontSize,
        'F1',
      );
    }

    flushPage(); // End title page

    // === Scene Pages ===
    for (const scene of data.scenes) {
      // Scene heading
      ensureSpace(FORMAT.headingSize + FORMAT.lineHeight * 2);
      addTextLine(scene.name, FORMAT.marginLeft, FORMAT.headingSize, 'F2');
      cursorY -= 8; // Extra space after heading

      // Scene prose content
      addWrappedText(
        scene.content,
        FORMAT.marginLeft,
        FORMAT.contentWidth,
        FORMAT.fontSize,
        'F1',
      );
      cursorY -= FORMAT.lineHeight; // Paragraph gap

      // Embedded illustration image
      const imgObjId = imageObjMap.get(scene.id);
      if (imgObjId) {
        // Close text block, draw image, reopen text block
        currentLines.push('ET');

        // Scale image to fit content width while preserving aspect ratio
        // Use a fixed display size (content width x proportional height)
        const displayWidth = FORMAT.contentWidth;
        const displayHeight = Math.min(300, FORMAT.contentWidth * 0.67);

        ensureSpace(displayHeight + 20);
        cursorY -= displayHeight;

        // Image placement: cm matrix is [width 0 0 height x y]
        currentLines.push('q');
        currentLines.push(
          `${displayWidth} 0 0 ${displayHeight} ${FORMAT.marginLeft} ${cursorY} cm`,
        );
        currentLines.push(`/Img${imgObjId} Do`);
        currentLines.push('Q');

        cursorY -= 10; // Gap after image

        // Reopen text block
        currentLines.push('BT');

        currentImageRefs.push(imgObjId);
      }

      cursorY -= FORMAT.lineHeight * 2; // Gap between scenes
    }

    // Flush remaining content
    if (currentLines.length > 0) {
      flushPage();
    }

    return pages;
  }

  // ==========================================================================
  // Image Handling
  // ==========================================================================

  private async fetchImage(url: string): Promise<ImageData | null> {
    const response = await fetch(url);
    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Use fixed dimensions; real image dimension parsing would need
    // format-specific header decoding which is out of scope for the MVP.
    // The cm matrix in the content stream controls display size.
    return { bytes, width: 468, height: 314 };
  }

  private addImageObject(objId: number, imgData: ImageData): void {
    // Convert bytes to hex string for the PDF stream
    const hexString = Array.from(imgData.bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const streamContent = hexString;

    this.addObj(
      objId,
      [
        '<< /Type /XObject /Subtype /Image',
        `/Width ${imgData.width} /Height ${imgData.height}`,
        '/ColorSpace /DeviceRGB /BitsPerComponent 8',
        '/Filter /DCTDecode',
        `/Length ${streamContent.length}`,
        '>>',
        'stream',
        streamContent,
        'endstream',
      ].join('\n'),
    );
  }

  // ==========================================================================
  // PDF Serialization
  // ==========================================================================

  private addObj(id: number, content: string): void {
    this.objects.push({ id, content });
  }

  private serializePDF(title: string): string {
    const lines: string[] = [];

    lines.push('%PDF-1.4');
    lines.push('%\xE2\xE3\xCF\xD3');
    lines.push('');

    // Sort objects by ID for clean output
    const sorted = [...this.objects].sort((a, b) => a.id - b.id);

    for (const obj of sorted) {
      lines.push(`${obj.id} 0 obj`);
      lines.push(obj.content);
      lines.push('endobj');
      lines.push('');
    }

    // Cross-reference table (simplified)
    const xrefStart = lines.join('\n').length;
    const totalObjs = sorted.length + 1; // +1 for free entry
    lines.push('xref');
    lines.push(`0 ${totalObjs}`);
    lines.push('0000000000 65535 f ');

    // Trailer
    lines.push('trailer');
    lines.push(
      `<< /Size ${totalObjs} /Root 1 0 R /Info << /Title (${this.escapeText(title)}) /Creator (Story Studio Export) >> >>`,
    );
    lines.push('startxref');
    lines.push(String(xrefStart));
    lines.push('%%EOF');

    return lines.join('\n');
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  private escapeText(text: string): string {
    return escapePdfText(text);
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
        if (currentLine) lines.push(currentLine);
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

    if (currentLine) lines.push(currentLine);
    return lines.length > 0 ? lines : [''];
  }
}
