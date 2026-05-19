/**
 * Generation State Machine
 *
 * Explicit finite state machine for the image generation lifecycle.
 * Models: idle → generating → polling → gallery → confirming → idle
 * with error recovery and cancellation at every step.
 */

// ---------------------------------------------------------------------------
// State types (discriminated union — each phase carries only its own data)
// ---------------------------------------------------------------------------

export interface GeneratedImageEntry {
  id: string;
  url: string;
}

interface IdleState {
  phase: 'idle';
}

interface GeneratingState {
  phase: 'generating';
  startTime: number;
  prompt: string;
}

interface PollingState {
  phase: 'polling';
  generationId: string;
  startTime: number;
  prompt: string;
}

interface GalleryState {
  phase: 'gallery';
  images: GeneratedImageEntry[];
  generationId: string;
  selectedImageId: string | null;
}

interface ConfirmingState {
  phase: 'confirming';
  images: GeneratedImageEntry[];
  selectedImageId: string;
  generationId: string;
}

interface SuccessState {
  phase: 'success';
  imageUrl?: string;
}

interface ErrorState {
  phase: 'error';
  error: string;
  /** Which phase failed — enables targeted retry */
  failedFrom: 'generating' | 'polling' | 'confirming';
}

export type GenerationState =
  | IdleState
  | GeneratingState
  | PollingState
  | GalleryState
  | ConfirmingState
  | SuccessState
  | ErrorState;

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export type GenerationEvent =
  | { type: 'START'; prompt: string }
  | { type: 'GENERATION_STARTED'; generationId: string }
  | { type: 'POLL_COMPLETE'; images: GeneratedImageEntry[] }
  | { type: 'POLL_FAILED'; error: string }
  | { type: 'GENERATE_FAILED'; error: string }
  | { type: 'SELECT_IMAGE'; imageId: string }
  | { type: 'CONFIRM' }
  | { type: 'CONFIRM_SUCCESS'; imageUrl?: string }
  | { type: 'CONFIRM_FAILED'; error: string }
  | { type: 'RETRY' }
  | { type: 'RESET' }
  /** Quick-path for ImageGenerator (no polling/gallery — just idle→generating→success/error) */
  | { type: 'GENERATE_SUCCESS'; imageUrl?: string };

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

export const INITIAL_STATE: GenerationState = { phase: 'idle' };

// ---------------------------------------------------------------------------
// Reducer — pure, guarded transitions
// ---------------------------------------------------------------------------

export function generationReducer(
  state: GenerationState,
  event: GenerationEvent
): GenerationState {
  switch (event.type) {
    // ── START ───────────────────────────────────────────────────────────
    case 'START':
      if (state.phase !== 'idle') return state;
      return { phase: 'generating', startTime: Date.now(), prompt: event.prompt };

    // ── Async generation kicked off → start polling ────────────────────
    case 'GENERATION_STARTED':
      if (state.phase !== 'generating') return state;
      return {
        phase: 'polling',
        generationId: event.generationId,
        startTime: state.startTime,
        prompt: state.prompt,
      };

    // ── Polling complete with images → gallery ─────────────────────────
    case 'POLL_COMPLETE':
      if (state.phase !== 'polling') return state;
      return {
        phase: 'gallery',
        images: event.images,
        generationId: state.generationId,
        selectedImageId: null,
      };

    // ── Polling failed ─────────────────────────────────────────────────
    case 'POLL_FAILED':
      if (state.phase !== 'polling') return state;
      return { phase: 'error', error: event.error, failedFrom: 'polling' };

    // ── Generation request itself failed ───────────────────────────────
    case 'GENERATE_FAILED':
      if (state.phase !== 'generating') return state;
      return { phase: 'error', error: event.error, failedFrom: 'generating' };

    // ── Quick-path success (ImageGenerator, no polling) ────────────────
    case 'GENERATE_SUCCESS':
      if (state.phase !== 'generating') return state;
      return { phase: 'success', imageUrl: event.imageUrl };

    // ── Select an image in gallery ─────────────────────────────────────
    case 'SELECT_IMAGE':
      if (state.phase !== 'gallery') return state;
      return { ...state, selectedImageId: event.imageId };

    // ── Confirm selection → saving ─────────────────────────────────────
    case 'CONFIRM':
      if (state.phase !== 'gallery' || !state.selectedImageId) return state;
      return {
        phase: 'confirming',
        images: state.images,
        selectedImageId: state.selectedImageId,
        generationId: state.generationId,
      };

    // ── Confirm succeeded ──────────────────────────────────────────────
    case 'CONFIRM_SUCCESS':
      if (state.phase !== 'confirming') return state;
      return { phase: 'idle' };

    // ── Confirm failed ─────────────────────────────────────────────────
    case 'CONFIRM_FAILED':
      if (state.phase !== 'confirming') return state;
      return { phase: 'error', error: event.error, failedFrom: 'confirming' };

    // ── Retry from error → return to idle ──────────────────────────────
    case 'RETRY':
      if (state.phase !== 'error') return state;
      return { phase: 'idle' };

    // ── Full reset from any state ──────────────────────────────────────
    case 'RESET':
      return { phase: 'idle' };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Type guard helpers for consuming components */
export const is = {
  idle: (s: GenerationState): s is IdleState => s.phase === 'idle',
  generating: (s: GenerationState): s is GeneratingState => s.phase === 'generating',
  polling: (s: GenerationState): s is PollingState => s.phase === 'polling',
  gallery: (s: GenerationState): s is GalleryState => s.phase === 'gallery',
  confirming: (s: GenerationState): s is ConfirmingState => s.phase === 'confirming',
  success: (s: GenerationState): s is SuccessState => s.phase === 'success',
  error: (s: GenerationState): s is ErrorState => s.phase === 'error',
  /** True while any async work is in flight */
  busy: (s: GenerationState): boolean =>
    s.phase === 'generating' || s.phase === 'polling' || s.phase === 'confirming',
} as const;
