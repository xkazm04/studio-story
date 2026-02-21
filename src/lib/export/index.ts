/**
 * Export Library - Professional Script Export System
 *
 * Provides comprehensive export functionality for scripts including:
 * - PDF screenplay export (industry standard)
 * - EPUB/MOBI e-book export
 * - Fountain plain text format
 * - RTF/DOCX word processing formats
 */

// PDF Generator
export {
  PDFGenerator,
  pdfGenerator,
  convertToScriptElements,
  DEFAULT_EXPORT_OPTIONS as DEFAULT_PDF_OPTIONS,
  type ScriptElement,
  type ScriptElementType,
  type TitlePageInfo,
  type PDFExportOptions,
  type PDFGeneratorResult,
} from './PDFGenerator';

// EPUB Builder
export {
  EPUBBuilder,
  epubBuilder,
  convertToEPUBChapters,
  DEFAULT_EPUB_OPTIONS,
  type EPUBMetadata,
  type EPUBChapter,
  type EPUBImage,
  type EPUBExportOptions,
  type EPUBGeneratorResult,
} from './EPUBBuilder';

// Fountain Exporter
export {
  FountainExporter,
  FountainParser,
  fountainExporter,
  fountainParser,
  convertToFountainElements,
  validateFountain,
  DEFAULT_FOUNTAIN_OPTIONS,
  type FountainElement,
  type FountainElementType,
  type FountainTitlePage,
  type FountainExportOptions,
  type FountainExportResult,
} from './FountainExporter';

// ============================================================================
// Unified Export Types
// ============================================================================

export type ExportFormat = 'pdf' | 'epub' | 'fountain' | 'rtf' | 'docx' | 'txt';

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;

  // Common options
  includeTitlePage: boolean;
  includeSceneNumbers: boolean;

  // Format-specific options
  pdf?: Partial<import('./PDFGenerator').PDFExportOptions>;
  epub?: Partial<import('./EPUBBuilder').EPUBExportOptions>;
  fountain?: Partial<import('./FountainExporter').FountainExportOptions>;
}

export interface ExportResult {
  blob: Blob;
  filename: string;
  format: ExportFormat;
  metadata: {
    pageCount?: number;
    chapterCount?: number;
    sceneCount?: number;
    wordCount?: number;
  };
}

// ============================================================================
// Unified Export Function
// ============================================================================

import { PDFGenerator, convertToScriptElements, type TitlePageInfo } from './PDFGenerator';
import { EPUBBuilder, convertToEPUBChapters, type EPUBMetadata } from './EPUBBuilder';
import { FountainExporter, convertToFountainElements, type FountainTitlePage } from './FountainExporter';

export interface ScriptData {
  title: string;
  author: string;
  blocks: Array<{
    id: string;
    sceneId: string;
    type: string;
    content: string;
    speaker?: string;
    order: number;
  }>;
  scenes?: Array<{
    id: string;
    name: string;
  }>;
  metadata?: {
    description?: string;
    genre?: string;
    copyright?: string;
    contact?: {
      name?: string;
      email?: string;
      phone?: string;
      address?: string[];
    };
  };
}

/**
 * Export script to specified format
 */
