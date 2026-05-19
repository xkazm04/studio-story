/**
 * Shared Export Types
 *
 * Re-exports canonical element types from src/lib/types/scriptElement.ts
 * and defines ScriptBlock, conversion utilities, and story export interfaces.
 */

// ============================================================================
// Canonical Script Element Types — imported from single source of truth
// ============================================================================

export type {
  ScriptBlockType,
  ScreenplayBlockType,
  PdfBlockType,
  FountainBlockType,
  ProseBlockType,
  ComicBlockType,
  FormatElementTypeMap,
  FormatElementType,
} from '../types/scriptElement';

// Backward-compatible re-exports (same names as before)
export type {
  ScriptElementType,
  PdfElementType,
  FountainElementType,
  ScreenplayElementType,
} from '../types/scriptElement';

// Local import for use in interfaces below
import type { ScriptElementType } from '../types/scriptElement';

// ============================================================================
// Canonical Script Block — single type replacing FountainElement, ScriptElement,
// and the anonymous {type, content, speaker} shapes used by converters.
// ============================================================================

/** Metadata carried by a ScriptBlock. Renderers read only the fields they need. */
export interface ScriptBlockMetadata {
  speaker?: string;
  sceneNumber?: string | number;
  dual?: boolean;
  dualDialogue?: 'left' | 'right';
  forced?: boolean;
  level?: number;
  [key: string]: unknown;
}

/**
 * Canonical script block used by all export formats.
 *
 * Replaces the formerly separate FountainElement, ScriptElement (PDF),
 * and ScreenplayElement interfaces — they all carried a type discriminator,
 * content string, and optional metadata.
 */
export interface ScriptBlock {
  type: ScriptElementType;
  content: string;
  metadata?: ScriptBlockMetadata;
}

/**
 * Raw script block as stored in ScriptData — uses storage-vocabulary types
 * (scene-header, description, content, dialogue, actor, direction) rather
 * than canonical ScriptElementType values.
 */
export interface ScriptBlockInput {
  type: string;
  content: string;
  speaker?: string;
}

/**
 * Convert storage-format blocks to canonical ScriptBlocks.
 *
 * This single function replaces the formerly duplicate convertToFountainElements
 * and convertToScriptElements functions, which had identical logic.
 */
export function convertToScriptBlocks(
  blocks: ScriptBlockInput[]
): ScriptBlock[] {
  const elements: ScriptBlock[] = [];

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

// ============================================================================
// Story Export Data Interfaces
// ============================================================================

export interface StoryExportData {
  title: string;
  author: string;
  scenes: StoryExportScene[];
  artStyle?: {
    palette: string[];
    backgroundColor: string;
    accentColor: string;
    fontFamily?: string;
  };
  metadata?: {
    description?: string;
    genre?: string;
  };
}

export interface StoryExportScene {
  id: string;
  name: string;
  content: string;
  imageUrl?: string;
  narrationUrl?: string;
  dialogueLines?: {
    speaker: string;
    text: string;
    audioUrl?: string;
  }[];
  choices?: {
    label: string;
    targetSceneId: string;
    condition?: Record<string, unknown>;
  }[];
  isEnding?: boolean;
}

// ============================================================================
// Unified Export Result
// ============================================================================

/**
 * Format-specific metadata returned from an export operation.
 * Each exporter populates only the fields relevant to its format.
 */
export interface ExportMetadata {
  // Format identifier (e.g. 'pdf', 'fountain', 'webm', 'png')
  format?: string;

  // Document metrics
  pageCount?: number;
  chapterCount?: number;
  sceneCount?: number;
  wordCount?: number;
  elementCount?: number;
  pageEstimate?: number;
  pages?: number;

  // Media metrics
  duration?: number;
  frameCount?: number;
  fileSize?: number;

  // URLs
  url?: string;
  dataUrl?: string;
}

// Re-export the standardized Result contract from result.ts
export { ExportError, exportSuccess, exportFailure } from './result';
export type { ExportErrorCode, ExportData, ExportResult } from './result';

/**
 * @deprecated Use ExportData from './result' instead. This type is kept for
 * backward compatibility with synchronous formatters that always succeed.
 */
export interface LegacyExportResult {
  filename: string;
  blob?: Blob;
  content?: string;
  mimeType?: string;
  format?: string;
  metadata: ExportMetadata;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Slugify a title for use as a filename.
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
