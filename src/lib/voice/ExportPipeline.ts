/**
 * ExportPipeline - Audio format conversion and export
 *
 * Handles export to various audio formats (MP3, WAV, AAC)
 * with metadata tagging and quality settings.
 */

import type { ChapterAudio, ChapterMetadata } from './ChapterAssembler';

/**
 * Supported export formats
 */
export type AudioFormat = 'mp3' | 'wav' | 'aac' | 'm4a' | 'flac' | 'ogg';

/**
 * MP3 quality presets
 */
export type MP3Quality = 'low' | 'medium' | 'high' | 'highest';

/**
 * Audio quality settings
 */
export interface AudioQualitySettings {
  format: AudioFormat;
  bitrate?: number; // kbps for lossy formats
  sampleRate?: number; // Hz
  channels?: 1 | 2; // mono or stereo
  mp3Quality?: MP3Quality;
}

/**
 * Metadata tags for audio files
 */
export interface AudioMetadataTags {
  title?: string;
  artist?: string;
  album?: string;
  albumArtist?: string;
  track?: number;
  totalTracks?: number;
  year?: number;
  genre?: string;
  comment?: string;
  composer?: string;
  copyright?: string;
  encodedBy?: string;
  coverArt?: Blob;
}

/**
 * Export job configuration
 */
export interface ExportJob {
  id: string;
  chapters: ChapterAudio[];
  settings: AudioQualitySettings;
  metadata: AudioMetadataTags;
  outputPath?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  outputs: ExportOutput[];
}

/**
 * Single export output
 */
export interface ExportOutput {
  chapterId: string;
  chapterName: string;
  format: AudioFormat;
  filename: string;
  filesize: number; // bytes
  duration: number; // seconds
  url?: string;
  blob?: Blob;
}

/**
 * Export progress event
 */
export interface ExportProgress {
  jobId: string;
  phase: 'preparing' | 'encoding' | 'tagging' | 'finalizing';
  currentChapter: number;
  totalChapters: number;
  percentage: number;
  currentFile?: string;
  estimatedTimeRemaining?: number; // seconds
}

type ExportProgressCallback = (progress: ExportProgress) => void;

/**
 * Format quality presets
 */
const QUALITY_PRESETS: Record<AudioFormat, Record<string, AudioQualitySettings>> = {
  mp3: {
    low: { format: 'mp3', bitrate: 128, sampleRate: 44100, channels: 2 },
    medium: { format: 'mp3', bitrate: 192, sampleRate: 44100, channels: 2 },
    high: { format: 'mp3', bitrate: 256, sampleRate: 44100, channels: 2 },
    highest: { format: 'mp3', bitrate: 320, sampleRate: 48000, channels: 2 },
  },
  wav: {
    standard: { format: 'wav', sampleRate: 44100, channels: 2 },
    high: { format: 'wav', sampleRate: 48000, channels: 2 },
    broadcast: { format: 'wav', sampleRate: 48000, channels: 2 },
  },
  aac: {
    low: { format: 'aac', bitrate: 128, sampleRate: 44100, channels: 2 },
    medium: { format: 'aac', bitrate: 192, sampleRate: 44100, channels: 2 },
    high: { format: 'aac', bitrate: 256, sampleRate: 48000, channels: 2 },
  },
  m4a: {
    low: { format: 'm4a', bitrate: 128, sampleRate: 44100, channels: 2 },
    medium: { format: 'm4a', bitrate: 192, sampleRate: 44100, channels: 2 },
    high: { format: 'm4a', bitrate: 256, sampleRate: 48000, channels: 2 },
  },
  flac: {
    standard: { format: 'flac', sampleRate: 44100, channels: 2 },
    high: { format: 'flac', sampleRate: 48000, channels: 2 },
    studio: { format: 'flac', sampleRate: 96000, channels: 2 },
  },
  ogg: {
    low: { format: 'ogg', bitrate: 128, sampleRate: 44100, channels: 2 },
    medium: { format: 'ogg', bitrate: 192, sampleRate: 44100, channels: 2 },
    high: { format: 'ogg', bitrate: 256, sampleRate: 48000, channels: 2 },
  },
};

/**
 * ExportPipeline singleton class
 */
