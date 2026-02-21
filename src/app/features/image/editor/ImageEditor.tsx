'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon,
  Layers,
  Bookmark,
  History,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Upload,
  Maximize2,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  RefreshCw,
  Settings,
  Sliders,
  MousePointer2,
  Crop,
} from 'lucide-react';
import {
  adjustmentStack,
  colorCorrection,
  selectionTools,
  transformTools,
  type AdjustmentLayer,
  type AdjustmentType,
  type LayerStack,
  type Selection,
  type SelectionToolType,
  type SelectionMode,
  type TransformToolType,
  type TransformConstraints,
  type Point,
} from '@/lib/editor';
import {
  AdjustmentPanel,
  PresetManager,
  EditorCanvas,
  ToolPanel,
  type EditorMode,
  type ActiveTool,
} from './components';
import { Tabs, type TabItem } from '@/app/components/UI';
import { cn } from '@/app/lib/utils';

// ============================================================================
// Types
// ============================================================================

type TabType = 'adjustments' | 'presets' | 'history';

// ============================================================================
// Constants
// ============================================================================

const TAB_ITEMS: TabItem[] = [
  { value: 'adjustments', label: 'Adjustments', icon: <Sliders className="w-4 h-4" /> },
  { value: 'presets', label: 'Presets', icon: <Bookmark className="w-4 h-4" /> },
  { value: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
];

// ============================================================================
// History Panel Component
// ============================================================================

interface HistoryPanelProps {
  stackId: string | null;
  onUndo: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ stackId, onUndo }) => {
  const [history, setHistory] = useState<Array<{ id: string; action: string; timestamp: Date }>>([]);

  useEffect(() => {
    if (!stackId) {
      setHistory([]);
      return;
    }

    const entries = adjustmentStack.getHistory(stackId);
    setHistory(
      entries.map((e) => ({
        id: e.id,
        action: `${e.action} layer`,
        timestamp: e.timestamp,
      }))
    );
  }, [stackId]);

  return (
    <div className="h-full flex flex-col bg-slate-900/50">
      <div className="flex items-center justify-between p-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-200">History</span>
        </div>
        {history.length > 0 && (
          <button
            onClick={onUndo}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Undo
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {history.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm text-slate-500">No history yet</p>
            <p className="text-xs text-slate-600 mt-1">
              Changes will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {[...history].reverse().map((entry, index) => (
              <div
                key={entry.id}
                className={cn(
                  'px-3 py-2 rounded text-xs',
                  index === 0 ? 'bg-blue-500/10 text-blue-300' : 'text-slate-400'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="capitalize">{entry.action}</span>
                  <span className="text-slate-500">
                    {entry.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const ImageEditor: React.FC = () => {
  // State - Adjustment Layers
  const [activeTab, setActiveTab] = useState<TabType>('adjustments');
  const [stackId, setStackId] = useState<string | null>(null);
  const [layers, setLayers] = useState<AdjustmentLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [processedImageData, setProcessedImageData] = useState<ImageData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [autoPreview, setAutoPreview] = useState(true);

  // State - Selection & Transform
  const [editorMode, setEditorMode] = useState<EditorMode>('view');
  const [activeTool, setActiveTool] = useState<ActiveTool>('pointer');
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('new');
  const [currentSelection, setCurrentSelection] = useState<Selection | null>(null);
  const [constraints, setConstraints] = useState<TransformConstraints>({
    lockAspectRatio: false,
    lockPosition: false,
    lockRotation: false,
    snapToGrid: false,
    gridSize: 10,
    snapToAngles: false,
    snapAngleIncrement: 15,
  });

  // History tracking for undo/redo
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const imageRef = useRef<HTMLImageElement | null>(null);

  // Determine editor mode from active tool
  useEffect(() => {
    const selectionToolIds: ActiveTool[] = ['marquee', 'ellipse', 'lasso', 'polygon', 'magic-wand', 'quick-select'];
    const transformToolIds: ActiveTool[] = ['move', 'scale', 'rotate', 'skew', 'crop', 'perspective'];

    if (selectionToolIds.includes(activeTool)) {
      setEditorMode('selection');
    } else if (transformToolIds.includes(activeTool)) {
      setEditorMode('transform');
    } else {
      setEditorMode('view');
    }
  }, [activeTool]);

  // Initialize stack
  useEffect(() => {
    const stack = adjustmentStack.createStack('Editor Stack');
    setStackId(stack.id);

    return () => {
      if (stack.id) {
        adjustmentStack.deleteStack(stack.id);
      }
    };
  }, []);

  // Subscribe to stack changes
  useEffect(() => {
    if (!stackId) return;

    const unsubscribe = adjustmentStack.subscribe(stackId, (stack) => {
      setLayers([...stack.layers]);
    });

    return unsubscribe;
  }, [stackId]);

  // Update selection tools config
  useEffect(() => {
    selectionTools.setMode(selectionMode);
  }, [selectionMode]);

  // Update transform constraints
  useEffect(() => {
    transformTools.setConstraints(constraints);
  }, [constraints]);

  // Check undo/redo availability
  useEffect(() => {
    const checkHistory = () => {
      setCanUndo(transformTools.canUndo());
      setCanRedo(transformTools.canRedo());
    };

    checkHistory();
    // Check periodically or subscribe to changes
    const interval = setInterval(checkHistory, 500);
    return () => clearInterval(interval);
  }, [currentSelection]);

  // Process image when layers change
  useEffect(() => {
    if (!imageUrl || !autoPreview || layers.length === 0) {
      if (layers.length === 0) setProcessedImageData(null);
      return;
    }

    const processImage = async () => {
      setIsProcessing(true);

      try {
        // Load image if not loaded
        if (!imageRef.current) {
          imageRef.current = new Image();
          imageRef.current.src = imageUrl;
          await new Promise((resolve) => {
            imageRef.current!.onload = resolve;
          });
        }

        // Get active adjustments
        const adjustments = layers
          .filter((l) => l.visible && l.opacity > 0)
          .sort((a, b) => a.order - b.order)
          .map((l) => l.adjustment);

        if (adjustments.length === 0) {
          setProcessedImageData(null);
          return;
        }

        // Process image
        const result = await colorCorrection.processImage(imageRef.current, adjustments);

        if (result.success && result.imageData) {
          setProcessedImageData(result.imageData);
        }
      } catch (err) {
        console.error('Failed to process image:', err);
      } finally {
        setIsProcessing(false);
      }
    };

    const debounceTimer = setTimeout(processImage, 100);
    return () => clearTimeout(debounceTimer);
  }, [imageUrl, layers, autoPreview]);

  // Adjustment Layer Handlers
  const handleAddLayer = useCallback(
    (type: AdjustmentType) => {
      if (!stackId) return;
      const layer = adjustmentStack.addLayer(stackId, type);
      if (layer) {
        setSelectedLayerId(layer.id);
      }
    },
    [stackId]
  );

  const handleUpdateLayer = useCallback(
    (layerId: string, updates: Partial<AdjustmentLayer>) => {
      if (!stackId) return;
      adjustmentStack.updateLayer(stackId, layerId, updates);
    },
    [stackId]
  );

  const handleRemoveLayer = useCallback(
    (layerId: string) => {
      if (!stackId) return;
      adjustmentStack.removeLayer(stackId, layerId);
      if (selectedLayerId === layerId) {
        setSelectedLayerId(null);
      }
    },
    [stackId, selectedLayerId]
  );

  const handleToggleVisibility = useCallback(
    (layerId: string) => {
      if (!stackId) return;
      adjustmentStack.toggleLayerVisibility(stackId, layerId);
    },
    [stackId]
  );

  const handleDuplicateLayer = useCallback(
    (layerId: string) => {
      if (!stackId) return;
      const newLayer = adjustmentStack.duplicateLayer(stackId, layerId);
      if (newLayer) {
        setSelectedLayerId(newLayer.id);
      }
    },
    [stackId]
  );

  const handleReorderLayers = useCallback(
    (layerIds: string[]) => {
      if (!stackId) return;
      adjustmentStack.reorderLayers(stackId, layerIds);
    },
    [stackId]
  );

  const handleApplyPreset = useCallback(
    (presetLayers: AdjustmentLayer[]) => {
      if (!stackId) return;

      // Clear existing layers
      layers.forEach((layer) => {
        adjustmentStack.removeLayer(stackId, layer.id);
      });

      // Add preset layers
      presetLayers.forEach((layer) => {
        const newLayer = adjustmentStack.addLayer(stackId, layer.type, layer.name);
        if (newLayer) {
          adjustmentStack.updateLayer(stackId, newLayer.id, {
            adjustment: layer.adjustment,
            opacity: layer.opacity,
            blendMode: layer.blendMode,
            visible: layer.visible,
          });
        }
      });
    },
    [stackId, layers]
  );

  const handleUndoAdjustment = useCallback(() => {
    if (!stackId) return;
    adjustmentStack.undo(stackId);
  }, [stackId]);

  const handleReset = useCallback(() => {
    if (!stackId) return;
    layers.forEach((layer) => {
      adjustmentStack.removeLayer(stackId, layer.id);
    });
    setSelectedLayerId(null);
  }, [stackId, layers]);

  // Selection Handlers
  const handleSelectionAction = useCallback(
    (action: 'invert' | 'deselect' | 'selectAll' | 'feather') => {
      switch (action) {
        case 'deselect':
          selectionTools.clearSelection();
          setCurrentSelection(null);
          break;
        case 'invert':
          // Invert requires canvas dimensions - would need to pass from EditorCanvas
          break;
        case 'selectAll':
          // Would select entire canvas - requires canvas dimensions
          break;
        case 'feather':
          // Would feather selection edges - advanced feature
          break;
      }
    },
    []
  );

  // Transform Handlers
  const handleTransformAction = useCallback(
    (action: 'flipH' | 'flipV' | 'rotate90' | 'reset' | 'apply') => {
      switch (action) {
        case 'flipH':
          transformTools.flip(true);
          break;
        case 'flipV':
          transformTools.flip(false);
          break;
        case 'rotate90':
          transformTools.rotate(90);
          break;
        case 'reset':
          transformTools.reset();
          break;
        case 'apply':
          // Apply would commit the transform to the image
          break;
      }
    },
    []
  );

  // History Handlers
  const handleHistoryAction = useCallback((action: 'undo' | 'redo') => {
    if (action === 'undo') {
      if (transformTools.canUndo()) {
        transformTools.undo();
      }
    } else {
      if (transformTools.canRedo()) {
        transformTools.redo();
      }
    }
  }, []);

  // Constraint change handler
  const handleConstraintsChange = useCallback(
    (newConstraints: Partial<TransformConstraints>) => {
      setConstraints((prev) => ({ ...prev, ...newConstraints }));
    },
    []
  );

  // Canvas event handlers
  const handleSelectionChange = useCallback((selection: Selection | null) => {
    setCurrentSelection(selection);
  }, []);

  // File Handlers
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImageUrl(url);
    imageRef.current = null;
    setProcessedImageData(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setCurrentSelection(null);
    selectionTools.clearSelection();
    transformTools.reset();
  }, []);

  const handleDownload = useCallback(() => {
    if (!processedImageData) return;

    const canvas = document.createElement('canvas');
    canvas.width = processedImageData.width;
    canvas.height = processedImageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.putImageData(processedImageData, 0, 0);

    const link = document.createElement('a');
    link.download = `edited_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [processedImageData]);

  // Render sidebar content based on active tab
  const renderSidebarContent = useMemo(() => {
    switch (activeTab) {
      case 'adjustments':
        return (
          <AdjustmentPanel
            layers={layers}
            selectedLayerId={selectedLayerId}
            onAddLayer={handleAddLayer}
            onUpdateLayer={handleUpdateLayer}
            onRemoveLayer={handleRemoveLayer}
            onToggleVisibility={handleToggleVisibility}
            onDuplicateLayer={handleDuplicateLayer}
            onReorderLayers={handleReorderLayers}
            onSelectLayer={setSelectedLayerId}
            onReset={handleReset}
          />
        );
      case 'presets':
        return (
          <PresetManager
            currentLayers={layers}
            onApplyPreset={handleApplyPreset}
          />
        );
      case 'history':
        return <HistoryPanel stackId={stackId} onUndo={handleUndoAdjustment} />;
      default:
        return null;
    }
  }, [
    activeTab,
    layers,
    selectedLayerId,
    stackId,
    handleAddLayer,
    handleUpdateLayer,
    handleRemoveLayer,
    handleToggleVisibility,
    handleDuplicateLayer,
    handleReorderLayers,
    handleApplyPreset,
    handleUndoAdjustment,
    handleReset,
  ]);

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-400" />
            <span className="font-medium text-slate-200">Image Editor</span>
          </div>

          {/* Upload */}
          <label className="flex items-center gap-1 px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Open Image
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          {/* Mode indicator */}
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-700/50 rounded text-xs">
            {editorMode === 'selection' && (
              <>
                <MousePointer2 className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-blue-300">Selection Mode</span>
              </>
            )}
            {editorMode === 'transform' && (
              <>
                <Crop className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-300">Transform Mode</span>
              </>
            )}
            {editorMode === 'view' && (
              <>
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-300">View Mode</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Processing indicator */}
          {isProcessing && (
            <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/10 rounded text-xs text-blue-300">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Processing...
            </div>
          )}

          {/* Auto-preview toggle */}
          <button
            onClick={() => setAutoPreview(!autoPreview)}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
              autoPreview
                ? 'bg-green-500/20 text-green-300'
                : 'bg-slate-700 text-slate-400'
            )}
            title="Toggle auto-preview"
          >
            {autoPreview ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            Auto
          </button>

          {/* Show original toggle */}
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            disabled={!processedImageData}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
              showOriginal
                ? 'bg-blue-500/20 text-blue-300'
                : 'bg-slate-700 text-slate-400',
              !processedImageData && 'opacity-50 cursor-not-allowed'
            )}
            title="Toggle original view"
          >
            <Eye className="w-3.5 h-3.5" />
            Original
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-700 rounded">
            <button
              onClick={() => setZoom(Math.max(0.1, zoom - 0.25))}
              className="text-slate-400 hover:text-slate-200"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-300 w-12 text-center font-mono">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(5, zoom + 0.25))}
              className="text-slate-400 hover:text-slate-200"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Reset zoom */}
          <button
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
            title="Reset zoom"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={!processedImageData}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors',
              !processedImageData && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tool Panel */}
        <ToolPanel
          activeTool={activeTool}
          onToolChange={setActiveTool}
          selectionMode={selectionMode}
          onSelectionModeChange={setSelectionMode}
          constraints={constraints}
          onConstraintsChange={handleConstraintsChange}
          selection={currentSelection}
          onSelectionAction={handleSelectionAction}
          onTransformAction={handleTransformAction}
          onHistoryAction={handleHistoryAction}
          canUndo={canUndo}
          canRedo={canRedo}
        />

        {/* Canvas area */}
        {imageUrl ? (
          <EditorCanvas
            imageUrl={imageUrl}
            processedImageData={processedImageData}
            mode={editorMode}
            activeTool={activeTool}
            zoom={zoom}
            offset={offset}
            selection={currentSelection}
            showOriginal={showOriginal}
            onZoomChange={setZoom}
            onOffsetChange={setOffset}
            onSelectionChange={handleSelectionChange}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-950">
            <div className="text-center">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-slate-700" />
              <h3 className="text-lg font-medium text-slate-400 mb-2">No Image Loaded</h3>
              <p className="text-sm text-slate-500 mb-4">
                Upload an image to start editing
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                Open Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* Sidebar */}
        <div className="w-80 border-l border-slate-700 flex flex-col bg-slate-900">
          {/* Tabs */}
          <div className="border-b border-slate-700">
            <Tabs
              items={TAB_ITEMS}
              value={activeTab}
              onChange={(v) => setActiveTab(v as TabType)}
              variant="underline"
            />
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {renderSidebarContent}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
