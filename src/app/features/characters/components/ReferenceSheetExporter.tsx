/**
 * ReferenceSheetExporter - Export character appearance evolution as reference sheet
 * Design: Clean Manuscript style with cyan accents
 *
 * Generates downloadable reference sheets showing:
 * - Character appearance timeline
 * - Milestone comparisons
 * - Visual changes summary
 * - Professional layout options
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Image,
  FileImage,
  Grid,
  List,
  Columns,
  X,
  Settings,
  Eye,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type { AppearanceMilestone } from '@/lib/evolution/MilestoneManager';
import { TRANSFORMATION_TYPES, AGE_STAGES } from '@/app/hooks/integration/useAvatarTimeline';

// ============================================================================
// Types
// ============================================================================

export interface ReferenceSheetExporterProps {
  characterId: string;
  characterName: string;
  milestones: AppearanceMilestone[];
  onClose: () => void;
}

type LayoutMode = 'grid' | 'timeline' | 'comparison';
type ExportFormat = 'png' | 'jpg' | 'pdf';
type SheetSize = 'a4' | 'letter' | 'custom';

interface ExportSettings {
  layout: LayoutMode;
  format: ExportFormat;
  size: SheetSize;
  includeLabels: boolean;
  includeChanges: boolean;
  includeDates: boolean;
  backgroundColor: string;
  borderStyle: 'none' | 'thin' | 'thick';
  watermark: boolean;
  quality: number;
}

// ============================================================================
// Constants
// ============================================================================

const LAYOUT_OPTIONS: { id: LayoutMode; label: string; icon: React.ReactNode }[] = [
  { id: 'grid', label: 'Grid', icon: <Grid size={16} /> },
  { id: 'timeline', label: 'Timeline', icon: <List size={16} /> },
  { id: 'comparison', label: 'Comparison', icon: <Columns size={16} /> },
];

const SIZE_OPTIONS: { id: SheetSize; label: string; dimensions: string }[] = [
  { id: 'a4', label: 'A4', dimensions: '210 × 297mm' },
  { id: 'letter', label: 'Letter', dimensions: '8.5 × 11in' },
  { id: 'custom', label: 'Custom', dimensions: 'Fit to content' },
];

const FORMAT_OPTIONS: { id: ExportFormat; label: string }[] = [
  { id: 'png', label: 'PNG' },
  { id: 'jpg', label: 'JPEG' },
  { id: 'pdf', label: 'PDF' },
];

const DEFAULT_SETTINGS: ExportSettings = {
  layout: 'grid',
  format: 'png',
  size: 'a4',
  includeLabels: true,
  includeChanges: true,
  includeDates: false,
  backgroundColor: '#1e293b',
  borderStyle: 'thin',
  watermark: false,
  quality: 90,
};

// ============================================================================
// Subcomponents
// ============================================================================

interface PreviewPanelProps {
  milestones: AppearanceMilestone[];
  settings: ExportSettings;
  characterName: string;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  milestones,
  settings,
  characterName,
}) => {
  const previewRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={previewRef}
      className={cn(
        'p-6 rounded-lg overflow-auto max-h-[500px]',
        settings.borderStyle === 'thin' && 'border border-slate-700',
        settings.borderStyle === 'thick' && 'border-2 border-slate-600'
      )}
      style={{ backgroundColor: settings.backgroundColor }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="font-mono text-lg text-slate-200 uppercase tracking-wider">
          {characterName}
        </h2>
        <p className="font-mono text-xs text-slate-500 mt-1">
          Character Appearance Reference Sheet
        </p>
      </div>

      {/* Grid Layout */}
      {settings.layout === 'grid' && (
        <div className="grid grid-cols-3 gap-4">
          {milestones.map((milestone, index) => (
            <div key={milestone.id} className="space-y-2">
              {/* Image */}
              <div className="aspect-square rounded-lg overflow-hidden bg-slate-800/50 border border-slate-700/50">
                {milestone.avatar_url || milestone.thumbnail_url ? (
                  <img
                    src={milestone.thumbnail_url || milestone.avatar_url}
                    alt={milestone.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <Image size={32} />
                  </div>
                )}
              </div>

              {/* Label */}
              {settings.includeLabels && (
                <div className="text-center">
                  <p className="font-mono text-xs text-slate-300 truncate">
                    {milestone.name}
                  </p>
                  <span className={cn(
                    'inline-block px-1.5 py-0.5 rounded text-[9px] font-mono mt-1',
                    TRANSFORMATION_TYPES[milestone.transformation_type]?.color || 'text-slate-400 bg-slate-700/50'
                  )}>
                    {TRANSFORMATION_TYPES[milestone.transformation_type]?.label}
                  </span>
                </div>
              )}

              {/* Changes */}
              {settings.includeChanges && milestone.visual_changes.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center">
                  {milestone.visual_changes.slice(0, 2).map((change, i) => (
                    <span key={i} className="px-1 py-0.5 bg-slate-800/60 rounded text-[8px] font-mono text-slate-500">
                      {change.attribute}
                    </span>
                  ))}
                  {milestone.visual_changes.length > 2 && (
                    <span className="text-[8px] font-mono text-slate-600">
                      +{milestone.visual_changes.length - 2}
                    </span>
                  )}
                </div>
              )}

              {/* Date */}
              {settings.includeDates && (
                <p className="text-center font-mono text-[8px] text-slate-600">
                  {new Date(milestone.created_at).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Timeline Layout */}
      {settings.layout === 'timeline' && (
        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <div key={milestone.id} className="flex gap-4">
              {/* Timeline indicator */}
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-8 h-8 rounded-full border-2 flex items-center justify-center',
                  TRANSFORMATION_TYPES[milestone.transformation_type]?.color?.split(' ')[0] || 'border-slate-600',
                  'bg-slate-800'
                )}>
                  <span className="font-mono text-xs text-slate-400">{index + 1}</span>
                </div>
                {index < milestones.length - 1 && (
                  <div className="w-px flex-1 bg-slate-700/50 min-h-8" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded overflow-hidden bg-slate-800/50 border border-slate-700/50 flex-shrink-0">
                    {milestone.avatar_url || milestone.thumbnail_url ? (
                      <img
                        src={milestone.thumbnail_url || milestone.avatar_url}
                        alt={milestone.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <Image size={20} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {settings.includeLabels && (
                      <>
                        <p className="font-mono text-xs text-slate-300">{milestone.name}</p>
                        <span className={cn(
                          'inline-block px-1.5 py-0.5 rounded text-[9px] font-mono mt-1',
                          TRANSFORMATION_TYPES[milestone.transformation_type]?.color || 'text-slate-400 bg-slate-700/50'
                        )}>
                          {TRANSFORMATION_TYPES[milestone.transformation_type]?.label}
                        </span>
                      </>
                    )}

                    {settings.includeChanges && milestone.visual_changes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {milestone.visual_changes.map((change, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-slate-800/60 rounded text-[8px] font-mono text-slate-500">
                            {change.attribute}: {change.to}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comparison Layout */}
      {settings.layout === 'comparison' && milestones.length >= 2 && (
        <div className="space-y-6">
          {/* First vs Last */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4">
            {/* First */}
            <div className="text-center">
              <p className="font-mono text-[10px] text-slate-500 uppercase mb-2">Beginning</p>
              <div className="aspect-square rounded-lg overflow-hidden bg-slate-800/50 border border-slate-700/50">
                {milestones[0].avatar_url || milestones[0].thumbnail_url ? (
                  <img
                    src={milestones[0].thumbnail_url || milestones[0].avatar_url}
                    alt={milestones[0].name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <Image size={32} />
                  </div>
                )}
              </div>
              {settings.includeLabels && (
                <p className="font-mono text-xs text-slate-300 mt-2">{milestones[0].name}</p>
              )}
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center">
              <div className="w-8 h-px bg-slate-600 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-l-6 border-transparent border-l-slate-600" />
              </div>
            </div>

            {/* Last */}
            <div className="text-center">
              <p className="font-mono text-[10px] text-slate-500 uppercase mb-2">Current</p>
              <div className="aspect-square rounded-lg overflow-hidden bg-slate-800/50 border border-slate-700/50">
                {milestones[milestones.length - 1].avatar_url || milestones[milestones.length - 1].thumbnail_url ? (
                  <img
                    src={milestones[milestones.length - 1].thumbnail_url || milestones[milestones.length - 1].avatar_url}
                    alt={milestones[milestones.length - 1].name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <Image size={32} />
                  </div>
                )}
              </div>
              {settings.includeLabels && (
                <p className="font-mono text-xs text-slate-300 mt-2">
                  {milestones[milestones.length - 1].name}
                </p>
              )}
            </div>
          </div>

          {/* All changes summary */}
          {settings.includeChanges && (
            <div className="pt-4 border-t border-slate-700/50">
              <p className="font-mono text-[10px] text-slate-500 uppercase mb-2">Evolution Summary</p>
              <div className="grid grid-cols-2 gap-2">
                {/* Collect all unique changes */}
                {Array.from(
                  new Map(
                    milestones
                      .flatMap((m) => m.visual_changes)
                      .map((c) => [c.attribute, c])
                  ).values()
                ).map((change, i) => (
                  <div key={i} className="px-2 py-1 bg-slate-800/60 rounded text-[9px] font-mono">
                    <span className="text-slate-500">{change.attribute}:</span>
                    <span className="text-slate-400 ml-1">{change.to}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Watermark */}
      {settings.watermark && (
        <div className="mt-6 pt-4 border-t border-slate-700/30 text-center">
          <p className="font-mono text-[8px] text-slate-600">
            Generated by Story Character Tools
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const ReferenceSheetExporter: React.FC<ReferenceSheetExporterProps> = ({
  characterId,
  characterName,
  milestones,
  onClose,
}) => {
  const [settings, setSettings] = useState<ExportSettings>(DEFAULT_SETTINGS);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showSettings, setShowSettings] = useState(false);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportStatus('idle');

    try {
      // In a real implementation, this would:
      // 1. Use html2canvas or similar to capture the preview
      // 2. Convert to the selected format
      // 3. Trigger download

      // For now, simulate export
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Create a canvas to generate the export
      // This is a simplified version - a full implementation would render the preview properly
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Set dimensions based on size
      const dimensions = {
        a4: { width: 2480, height: 3508 },
        letter: { width: 2550, height: 3300 },
        custom: { width: 1920, height: 1080 },
      };

      const size = dimensions[settings.size];
      canvas.width = size.width;
      canvas.height = size.height;

      if (ctx) {
        // Fill background
        ctx.fillStyle = settings.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add title
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(characterName.toUpperCase(), canvas.width / 2, 80);

        ctx.font = '24px monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Character Appearance Reference Sheet', canvas.width / 2, 120);

        // Add placeholder for images (in real impl, would load and draw actual images)
        const cols = settings.layout === 'timeline' ? 1 : 3;
        const rows = Math.ceil(milestones.length / cols);
        const imgSize = Math.min(400, (canvas.width - 200) / cols);
        const startY = 200;

        milestones.forEach((milestone, index) => {
          const col = index % cols;
          const row = Math.floor(index / cols);
          const x = 100 + col * (imgSize + 40);
          const y = startY + row * (imgSize + 100);

          // Draw placeholder box
          ctx.fillStyle = '#334155';
          ctx.fillRect(x, y, imgSize, imgSize);

          // Draw label
          if (settings.includeLabels) {
            ctx.fillStyle = '#e2e8f0';
            ctx.font = '18px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(milestone.name, x + imgSize / 2, y + imgSize + 30);
          }
        });
      }

      // Convert to blob and download
      const mimeTypes: Record<ExportFormat, string> = {
        png: 'image/png',
        jpg: 'image/jpeg',
        pdf: 'application/pdf',
      };

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${characterName.toLowerCase().replace(/\s+/g, '-')}-reference-sheet.${settings.format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        },
        mimeTypes[settings.format],
        settings.quality / 100
      );

      setExportStatus('success');
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('error');
    } finally {
      setIsExporting(false);
    }
  }, [characterName, milestones, settings]);

  const updateSetting = <K extends keyof ExportSettings>(
    key: K,
    value: ExportSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl max-h-[90vh] bg-slate-900 rounded-lg border border-slate-800 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileImage size={18} className="text-cyan-400" />
            <h2 className="font-mono text-sm uppercase tracking-wide text-slate-200">
              export_reference_sheet
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                'p-2 rounded transition-colors',
                showSettings
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'bg-slate-800/40 text-slate-400 hover:text-slate-300'
              )}
            >
              <Settings size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded bg-slate-800/40 text-slate-400 hover:text-slate-300 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-[1fr_300px] gap-4">
            {/* Preview */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Eye size={14} className="text-slate-500" />
                <span className="font-mono text-xs text-slate-500 uppercase">Preview</span>
              </div>
              <PreviewPanel
                milestones={milestones}
                settings={settings}
                characterName={characterName}
              />
            </div>

            {/* Settings */}
            <div className="space-y-4">
              {/* Layout */}
              <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                <span className="font-mono text-[10px] text-slate-500 uppercase block mb-2">
                  Layout
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {LAYOUT_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => updateSetting('layout', option.id)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2 rounded border transition-colors',
                        settings.layout === option.id
                          ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
                          : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:border-slate-600'
                      )}
                    >
                      {option.icon}
                      <span className="font-mono text-[9px]">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Format & Size */}
              <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                <span className="font-mono text-[10px] text-slate-500 uppercase block mb-2">
                  Format
                </span>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {FORMAT_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => updateSetting('format', option.id)}
                      className={cn(
                        'px-2 py-1.5 rounded border font-mono text-xs transition-colors',
                        settings.format === option.id
                          ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
                          : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:border-slate-600'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <span className="font-mono text-[10px] text-slate-500 uppercase block mb-2">
                  Size
                </span>
                <div className="space-y-1">
                  {SIZE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => updateSetting('size', option.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-2 py-1.5 rounded border font-mono text-xs transition-colors',
                        settings.size === option.id
                          ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
                          : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:border-slate-600'
                      )}
                    >
                      <span>{option.label}</span>
                      <span className="text-[10px] text-slate-600">{option.dimensions}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                <span className="font-mono text-[10px] text-slate-500 uppercase block mb-2">
                  Include
                </span>
                <div className="space-y-2">
                  {[
                    { key: 'includeLabels' as const, label: 'Labels & Names' },
                    { key: 'includeChanges' as const, label: 'Visual Changes' },
                    { key: 'includeDates' as const, label: 'Dates' },
                    { key: 'watermark' as const, label: 'Watermark' },
                  ].map((option) => (
                    <label
                      key={option.key}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-mono text-xs text-slate-400">{option.label}</span>
                      <input
                        type="checkbox"
                        checked={settings[option.key]}
                        onChange={(e) => updateSetting(option.key, e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800
                                   text-cyan-500 focus:ring-cyan-500/50"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Quality */}
              <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] text-slate-500 uppercase">
                    Quality
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    {settings.quality}%
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={100}
                  value={settings.quality}
                  onChange={(e) => updateSetting('quality', parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none
                             [&::-webkit-slider-thumb]:w-3
                             [&::-webkit-slider-thumb]:h-3
                             [&::-webkit-slider-thumb]:bg-cyan-400
                             [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            {exportStatus === 'success' && (
              <span className="flex items-center gap-1 font-mono text-xs text-green-400">
                <Check size={14} />
                Export complete
              </span>
            )}
            {exportStatus === 'error' && (
              <span className="flex items-center gap-1 font-mono text-xs text-red-400">
                <AlertCircle size={14} />
                Export failed
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-slate-800/40 text-slate-400
                         hover:bg-slate-700/60 font-mono text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || milestones.length === 0}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded font-mono text-xs transition-colors',
                isExporting || milestones.length === 0
                  ? 'bg-slate-700/40 text-slate-600 cursor-not-allowed'
                  : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400'
              )}
            >
              {isExporting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span>Export {settings.format.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ReferenceSheetExporter;