class ExportPipeline {
  private static instance: ExportPipeline;
  private jobs: Map<string, ExportJob> = new Map();
  private progressListeners: Map<string, ExportProgressCallback> = new Map();

  private constructor() {}

  static getInstance(): ExportPipeline {
    if (!ExportPipeline.instance) {
      ExportPipeline.instance = new ExportPipeline();
    }
    return ExportPipeline.instance;
  }

  /**
   * Get quality preset for format
   */
  getQualityPreset(format: AudioFormat, quality: string): AudioQualitySettings {
    return QUALITY_PRESETS[format]?.[quality] || QUALITY_PRESETS[format]?.medium || {
      format,
      sampleRate: 44100,
      channels: 2,
    };
  }

  /**
   * Get available quality presets for format
   */
  getAvailablePresets(format: AudioFormat): string[] {
    return Object.keys(QUALITY_PRESETS[format] || {});
  }

  /**
   * Create export job
   */
  createExportJob(
    chapters: ChapterAudio[],
    settings: AudioQualitySettings,
    metadata?: AudioMetadataTags
  ): ExportJob {
    const job: ExportJob = {
      id: `export_${Date.now()}`,
      chapters,
      settings,
      metadata: metadata || {},
      status: 'pending',
      progress: 0,
      outputs: [],
    };

    this.jobs.set(job.id, job);
    return job;
  }

