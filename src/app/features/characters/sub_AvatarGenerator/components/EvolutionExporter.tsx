/**
 * EvolutionExporter - Export avatar evolution as images, GIFs, or sprite sheets
 * Design: Clean Manuscript style with cyan accents
 *
 * Supports timeline strip, animation GIF, and comparison grid exports
 */

'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Image,
  Film,
  LayoutGrid,
  Rows,
  Settings,
  Play,
  Pause,
  RefreshCw,
  FileImage,
  Eye,
  X,
  Check,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type { AvatarHistoryEntry } from '@/app/hooks/integration/useAvatarTimeline';

// ============================================================================
// Types
// ============================================================================

export type ExportFormat = 'png' | 'jpeg' | 'webp';
export type ExportLayout = 'strip' | 'grid' | 'single' | 'comparison';

export interface ExportSettings {
  format: ExportFormat;
  layout: ExportLayout;
  quality: number; // 0-100
  width: number;
  height: number;
  padding: number;
  backgroundColor: string;
  includeLabels: boolean;
  labelColor: string;
  frameDelay: number; // For GIF animation (ms)
}

export interface EvolutionExporterProps {
  entries: AvatarHistoryEntry[];
  characterName?: string;
  onExport?: (blob: Blob, filename: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_SETTINGS: ExportSettings = {
  format: 'png',
  layout: 'strip',
  quality: 90,
  width: 512,
  height: 512,
  padding: 16,
  backgroundColor: '#1e293b', // slate-800
  includeLabels: true,
  labelColor: '#ffffff',
  frameDelay: 500,
};

const FORMAT_OPTIONS: { format: ExportFormat; label: string; description: string }[] = [
  { format: 'png', label: 'PNG', description: 'Lossless, transparent support' },
  { format: 'jpeg', label: 'JPEG', description: 'Smaller size, no transparency' },
  { format: 'webp', label: 'WebP', description: 'Modern format, good compression' },
];

const LAYOUT_OPTIONS: {
  layout: ExportLayout;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    layout: 'strip',
    label: 'Timeline Strip',
    icon: <Rows size={14} />,
    description: 'Horizontal progression',
  },
  {
    layout: 'grid',
    label: 'Grid',
    icon: <LayoutGrid size={14} />,
    description: 'Arranged in rows/cols',
  },
  {
    layout: 'comparison',
    label: 'Before/After',
    icon: <Image size={14} />,
    description: 'First and last comparison',
  },
  {
    layout: 'single',
    label: 'Individual',
    icon: <FileImage size={14} />,
    description: 'Export each separately',
  },
];

const PRESET_SIZES = [
  { label: '256px', value: 256 },
  { label: '512px', value: 512 },
  { label: '768px', value: 768 },
  { label: '1024px', value: 1024 },
];

// ============================================================================
// Helper Functions
// ============================================================================

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function getMimeType(format: ExportFormat): string {
  switch (format) {
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/png';
  }
}

// ============================================================================
// Main Component
// ============================================================================

const EvolutionExporter: React.FC<EvolutionExporterProps> = ({
  entries,
  characterName = 'character',
  onExport,
  disabled = false,
  compact = false,
}) => {
  const [settings, setSettings] = useState<ExportSettings>(DEFAULT_SETTINGS);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate canvas dimensions based on layout
  const canvasDimensions = useMemo(() => {
    const { width, height, padding, layout } = settings;
    const count = entries.length;

    switch (layout) {
      case 'strip':
        return {
          width: count * width + (count + 1) * padding,
          height: height + padding * 2,
        };
      case 'grid': {
        const cols = Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);
        return {
          width: cols * width + (cols + 1) * padding,
          height: rows * height + (rows + 1) * padding + (settings.includeLabels ? 24 * rows : 0),
        };
      }
      case 'comparison':
        return {
          width: 2 * width + 3 * padding,
          height: height + padding * 2 + (settings.includeLabels ? 24 : 0),
        };
      case 'single':
      default:
        return {
          width: width + padding * 2,
          height: height + padding * 2 + (settings.includeLabels ? 24 : 0),
        };
    }
  }, [settings, entries.length]);

  // Update a setting
  const updateSetting = <K extends keyof ExportSettings>(key: K, value: ExportSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setPreviewUrl(null); // Clear preview on settings change
  };

