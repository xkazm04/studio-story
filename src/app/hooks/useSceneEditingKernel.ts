/**
 * useSceneEditingKernel
 *
 * Shared editing kernel extracted from ContentSection, SceneEditorPanel,
 * and ScriptEditor. Owns: content state, dirty detection, debounced
 * auto-save with flush-on-unmount, save-state badge progression, and
 * format-mode awareness.
 *
 * Each editor surface becomes a thin rendering adapter over this kernel.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// ─── Types ──────────────────────────────────────────────────

export type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export interface SceneEditingKernelOptions<F extends Record<string, string>> {
  /** Scene id — resets state when it changes */
  sceneId: string;
  /** Initial field values (from server/query) */
  initialFields: F;
  /** Persist function — called with sceneId + dirty fields */
  saveFn: (sceneId: string, fields: Partial<F>) => Promise<void>;
  /**
   * Auto-save debounce delay in ms.
   * Set to 0 or omit to disable auto-save (manual save only).
   * @default 0
   */
  autoSaveDelay?: number;
  /**
   * How long the "saved" badge stays visible after a successful save.
   * @default 2000
   */
  savedFeedbackMs?: number;
}

export interface SceneEditingKernel<F extends Record<string, string>> {
  /** Current field values */
  fields: F;
  /** Update a single field */
  setField: <K extends keyof F>(key: K, value: F[K]) => void;
  /** Bulk-update multiple fields at once */
  setFields: (partial: Partial<F>) => void;
  /** Whether any field differs from its initial value */
  isDirty: boolean;
  /** Badge progression: idle → dirty → saving → saved → error */
  saveState: SaveState;
  /** Trigger a save (no-op if not dirty or already saving) */
  save: () => Promise<void>;
  /** Flush any pending auto-save immediately (synchronous trigger) */
  flush: () => void;
}

// ─── Hook ───────────────────────────────────────────────────

export function useSceneEditingKernel<F extends Record<string, string>>(
  options: SceneEditingKernelOptions<F>,
): SceneEditingKernel<F> {
  const {
    sceneId,
    initialFields,
    saveFn,
    autoSaveDelay = 0,
    savedFeedbackMs = 2000,
  } = options;

  // ── State ────────────────────────────────────────────────
  const [fields, setFieldsState] = useState<F>(initialFields);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const savingRef = useRef(false);

  // Refs for flush-on-unmount (must capture latest values)
  const fieldsRef = useRef<F>(fields);
  fieldsRef.current = fields;
  const initialFieldsRef = useRef<F>(initialFields);
  initialFieldsRef.current = initialFields;
  const sceneIdRef = useRef(sceneId);
  sceneIdRef.current = sceneId;
  const saveFnRef = useRef(saveFn);
  saveFnRef.current = saveFn;

  // Auto-save timer
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Pending save callback for synchronous flush
  const pendingSaveRef = useRef<(() => void) | null>(null);
  // Timer for "saved" → "idle" feedback transition
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Dirty detection ──────────────────────────────────────
  const isDirty = computeDirty(fields, initialFields);
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  // ── Reset on scene change ────────────────────────────────
  useEffect(() => {
    // Flush pending save for the previous scene before resetting
    flushInternal();
    setFieldsState(initialFields);
    setSaveState('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId]);

  // Also sync if initialFields change for the SAME scene (server refetch)
  const prevInitialRef = useRef(initialFields);
  useEffect(() => {
    if (prevInitialRef.current !== initialFields) {
      prevInitialRef.current = initialFields;
      // Only overwrite if not dirty (don't clobber user edits)
      if (!isDirtyRef.current) {
        setFieldsState(initialFields);
      }
    }
  }, [initialFields]);

  // ── Save logic ───────────────────────────────────────────
  const executeSave = useCallback(async () => {
    if (savingRef.current) return;
    const currentFields = fieldsRef.current;
    const currentInitial = initialFieldsRef.current;
    const currentSceneId = sceneIdRef.current;

    if (!computeDirty(currentFields, currentInitial)) return;

    // Compute only changed fields
    const changed: Partial<F> = {};
    for (const key of Object.keys(currentFields) as (keyof F)[]) {
      if (currentFields[key] !== currentInitial[key]) {
        changed[key] = currentFields[key];
      }
    }

    savingRef.current = true;
    setSaveState('saving');
    try {
      await saveFnRef.current(currentSceneId, changed);
      setSaveState('saved');
    } catch {
      setSaveState('error');
    } finally {
      savingRef.current = false;
    }
  }, []);

  // ── Saved/error → idle feedback transition ───────────────
  useEffect(() => {
    if (saveState !== 'saved' && saveState !== 'error') return;
    feedbackTimeoutRef.current = setTimeout(
      () => setSaveState('idle'),
      savedFeedbackMs,
    );
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, [saveState, savedFeedbackMs]);

  // ── Auto-save debounce ───────────────────────────────────
  useEffect(() => {
    if (autoSaveDelay <= 0) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (isDirty) {
      setSaveState('dirty');
      pendingSaveRef.current = () => { executeSave(); };
      saveTimeoutRef.current = setTimeout(() => {
        pendingSaveRef.current = null;
        executeSave();
      }, autoSaveDelay);
    } else {
      pendingSaveRef.current = null;
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, autoSaveDelay]);

  // ── Flush helper ─────────────────────────────────────────
  function flushInternal() {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (pendingSaveRef.current) {
      pendingSaveRef.current();
      pendingSaveRef.current = null;
    }
  }

  const flush = useCallback(() => {
    flushInternal();
  }, []);

  // ── Flush on unmount ─────────────────────────────────────
  useEffect(() => {
    return () => { flushInternal(); };
  }, []);

  // ── Guard against browser/tab close ──────────────────────
  useEffect(() => {
    if (autoSaveDelay <= 0) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingSaveRef.current) {
        pendingSaveRef.current();
        pendingSaveRef.current = null;
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [autoSaveDelay]);

  // ── Field setters ────────────────────────────────────────
  const setField = useCallback(<K extends keyof F>(key: K, value: F[K]) => {
    setFieldsState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setFields = useCallback((partial: Partial<F>) => {
    setFieldsState((prev) => ({ ...prev, ...partial }));
  }, []);

  // ── Manual save ──────────────────────────────────────────
  const save = useCallback(async () => {
    // Clear any pending auto-save first
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    pendingSaveRef.current = null;
    await executeSave();
  }, [executeSave]);

  // ── Update saveState to dirty when fields change (manual mode) ──
  useEffect(() => {
    if (autoSaveDelay > 0) return; // auto-save mode handles this
    if (isDirty && saveState === 'idle') {
      setSaveState('dirty');
    } else if (!isDirty && saveState === 'dirty') {
      setSaveState('idle');
    }
  }, [isDirty, saveState, autoSaveDelay]);

  return { fields, setField, setFields, isDirty, saveState, save, flush };
}

// ─── Helpers ────────────────────────────────────────────────

function computeDirty<F extends Record<string, string>>(
  current: F,
  initial: F,
): boolean {
  for (const key of Object.keys(current) as (keyof F)[]) {
    if (current[key] !== initial[key]) return true;
  }
  return false;
}
