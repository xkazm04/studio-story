/**
 * Canonical Script Block Type
 *
 * Single source of truth for all script element types across screenplay,
 * prose, and comic formats. Format-specific subsets narrow via Extract<>.
 *
 * Adding a new block type is a single-file change here; TypeScript will
 * surface any format handler that needs updating.
 */

// ============================================================================
// Canonical Union — superset of all format-specific element types
// ============================================================================

export type ScriptBlockType =
  // Screenplay / Fountain (kebab-case, industry standard)
  | 'scene-heading'
  | 'action'
  | 'character'
  | 'dialogue'         // shared: screenplay, prose, comic
  | 'parenthetical'
  | 'transition'
  | 'centered'
  | 'note'             // shared: screenplay, comic
  | 'section'
  | 'synopsis'
  | 'page-break'
  | 'line-break'
  | 'title-page'
  | 'boneyard'
  | 'blank'
  // Prose / Novel (snake_case, novel conventions)
  | 'chapter_heading'
  | 'section_break'
  | 'paragraph'
  | 'thought'
  | 'letter'
  | 'quote'
  | 'flashback'
  | 'epigraph'
  // Comic Script (snake_case, panel/page structure)
  | 'page_header'
  | 'panel_header'
  | 'description'
  | 'caption'
  | 'sfx'
  | 'splash'
  | 'spread';

// ============================================================================
// Per-Format Subsets
// ============================================================================

/** All screenplay element types (Fountain standard). */
export type ScreenplayBlockType = Extract<ScriptBlockType,
  | 'scene-heading' | 'action' | 'character' | 'dialogue' | 'parenthetical'
  | 'transition' | 'centered' | 'note' | 'section' | 'synopsis'
  | 'page-break' | 'line-break' | 'title-page' | 'boneyard' | 'blank'
>;

/** Elements supported by the PDF generator. */
export type PdfBlockType = Extract<ScriptBlockType,
  | 'scene-heading' | 'action' | 'character' | 'dialogue' | 'parenthetical'
  | 'transition' | 'note' | 'centered' | 'page-break'
>;

/** Elements supported by the Fountain exporter. */
export type FountainBlockType = Extract<ScriptBlockType,
  | 'title-page' | 'scene-heading' | 'action' | 'character' | 'dialogue'
  | 'parenthetical' | 'transition' | 'centered' | 'section' | 'synopsis'
  | 'note' | 'boneyard' | 'page-break' | 'line-break'
>;

/** Prose / novel element types. */
export type ProseBlockType = Extract<ScriptBlockType,
  | 'chapter_heading' | 'section_break' | 'paragraph' | 'dialogue'
  | 'thought' | 'letter' | 'quote' | 'flashback' | 'note' | 'epigraph'
>;

/** Comic script element types. */
export type ComicBlockType = Extract<ScriptBlockType,
  | 'page_header' | 'panel_header' | 'description' | 'dialogue'
  | 'caption' | 'sfx' | 'note' | 'splash' | 'spread'
>;

// ============================================================================
// Format Mapped Type — enables generic format-aware code
// ============================================================================

/** Maps format name to its element type subset. */
export interface FormatElementTypeMap {
  screenplay: ScreenplayBlockType;
  pdf: PdfBlockType;
  fountain: FountainBlockType;
  prose: ProseBlockType;
  comic: ComicBlockType;
}

/** Get the element type subset for a specific format. */
export type FormatElementType<F extends keyof FormatElementTypeMap> = FormatElementTypeMap[F];

// ============================================================================
// Backward-Compatible Aliases
// ============================================================================

/** @deprecated Use ScriptBlockType (canonical superset) or ScreenplayBlockType (screenplay subset) */
export type ScriptElementType = ScreenplayBlockType;

/** @deprecated Use PdfBlockType */
export type PdfElementType = PdfBlockType;

/** @deprecated Use FountainBlockType */
export type FountainElementType = FountainBlockType;

/** @deprecated Use ScreenplayBlockType (identical to the old ScreenplayElementType) */
export type ScreenplayElementType = ScreenplayBlockType;

/** @deprecated Use ProseBlockType */
export type ProseElementType = ProseBlockType;

/** @deprecated Use ComicBlockType */
export type ComicElementType = ComicBlockType;