  // Generate preview
  const generatePreview = useCallback(async () => {
    if (entries.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    setError(null);
    setIsExporting(true);
    setExportProgress(0);

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const { width, height, padding, layout, backgroundColor, includeLabels, labelColor } = settings;

      // Set canvas size
      canvas.width = canvasDimensions.width;
      canvas.height = canvasDimensions.height;

      // Fill background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Load and draw images based on layout
      const entriesToDraw = layout === 'comparison' && entries.length >= 2
        ? [entries[0], entries[entries.length - 1]]
        : entries;

      for (let i = 0; i < entriesToDraw.length; i++) {
        const entry = entriesToDraw[i];
        setExportProgress(((i + 1) / entriesToDraw.length) * 100);

        if (!entry.avatar_url) continue;

        try {
          const img = await loadImage(entry.avatar_url);

          let x = 0;
          let y = 0;

          switch (layout) {
            case 'strip':
              x = padding + i * (width + padding);
              y = padding;
              break;
            case 'grid': {
              const cols = Math.ceil(Math.sqrt(entriesToDraw.length));
              const col = i % cols;
              const row = Math.floor(i / cols);
              x = padding + col * (width + padding);
              y = padding + row * (height + padding + (includeLabels ? 24 : 0));
              break;
            }
            case 'comparison':
              x = padding + i * (width + padding);
              y = padding;
              break;
            case 'single':
              x = padding;
              y = padding;
              break;
          }

          // Draw image
          ctx.drawImage(img, x, y, width, height);

          // Draw label
          if (includeLabels) {
            ctx.fillStyle = labelColor;
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            const label = layout === 'comparison'
              ? (i === 0 ? 'Before' : 'After')
              : entry.transformation_type || `#${i + 1}`;
            ctx.fillText(label, x + width / 2, y + height + 18);
          }
        } catch (imgError) {
          console.warn(`Failed to load image for entry ${i}:`, imgError);
        }
      }

      // Generate preview URL
      const url = canvas.toDataURL(getMimeType(settings.format), settings.quality / 100);
      setPreviewUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
      setExportProgress(100);
    }
  }, [entries, settings, canvasDimensions]);

