/**
 * AnimaticExporter - Export Animatics to Video Format
 *
 * Handles rendering storyboard panels with timing, transitions,
 * and audio into exportable video formats.
 */

import {
  TimingController,
  timingController,
  type PanelTiming,
  type AudioTrack,
  type TransitionType,
  EASING_FUNCTIONS,
} from './TimingController';

// ============================================================================
// Types
// ============================================================================

export type ExportFormat = 'webm' | 'mp4' | 'gif';
export type ExportQuality = 'low' | 'medium' | 'high' | 'ultra';
export type ExportResolution = '720p' | '1080p' | '2k' | '4k';

export interface ExportSettings {
  format: ExportFormat;
  quality: ExportQuality;
  resolution: ExportResolution;
  frameRate: number;
  includeAudio: boolean;
  watermark?: {
    text: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    opacity: number;
  };
}

export interface PanelData {
  id: string;
  imageUrl?: string;
  canvas?: HTMLCanvasElement;
  thumbnail?: string;
}

export interface ExportProgress {
  phase: 'preparing' | 'rendering' | 'encoding' | 'complete' | 'error';
  currentFrame: number;
  totalFrames: number;
  currentPanel: number;
  totalPanels: number;
  percentage: number;
  estimatedTimeRemaining?: number;
  message: string;
}

export interface ExportResult {
  success: boolean;
  blob?: Blob;
  url?: string;
  duration: number;
  frameCount: number;
  fileSize?: number;
  error?: string;
}

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  format: 'webm',
  quality: 'high',
  resolution: '1080p',
  frameRate: 24,
  includeAudio: true,
};

export const RESOLUTION_MAP: Record<ExportResolution, { width: number; height: number }> = {
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  '2k': { width: 2560, height: 1440 },
  '4k': { width: 3840, height: 2160 },
};

export const QUALITY_BITRATE_MAP: Record<ExportQuality, number> = {
  low: 2_000_000,      // 2 Mbps
  medium: 5_000_000,   // 5 Mbps
  high: 10_000_000,    // 10 Mbps
  ultra: 20_000_000,   // 20 Mbps
};

const FORMAT_MIME_MAP: Record<ExportFormat, string> = {
  webm: 'video/webm;codecs=vp9',
  mp4: 'video/mp4',
  gif: 'image/gif',
};

// ============================================================================
// AnimaticExporter Class
// ============================================================================

export class AnimaticExporter {
  private settings: ExportSettings;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isExporting = false;
  private abortController: AbortController | null = null;
  private progressCallback: ((progress: ExportProgress) => void) | null = null;
  private imageCache: Map<string, HTMLImageElement> = new Map();

  constructor(settings: Partial<ExportSettings> = {}) {
    this.settings = { ...DEFAULT_EXPORT_SETTINGS, ...settings };
  }

  // --------------------------------------------------------------------------
  // Configuration
  // --------------------------------------------------------------------------

