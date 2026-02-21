'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid3X3,
  Ratio,
  SunDim,
  Triangle,
  Crosshair,
  Slash,
  Eye,
  EyeOff,
  Settings2,
  RotateCcw,
  ChevronDown,
  Palette,
  Sliders,
  Layout,
  Target,
  Layers,
} from 'lucide-react';
import {
  compositionOverlay,
  type GridType,
  type GridConfig,
  type SpiralOrientation,
  type DiagonalType,
  type CompositionTemplate,
} from '@/lib/composition';
import { cn } from '@/app/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface CompositionGuidesProps {
  canvasWidth: number;
  canvasHeight: number;
  onConfigChange?: (config: GridConfig) => void;
  className?: string;
}

interface GridOption {
  type: GridType;
  icon: React.ElementType;
  label: string;
  shortLabel: string;
}

// ============================================================================
// Constants
// ============================================================================

const GRID_OPTIONS: GridOption[] = [
  { type: 'rule-of-thirds', icon: Grid3X3, label: 'Rule of Thirds', shortLabel: 'Thirds' },
  { type: 'golden-ratio', icon: Ratio, label: 'Golden Ratio', shortLabel: 'Golden' },
  { type: 'golden-spiral', icon: SunDim, label: 'Golden Spiral', shortLabel: 'Spiral' },
  { type: 'phi-grid', icon: Layout, label: 'Phi Grid', shortLabel: 'Phi' },
  { type: 'diagonal', icon: Slash, label: 'Diagonal', shortLabel: 'Diag' },
  { type: 'center-cross', icon: Crosshair, label: 'Center Cross', shortLabel: 'Center' },
  { type: 'triangle', icon: Triangle, label: 'Triangle', shortLabel: 'Tri' },
  { type: 'custom', icon: Settings2, label: 'Custom Grid', shortLabel: 'Custom' },
];

const SPIRAL_ORIENTATIONS: { value: SpiralOrientation; label: string }[] = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-right', label: 'Bottom Right' },
];

const DIAGONAL_TYPES: { value: DiagonalType; label: string }[] = [
  { value: 'both', label: 'Both Diagonals' },
  { value: 'baroque', label: 'Baroque (↗)' },
  { value: 'sinister', label: 'Sinister (↘)' },
];

const PRESET_COLORS = [
  { value: '#ffffff', label: 'White' },
  { value: '#ff6b6b', label: 'Red' },
  { value: '#4ecdc4', label: 'Cyan' },
  { value: '#ffe66d', label: 'Yellow' },
  { value: '#95e1d3', label: 'Mint' },
  { value: '#a855f7', label: 'Purple' },
];

// ============================================================================
// Sub-components
// ============================================================================

interface GridButtonProps {
  option: GridOption;
  isActive: boolean;
  onClick: () => void;
}

const GridButton: React.FC<GridButtonProps> = ({ option, isActive, onClick }) => {
  const Icon = option.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all',
        'hover:bg-slate-700/50',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
        isActive && 'bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30'
      )}
      title={option.label}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-medium">{option.shortLabel}</span>
      {isActive && (
        <motion.div
          layoutId="activeGrid"
          className="absolute inset-0 border border-blue-500/50 rounded-lg"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  );
};

