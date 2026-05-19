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

// Story PDF Generator
export { StoryPDFGenerator } from './StoryPDFGenerator';

// HTML5 Bundle Generator
export { HTML5BundleGenerator } from './HTML5BundleGenerator';

// Visual Novel Generator
export { VisualNovelGenerator } from './VisualNovelGenerator';

// VN Export Bridge utilities
export {
  buildVNExportScenes,
  findReachableScenes,
  generateGradientBackground,
  type ExportSummary,
  type VNSceneInput,
  type VNActInput,
  type BuildVNExportParams,
} from './vnExportBridge';

// Canonical Script Element Type
export {
  type ScriptElementType as CanonicalScriptElementType,
  type PdfElementType,
  type FountainElementType as CanonicalFountainElementType,
  type ScreenplayElementType as CanonicalScreenplayElementType,
} from './types';

// Canonical Script Block — single type replacing FountainElement, ScriptElement, etc.
export {
  type ScriptBlock,
  type ScriptBlockInput,
  type ScriptBlockMetadata,
  convertToScriptBlocks,
} from './types';

// Shared Story Export Types
export { type StoryExportData, type StoryExportScene, slugify } from './types';

// Unified Export Result
export { type ExportMetadata, type LegacyExportResult } from './types';

// Standardized Result Contract
export {
  ExportError,
  exportSuccess,
  exportFailure,
  type ExportErrorCode,
  type ExportData,
  type ExportResult,
} from './result';

// Script Block Validator
export {
  validateScriptBlocks,
  type ValidationResult,
  type ValidationIssue,
  type ValidationSeverity,
  type ValidatableBlock,
} from './validator';

// Fountain Exporter
export {
  FountainExporter,
  FountainParser,
  fountainExporter,
  fountainParser,
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

export type ExportFormat = 'pdf' | 'epub' | 'fountain' | 'rtf' | 'docx' | 'txt' | 'story-pdf' | 'html5' | 'visual-novel';

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

// ExportResult is now imported from './types' and re-exported above

// ============================================================================
// Unified Export Function
// ============================================================================

import { PDFGenerator, type TitlePageInfo } from './PDFGenerator';
import { EPUBBuilder, convertToEPUBChapters, type EPUBMetadata } from './EPUBBuilder';
import { FountainExporter, type FountainTitlePage } from './FountainExporter';
import { convertToScriptBlocks } from './types';
import { StoryPDFGenerator as _StoryPDFGenerator } from './StoryPDFGenerator';
import { HTML5BundleGenerator as _HTML5BundleGenerator } from './HTML5BundleGenerator';
import { VisualNovelGenerator as _VisualNovelGenerator } from './VisualNovelGenerator';
import type { StoryExportData } from './types';
import type { ExportResult, ExportData } from './result';
import { exportSuccess, exportFailure } from './result';
import { validateScriptBlocks } from './validator';

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
 * Export script to specified format.
 *
 * Returns a discriminated ExportResult — check `result.success` before
 * accessing `result.data`.
 */
export async function exportScript(
  data: ScriptData,
  options: ExportOptions
): Promise<ExportResult<ExportData>> {
  // Pre-export validation — fail fast on structural errors
  const validation = validateScriptBlocks(data.blocks);
  if (!validation.valid) {
    const summary = validation.errors
      .map(e => `Block ${e.blockIndex}: ${e.message}`)
      .join('; ');
    return exportFailure('INVALID_INPUT', `Script validation failed: ${summary}`);
  }

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
    case 'story-pdf':
      return exportToStoryPDF(data);
    case 'html5':
      return exportToHTML5(data);
    case 'visual-novel':
      return exportToVisualNovel(data);
    default:
      return exportFailure('INVALID_INPUT', `Unsupported export format: ${format}`);
  }
}

async function exportToPDF(
  data: ScriptData,
  options: ExportOptions
): Promise<ExportResult<ExportData>> {
  const generator = new PDFGenerator({
    includeTitlePage: options.includeTitlePage,
    includeSceneNumbers: options.includeSceneNumbers,
    ...options.pdf,
  });

  const elements = convertToScriptBlocks(data.blocks);

  const titleInfo: TitlePageInfo = {
    title: data.title,
    author: data.author,
    contact: data.metadata?.contact,
    copyright: data.metadata?.copyright,
  };

  const result = await generator.generateScreenplay(elements, titleInfo);
  if (!result.success) return result;

  return exportSuccess({
    blob: result.data.blob,
    filename: options.filename || result.data.filename,
    format: 'pdf',
    metadata: {
      pageCount: result.data.metadata.pageCount,
      sceneCount: data.blocks.filter(b => b.type === 'scene-header').length,
    },
  });
}