  updateSettings(settings: Partial<ExportSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  getSettings(): ExportSettings {
    return { ...this.settings };
  }

  // --------------------------------------------------------------------------
  // Export Process
  // --------------------------------------------------------------------------

  async export(
    panels: PanelData[],
    controller: TimingController = timingController,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    if (this.isExporting) {
      return {
        success: false,
        duration: 0,
        frameCount: 0,
        error: 'Export already in progress',
      };
    }

    this.isExporting = true;
    this.progressCallback = onProgress || null;
    this.abortController = new AbortController();
    this.recordedChunks = [];

    const startTime = performance.now();

    try {
      // Initialize canvas
      const { width, height } = RESOLUTION_MAP[this.settings.resolution];
      this.canvas = document.createElement('canvas');
      this.canvas.width = width;
      this.canvas.height = height;
      this.ctx = this.canvas.getContext('2d');

      if (!this.ctx) {
        throw new Error('Failed to create canvas context');
      }

      // Preload images
      this.reportProgress({
        phase: 'preparing',
        currentFrame: 0,
        totalFrames: 0,
        currentPanel: 0,
        totalPanels: panels.length,
        percentage: 0,
        message: 'Loading panel images...',
      });

      await this.preloadImages(panels);

      // Calculate total frames
      const totalDuration = controller.getState().totalDuration;
      const totalFrames = Math.ceil((totalDuration / 1000) * this.settings.frameRate);

      // Setup media recorder
      const stream = this.canvas.captureStream(this.settings.frameRate);
      const mimeType = this.getSupportedMimeType();

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: QUALITY_BITRATE_MAP[this.settings.quality],
      });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      // Start recording
      this.mediaRecorder.start();

      // Render frames
      this.reportProgress({
        phase: 'rendering',
        currentFrame: 0,
        totalFrames,
        currentPanel: 0,
        totalPanels: panels.length,
        percentage: 0,
        message: 'Rendering frames...',
      });

      const frameTime = 1000 / this.settings.frameRate;

      for (let frame = 0; frame < totalFrames; frame++) {
        if (this.abortController?.signal.aborted) {
          throw new Error('Export cancelled');
        }

        const currentTime = frame * frameTime;
        await this.renderFrame(panels, controller, currentTime);

        // Report progress
        const panelInfo = controller.getPanelAtTime(currentTime);
        const currentPanelIndex = panelInfo
          ? panels.findIndex((p) => p.id === panelInfo.panelId)
          : 0;

        this.reportProgress({
          phase: 'rendering',
          currentFrame: frame + 1,
          totalFrames,
          currentPanel: currentPanelIndex + 1,
          totalPanels: panels.length,
          percentage: Math.round(((frame + 1) / totalFrames) * 90),
          estimatedTimeRemaining: this.estimateTimeRemaining(frame, totalFrames, startTime),
          message: `Rendering frame ${frame + 1}/${totalFrames}`,
        });

        // Small delay to allow the recorder to process
        await this.delay(frameTime);
      }

      // Stop recording and finalize
      this.reportProgress({
        phase: 'encoding',
        currentFrame: totalFrames,
        totalFrames,
        currentPanel: panels.length,
        totalPanels: panels.length,
        percentage: 95,
        message: 'Encoding video...',
      });

      const blob = await this.finalizeRecording();

      const result: ExportResult = {
        success: true,
        blob,
        url: URL.createObjectURL(blob),
        duration: totalDuration,
        frameCount: totalFrames,
        fileSize: blob.size,
      };

      this.reportProgress({
        phase: 'complete',
        currentFrame: totalFrames,
        totalFrames,
        currentPanel: panels.length,
        totalPanels: panels.length,
        percentage: 100,
        message: 'Export complete!',
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.reportProgress({
        phase: 'error',
        currentFrame: 0,
        totalFrames: 0,
        currentPanel: 0,
        totalPanels: panels.length,
        percentage: 0,
        message: `Export failed: ${errorMessage}`,
      });

      return {
        success: false,
        duration: 0,
        frameCount: 0,
        error: errorMessage,
      };
    } finally {
      this.cleanup();
    }
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  // --------------------------------------------------------------------------
  // Frame Rendering
  // --------------------------------------------------------------------------

  private async renderFrame(
    panels: PanelData[],
    controller: TimingController,
    currentTime: number
  ): Promise<void> {
    if (!this.ctx || !this.canvas) return;

    const { width, height } = this.canvas;

    // Clear canvas
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, width, height);

    // Get current panel and transition state
    const panelInfo = controller.getPanelAtTime(currentTime);
    const transitionState = controller.getTransitionState(currentTime);

    if (!panelInfo) return;

    const currentPanel = panels.find((p) => p.id === panelInfo.panelId);
    if (!currentPanel) return;

    if (transitionState?.inTransition && transitionState.fromPanelId && transitionState.toPanelId) {
      // Render transition
      const fromPanel = panels.find((p) => p.id === transitionState.fromPanelId);
      const toPanel = panels.find((p) => p.id === transitionState.toPanelId);

      if (fromPanel && toPanel) {
        await this.renderTransition(
          fromPanel,
          toPanel,
          transitionState.transitionType,
          transitionState.transitionProgress,
          controller
        );
      }
    } else {
      // Render single panel with Ken Burns
      const kenBurnsTransform = controller.getKenBurnsTransform(
        currentPanel.id,
        panelInfo.progress
      );
      await this.renderPanel(currentPanel, kenBurnsTransform);
    }

    // Add watermark if configured
    if (this.settings.watermark) {
      this.renderWatermark();
    }
  }

  private async renderPanel(
    panel: PanelData,
    kenBurns?: { scale: number; translateX: number; translateY: number }
  ): Promise<void> {
    if (!this.ctx || !this.canvas) return;

    const { width, height } = this.canvas;
    const image = await this.getImage(panel);

    if (!image) {
      // Render placeholder
      this.ctx.fillStyle = '#1e293b';
      this.ctx.fillRect(0, 0, width, height);
      this.ctx.fillStyle = '#475569';
      this.ctx.font = '48px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(`Panel: ${panel.id}`, width / 2, height / 2);
      return;
    }

    this.ctx.save();

    if (kenBurns && kenBurns.scale !== 1) {
      // Apply Ken Burns transform
      this.ctx.translate(width / 2, height / 2);
      this.ctx.scale(kenBurns.scale, kenBurns.scale);
      this.ctx.translate(
        kenBurns.translateX * width * 0.5,
        kenBurns.translateY * height * 0.5
      );
      this.ctx.translate(-width / 2, -height / 2);
    }

    // Draw image maintaining aspect ratio
    const imgAspect = image.width / image.height;
    const canvasAspect = width / height;

    let drawWidth: number, drawHeight: number, drawX: number, drawY: number;

    if (imgAspect > canvasAspect) {
      drawHeight = height;
      drawWidth = drawHeight * imgAspect;
      drawX = (width - drawWidth) / 2;
      drawY = 0;
    } else {
      drawWidth = width;
      drawHeight = drawWidth / imgAspect;
      drawX = 0;
      drawY = (height - drawHeight) / 2;
    }

    this.ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    this.ctx.restore();
  }

  private async renderTransition(
    fromPanel: PanelData,
    toPanel: PanelData,
    type: TransitionType,
    progress: number,
    controller: TimingController
  ): Promise<void> {
    if (!this.ctx || !this.canvas) return;

    const { width, height } = this.canvas;
    const fromImage = await this.getImage(fromPanel);
    const toImage = await this.getImage(toPanel);

    switch (type) {
      case 'cut':
        if (progress < 0.5) {
          await this.renderPanel(fromPanel);
        } else {
          await this.renderPanel(toPanel);
        }
        break;

      case 'fade':
        if (progress < 0.5) {
          await this.renderPanel(fromPanel);
          this.ctx.fillStyle = `rgba(0, 0, 0, ${progress * 2})`;
          this.ctx.fillRect(0, 0, width, height);
        } else {
          await this.renderPanel(toPanel);
          this.ctx.fillStyle = `rgba(0, 0, 0, ${(1 - progress) * 2})`;
          this.ctx.fillRect(0, 0, width, height);
        }
        break;

      case 'dissolve':
        await this.renderPanel(fromPanel);
        this.ctx.globalAlpha = progress;
        await this.renderPanel(toPanel);
        this.ctx.globalAlpha = 1;
        break;

      case 'wipe-left':
        await this.renderPanel(fromPanel);
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(0, 0, width * progress, height);
        this.ctx.clip();
        await this.renderPanel(toPanel);
        this.ctx.restore();
        break;

      case 'wipe-right':
        await this.renderPanel(fromPanel);
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(width * (1 - progress), 0, width * progress, height);
        this.ctx.clip();
        await this.renderPanel(toPanel);
        this.ctx.restore();
        break;

      case 'wipe-up':
        await this.renderPanel(fromPanel);
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(0, height * (1 - progress), width, height * progress);
        this.ctx.clip();
        await this.renderPanel(toPanel);
        this.ctx.restore();
        break;

      case 'wipe-down':
        await this.renderPanel(fromPanel);
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(0, 0, width, height * progress);
        this.ctx.clip();
        await this.renderPanel(toPanel);
        this.ctx.restore();
        break;

      case 'push-left':
        this.ctx.save();
        this.ctx.translate(-width * progress, 0);
        await this.renderPanel(fromPanel);
        this.ctx.translate(width, 0);
        await this.renderPanel(toPanel);
        this.ctx.restore();
        break;

      case 'push-right':
        this.ctx.save();
        this.ctx.translate(width * progress, 0);
        await this.renderPanel(fromPanel);
        this.ctx.translate(-width, 0);
        await this.renderPanel(toPanel);
        this.ctx.restore();
        break;

      case 'zoom-in':
        await this.renderPanel(fromPanel);
        this.ctx.globalAlpha = progress;
        this.ctx.save();
        this.ctx.translate(width / 2, height / 2);
        this.ctx.scale(0.5 + progress * 0.5, 0.5 + progress * 0.5);
        this.ctx.translate(-width / 2, -height / 2);
        await this.renderPanel(toPanel);
        this.ctx.restore();
        this.ctx.globalAlpha = 1;
        break;

      case 'zoom-out':
        await this.renderPanel(fromPanel);
        this.ctx.globalAlpha = progress;
        this.ctx.save();
        this.ctx.translate(width / 2, height / 2);
        this.ctx.scale(1.5 - progress * 0.5, 1.5 - progress * 0.5);
        this.ctx.translate(-width / 2, -height / 2);
        await this.renderPanel(toPanel);
        this.ctx.restore();
        this.ctx.globalAlpha = 1;
        break;

      default:
        await this.renderPanel(progress < 0.5 ? fromPanel : toPanel);
    }
  }

  private renderWatermark(): void {
    if (!this.ctx || !this.canvas || !this.settings.watermark) return;

    const { width, height } = this.canvas;
    const { text, position, opacity } = this.settings.watermark;

    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '24px sans-serif';

    const padding = 20;
    const textMetrics = this.ctx.measureText(text);

    let x: number, y: number;

    switch (position) {
      case 'top-left':
        x = padding;
        y = padding + 24;
        this.ctx.textAlign = 'left';
        break;
      case 'top-right':
        x = width - padding;
        y = padding + 24;
        this.ctx.textAlign = 'right';
        break;
      case 'bottom-left':
        x = padding;
        y = height - padding;
        this.ctx.textAlign = 'left';
        break;
      case 'bottom-right':
      default:
        x = width - padding;
        y = height - padding;
        this.ctx.textAlign = 'right';
    }

    // Shadow for readability
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;

    this.ctx.fillText(text, x, y);
    this.ctx.restore();
  }

  // --------------------------------------------------------------------------
  // Image Handling
  // --------------------------------------------------------------------------

  private async preloadImages(panels: PanelData[]): Promise<void> {
    const promises = panels.map(async (panel) => {
      const url = panel.imageUrl || panel.thumbnail;
      if (url && !this.imageCache.has(url)) {
        const image = await this.loadImage(url);
        if (image) {
          this.imageCache.set(url, image);
        }
      }
    });

    await Promise.all(promises);
  }

  private async loadImage(url: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  private async getImage(panel: PanelData): Promise<HTMLImageElement | null> {
    if (panel.canvas) {
      // Convert canvas to image
      const dataUrl = panel.canvas.toDataURL();
      return this.loadImage(dataUrl);
    }

    const url = panel.imageUrl || panel.thumbnail;
    if (url) {
      return this.imageCache.get(url) || this.loadImage(url);
    }

    return null;
  }

  // --------------------------------------------------------------------------
  // Recording Helpers
  // --------------------------------------------------------------------------

  private getSupportedMimeType(): string {
    const preferred = FORMAT_MIME_MAP[this.settings.format];

    if (MediaRecorder.isTypeSupported(preferred)) {
      return preferred;
    }

    // Fallback options
    const fallbacks = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
    ];

    for (const mime of fallbacks) {
      if (MediaRecorder.isTypeSupported(mime)) {
        return mime;
      }
    }

    return 'video/webm';
  }

  private async finalizeRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No media recorder'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: this.getSupportedMimeType(),
        });
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  // --------------------------------------------------------------------------
  // Utility Methods
  // --------------------------------------------------------------------------

  private reportProgress(progress: ExportProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  private estimateTimeRemaining(
    currentFrame: number,
    totalFrames: number,
    startTime: number
  ): number {
    if (currentFrame === 0) return 0;

    const elapsed = performance.now() - startTime;
    const avgTimePerFrame = elapsed / currentFrame;
    const remainingFrames = totalFrames - currentFrame;

    return Math.round((remainingFrames * avgTimePerFrame) / 1000);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private cleanup(): void {
    this.isExporting = false;
    this.progressCallback = null;
    this.abortController = null;

    if (this.mediaRecorder) {
      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      this.mediaRecorder = null;
    }

    this.recordedChunks = [];
    this.canvas = null;
    this.ctx = null;
  }

  // --------------------------------------------------------------------------
  // Static Utilities
  // --------------------------------------------------------------------------

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const animaticExporter = new AnimaticExporter();
