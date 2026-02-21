/**
 * Types for Character Creator module
 */

export interface ImageExtractionConfig {
  gemini: { enabled: boolean };
  groq: { enabled: boolean };
}

export interface ExtractionResult {
  model: string;
  data: Record<string, unknown>;
  processingTime?: number;
  error?: string;
  confidence?: number;
}