async function exportToEPUB(
  data: ScriptData,
  options: ExportOptions
): Promise<ExportResult<ExportData>> {
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
  if (!result.success) return result;

  return exportSuccess({
    blob: result.data.blob,
    filename: options.filename || result.data.filename,
    format: 'epub',
    metadata: {
      chapterCount: result.data.metadata.chapterCount,
      wordCount: result.data.metadata.wordCount,
    },
  });
}

async function exportToFountain(
  data: ScriptData,
  options: ExportOptions
): Promise<ExportResult<ExportData>> {
  const exporter = new FountainExporter({
    includeTitlePage: options.includeTitlePage,
    includeSceneNumbers: options.includeSceneNumbers,
    ...options.fountain,
  });

  const elements = convertToScriptBlocks(data.blocks);

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

  const blob = new Blob([result.content!], { type: 'text/plain;charset=utf-8' });

  return exportSuccess({
    blob,
    filename: options.filename || result.filename,
    format: 'fountain',
    metadata: {
      pageCount: result.metadata.pageEstimate,
      sceneCount: result.metadata.sceneCount,
    },
  });
}

async function exportToPlainText(
  data: ScriptData,
  options: ExportOptions
): Promise<ExportResult<ExportData>> {
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

  return exportSuccess({
    blob,
    filename,
    format: 'txt',
    metadata: {
      sceneCount: data.blocks.filter(b => b.type === 'scene-header').length,
      wordCount: content.split(/\s+/).length,
    },
  });
}

/**
 * Convert ScriptData to StoryExportData for story-pdf export.
 */
async function exportToStoryPDF(data: ScriptData): Promise<ExportResult<ExportData>> {
  const sceneMap = new Map<string, string[]>();
  for (const block of data.blocks) {
    const existing = sceneMap.get(block.sceneId) || [];
    existing.push(block.content);
    sceneMap.set(block.sceneId, existing);
  }

  const scenes = data.scenes || Array.from(sceneMap.keys()).map((id, i) => ({
    id,
    name: `Scene ${i + 1}`,
  }));

  const storyData: StoryExportData = {
    title: data.title,
    author: data.author,
    scenes: scenes.map((s) => ({
      id: s.id,
      name: s.name,
      content: (sceneMap.get(s.id) || []).join('\n\n'),
    })),
    metadata: data.metadata ? {
      description: data.metadata.description,
      genre: data.metadata.genre,
    } : undefined,
  };

  const generator = new _StoryPDFGenerator();
  return generator.generate(storyData);
}

/**
 * Export story data as a self-contained HTML5 bundle.
 */
async function exportToHTML5(data: ScriptData): Promise<ExportResult<ExportData>> {
  const sceneMap = new Map<string, string[]>();
  for (const block of data.blocks) {
    const existing = sceneMap.get(block.sceneId) || [];
    existing.push(block.content);
    sceneMap.set(block.sceneId, existing);
  }

  const scenes = data.scenes || Array.from(sceneMap.keys()).map((id, i) => ({
    id,
    name: `Scene ${i + 1}`,
  }));

  const storyData: StoryExportData = {
    title: data.title,
    author: data.author,
    scenes: scenes.map((s) => ({
      id: s.id,
      name: s.name,
      content: (sceneMap.get(s.id) || []).join('\n\n'),
    })),
    metadata: data.metadata ? {
      description: data.metadata.description,
      genre: data.metadata.genre,
    } : undefined,
  };

  const generator = new _HTML5BundleGenerator();
  return generator.generate(storyData);
}

/**
 * Export story data as an interactive visual novel HTML file.
 */
async function exportToVisualNovel(data: ScriptData): Promise<ExportResult<ExportData>> {
  const sceneMap = new Map<string, string[]>();
  for (const block of data.blocks) {
    const existing = sceneMap.get(block.sceneId) || [];
    existing.push(block.content);
    sceneMap.set(block.sceneId, existing);
  }

  const scenes = data.scenes || Array.from(sceneMap.keys()).map((id, i) => ({
    id,
    name: `Scene ${i + 1}`,
  }));

  const storyData: StoryExportData = {
    title: data.title,
    author: data.author,
    scenes: scenes.map((s) => ({
      id: s.id,
      name: s.name,
      content: (sceneMap.get(s.id) || []).join('\n\n'),
    })),
    metadata: data.metadata ? {
      description: data.metadata.description,
      genre: data.metadata.genre,
    } : undefined,
  };

  const generator = new _VisualNovelGenerator();
  return generator.generate(storyData);
}

/**
 * Download an exported file. Accepts the data payload from a successful result.
 * Callers should check `result.success` before calling this.
 */
export function downloadExport(data: ExportData): void {
  const blob = data.blob ?? (data.content ? new Blob([data.content], { type: data.mimeType || 'text/plain' }) : null);
  if (!blob) throw new Error('Export data has no blob or content to download');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = data.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
