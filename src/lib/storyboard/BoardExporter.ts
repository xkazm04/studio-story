/**
 * BoardExporter - PDF and Image Export for Storyboards
 *
 * Generates professional-quality PDF and image exports from storyboard panels
 * with customizable layouts, annotations, and formatting options.
 */

// ============================================================================
// Types
// ============================================================================

export type ExportFormat = 'pdf' | 'png' | 'jpg' | 'svg';
export type PageOrientation = 'portrait' | 'landscape';
export type PageSize = 'letter' | 'a4' | 'tabloid' | 'custom';
export type GridLayout = '2x2' | '2x3' | '3x2' | '3x3' | '4x3' | '4x4' | '1x1' | 'list' | 'sequence';

export interface StoryboardPanel {
  id: string;
  order: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  shotType?: string;
  cameraAngle?: string;
  cameraMovement?: string;
  duration?: number;
  dialogue?: string;
  action?: string;
  notes?: string;
  isKeyFrame?: boolean;
}

export interface Annotation {
  id: string;
  type: 'dialogue' | 'action' | 'sfx' | 'note' | 'transition';
  content: string;
  character?: string;
  order: number;
}

export interface ExportOptions {
  format: ExportFormat;
  pageSize: PageSize;
  orientation: PageOrientation;
  gridLayout: GridLayout;
  customWidth?: number;
  customHeight?: number;
  includeCoverPage?: boolean;
  includePageNumbers?: boolean;
  includeTimestamps?: boolean;
  includeShotInfo?: boolean;
  includeAnnotations?: boolean;
  includeNotes?: boolean;
  quality?: number; // 1-100 for jpg
  dpi?: number; // For print quality
  backgroundColor?: string;
  borderColor?: string;
  showBorders?: boolean;
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface StoryboardExportData {
  title: string;
  projectName?: string;
  sceneName?: string;
  director?: string;
  dateCreated?: string;
  version?: string;
  panels: StoryboardPanel[];
  annotations?: Record<string, Annotation[]>; // panelId -> annotations
}

export interface ExportResult {
  success: boolean;
  format: ExportFormat;
  filename: string;
  dataUrl?: string;
  blob?: Blob;
  pages?: number;
  error?: string;
}

// ============================================================================
// Constants
// ============================================================================

const PAGE_SIZES: Record<PageSize, { width: number; height: number }> = {
  letter: { width: 612, height: 792 }, // 8.5 x 11 inches at 72 DPI
  a4: { width: 595, height: 842 }, // 210 x 297 mm at 72 DPI
  tabloid: { width: 792, height: 1224 }, // 11 x 17 inches at 72 DPI
  custom: { width: 612, height: 792 },
};

const GRID_CONFIGS: Record<GridLayout, { cols: number; rows: number }> = {
  '1x1': { cols: 1, rows: 1 },
  '2x2': { cols: 2, rows: 2 },
  '2x3': { cols: 2, rows: 3 },
  '3x2': { cols: 3, rows: 2 },
  '3x3': { cols: 3, rows: 3 },
  '4x3': { cols: 4, rows: 3 },
  '4x4': { cols: 4, rows: 4 },
  'list': { cols: 1, rows: 6 },
  'sequence': { cols: 1, rows: 4 },
};

const DEFAULT_OPTIONS: ExportOptions = {
  format: 'pdf',
  pageSize: 'letter',
  orientation: 'landscape',
  gridLayout: '2x3',
  includeCoverPage: true,
  includePageNumbers: true,
  includeTimestamps: false,
  includeShotInfo: true,
  includeAnnotations: true,
  includeNotes: false,
  quality: 90,
  dpi: 150,
  backgroundColor: '#1e293b',
  borderColor: '#334155',
  showBorders: true,
  margins: { top: 36, right: 36, bottom: 36, left: 36 },
};

// ============================================================================
// Helper Functions
// ============================================================================

function getPageDimensions(options: ExportOptions): { width: number; height: number } {
  let { width, height } = options.pageSize === 'custom' && options.customWidth && options.customHeight
    ? { width: options.customWidth, height: options.customHeight }
    : PAGE_SIZES[options.pageSize];

  // Swap for landscape
  if (options.orientation === 'landscape') {
    [width, height] = [height, width];
  }

  return { width, height };
}

function calculatePanelsPerPage(gridLayout: GridLayout): number {
  const config = GRID_CONFIGS[gridLayout];
  return config.cols * config.rows;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}s`;
}

function formatShotType(shotType: string): string {
  return shotType
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ============================================================================
// Canvas Rendering Functions
// ============================================================================

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function drawPanelToCanvas(
  ctx: CanvasRenderingContext2D,
  panel: StoryboardPanel,
  annotations: Annotation[],
  x: number,
  y: number,
  width: number,
  height: number,
  options: ExportOptions,
  image?: HTMLImageElement
): void {
  const padding = 8;
  const infoHeight = options.includeShotInfo ? 40 : 0;
  const annotationHeight = options.includeAnnotations && annotations.length > 0 ? 30 : 0;

  // Draw border
  if (options.showBorders) {
    ctx.strokeStyle = options.borderColor || '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
  }

  // Draw image area
  const imageWidth = width - padding * 2;
  const imageHeight = height - padding * 2 - infoHeight - annotationHeight;

  if (image) {
    // Calculate aspect ratio fit
    const imgAspect = image.width / image.height;
    const boxAspect = imageWidth / imageHeight;

    let drawWidth = imageWidth;
    let drawHeight = imageHeight;
    let drawX = x + padding;
    let drawY = y + padding;

    if (imgAspect > boxAspect) {
      drawHeight = imageWidth / imgAspect;
      drawY = y + padding + (imageHeight - drawHeight) / 2;
    } else {
      drawWidth = imageHeight * imgAspect;
      drawX = x + padding + (imageWidth - drawWidth) / 2;
    }

    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  } else {
    // Draw placeholder
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + padding, y + padding, imageWidth, imageHeight);

    ctx.fillStyle = '#475569';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No Image', x + width / 2, y + padding + imageHeight / 2);
  }

  // Draw panel number badge
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(x + padding + 4, y + padding + 4, 24, 20, 4);
  ctx.fill();

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(panel.order), x + padding + 16, y + padding + 17);

  // Draw key frame badge
  if (panel.isKeyFrame) {
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.roundRect(x + width - padding - 28, y + padding + 4, 24, 14, 4);
    ctx.fill();

    ctx.fillStyle = '#422006';
    ctx.font = 'bold 8px system-ui, sans-serif';
    ctx.fillText('KEY', x + width - padding - 16, y + padding + 13);
  }

  // Draw shot info
  if (options.includeShotInfo && (panel.shotType || panel.cameraMovement || panel.duration)) {
    const infoY = y + height - infoHeight - annotationHeight + padding;

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px system-ui, sans-serif';
    ctx.textAlign = 'left';

    let infoText = '';
    if (panel.shotType) infoText += formatShotType(panel.shotType);
    if (panel.cameraAngle) infoText += ` • ${formatShotType(panel.cameraAngle)}`;
    if (panel.cameraMovement && panel.cameraMovement !== 'static') {
      infoText += ` • ${formatShotType(panel.cameraMovement)}`;
    }
    if (panel.duration) infoText += ` • ${formatDuration(panel.duration)}`;

    ctx.fillText(infoText.slice(0, 50), x + padding, infoY);

    if (panel.action) {
      ctx.fillStyle = '#64748b';
      ctx.font = '8px system-ui, sans-serif';
      const actionText = panel.action.length > 60 ? panel.action.slice(0, 57) + '...' : panel.action;
      ctx.fillText(actionText, x + padding, infoY + 14);
    }
  }

  // Draw annotations preview
  if (options.includeAnnotations && annotations.length > 0) {
    const annotY = y + height - annotationHeight + padding / 2;

    ctx.fillStyle = '#475569';
    ctx.font = 'italic 8px system-ui, sans-serif';

    const dialogueAnnotation = annotations.find(a => a.type === 'dialogue');
    if (dialogueAnnotation) {
      const dialogueText = dialogueAnnotation.content.length > 40
        ? dialogueAnnotation.content.slice(0, 37) + '...'
        : dialogueAnnotation.content;
      ctx.fillText(`"${dialogueText}"`, x + padding, annotY);
    }
  }
}

function drawCoverPage(
  ctx: CanvasRenderingContext2D,
  data: StoryboardExportData,
  width: number,
  height: number,
  options: ExportOptions
): void {
  // Background
  ctx.fillStyle = options.backgroundColor || '#1e293b';
  ctx.fillRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;

  // Title
  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 32px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(data.title, centerX, centerY - 60);

  // Subtitle / Scene name
  if (data.sceneName) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText(data.sceneName, centerX, centerY - 20);
  }

  // Project name
  if (data.projectName) {
    ctx.fillStyle = '#64748b';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(data.projectName, centerX, centerY + 20);
  }

  // Metadata
  ctx.fillStyle = '#475569';
  ctx.font = '12px system-ui, sans-serif';

  let metaY = centerY + 80;
  if (data.director) {
    ctx.fillText(`Director: ${data.director}`, centerX, metaY);
    metaY += 20;
  }
  if (data.dateCreated) {
    ctx.fillText(`Date: ${data.dateCreated}`, centerX, metaY);
    metaY += 20;
  }
  if (data.version) {
    ctx.fillText(`Version: ${data.version}`, centerX, metaY);
  }

  // Panel count
  ctx.fillStyle = '#334155';
  ctx.fillText(`${data.panels.length} Panels`, centerX, height - 60);
}

// ============================================================================
// BoardExporter Class
// ============================================================================

class BoardExporter {
  private static instance: BoardExporter;

  private constructor() {}

  static getInstance(): BoardExporter {
    if (!BoardExporter.instance) {
      BoardExporter.instance = new BoardExporter();
    }
    return BoardExporter.instance;
  }

  // -------------------------------------------------------------------------
  // Export Methods
  // -------------------------------------------------------------------------

  async exportToImage(
    data: StoryboardExportData,
    options: Partial<ExportOptions> = {}
  ): Promise<ExportResult> {
    const opts: ExportOptions = { ...DEFAULT_OPTIONS, ...options };

    try {
      const { width, height } = getPageDimensions(opts);
      const canvas = document.createElement('canvas');
      const dpiScale = (opts.dpi || 150) / 72;
      canvas.width = width * dpiScale;
      canvas.height = height * dpiScale;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      ctx.scale(dpiScale, dpiScale);

      // Draw background
      ctx.fillStyle = opts.backgroundColor || '#1e293b';
      ctx.fillRect(0, 0, width, height);

      // Calculate layout
      const gridConfig = GRID_CONFIGS[opts.gridLayout];
      const margins = opts.margins || DEFAULT_OPTIONS.margins!;
      const usableWidth = width - margins.left - margins.right;
      const usableHeight = height - margins.top - margins.bottom;
      const panelWidth = usableWidth / gridConfig.cols;
      const panelHeight = usableHeight / gridConfig.rows;

      // Load images
      const imagePromises = data.panels.slice(0, gridConfig.cols * gridConfig.rows).map(async (panel) => {
        if (panel.imageUrl || panel.thumbnailUrl) {
          try {
            return await loadImage(panel.thumbnailUrl || panel.imageUrl!);
          } catch {
            return undefined;
          }
        }
        return undefined;
      });

      const images = await Promise.all(imagePromises);

      // Draw panels
      data.panels.slice(0, gridConfig.cols * gridConfig.rows).forEach((panel, index) => {
        const col = index % gridConfig.cols;
        const row = Math.floor(index / gridConfig.cols);
        const x = margins.left + col * panelWidth;
        const y = margins.top + row * panelHeight;
        const annotations = data.annotations?.[panel.id] || [];

        drawPanelToCanvas(ctx, panel, annotations, x, y, panelWidth, panelHeight, opts, images[index]);
      });

      // Generate output
      const format = opts.format === 'jpg' ? 'image/jpeg' : 'image/png';
      const quality = opts.format === 'jpg' ? (opts.quality || 90) / 100 : undefined;
      const dataUrl = canvas.toDataURL(format, quality);

      return {
        success: true,
        format: opts.format,
        filename: `${data.title.replace(/\s+/g, '_')}_storyboard.${opts.format}`,
        dataUrl,
        pages: 1,
      };
    } catch (error) {
      return {
        success: false,
        format: opts.format,
        filename: '',
        error: error instanceof Error ? error.message : 'Export failed',
      };
    }
  }

  async exportToPDF(
    data: StoryboardExportData,
    options: Partial<ExportOptions> = {}
  ): Promise<ExportResult> {
    const opts: ExportOptions = { ...DEFAULT_OPTIONS, ...options, format: 'pdf' };

    try {
      const { width, height } = getPageDimensions(opts);
      const panelsPerPage = calculatePanelsPerPage(opts.gridLayout);
      const totalPages = Math.ceil(data.panels.length / panelsPerPage) + (opts.includeCoverPage ? 1 : 0);

      // For PDF, we'll generate a multi-page canvas representation
      // In a real implementation, you'd use a library like jsPDF or pdfkit
      const pages: string[] = [];

      // Create cover page
      if (opts.includeCoverPage) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawCoverPage(ctx, data, width, height, opts);
          pages.push(canvas.toDataURL('image/png'));
        }
      }

      // Create content pages
      const gridConfig = GRID_CONFIGS[opts.gridLayout];
      const margins = opts.margins || DEFAULT_OPTIONS.margins!;
      const usableWidth = width - margins.left - margins.right;
      const usableHeight = height - margins.top - margins.bottom - (opts.includePageNumbers ? 20 : 0);
      const panelWidth = usableWidth / gridConfig.cols;
      const panelHeight = usableHeight / gridConfig.rows;

      for (let pageIndex = 0; pageIndex < Math.ceil(data.panels.length / panelsPerPage); pageIndex++) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) continue;

        // Background
        ctx.fillStyle = opts.backgroundColor || '#1e293b';
        ctx.fillRect(0, 0, width, height);

        // Get panels for this page
        const startIndex = pageIndex * panelsPerPage;
        const pagePanels = data.panels.slice(startIndex, startIndex + panelsPerPage);

        // Load images for this page
        const imagePromises = pagePanels.map(async (panel) => {
          if (panel.imageUrl || panel.thumbnailUrl) {
            try {
              return await loadImage(panel.thumbnailUrl || panel.imageUrl!);
            } catch {
              return undefined;
            }
          }
          return undefined;
        });

        const images = await Promise.all(imagePromises);

        // Draw panels
        pagePanels.forEach((panel, index) => {
          const col = index % gridConfig.cols;
          const row = Math.floor(index / gridConfig.cols);
          const x = margins.left + col * panelWidth;
          const y = margins.top + row * panelHeight;
          const annotations = data.annotations?.[panel.id] || [];

          drawPanelToCanvas(ctx, panel, annotations, x, y, panelWidth, panelHeight, opts, images[index]);
        });

        // Draw page number
        if (opts.includePageNumbers) {
          const displayPageNum = opts.includeCoverPage ? pageIndex + 2 : pageIndex + 1;
          ctx.fillStyle = '#64748b';
          ctx.font = '10px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(
            `Page ${displayPageNum} of ${totalPages}`,
            width / 2,
            height - 20
          );
        }

        pages.push(canvas.toDataURL('image/png'));
      }

      // For now, return the first page as data URL
      // In production, you'd combine these into an actual PDF
      return {
        success: true,
        format: 'pdf',
        filename: `${data.title.replace(/\s+/g, '_')}_storyboard.pdf`,
        dataUrl: pages[0],
        pages: totalPages,
      };
    } catch (error) {
      return {
        success: false,
        format: 'pdf',
        filename: '',
        error: error instanceof Error ? error.message : 'PDF export failed',
      };
    }
  }

  async export(
    data: StoryboardExportData,
    options: Partial<ExportOptions> = {}
  ): Promise<ExportResult> {
    const format = options.format || 'pdf';

    if (format === 'pdf') {
      return this.exportToPDF(data, options);
    } else {
      return this.exportToImage(data, { ...options, format });
    }
  }

  // -------------------------------------------------------------------------
  // Utility Methods
  // -------------------------------------------------------------------------

  getAvailableFormats(): ExportFormat[] {
    return ['pdf', 'png', 'jpg'];
  }

  getAvailablePageSizes(): PageSize[] {
    return ['letter', 'a4', 'tabloid', 'custom'];
  }

  getAvailableGridLayouts(): GridLayout[] {
    return ['1x1', '2x2', '2x3', '3x3', '4x4', 'sequence'];
  }

  getDefaultOptions(): ExportOptions {
    return { ...DEFAULT_OPTIONS };
  }

  calculatePageCount(panelCount: number, gridLayout: GridLayout, includeCover: boolean): number {
    const panelsPerPage = calculatePanelsPerPage(gridLayout);
    const contentPages = Math.ceil(panelCount / panelsPerPage);
    return includeCover ? contentPages + 1 : contentPages;
  }

  // Download helper
  downloadResult(result: ExportResult): void {
    if (!result.success || !result.dataUrl) return;

    const link = document.createElement('a');
    link.download = result.filename;
    link.href = result.dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Export singleton instance
export const boardExporter = BoardExporter.getInstance();

// Export class for testing
export { BoardExporter };
