/**
 * Shared Story Export Types
 *
 * Used by StoryPDFGenerator, HTML5BundleGenerator, and VisualNovelGenerator.
 * Defines the common data shape for exporting rich illustrated stories.
 */

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