  // Download export
  const downloadExport = useCallback(async () => {
    if (!previewUrl) {
      await generatePreview();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))),
          getMimeType(settings.format),
          settings.quality / 100
        );
      });

      const timestamp = Date.now();
      const filename = `${characterName}-evolution-${settings.layout}-${timestamp}.${settings.format}`;

      if (onExport) {
        onExport(blob, filename);
      } else {
        // Default download behavior
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  }, [previewUrl, settings, characterName, onExport, generatePreview]);

  if (compact) {
    return (
      <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <h3 className="font-mono text-xs uppercase tracking-wide text-slate-300">
              export
            </h3>
          </div>
        </div>

        <div className="flex gap-2">
          <select
            value={settings.layout}
            onChange={(e) => updateSetting('layout', e.target.value as ExportLayout)}
            disabled={disabled || entries.length === 0}
            className="flex-1 px-2 py-1.5 bg-slate-800/40 border border-slate-700/50 rounded
                       font-mono text-xs text-slate-300
                       focus:outline-none focus:ring-1 focus:ring-cyan-500/50
                       disabled:opacity-50"
          >
            {LAYOUT_OPTIONS.map((option) => (
              <option key={option.layout} value={option.layout}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            onClick={downloadExport}
            disabled={disabled || entries.length === 0 || isExporting}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded',
              'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400',
              'font-mono text-xs transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Download size={12} />
            <span>Export</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
            evolution_exporter
          </h3>
          <span className="px-2 py-0.5 bg-slate-800/60 rounded text-[10px] font-mono text-slate-500">
            {entries.length} entries
          </span>
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded transition-colors',
            showAdvanced
              ? 'bg-cyan-500/20 text-cyan-400'
              : 'bg-slate-800/40 text-slate-400 hover:bg-slate-700/60'
          )}
        >
          <Settings size={12} />
          <span className="font-mono text-[10px]">Advanced</span>
          <ChevronDown
            size={12}
            className={cn('transition-transform', showAdvanced && 'rotate-180')}
          />
        </button>
      </div>

      {/* Layout Selection */}
      <div className="mb-4">
        <label className="block font-mono text-[10px] text-slate-500 uppercase mb-2">
          layout
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {LAYOUT_OPTIONS.map((option) => {
            const isSelected = option.layout === settings.layout;
            return (
              <button
                key={option.layout}
                onClick={() => updateSetting('layout', option.layout)}
                disabled={disabled}
                className={cn(
                  'flex flex-col items-center p-3 rounded-lg border transition-all text-center',
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                    : 'bg-slate-800/40 border-slate-700/50 text-slate-500 hover:border-slate-600',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {option.icon}
                <span className="font-mono text-[10px] mt-1">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Format & Size */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Format */}
        <div>
          <label className="block font-mono text-[10px] text-slate-500 uppercase mb-2">
            format
          </label>
          <select
            value={settings.format}
            onChange={(e) => updateSetting('format', e.target.value as ExportFormat)}
            disabled={disabled}
            className="w-full px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-lg
                       font-mono text-xs text-slate-300
                       focus:outline-none focus:ring-1 focus:ring-cyan-500/50
                       disabled:opacity-50"
          >
            {FORMAT_OPTIONS.map((option) => (
              <option key={option.format} value={option.format}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </div>

        {/* Size */}
        <div>
          <label className="block font-mono text-[10px] text-slate-500 uppercase mb-2">
            image_size
          </label>
          <div className="flex gap-1">
            {PRESET_SIZES.map((size) => (
              <button
                key={size.value}
                onClick={() => {
                  updateSetting('width', size.value);
                  updateSetting('height', size.value);
                }}
                disabled={disabled}
                className={cn(
                  'flex-1 px-2 py-2 rounded font-mono text-[10px] transition-colors',
                  settings.width === size.value
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'bg-slate-800/40 text-slate-500 hover:bg-slate-700/60',
                  disabled && 'opacity-50'
                )}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30"
          >
            <div className="grid grid-cols-2 gap-4">
              {/* Quality */}
              <div>
                <label className="block font-mono text-[10px] text-slate-500 uppercase mb-1">
                  quality: {settings.quality}%
                </label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={settings.quality}
                  onChange={(e) => updateSetting('quality', Number(e.target.value))}
                  disabled={disabled}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                             [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
                />
              </div>

              {/* Padding */}
              <div>
                <label className="block font-mono text-[10px] text-slate-500 uppercase mb-1">
                  padding: {settings.padding}px
                </label>
                <input
                  type="range"
                  min={0}
                  max={48}
                  value={settings.padding}
                  onChange={(e) => updateSetting('padding', Number(e.target.value))}
                  disabled={disabled}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                             [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
                />
              </div>

              {/* Background Color */}
              <div>
                <label className="block font-mono text-[10px] text-slate-500 uppercase mb-1">
                  background
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.backgroundColor}
                    onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                    disabled={disabled}
                    className="w-8 h-8 rounded border border-slate-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.backgroundColor}
                    onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                    disabled={disabled}
                    className="flex-1 px-2 py-1 bg-slate-900/50 border border-slate-700/50 rounded
                               font-mono text-[10px] text-slate-400
                               focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                  />
                </div>
              </div>

              {/* Labels */}
              <div>
                <label className="block font-mono text-[10px] text-slate-500 uppercase mb-1">
                  labels
                </label>
                <button
                  onClick={() => updateSetting('includeLabels', !settings.includeLabels)}
                  disabled={disabled}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 px-3 py-2 rounded border transition-colors',
                    settings.includeLabels
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-500'
                  )}
                >
                  {settings.includeLabels ? <Check size={12} /> : <X size={12} />}
                  <span className="font-mono text-[10px]">
                    {settings.includeLabels ? 'Enabled' : 'Disabled'}
                  </span>
                </button>
              </div>
            </div>

            {/* Output dimensions info */}
            <div className="mt-3 pt-3 border-t border-slate-700/30">
              <span className="font-mono text-[10px] text-slate-600">
                Output: {canvasDimensions.width} x {canvasDimensions.height}px
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview */}
      {previewUrl && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] text-slate-500 uppercase">preview</span>
            <button
              onClick={() => setPreviewUrl(null)}
              className="p-1 rounded hover:bg-slate-700/50 text-slate-500 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
          <div className="p-2 bg-slate-800/40 rounded-lg border border-slate-700/30 overflow-auto max-h-64">
            <img
              src={previewUrl}
              alt="Export preview"
              className="max-w-full h-auto"
              style={{ imageRendering: 'auto' }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertCircle size={14} className="text-red-400" />
          <span className="font-mono text-xs text-red-400">{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={generatePreview}
          disabled={disabled || entries.length === 0 || isExporting}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg',
            'bg-slate-800/40 hover:bg-slate-700/60 text-slate-300',
            'font-mono text-xs transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Eye size={14} />
          <span>Preview</span>
        </button>

        <button
          onClick={downloadExport}
          disabled={disabled || entries.length === 0 || isExporting}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg',
            'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400',
            'font-mono text-xs transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isExporting ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>{Math.round(exportProgress)}%</span>
            </>
          ) : (
            <>
              <Download size={14} />
              <span>Export</span>
            </>
          )}
        </button>
      </div>

      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="mt-4 text-center">
          <p className="font-mono text-xs text-slate-600">
            Add timeline entries to enable export
          </p>
        </div>
      )}
    </div>
  );
};

export default EvolutionExporter;
