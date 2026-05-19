/**
 * Standardized Export Result Contract
 *
 * Provides a discriminated union Result type and structured ExportError class
 * so every exporter returns the same shape: ExportResult<T>.
 *
 * Replaces the previous mix of throw, return null, return {success: false},
 * and silent void patterns across different exporters.
 */

import type { ExportMetadata } from './types';

// ============================================================================
// Error Codes
// ============================================================================

/**
 * Structured error codes for export failures.
 * Consumers can switch on these to show context-appropriate UI messages.
 */
export type ExportErrorCode =
  | 'CANVAS_UNAVAILABLE'
  | 'INVALID_INPUT'
  | 'GENERATION_FAILED'
  | 'DEPENDENCY_MISSING'
  | 'FETCH_FAILED'
  | 'ENCODING_FAILED'
  | 'CANCELLED';

// ============================================================================
// ExportError
// ============================================================================

/**
 * Structured error for export failures.
 * Carries a machine-readable `code` and a human-friendly `message`.
 */
export class ExportError extends Error {
  readonly name = 'ExportError';

  constructor(
    public readonly code: ExportErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
  }
}

// ============================================================================
// ExportData — the payload returned on success
// ============================================================================

/**
 * Data payload for a successful export.
 * This is the "T" in ExportResult<T> for standard script/story exports.
 */
export interface ExportData {
  filename: string;
  blob?: Blob;
  content?: string;
  mimeType?: string;
  format?: string;
  metadata: ExportMetadata;
}

// ============================================================================
// ExportResult<T> — discriminated union
// ============================================================================

/**
 * Discriminated union result type for all export operations.
 *
 * Usage:
 * ```ts
 * const result = await exporter.generate(data);
 * if (result.success) {
 *   downloadBlob(result.data.blob, result.data.filename);
 * } else {
 *   showError(result.error.code, result.error.message);
 * }
 * ```
 */
export type ExportResult<T = ExportData> =
  | { success: true; data: T }
  | { success: false; error: ExportError };

// ============================================================================
// Helper Constructors
// ============================================================================

/** Wrap a payload as a successful ExportResult. */
export function exportSuccess<T>(data: T): ExportResult<T> {
  return { success: true, data };
}

/** Create a failed ExportResult from code + message. */
export function exportFailure(
  code: ExportErrorCode,
  message: string,
  cause?: unknown,
): ExportResult<never> {
  return { success: false, error: new ExportError(code, message, cause) };
}