  /**
   * Execute export job
   */
  async executeExport(
    jobId: string,
    onProgress?: ExportProgressCallback
  ): Promise<ExportJob> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Export job not found: ${jobId}`);
    }

    job.status = 'processing';

    try {
      // Report preparing
      this.reportProgress(jobId, {
        jobId,
        phase: 'preparing',
        currentChapter: 0,
        totalChapters: job.chapters.length,
        percentage: 0,
      }, onProgress);

      // Process each chapter
      for (let i = 0; i < job.chapters.length; i++) {
        const chapter = job.chapters[i];

        // Report encoding
        this.reportProgress(jobId, {
          jobId,
          phase: 'encoding',
          currentChapter: i + 1,
          totalChapters: job.chapters.length,
          percentage: Math.round(((i + 0.3) / job.chapters.length) * 80),
          currentFile: chapter.actName,
        }, onProgress);

        // Encode chapter
        const output = await this.encodeChapter(chapter, job.settings, job.metadata, i);

        // Report tagging
        this.reportProgress(jobId, {
          jobId,
          phase: 'tagging',
          currentChapter: i + 1,
          totalChapters: job.chapters.length,
          percentage: Math.round(((i + 0.7) / job.chapters.length) * 80),
          currentFile: chapter.actName,
        }, onProgress);

        // Add metadata tags
        await this.addMetadataTags(output, job.metadata, i + 1, job.chapters.length);

        job.outputs.push(output);
        job.progress = Math.round(((i + 1) / job.chapters.length) * 100);
      }

      // Report finalizing
      this.reportProgress(jobId, {
        jobId,
        phase: 'finalizing',
        currentChapter: job.chapters.length,
        totalChapters: job.chapters.length,
        percentage: 100,
      }, onProgress);

      job.status = 'completed';
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Export failed';
    }

    return job;
  }

  /**
   * Encode a single chapter (mock implementation)
   */
  private async encodeChapter(
    chapter: ChapterAudio,
    settings: AudioQualitySettings,
    metadata: AudioMetadataTags,
    index: number
  ): Promise<ExportOutput> {
    // Simulate encoding time
    const encodingTime = Math.min(chapter.totalDuration * 5, 300);
    await new Promise(resolve => setTimeout(resolve, encodingTime));

    // Generate filename
    const filename = this.generateFilename(chapter, metadata, settings.format, index);

    // Estimate file size based on bitrate and duration
    let filesize: number;
    if (settings.bitrate) {
      // Lossy format: bitrate * duration
      filesize = Math.round((settings.bitrate * 1000 / 8) * chapter.totalDuration);
    } else {
      // Lossless format: sample rate * channels * bytes per sample * duration
      const bytesPerSample = settings.format === 'wav' ? 2 : 3;
      filesize = Math.round(
        (settings.sampleRate || 44100) *
        (settings.channels || 2) *
        bytesPerSample *
        chapter.totalDuration
      );
    }

    return {
      chapterId: chapter.id,
      chapterName: chapter.actName,
      format: settings.format,
      filename,
      filesize,
      duration: chapter.totalDuration,
      url: `blob:export/${chapter.id}.${settings.format}`,
    };
  }

  /**
   * Generate filename for export
   */
  private generateFilename(
    chapter: ChapterAudio,
    metadata: AudioMetadataTags,
    format: AudioFormat,
    index: number
  ): string {
    const parts: string[] = [];

    // Add album/project name if available
    if (metadata.album) {
      parts.push(this.sanitizeFilename(metadata.album));
    }

    // Add chapter number
    parts.push(`Chapter_${String(index + 1).padStart(2, '0')}`);

    // Add chapter name
    parts.push(this.sanitizeFilename(chapter.actName));

    return `${parts.join('_')}.${format}`;
  }

  /**
   * Sanitize filename
   */
  private sanitizeFilename(name: string): string {
    return name
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 50);
  }

  /**
   * Add metadata tags to output (mock implementation)
   */
  private async addMetadataTags(
    output: ExportOutput,
    metadata: AudioMetadataTags,
    trackNumber: number,
    totalTracks: number
  ): Promise<void> {
    // Simulate tagging time
    await new Promise(resolve => setTimeout(resolve, 50));

    // In real implementation, would use ID3 tags for MP3,
    // Vorbis comments for OGG/FLAC, or atoms for M4A/AAC
  }

  /**
   * Report progress to listeners
   */
  private reportProgress(
    jobId: string,
    progress: ExportProgress,
    callback?: ExportProgressCallback
  ): void {
    if (callback) {
      callback(progress);
    }

    const listener = this.progressListeners.get(jobId);
    if (listener) {
      listener(progress);
    }
  }

  /**
   * Register progress listener
   */
  onProgress(jobId: string, callback: ExportProgressCallback): () => void {
    this.progressListeners.set(jobId, callback);
    return () => this.progressListeners.delete(jobId);
  }

  /**
   * Get export job
   */
  getJob(jobId: string): ExportJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs
   */
  getAllJobs(): ExportJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Cancel export job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (job && job.status === 'processing') {
      job.status = 'failed';
      job.error = 'Cancelled by user';
      return true;
    }
    return false;
  }

  /**
   * Delete export job
   */
  deleteJob(jobId: string): boolean {
    return this.jobs.delete(jobId);
  }

  /**
   * Download export output
   */
  async downloadOutput(output: ExportOutput): Promise<void> {
    if (!output.url && !output.blob) {
      throw new Error('No downloadable content available');
    }

    // Create download link
    const url = output.url || (output.blob ? URL.createObjectURL(output.blob) : '');
    const link = document.createElement('a');
    link.href = url;
    link.download = output.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up blob URL if created
    if (output.blob && !output.url) {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Download all outputs from job as zip
   */
  async downloadJobAsZip(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'completed') {
      throw new Error('Job not ready for download');
    }

    // In real implementation, would use JSZip to create archive
    // For now, download files individually
    for (const output of job.outputs) {
      await this.downloadOutput(output);
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  }

  /**
   * Estimate export file size
   */
  estimateFileSize(
    durationSeconds: number,
    settings: AudioQualitySettings
  ): number {
    if (settings.bitrate) {
      return Math.round((settings.bitrate * 1000 / 8) * durationSeconds);
    }
    // Lossless estimation
    const bytesPerSample = settings.format === 'wav' ? 2 : 3;
    return Math.round(
      (settings.sampleRate || 44100) *
      (settings.channels || 2) *
      bytesPerSample *
      durationSeconds
    );
  }

  /**
   * Get format description
   */
  getFormatDescription(format: AudioFormat): string {
    const descriptions: Record<AudioFormat, string> = {
      mp3: 'MP3 - Universal compatibility, good quality',
      wav: 'WAV - Uncompressed, broadcast quality',
      aac: 'AAC - High quality, smaller files',
      m4a: 'M4A - Apple compatible, high quality',
      flac: 'FLAC - Lossless compression',
      ogg: 'OGG - Open format, good quality',
    };
    return descriptions[format] || format.toUpperCase();
  }
}

// Export singleton instance
export const exportPipeline = ExportPipeline.getInstance();

// Export class for testing
export { ExportPipeline };
