/**
 * BatchUploader - Multi-file upload handling with progress tracking
 *
 * Provides batch file upload with progress tracking, validation,
 * pause/resume capability, and upload state persistence.
 */

// Types
export interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: UploadStatus;
  progress: number;
  error?: string;
  uploadedAt?: number;
  retryCount: number;
  chunks?: ChunkInfo[];
}

export type UploadStatus =
  | 'pending'
  | 'validating'
  | 'uploading'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ChunkInfo {
  index: number;
  start: number;
  end: number;
  uploaded: boolean;
}

export interface BatchUploadState {
  id: string;
  files: UploadFile[];
  status: 'idle' | 'uploading' | 'paused' | 'completed' | 'failed';
  startedAt?: number;
  completedAt?: number;
  totalSize: number;
  uploadedSize: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface UploadConfig {
  maxFileSize: number; // bytes
  allowedTypes: string[];
  maxConcurrent: number;
  chunkSize: number; // bytes
  enableChunking: boolean;
  validateBeforeUpload: boolean;
}

export interface UploadProgress {
  fileId: string;
  progress: number;
  bytesUploaded: number;
  totalBytes: number;
}

export type UploadEventType =
  | 'file-added'
  | 'file-removed'
  | 'upload-start'
  | 'upload-progress'
  | 'upload-complete'
  | 'upload-error'
  | 'upload-paused'
  | 'upload-resumed'
  | 'batch-complete'
  | 'validation-error';

export interface UploadEvent {
  type: UploadEventType;
  fileId?: string;
  data?: unknown;
  timestamp: number;
}

const DEFAULT_CONFIG: UploadConfig = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  maxConcurrent: 3,
  chunkSize: 1024 * 1024, // 1MB chunks
  enableChunking: true,
  validateBeforeUpload: true,
};

const STORAGE_KEY = 'story-batch-upload-state';

type EventCallback = (event: UploadEvent) => void;

/**
 * BatchUploader class
 */
class BatchUploader {
  private static instance: BatchUploader;
  private config: UploadConfig;
  private state: BatchUploadState;
  private eventListeners: Map<UploadEventType, Set<EventCallback>> = new Map();
  private uploadQueue: string[] = [];
  private activeUploads: Set<string> = new Set();
  private abortControllers: Map<string, AbortController> = new Map();

  private constructor(config: Partial<UploadConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = this.createInitialState();
    this.loadPersistedState();
  }

  static getInstance(config?: Partial<UploadConfig>): BatchUploader {
    if (!BatchUploader.instance) {
      BatchUploader.instance = new BatchUploader(config);
    }
    return BatchUploader.instance;
  }

  /**
   * Create initial state
   */
  private createInitialState(): BatchUploadState {
    return {
      id: `batch_${Date.now()}`,
      files: [],
      status: 'idle',
      totalSize: 0,
      uploadedSize: 0,
    };
  }

