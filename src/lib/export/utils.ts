/**
 * Shared utilities for the export layer.
 *
 * All text-escaping and filename-sanitization helpers live here so every
 * exporter shares a single, well-tested implementation per output format.
 */

// ============================================================================
// Filename helpers
// ============================================================================

/** Sanitize a string for use as a filename. */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase();
}

/** Generate a v4 UUID using crypto.randomUUID(). */
export function generateUUID(): string {
  return crypto.randomUUID();
}

// ============================================================================
// Text-escaping helpers
// ============================================================================

/** Escape text for safe embedding in HTML content/attributes. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Escape text for safe embedding in XML content/attributes. */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Escape text for embedding in a PDF text-showing operator — `(…) Tj`. */
export function escapePdfText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, ''); // Remove non-ASCII
}

/** Escape text for safe embedding in RTF content. */
export function escapeRtf(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}');
}