export async function exportScript(
  data: ScriptData,
  options: ExportOptions
): Promise<ExportResult> {
  const { format } = options;

  switch (format) {
    case 'pdf':
      return exportToPDF(data, options);
    case 'epub':
      return exportToEPUB(data, options);
    case 'fountain':
      return exportToFountain(data, options);
    case 'txt':
      return exportToPlainText(data, options);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

async function exportToPDF(
  data: ScriptData,
  options: ExportOptions
): Promise<ExportResult> {
  const generator = new PDFGenerator({
    includeTitlePage: options.includeTitlePage,
    includeSceneNumbers: options.includeSceneNumbers,
    ...options.pdf,
  });

  const elements = convertToScriptElements(data.blocks);

  const titleInfo: TitlePageInfo = {
    title: data.title,
    author: data.author,
    contact: data.metadata?.contact,
    copyright: data.metadata?.copyright,
  };

  const result = await generator.generateScreenplay(elements, titleInfo);

  return {
    blob: result.blob,
    filename: options.filename || result.filename,
    format: 'pdf',
    metadata: {
      pageCount: result.pageCount,
      sceneCount: data.blocks.filter(b => b.type === 'scene-header').length,
    },
  };
}

async function exportToEPUB(
  data: ScriptData,
  options: ExportOptions
): Promise<ExportResult> {
  const builder = new EPUBBuilder({
    includeTableOfContents: options.includeTitlePage,
    ...options.epub,
  });

  // Group blocks by scene for chapters
  const sceneMap = new Map<string, typeof data.blocks>();
  for (const block of data.blocks) {
    const existing = sceneMap.get(block.sceneId) || [];
    existing.push(block);
    sceneMap.set(block.sceneId, existing);
  }

  const scenes = data.scenes || Array.from(sceneMap.keys()).map((id, i) => ({
    id,
    name: `Scene ${i + 1}`,
  }));

  const chaptersData = scenes.map(scene => ({
    id: scene.id,
    name: scene.name,
    blocks: sceneMap.get(scene.id) || [],
  }));

  const chapters = convertToEPUBChapters(chaptersData);

  const metadata: EPUBMetadata = {
    title: data.title,
    author: data.author,
    language: 'en',
    identifier: `urn:uuid:${crypto.randomUUID()}`,
    description: data.metadata?.description,
    rights: data.metadata?.copyright,
  };

  builder.setMetadata(metadata);
  builder.addChapters(chapters);

  const result = await builder.build();

  return {
    blob: result.blob,
    filename: options.filename || result.filename,
    format: 'epub',
    metadata: {
      chapterCount: result.chapterCount,
      wordCount: result.wordCount,
    },
  };
}

async function exportToFountain(
  data: ScriptData,
  options: ExportOptions
): Promise<ExportResult> {
  const exporter = new FountainExporter({
    includeTitlePage: options.includeTitlePage,
    includeSceneNumbers: options.includeSceneNumbers,
    ...options.fountain,
  });

  const elements = convertToFountainElements(data.blocks);

  const titlePage: FountainTitlePage = {
    title: data.title,
    author: data.author,
    contact: data.metadata?.contact
      ? [
          data.metadata.contact.name,
          ...(data.metadata.contact.address || []),
          data.metadata.contact.phone,
          data.metadata.contact.email,
        ].filter(Boolean).join('\n')
      : undefined,
    copyright: data.metadata?.copyright,
  };

  const result = exporter.export(elements, titlePage);

  const blob = new Blob([result.content], { type: 'text/plain;charset=utf-8' });

  return {
    blob,
    filename: options.filename || result.filename,
    format: 'fountain',
    metadata: {
      pageCount: result.pageEstimate,
      sceneCount: result.sceneCount,
    },
  };
}

async function exportToPlainText(
  data: ScriptData,
  options: ExportOptions
): Promise<ExportResult> {
  const lines: string[] = [];

  // Title
  if (options.includeTitlePage) {
    lines.push(data.title.toUpperCase());
    lines.push('');
    lines.push(`by ${data.author}`);
    lines.push('');
    lines.push('='.repeat(60));
    lines.push('');
  }

  // Content
  for (const block of data.blocks) {
    switch (block.type) {
      case 'scene-header':
        lines.push('');
        lines.push(block.content.toUpperCase());
        lines.push('');
        break;
      case 'description':
      case 'content':
        lines.push(block.content);
        lines.push('');
        break;
      case 'dialogue':
        if (block.speaker) {
          lines.push(`    ${block.speaker.toUpperCase()}`);
        }
        lines.push(`        ${block.content}`);
        lines.push('');
        break;
      case 'direction':
        lines.push(`(${block.content})`);
        break;
    }
  }

  const content = lines.join('\n');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const filename = options.filename || `${data.title.toLowerCase().replace(/\s+/g, '_')}.txt`;

  return {
    blob,
    filename,
    format: 'txt',
    metadata: {
      sceneCount: data.blocks.filter(b => b.type === 'scene-header').length,
      wordCount: content.split(/\s+/).length,
    },
  };
}

/**
 * Download exported file
 */
export function downloadExport(result: ExportResult): void {
  const url = URL.createObjectURL(result.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