  /**
   * Load persisted state from localStorage
   */
  private loadPersistedState(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        // Only restore incomplete uploads
        if (data.status !== 'completed') {
          // Note: We can't restore File objects, so we just restore metadata
          // User will need to re-add files if they want to resume
          this.state = {
            ...data,
            files: data.files.map((f: UploadFile) => ({
              ...f,
              status: f.status === 'uploading' ? 'paused' : f.status,
            })),
          };
        }
      }
    } catch (error) {
      console.error('Failed to load upload state:', error);
    }
  }

  /**
   * Persist state to localStorage
   */
  private persistState(): void {
    try {
      // Don't persist file blobs, just metadata
      const stateToStore = {
        ...this.state,
        files: this.state.files.map((f) => ({
          id: f.id,
          name: f.name,
          size: f.size,
          type: f.type,
          status: f.status,
          progress: f.progress,
          error: f.error,
          uploadedAt: f.uploadedAt,
          retryCount: f.retryCount,
        })),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToStore));
    } catch (error) {
      console.error('Failed to persist upload state:', error);
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(type: UploadEventType, fileId?: string, data?: unknown): void {
    const event: UploadEvent = {
      type,
      fileId,
      data,
      timestamp: Date.now(),
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach((callback) => callback(event));
    }
  }

  /**
   * Subscribe to events
   */
  on(type: UploadEventType, callback: EventCallback): () => void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(type)?.delete(callback);
    };
  }

  /**
   * Validate a single file
   */
  validateFile(file: File): ValidationResult {
    const errors: string[] = [];

    // Check file size
    if (file.size > this.config.maxFileSize) {
      const maxMB = Math.round(this.config.maxFileSize / (1024 * 1024));
      errors.push(`File size exceeds ${maxMB}MB limit`);
    }

    // Check file type
    if (!this.config.allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type || 'unknown'} is not allowed`);
    }

    // Check for empty files
    if (file.size === 0) {
      errors.push('File is empty');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Add files to the upload queue
   */
  addFiles(files: File[]): UploadFile[] {
    const addedFiles: UploadFile[] = [];

    for (const file of files) {
      const uploadFile: UploadFile = {
        id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending',
        progress: 0,
        retryCount: 0,
      };

      // Validate if configured
      if (this.config.validateBeforeUpload) {
        const validation = this.validateFile(file);
        if (!validation.valid) {
          uploadFile.status = 'failed';
          uploadFile.error = validation.errors.join(', ');
          this.emit('validation-error', uploadFile.id, validation.errors);
        }
      }

      this.state.files.push(uploadFile);
      this.state.totalSize += file.size;
      addedFiles.push(uploadFile);
      this.emit('file-added', uploadFile.id, uploadFile);
    }

    this.persistState();
    return addedFiles;
  }

  /**
   * Remove a file from the queue
   */
  removeFile(fileId: string): void {
    const index = this.state.files.findIndex((f) => f.id === fileId);
    if (index === -1) return;

    const file = this.state.files[index];

    // Cancel if uploading
    if (file.status === 'uploading') {
      this.cancelUpload(fileId);
    }

    // Remove from queue
    this.uploadQueue = this.uploadQueue.filter((id) => id !== fileId);

    // Update state
    this.state.totalSize -= file.size;
    if (file.status === 'completed') {
      this.state.uploadedSize -= file.size;
    }
    this.state.files.splice(index, 1);

    this.emit('file-removed', fileId);
    this.persistState();
  }

  /**
   * Start uploading all pending files
   */
  async startUpload(uploadFn: (file: File, onProgress: (progress: number) => void) => Promise<void>): Promise<void> {
    if (this.state.status === 'uploading') return;

    this.state.status = 'uploading';
    this.state.startedAt = Date.now();
    this.emit('upload-start');

    // Queue all pending files
    this.uploadQueue = this.state.files
      .filter((f) => f.status === 'pending' || f.status === 'paused')
      .map((f) => f.id);

    // Process queue
    await this.processQueue(uploadFn);
  }

  /**
   * Process the upload queue
   */
  private async processQueue(uploadFn: (file: File, onProgress: (progress: number) => void) => Promise<void>): Promise<void> {
    while (this.uploadQueue.length > 0 && this.state.status === 'uploading') {
      // Check if we can start more uploads
      if (this.activeUploads.size >= this.config.maxConcurrent) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }

      const fileId = this.uploadQueue.shift();
      if (!fileId) continue;

      const file = this.state.files.find((f) => f.id === fileId);
      if (!file || file.status === 'completed' || file.status === 'cancelled') {
        continue;
      }

      // Start upload
      this.activeUploads.add(fileId);
      this.uploadSingleFile(file, uploadFn).catch((error) => {
        console.error(`Upload failed for ${file.name}:`, error);
      });
    }

    // Wait for all active uploads to complete
    while (this.activeUploads.size > 0 && this.state.status === 'uploading') {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Check if batch is complete
    const allCompleted = this.state.files.every(
      (f) => f.status === 'completed' || f.status === 'failed' || f.status === 'cancelled'
    );

    if (allCompleted) {
      this.state.status = 'completed';
      this.state.completedAt = Date.now();
      this.emit('batch-complete');
    }

    this.persistState();
  }

  /**
   * Upload a single file
   */
  private async uploadSingleFile(
    uploadFile: UploadFile,
    uploadFn: (file: File, onProgress: (progress: number) => void) => Promise<void>
  ): Promise<void> {
    const abortController = new AbortController();
    this.abortControllers.set(uploadFile.id, abortController);

    try {
      uploadFile.status = 'uploading';
      this.persistState();

      const onProgress = (progress: number) => {
        uploadFile.progress = progress;
        const bytesUploaded = Math.round((progress / 100) * uploadFile.size);
        this.emit('upload-progress', uploadFile.id, {
          progress,
          bytesUploaded,
          totalBytes: uploadFile.size,
        });
        this.persistState();
      };

      await uploadFn(uploadFile.file, onProgress);

      uploadFile.status = 'completed';
      uploadFile.progress = 100;
      uploadFile.uploadedAt = Date.now();
      this.state.uploadedSize += uploadFile.size;
      this.emit('upload-complete', uploadFile.id);
    } catch (error) {
      if (abortController.signal.aborted) {
        uploadFile.status = 'cancelled';
      } else {
        uploadFile.status = 'failed';
        uploadFile.error = error instanceof Error ? error.message : 'Upload failed';
        this.emit('upload-error', uploadFile.id, uploadFile.error);
      }
    } finally {
      this.activeUploads.delete(uploadFile.id);
      this.abortControllers.delete(uploadFile.id);
      this.persistState();
    }
  }

  /**
   * Pause all uploads
   */
  pauseUpload(): void {
    if (this.state.status !== 'uploading') return;

    this.state.status = 'paused';

    // Mark active uploads as paused
    for (const fileId of this.activeUploads) {
      const file = this.state.files.find((f) => f.id === fileId);
      if (file) {
        file.status = 'paused';
      }
      // Abort the request
      this.abortControllers.get(fileId)?.abort();
    }

    this.activeUploads.clear();
    this.emit('upload-paused');
    this.persistState();
  }

  /**
   * Resume paused uploads
   */
  async resumeUpload(uploadFn: (file: File, onProgress: (progress: number) => void) => Promise<void>): Promise<void> {
    if (this.state.status !== 'paused') return;

    this.state.status = 'uploading';
    this.emit('upload-resumed');

    // Re-queue paused files
    this.uploadQueue = this.state.files
      .filter((f) => f.status === 'paused')
      .map((f) => f.id);

    await this.processQueue(uploadFn);
  }

  /**
   * Cancel a specific upload
   */
  cancelUpload(fileId: string): void {
    const file = this.state.files.find((f) => f.id === fileId);
    if (!file) return;

    // Abort if active
    this.abortControllers.get(fileId)?.abort();
    this.activeUploads.delete(fileId);

    // Remove from queue
    this.uploadQueue = this.uploadQueue.filter((id) => id !== fileId);

    file.status = 'cancelled';
    this.persistState();
  }

  /**
   * Cancel all uploads
   */
  cancelAll(): void {
    // Abort all active uploads
    for (const [fileId, controller] of this.abortControllers) {
      controller.abort();
      const file = this.state.files.find((f) => f.id === fileId);
      if (file) {
        file.status = 'cancelled';
      }
    }

    this.activeUploads.clear();
    this.abortControllers.clear();
    this.uploadQueue = [];
    this.state.status = 'idle';
    this.persistState();
  }

  /**
   * Retry failed uploads
   */
  async retryFailed(uploadFn: (file: File, onProgress: (progress: number) => void) => Promise<void>): Promise<void> {
    // Reset failed files to pending
    for (const file of this.state.files) {
      if (file.status === 'failed') {
        file.status = 'pending';
        file.progress = 0;
        file.error = undefined;
        file.retryCount += 1;
      }
    }

    this.persistState();
    await this.startUpload(uploadFn);
  }

  /**
   * Get current state
   */
  getState(): BatchUploadState {
    return { ...this.state };
  }

  /**
   * Get file by ID
   */
  getFile(fileId: string): UploadFile | undefined {
    return this.state.files.find((f) => f.id === fileId);
  }

  /**
   * Get overall progress
   */
  getOverallProgress(): number {
    if (this.state.totalSize === 0) return 0;

    let totalProgress = 0;
    for (const file of this.state.files) {
      totalProgress += (file.progress / 100) * file.size;
    }

    return Math.round((totalProgress / this.state.totalSize) * 100);
  }

  /**
   * Get upload statistics
   */
  getStats(): {
    total: number;
    pending: number;
    uploading: number;
    completed: number;
    failed: number;
    cancelled: number;
  } {
    const stats = {
      total: this.state.files.length,
      pending: 0,
      uploading: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    for (const file of this.state.files) {
      switch (file.status) {
        case 'pending':
        case 'validating':
          stats.pending++;
          break;
        case 'uploading':
        case 'paused':
          stats.uploading++;
          break;
        case 'completed':
          stats.completed++;
          break;
        case 'failed':
          stats.failed++;
          break;
        case 'cancelled':
          stats.cancelled++;
          break;
      }
    }

    return stats;
  }

  /**
   * Clear completed and failed uploads
   */
  clearCompleted(): void {
    this.state.files = this.state.files.filter(
      (f) => f.status !== 'completed' && f.status !== 'failed' && f.status !== 'cancelled'
    );
    this.persistState();
  }

  /**
   * Reset the uploader
   */
  reset(): void {
    this.cancelAll();
    this.state = this.createInitialState();
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<UploadConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get configuration
   */
  getConfig(): UploadConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const batchUploader = BatchUploader.getInstance();

// Export class for testing
export { BatchUploader };
