/**
 * Supabase Storage Utility
 *
 * Shared helper for uploading files to Supabase Storage and retrieving
 * permanent public URLs. Used by the illustration pipeline to persist
 * selected images.
 *
 * Default bucket: 'illustrations'
 */

import { supabaseServer } from '@/lib/supabase/server';

/**
 * Upload a buffer to Supabase Storage and return the public URL.
 *
 * @param bucket - Storage bucket name (e.g., 'illustrations')
 * @param path   - Object path within the bucket (e.g., 'project-id/scene-id/123.jpg')
 * @param buffer - File contents as a Buffer
 * @param contentType - MIME type (e.g., 'image/jpeg')
 * @returns Public URL for the uploaded file
 */
export async function uploadToStorage(
  bucket: string,
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const { error } = await supabaseServer.storage
    .from(bucket)
    .upload(path, buffer, { contentType, upsert: true });

  if (error) {
    throw new Error(`Storage upload failed for ${bucket}/${path}: ${error.message}`);
  }

  return getPublicUrl(bucket, path);
}

/**
 * Get the public URL for an object in Supabase Storage.
 *
 * @param bucket - Storage bucket name
 * @param path   - Object path within the bucket
 * @returns Public URL string
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabaseServer.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
}