interface TemplateCardProps {
  template: CompositionTemplate;
  isActive: boolean;
  onClick: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col p-2 rounded-lg text-left transition-all',
        'hover:bg-slate-700/50',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
        isActive && 'bg-blue-600/20 ring-1 ring-blue-500/30'
      )}
    >
      <span className="text-xs font-medium text-slate-200">{template.name}</span>
      <span className="text-[10px] text-slate-500 line-clamp-1">{template.description}</span>
    </button>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const CompositionGuides: React.FC<CompositionGuidesProps> = ({
  canvasWidth,
  canvasHeight,
  onConfigChange,
  className,
}) => {
  // State
  const [config, setConfig] = useState<GridConfig>({
    type: 'rule-of-thirds',
    visible: true,
    opacity: 0.5,
    color: '#ffffff',
    lineWidth: 1,
    showPowerPoints: true,
    spiralOrientation: 'top-left',
    diagonalType: 'both',
    customRows: 3,
    customCols: 3,
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Get templates
  const templates = useMemo(() => compositionOverlay.getTemplates(), []);
  const suggestedGrids = useMemo(
    () => compositionOverlay.suggestGridsForAspectRatio(canvasWidth, canvasHeight),
    [canvasWidth, canvasHeight]
  );

  // Update parent when config changes
  useEffect(() => {
    onConfigChange?.(config);
  }, [config, onConfigChange]);

  // Draw preview overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !config.visible) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background (checkerboard pattern for transparency)
    const cellSize = 8;
    for (let y = 0; y < canvas.height; y += cellSize) {
      for (let x = 0; x < canvas.width; x += cellSize) {
        ctx.fillStyle = (x + y) % (cellSize * 2) === 0 ? '#1e293b' : '#0f172a';
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    }

    // Draw grid overlay
    compositionOverlay.drawOverlay(ctx, canvas.width, canvas.height, config);
  }, [config, canvasWidth, canvasHeight]);

  // Handlers
  const handleGridTypeChange = useCallback((type: GridType) => {
    setConfig((prev) => ({ ...prev, type }));
    setSelectedTemplate(null);
  }, []);

  const handleToggleVisibility = useCallback(() => {
    setConfig((prev) => ({ ...prev, visible: !prev.visible }));
  }, []);

  const handleOpacityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig((prev) => ({ ...prev, opacity: parseFloat(e.target.value) }));
  }, []);

  const handleColorChange = useCallback((color: string) => {
    setConfig((prev) => ({ ...prev, color }));
  }, []);

  const handleLineWidthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig((prev) => ({ ...prev, lineWidth: parseInt(e.target.value, 10) }));
  }, []);

  const handleTogglePowerPoints = useCallback(() => {
    setConfig((prev) => ({ ...prev, showPowerPoints: !prev.showPowerPoints }));
  }, []);

  const handleSpiralOrientationChange = useCallback((orientation: SpiralOrientation) => {
    setConfig((prev) => ({ ...prev, spiralOrientation: orientation }));
  }, []);

  const handleDiagonalTypeChange = useCallback((type: DiagonalType) => {
    setConfig((prev) => ({ ...prev, diagonalType: type }));
  }, []);

  const handleCustomGridChange = useCallback(
    (field: 'customRows' | 'customCols', value: number) => {
      setConfig((prev) => ({ ...prev, [field]: Math.max(2, Math.min(12, value)) }));
    },
    []
  );

  const handleTemplateSelect = useCallback((template: CompositionTemplate) => {
    setSelectedTemplate(template.id);
    // Apply first suggested grid from template
    if (template.suggestedGrids.length > 0) {
      setConfig((prev) => ({ ...prev, type: template.suggestedGrids[0] }));
    }
  }, []);

  const handleReset = useCallback(() => {
    setConfig({
      type: 'rule-of-thirds',
      visible: true,
      opacity: 0.5,
      color: '#ffffff',
      lineWidth: 1,
      showPowerPoints: true,
      spiralOrientation: 'top-left',
      diagonalType: 'both',
      customRows: 3,
      customCols: 3,
    });
    setSelectedTemplate(null);
  }, []);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-medium text-slate-200">Composition Guides</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleVisibility}
            className={cn(
              'p-1.5 rounded transition-colors',
              config.visible
                ? 'bg-blue-600/20 text-blue-400'
                : 'bg-slate-700/50 text-slate-400'
            )}
            title={config.visible ? 'Hide guides' : 'Show guides'}
          >
            {config.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
            title="Reset to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preview Canvas */}
      <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-700/50">
        <canvas
          ref={canvasRef}
          width={320}
          height={180}
          className="w-full h-full"
        />
        {!config.visible && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
            <span className="text-xs text-slate-500">Guides hidden</span>
          </div>
        )}
      </div>

      {/* Grid Type Selection */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-800/50 rounded-lg">
        {GRID_OPTIONS.map((option) => (
          <GridButton
            key={option.type}
            option={option}
            isActive={config.type === option.type}
            onClick={() => handleGridTypeChange(option.type)}
          />
        ))}
      </div>

      {/* Suggested Grids */}
      {suggestedGrids.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500">Suggested:</span>
          <div className="flex gap-1">
            {suggestedGrids.map((gridType) => {
              const option = GRID_OPTIONS.find((o) => o.type === gridType);
              if (!option) return null;
              return (
                <button
                  key={gridType}
                  onClick={() => handleGridTypeChange(gridType)}
                  className={cn(
                    'px-2 py-0.5 text-[10px] rounded-full transition-colors',
                    config.type === gridType
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-slate-700/50 text-slate-400 hover:text-slate-200'
                  )}
                >
                  {option.shortLabel}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Type-specific Options */}
      <AnimatePresence mode="wait">
        {config.type === 'golden-spiral' && (
          <motion.div
            key="spiral-options"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-1 p-2 bg-slate-800/50 rounded-lg">
              <span className="w-full text-[10px] text-slate-500 mb-1">Spiral Origin:</span>
              {SPIRAL_ORIENTATIONS.map((orient) => (
                <button
                  key={orient.value}
                  onClick={() => handleSpiralOrientationChange(orient.value)}
                  className={cn(
                    'px-2 py-1 text-[10px] rounded transition-colors',
                    config.spiralOrientation === orient.value
                      ? 'bg-blue-600/30 text-blue-300'
                      : 'bg-slate-700/50 text-slate-400 hover:text-slate-200'
                  )}
                >
                  {orient.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {config.type === 'diagonal' && (
          <motion.div
            key="diagonal-options"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-1 p-2 bg-slate-800/50 rounded-lg">
              <span className="w-full text-[10px] text-slate-500 mb-1">Diagonal Type:</span>
              {DIAGONAL_TYPES.map((diag) => (
                <button
                  key={diag.value}
                  onClick={() => handleDiagonalTypeChange(diag.value)}
                  className={cn(
                    'px-2 py-1 text-[10px] rounded transition-colors',
                    config.diagonalType === diag.value
                      ? 'bg-blue-600/30 text-blue-300'
                      : 'bg-slate-700/50 text-slate-400 hover:text-slate-200'
                  )}
                >
                  {diag.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {config.type === 'custom' && (
          <motion.div
            key="custom-options"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2 p-2 bg-slate-800/50 rounded-lg">
              <div>
                <label className="text-[10px] text-slate-500">Rows</label>
                <input
                  type="number"
                  min={2}
                  max={12}
                  value={config.customRows}
                  onChange={(e) => handleCustomGridChange('customRows', parseInt(e.target.value, 10))}
                  className="w-full mt-1 px-2 py-1 text-xs bg-slate-700 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500">Columns</label>
                <input
                  type="number"
                  min={2}
                  max={12}
                  value={config.customCols}
                  onChange={(e) => handleCustomGridChange('customCols', parseInt(e.target.value, 10))}
                  className="w-full mt-1 px-2 py-1 text-xs bg-slate-700 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Toggle */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="flex items-center justify-between w-full p-2 rounded-lg bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5" />
          <span className="text-xs">Appearance Settings</span>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform',
            showSettings && 'rotate-180'
          )}
        />
      </button>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 p-3 bg-slate-800/50 rounded-lg">
              {/* Opacity */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-slate-500">Opacity</label>
                  <span className="text-[10px] text-slate-400">
                    {Math.round(config.opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.1}
                  value={config.opacity}
                  onChange={handleOpacityChange}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Line Width */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-slate-500">Line Width</label>
                  <span className="text-[10px] text-slate-400">{config.lineWidth}px</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={4}
                  step={1}
                  value={config.lineWidth}
                  onChange={handleLineWidthChange}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Color */}
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Color</label>
                <div className="flex gap-1">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handleColorChange(preset.value)}
                      className={cn(
                        'w-6 h-6 rounded-full border-2 transition-all',
                        config.color === preset.value
                          ? 'border-white scale-110'
                          : 'border-transparent hover:border-slate-500'
                      )}
                      style={{ backgroundColor: preset.value }}
                      title={preset.label}
                    />
                  ))}
                </div>
              </div>

              {/* Power Points Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showPowerPoints}
                  onChange={handleTogglePowerPoints}
                  className="rounded bg-slate-700 border-slate-600"
                />
                <Target className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs text-slate-300">Show Power Points</span>
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Templates Toggle */}
      <button
        onClick={() => setShowTemplates(!showTemplates)}
        className="flex items-center justify-between w-full p-2 rounded-lg bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5" />
          <span className="text-xs">Composition Templates</span>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform',
            showTemplates && 'rotate-180'
          )}
        />
      </button>

      {/* Templates Panel */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1 p-2 bg-slate-800/50 rounded-lg max-h-48 overflow-y-auto">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isActive={selectedTemplate === template.id}
                  onClick={() => handleTemplateSelect(template)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompositionGuides;
