/**
 * AvatarSheetExporter - Export organized sprite sheets from generated avatars
 * Design: Clean Manuscript style with cyan accents
 *
 * Creates sprite sheet exports in configurable grid layouts for games/comics
 */

'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Grid,
  Image,
  Settings2,
  Layers,
  Maximize,
  RefreshCw,
  Check,
  AlertCircle,
  FileImage,
  Folder,
  Eye,
  EyeOff,
  Move,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { GeneratedAvatar } from '../../hooks/useAvatarGenerator';

// ============================================================================
// Types
// ============================================================================

export interface ExportSettings {
  gridColumns: number;
  gridRows: number;
  cellSize: number;
  padding: number;
  backgroundColor: string;
  format: ExportFormat;
  quality: number;
  includeLabels: boolean;
  labelPosition: 'top' | 'bottom' | 'none';
}

export type ExportFormat = 'png' | 'jpeg' | 'webp';

export interface AvatarSheetItem {
  id: string;
  avatar: GeneratedAvatar;
  label?: string;
  order: number;
  included: boolean;
}

export interface AvatarSheetExporterProps {
  avatars: GeneratedAvatar[];
  characterName?: string;
  onExport?: (blob: Blob, filename: string) => void;
  disabled?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_SETTINGS: ExportSettings = {
  gridColumns: 4,
  gridRows: 2,
  cellSize: 256,
  padding: 4,
  backgroundColor: '#1e293b', // slate-800
  format: 'png',
  quality: 0.92,
  includeLabels: false,
  labelPosition: 'bottom',
};

const CELL_SIZE_OPTIONS = [
  { value: 64, label: '64px (Pixel Art)' },
  { value: 128, label: '128px (Small)' },
  { value: 256, label: '256px (Standard)' },
  { value: 512, label: '512px (Large)' },
  { value: 1024, label: '1024px (HD)' },
];

const GRID_PRESETS = [
  { cols: 2, rows: 2, name: '2x2 (4 cells)' },
  { cols: 4, rows: 2, name: '4x2 (8 cells)' },
  { cols: 4, rows: 3, name: '4x3 (12 cells)' },
  { cols: 4, rows: 4, name: '4x4 (16 cells)' },
  { cols: 6, rows: 4, name: '6x4 (24 cells)' },
  { cols: 8, rows: 4, name: '8x4 (32 cells)' },
];

const FORMAT_OPTIONS: { value: ExportFormat; label: string; description: string }[] = [
  { value: 'png', label: 'PNG', description: 'Lossless, transparent background' },
  { value: 'jpeg', label: 'JPEG', description: 'Compressed, smaller file' },
  { value: 'webp', label: 'WebP', description: 'Modern format, best compression' },
];

// ============================================================================
// Helper Functions
// ============================================================================

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function calculateSheetDimensions(settings: ExportSettings): { width: number; height: number } {
  const width = settings.gridColumns * (settings.cellSize + settings.padding) + settings.padding;
  const height = settings.gridRows * (settings.cellSize + settings.padding) + settings.padding;
  return { width, height };
}

// ============================================================================
// Subcomponents
// ============================================================================

interface SheetPreviewProps {
  items: AvatarSheetItem[];
  settings: ExportSettings;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onToggleItem?: (itemId: string) => void;
}

const SheetPreview: React.FC<SheetPreviewProps> = ({
  items,
  settings,
  onToggleItem,
}) => {
  const includedItems = items.filter(i => i.included);
  const { width, height } = calculateSheetDimensions(settings);
  const scale = Math.min(400 / width, 300 / height);

  return (
    <div className="flex flex-col items-center">
      {/* Sheet Preview */}
      <div
        className="relative border border-slate-600 rounded-lg overflow-hidden"
        style={{
          width: width * scale,
          height: height * scale,
          backgroundColor: settings.backgroundColor,
        }}
      >
        {/* Grid */}
        <div
          className="absolute inset-0 grid"
          style={{
            gridTemplateColumns: `repeat(${settings.gridColumns}, 1fr)`,
            gap: settings.padding * scale,
            padding: settings.padding * scale,
          }}
        >
          {Array.from({ length: settings.gridColumns * settings.gridRows }).map((_, index) => {
            const item = includedItems[index];
            const cellSize = settings.cellSize * scale;

            return (
              <div
                key={index}
                className={cn(
                  'relative rounded overflow-hidden',
                  !item && 'border border-dashed border-slate-600'
                )}
                style={{
                  width: cellSize,
                  height: cellSize,
                }}
              >
                {item ? (
                  <>
                    <img
                      src={item.avatar.url}
                      alt={item.label || `Avatar ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {settings.includeLabels && item.label && (
                      <div
                        className={cn(
                          'absolute left-0 right-0 bg-black/60 px-1 py-0.5',
                          'text-center truncate',
                          settings.labelPosition === 'top' ? 'top-0' : 'bottom-0'
                        )}
                        style={{ fontSize: Math.max(8, cellSize * 0.08) }}
                      >
                        <span className="text-white font-mono">{item.label}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <Image size={cellSize * 0.2} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dimensions */}
      <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-slate-500">
        <span>{width} × {height} px</span>
        <span>•</span>
        <span>{includedItems.length} / {settings.gridColumns * settings.gridRows} cells</span>
      </div>
    </div>
  );
};

interface ItemSelectorProps {
  items: AvatarSheetItem[];
  onToggle: (itemId: string) => void;
  onLabelChange: (itemId: string, label: string) => void;
  disabled?: boolean;
}

const ItemSelector: React.FC<ItemSelectorProps> = ({
  items,
  onToggle,
  onLabelChange,
  disabled,
}) => {
  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {items.map((item, index) => (
        <div
          key={item.id}
          className={cn(
            'flex items-center gap-3 p-2 rounded-lg border transition-all',
            item.included
              ? 'bg-cyan-500/10 border-cyan-500/30'
              : 'bg-slate-800/40 border-slate-700/50 opacity-60'
          )}
        >
          {/* Toggle */}
          <button
            onClick={() => onToggle(item.id)}
            disabled={disabled}
            className={cn(
              'w-5 h-5 rounded border flex items-center justify-center transition-colors',
              item.included
                ? 'bg-cyan-500 border-cyan-400'
                : 'bg-slate-700 border-slate-600'
            )}
          >
            {item.included && <Check size={12} className="text-white" />}
          </button>

          {/* Thumbnail */}
          <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
            <img
              src={item.avatar.url}
              alt={`Avatar ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Label Input */}
          <input
            type="text"
            value={item.label || ''}
            onChange={(e) => onLabelChange(item.id, e.target.value)}
            placeholder={`Avatar ${index + 1}`}
            disabled={disabled || !item.included}
            className={cn(
              'flex-1 px-2 py-1 bg-slate-800/60 border border-slate-700/50 rounded',
              'font-mono text-xs text-slate-300 placeholder:text-slate-600',
              'focus:outline-none focus:ring-1 focus:ring-cyan-500/50',
              'disabled:opacity-50'
            )}
          />

          {/* Order indicator */}
          <span className="font-mono text-[10px] text-slate-500 w-4">
            #{index + 1}
          </span>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const AvatarSheetExporter: React.FC<AvatarSheetExporterProps> = ({
  avatars,
  characterName = 'character',
  onExport,
  disabled = false,
}) => {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State
  const [settings, setSettings] = useState<ExportSettings>(DEFAULT_SETTINGS);
  const [items, setItems] = useState<AvatarSheetItem[]>(() =>
    avatars.map((avatar, index) => ({
      id: avatar.id,
      avatar,
      label: avatar.prompt?.split(',')[0]?.slice(0, 20) || `Avatar ${index + 1}`,
      order: index,
      included: true,
    }))
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Computed
  const includedCount = useMemo(() => items.filter(i => i.included).length, [items]);
  const maxCells = settings.gridColumns * settings.gridRows;
  const { width: sheetWidth, height: sheetHeight } = useMemo(
    () => calculateSheetDimensions(settings),
    [settings]
  );

  // Handlers
  const updateSetting = <K extends keyof ExportSettings>(key: K, value: ExportSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleItem = useCallback((itemId: string) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, included: !item.included } : item
    ));
  }, []);

  const updateItemLabel = useCallback((itemId: string, label: string) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, label } : item
    ));
  }, []);

  const applyGridPreset = (cols: number, rows: number) => {
    setSettings(prev => ({ ...prev, gridColumns: cols, gridRows: rows }));
  };

  const exportSheet = useCallback(async () => {
    if (!canvasRef.current || includedCount === 0) return;

    setIsExporting(true);
    setExportError(null);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      // Set canvas size
      canvas.width = sheetWidth;
      canvas.height = sheetHeight;

      // Fill background
      ctx.fillStyle = settings.backgroundColor;
      ctx.fillRect(0, 0, sheetWidth, sheetHeight);

      // Get included items in order
      const includedItems = items.filter(i => i.included).slice(0, maxCells);

      // Load all images
      const loadedImages = await Promise.all(
        includedItems.map(item => loadImage(item.avatar.url).catch(() => null))
      );

      // Draw each avatar
      for (let i = 0; i < includedItems.length; i++) {
        const img = loadedImages[i];
        if (!img) continue;

        const item = includedItems[i];
        const col = i % settings.gridColumns;
        const row = Math.floor(i / settings.gridColumns);

        const x = settings.padding + col * (settings.cellSize + settings.padding);
        const y = settings.padding + row * (settings.cellSize + settings.padding);

        // Draw image
        ctx.drawImage(img, x, y, settings.cellSize, settings.cellSize);

        // Draw label if enabled
        if (settings.includeLabels && item.label) {
          const labelHeight = Math.max(16, settings.cellSize * 0.08);
          const labelY = settings.labelPosition === 'top' ? y : y + settings.cellSize - labelHeight;

          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(x, labelY, settings.cellSize, labelHeight);

          ctx.fillStyle = '#ffffff';
          ctx.font = `${Math.max(10, settings.cellSize * 0.06)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            item.label.slice(0, 20),
            x + settings.cellSize / 2,
            labelY + labelHeight / 2
          );
        }
      }

      // Export to blob
      const mimeType = settings.format === 'png' ? 'image/png' :
        settings.format === 'jpeg' ? 'image/jpeg' : 'image/webp';

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const filename = `${characterName.toLowerCase().replace(/\s+/g, '_')}_avatars.${settings.format}`;

            if (onExport) {
              onExport(blob, filename);
            } else {
              // Default: download the file
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
          setIsExporting(false);
        },
        mimeType,
        settings.quality
      );
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
      setIsExporting(false);
    }
  }, [items, settings, sheetWidth, sheetHeight, maxCells, includedCount, characterName, onExport]);

  return (
    <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
            avatar_sheet_exporter
          </h3>
          {includedCount > 0 && (
            <span className="px-2 py-0.5 bg-cyan-500/20 rounded text-cyan-400 font-mono text-xs">
              {includedCount} avatars
            </span>
          )}
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={cn(
            'p-1.5 rounded transition-colors',
            showSettings
              ? 'bg-cyan-500/20 text-cyan-400'
              : 'bg-slate-800/40 text-slate-400 hover:text-white'
          )}
        >
          <Settings2 size={16} />
        </button>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/30 space-y-4">
              {/* Grid Presets */}
              <div>
                <span className="font-mono text-[10px] text-slate-500 uppercase mb-2 block">
                  grid_layout
                </span>
                <div className="flex flex-wrap gap-2">
                  {GRID_PRESETS.map(preset => (
                    <button
                      key={`${preset.cols}x${preset.rows}`}
                      onClick={() => applyGridPreset(preset.cols, preset.rows)}
                      disabled={disabled}
                      className={cn(
                        'px-2 py-1 rounded border font-mono text-[10px] transition-all',
                        settings.gridColumns === preset.cols && settings.gridRows === preset.rows
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                          : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-slate-600'
                      )}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cell Size */}
              <div>
                <span className="font-mono text-[10px] text-slate-500 uppercase mb-2 block">
                  cell_size
                </span>
                <select
                  value={settings.cellSize}
                  onChange={(e) => updateSetting('cellSize', Number(e.target.value))}
                  disabled={disabled}
                  className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg
                             font-mono text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                >
                  {CELL_SIZE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Format & Quality */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="font-mono text-[10px] text-slate-500 uppercase mb-2 block">
                    format
                  </span>
                  <select
                    value={settings.format}
                    onChange={(e) => updateSetting('format', e.target.value as ExportFormat)}
                    disabled={disabled}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg
                               font-mono text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                  >
                    {FORMAT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="font-mono text-[10px] text-slate-500 uppercase mb-2 block">
                    quality: {Math.round(settings.quality * 100)}%
                  </span>
                  <input
                    type="range"
                    min={0.5}
                    max={1}
                    step={0.05}
                    value={settings.quality}
                    onChange={(e) => updateSetting('quality', Number(e.target.value))}
                    disabled={disabled || settings.format === 'png'}
                    className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer
                               [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                               [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400
                               disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Labels Toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateSetting('includeLabels', !settings.includeLabels)}
                  disabled={disabled}
                  className={cn(
                    'w-5 h-5 rounded border flex items-center justify-center transition-colors',
                    settings.includeLabels
                      ? 'bg-cyan-500 border-cyan-400'
                      : 'bg-slate-700 border-slate-600'
                  )}
                >
                  {settings.includeLabels && <Check size={12} className="text-white" />}
                </button>
                <span className="font-mono text-xs text-slate-400">Include labels</span>

                {settings.includeLabels && (
                  <select
                    value={settings.labelPosition}
                    onChange={(e) => updateSetting('labelPosition', e.target.value as 'top' | 'bottom')}
                    disabled={disabled}
                    className="ml-auto px-2 py-1 bg-slate-800/60 border border-slate-700/50 rounded
                               font-mono text-[10px] text-slate-300"
                  >
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                  </select>
                )}
              </div>

              {/* Background Color */}
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-slate-500 uppercase">background</span>
                <input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                  disabled={disabled}
                  className="w-8 h-8 rounded border border-slate-600 cursor-pointer"
                />
                <span className="font-mono text-xs text-slate-400">{settings.backgroundColor}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Item Selector */}
        <div>
          <span className="font-mono text-[10px] text-slate-500 uppercase mb-2 block">
            select_avatars ({includedCount} / {maxCells})
          </span>
          <ItemSelector
            items={items}
            onToggle={toggleItem}
            onLabelChange={updateItemLabel}
            disabled={disabled}
          />
        </div>

        {/* Preview */}
        <div>
          <span className="font-mono text-[10px] text-slate-500 uppercase mb-2 block">
            sheet_preview
          </span>
          <SheetPreview
            items={items}
            settings={settings}
            onToggleItem={toggleItem}
          />
        </div>
      </div>

      {/* Error Display */}
      {exportError && (
        <div className="mt-4 flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded">
          <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
          <span className="font-mono text-[10px] text-red-400">{exportError}</span>
        </div>
      )}

      {/* Export Button */}
      <button
        onClick={exportSheet}
        disabled={disabled || isExporting || includedCount === 0}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-4 py-3 mt-4 rounded-lg',
          'font-mono text-sm uppercase tracking-wide transition-all',
          'bg-cyan-600 hover:bg-cyan-500 text-white',
          'shadow-lg hover:shadow-cyan-500/20',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
        )}
      >
        {isExporting ? (
          <>
            <RefreshCw size={16} className="animate-spin" />
            exporting...
          </>
        ) : (
          <>
            <Download size={16} />
            export sprite sheet
          </>
        )}
      </button>

      {/* Empty State */}
      {avatars.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-slate-500">
          <Layers size={32} className="mb-3 opacity-50" />
          <p className="font-mono text-xs mb-2">No avatars to export</p>
          <p className="font-mono text-[10px] text-center">
            Generate some avatars first to create a sprite sheet
          </p>
        </div>
      )}
    </div>
  );
};

export default AvatarSheetExporter;
