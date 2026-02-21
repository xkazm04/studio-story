/**
 * Image Processing Service
 * Utility functions for image file handling and cleanup
 */

import { unlink } from 'fs/promises';
import { existsSync } from 'fs';

/**
 * Clean up temporary image file
 * Safely removes a file from the filesystem
 *
 * @param filePath - Absolute path to the file to delete
 */
export async function cleanupTempImage(filePath: string): Promise<void> {
  try {
    // Check if file exists before attempting to delete
    if (existsSync(filePath)) {
      await unlink(filePath);
    }
  } catch (error) {
    // Log error but don't throw - cleanup failures shouldn't break the flow
    console.error(`Failed to cleanup temp file ${filePath}:`, error);
  }
}

/**
 * Validate image file type
 * Checks if the file extension is a supported image format
 *
 * @param filename - Name of the file to validate
 * @returns true if valid image extension, false otherwise
 */
export function isValidImageFile(filename: string): boolean {
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return validExtensions.includes(ext);
}

/**
 * Get MIME type from file extension
 *
 * @param filename - Name of the file
 * @returns MIME type string
 */
export function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}
