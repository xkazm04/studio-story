/**
 * React hooks for batch upload functionality
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  batchUploader,
  type UploadFile,
  type BatchUploadState,
  type UploadConfig,
  type UploadEventType,
} from './BatchUploader';
import { retryManager, type RetryConfig } from './RetryManager';

/**
 * Main hook for batch upload functionality
 */
export function useBatchUpload(
  uploadFn?: (file: File, onProgress: (progress: number) => void) => Promise<void>
) {
  const [state, setState] = useState<BatchUploadState>(() => batchUploader.getState());
  const [overallProgress, setOverallProgress] = useState(0);
  const uploadFnRef = useRef(uploadFn);

  // Keep upload function ref updated
  useEffect(() => {
    uploadFnRef.current = uploadFn;
  }, [uploadFn]);

  // Subscribe to events
  useEffect(() => {
    const updateState = () => {
      setState(batchUploader.getState());
      setOverallProgress(batchUploader.getOverallProgress());
    };

    const eventTypes: UploadEventType[] = [
      'file-added',
      'file-removed',
      'upload-start',
      'upload-progress',
      'upload-complete',
      'upload-error',
      'upload-paused',
      'upload-resumed',
      'batch-complete',
      'validation-error',
    ];

    const unsubscribes = eventTypes.map((type) =>
      batchUploader.on(type, updateState)
    );

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, []);

  const addFiles = useCallback((files: File[]) => {
    return batchUploader.addFiles(files);
  }, []);

  const removeFile = useCallback((fileId: string) => {
    batchUploader.removeFile(fileId);
  }, []);

  const startUpload = useCallback(async () => {
    if (!uploadFnRef.current) {
      console.error('No upload function provided');
      return;
    }
    await batchUploader.startUpload(uploadFnRef.current);
  }, []);

  const pauseUpload = useCallback(() => {
    batchUploader.pauseUpload();
  }, []);

  const resumeUpload = useCallback(async () => {
    if (!uploadFnRef.current) {
      console.error('No upload function provided');
      return;
    }
    await batchUploader.resumeUpload(uploadFnRef.current);
  }, []);

  const cancelUpload = useCallback((fileId: string) => {
    batchUploader.cancelUpload(fileId);
  }, []);

  const cancelAll = useCallback(() => {
    batchUploader.cancelAll();
  }, []);

  const retryFailed = useCallback(async () => {
    if (!uploadFnRef.current) {
      console.error('No upload function provided');
      return;
    }
    await batchUploader.retryFailed(uploadFnRef.current);
  }, []);

  const clearCompleted = useCallback(() => {
    batchUploader.clearCompleted();
  }, []);

  const reset = useCallback(() => {
    batchUploader.reset();
    setState(batchUploader.getState());
    setOverallProgress(0);
  }, []);

  return {
    // State
    state,
    files: state.files,
    status: state.status,
    overallProgress,
    stats: batchUploader.getStats(),

    // Actions
    addFiles,
    removeFile,
    startUpload,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    cancelAll,
    retryFailed,
    clearCompleted,
    reset,

    // Helpers
    getFile: batchUploader.getFile.bind(batchUploader),
    validateFile: batchUploader.validateFile.bind(batchUploader),
  };
}

/**
 * Hook for tracking upload progress of a single file
 */
export function useFileProgress(fileId: string | null) {
  const [file, setFile] = useState<UploadFile | undefined>(undefined);

  useEffect(() => {
    if (!fileId) {
      setFile(undefined);
      return;
    }

    const updateFile = () => {
      setFile(batchUploader.getFile(fileId));
    };

    updateFile();

    const unsubProgress = batchUploader.on('upload-progress', (event) => {
      if (event.fileId === fileId) {
        updateFile();
      }
    });

    const unsubComplete = batchUploader.on('upload-complete', (event) => {
      if (event.fileId === fileId) {
        updateFile();
      }
    });

    const unsubError = batchUploader.on('upload-error', (event) => {
      if (event.fileId === fileId) {
        updateFile();
      }
    });

    return () => {
      unsubProgress();
      unsubComplete();
      unsubError();
    };
  }, [fileId]);

  return file;
}

/**
 * Hook for upload configuration
 */
export function useUploadConfig() {
  const [config, setConfigState] = useState<UploadConfig>(() =>
    batchUploader.getConfig()
  );

  const updateConfig = useCallback((newConfig: Partial<UploadConfig>) => {
    batchUploader.updateConfig(newConfig);
    setConfigState(batchUploader.getConfig());
  }, []);

  return { config, updateConfig };
}

/**
 * Hook for retry functionality
 */
export function useRetry() {
  const [retryConfig, setRetryConfigState] = useState<RetryConfig>(() =>
    retryManager.getConfig()
  );

  const updateRetryConfig = useCallback((newConfig: Partial<RetryConfig>) => {
    retryManager.updateConfig(newConfig);
    setRetryConfigState(retryManager.getConfig());
  }, []);

  const executeWithRetry = useCallback(
    async <T>(
      id: string,
      fn: (signal: AbortSignal) => Promise<T>,
      onRetry?: (attempt: number, delay: number, error: string) => void
    ) => {
      return retryManager.withRetry(id, fn, onRetry);
    },
    []
  );

  const cancelRetry = useCallback((id: string) => {
    retryManager.cancel(id);
  }, []);

  const getRetryState = useCallback((id: string) => {
    return retryManager.getState(id);
  }, []);

  return {
    retryConfig,
    updateRetryConfig,
    executeWithRetry,
    cancelRetry,
    getRetryState,
    getRemainingAttempts: retryManager.getRemainingAttempts.bind(retryManager),
    isRetrying: retryManager.isRetrying.bind(retryManager),
  };
}

/**
 * Hook for file validation
 */
export function useFileValidation() {
  const validateFile = useCallback((file: File) => {
    return batchUploader.validateFile(file);
  }, []);

  const validateFiles = useCallback((files: File[]) => {
    return files.map((file) => ({
      file,
      validation: batchUploader.validateFile(file),
    }));
  }, []);

  return { validateFile, validateFiles };
}

/**
 * Hook for upload history/stats
 */
export function useUploadStats() {
  const [stats, setStats] = useState(() => batchUploader.getStats());

  useEffect(() => {
    const updateStats = () => {
      setStats(batchUploader.getStats());
    };

    const eventTypes: UploadEventType[] = [
      'file-added',
      'file-removed',
      'upload-complete',
      'upload-error',
      'batch-complete',
    ];

    const unsubscribes = eventTypes.map((type) =>
      batchUploader.on(type, updateStats)
    );

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, []);

  return stats;
}
