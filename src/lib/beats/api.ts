/**
 * Centralized Beat API Constants & Typed Fetch Client
 *
 * Single source of truth for all beat-related endpoint URLs.
 * Eliminates scattered hardcoded strings and prevents typo-induced 404s.
 */

import { API_BASE_URL } from '@/app/config/api';

// ---------------------------------------------------------------------------
// URL Constants
// ---------------------------------------------------------------------------

export const BEAT_URLS = {
  /** /api/beats — list (GET) and create (POST) */
  beats: `${API_BASE_URL}/beats`,

  /** /api/beats/:id — update (PUT) and delete (DELETE) */
  beat: (id: string) => `${API_BASE_URL}/beats/${id}`,

  /** /api/beats/project/:projectId — bulk delete (DELETE) */
  beatsByProject: (projectId: string) => `${API_BASE_URL}/beats/project/${projectId}`,

  /** /api/beat-dependencies — list/create/delete */
  dependencies: `${API_BASE_URL}/beat-dependencies`,

  /** /api/beat-pacing — pacing suggestions CRUD */
  pacing: `${API_BASE_URL}/beat-pacing`,

  /** /api/beat-scene-mappings — batch mappings list/create */
  sceneMappings: `${API_BASE_URL}/beat-scene-mappings`,

  /** /api/beat-scene-mappings/:id — single mapping update/delete */
  sceneMapping: (id: string) => `${API_BASE_URL}/beat-scene-mappings/${id}`,

  /** /api/beat-scene-mapping — AI scene suggestion generation */
  sceneMappingGenerate: `${API_BASE_URL}/beat-scene-mapping`,

  /** /api/beat-suggestions — AI name/description suggestions */
  suggestions: `${API_BASE_URL}/beat-suggestions`,

  /** /api/beat-summary — single (POST) and batch (PUT) summary generation */
  summary: `${API_BASE_URL}/beat-summary`,
} as const;
