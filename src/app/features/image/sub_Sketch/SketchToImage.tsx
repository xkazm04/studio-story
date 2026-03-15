"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Sparkles, Zap, Grid3X3, Lightbulb, Upload, X, Trash2, Eye, EyeOff, Sliders, Image as ImageIcon, Layers, Brush, Ruler, Undo, Redo, ZoomIn, ZoomOut, RotateCcw, Film, AudioLines } from "lucide-react";
import { Button } from "@/app/components/UI/Button";
import { Card } from "@/app/components/UI/Card";
import { RangeSlider } from "@/app/components/UI/RangeSlider";
import { Tooltip } from "@/app/components/UI/Tooltip";
import { ToolbarFlyout, type ToolbarItem } from "./components/ToolbarFlyout";
import PromptMapGpt from "./components/PromptMapGpt";
import PromptMapClaude from "./components/PromptMapClaude";
import PromptLaboratory from "./components/PromptLaboratory";
import CompositionGuides from "./components/CompositionGuides";
import LayoutSuggestions from "./components/LayoutSuggestions";
import StyleController from "./components/StyleController";
import RealTimePreview from "./components/RealTimePreview";
import VariationGallery from "./components/VariationGallery";
import StoryboardPipeline from "./components/StoryboardPipeline";
import BrushLibrary from "./components/BrushLibrary";
import LayerPanel from "./components/LayerPanel";
import DrawingGuides from "./components/DrawingGuides";
import MultimodalSynthesis from "./components/MultimodalSynthesis";
import {
  compositionOverlay,
  type GridConfig,
  type FocalPoint,
  type BalanceAnalysis,
} from "@/lib/composition";
import {
  realTimeEngine,
  type StyleParameters,
  type GenerationResult,
  type Variation,
  DEFAULT_STYLE,
} from "@/lib/sketch";
import {
  canvasEngine,
  type BrushSettings,
  type Layer,
  DEFAULT_BRUSH,
} from "@/lib/canvas";
import { cn } from "@/app/lib/utils";

type PromptMapMode = 'gpt' | 'claude' | 'lab' | 'synthesis' | null;
type SidePanelMode = 'guides' | 'suggestions' | 'style' | 'preview' | 'variations' | 'storyboard' | 'brushes' | 'layers' | 'drawing-guides' | null;

const SIDE_PANEL_CONFIG: Record<Exclude<SidePanelMode, null>, { icon: typeof Grid3X3; iconColor: string; label: string }> = {
  guides:          { icon: Grid3X3,  iconColor: 'text-cyan-400',   label: 'Composition Guides' },
  suggestions:     { icon: Lightbulb, iconColor: 'text-yellow-400', label: 'Layout Analysis' },
  style:           { icon: Sliders,  iconColor: 'text-purple-400', label: 'Style Controls' },
  preview:         { icon: ImageIcon, iconColor: 'text-green-400',  label: 'Real-Time Preview' },
  variations:      { icon: Layers,   iconColor: 'text-orange-400', label: 'Variations' },
  brushes:         { icon: Brush,    iconColor: 'text-purple-400', label: 'Brush Library' },
  layers:          { icon: Layers,   iconColor: 'text-cyan-400',   label: 'Layers' },
  'drawing-guides': { icon: Ruler,   iconColor: 'text-green-400',  label: 'Drawing Guides' },
  storyboard:      { icon: Film,     iconColor: 'text-cyan-400',   label: 'Storyboard' },
};

const SketchToImage: React.FC = () => {
  const [promptMapMode, setPromptMapMode] = useState<PromptMapMode>(null);
  const [sidePanelMode, setSidePanelMode] = useState<SidePanelMode>(null);
  const [composedPrompt, setComposedPrompt] = useState("");

  // Canvas and image state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState("#ffffff");
  const [showGuideOverlay, setShowGuideOverlay] = useState(true);

  // Composition state
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    type: 'rule-of-thirds',
    visible: true,
    opacity: 0.5,
    color: '#ffffff',
    lineWidth: 1,
    showPowerPoints: true,
  });
  const [focalPoints, setFocalPoints] = useState<FocalPoint[]>([]);
  const [balance, setBalance] = useState<BalanceAnalysis | null>(null);

  // Real-time preview state
  const [styleParams, setStyleParams] = useState<StyleParameters>(DEFAULT_STYLE);
  const [selectedResult, setSelectedResult] = useState<GenerationResult | null>(null);
  const [variations, setVariations] = useState<Variation[]>([]);

  // Professional canvas state
  const [brushSettings, setBrushSettings] = useState<BrushSettings>(DEFAULT_BRUSH);
  const [activeLayer, setActiveLayer] = useState<Layer | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [useProfessionalCanvas, setUseProfessionalCanvas] = useState(false);

  // Dynamic brush cursor — renders a circle matching brush size scaled by zoom
  const brushCursor = useMemo(() => {
    const diameter = brushSettings.size * zoom;
    if (diameter < 3) return 'crosshair';
    const radius = diameter / 2;
    const svgSize = Math.max(diameter + 2, 8); // +2 for stroke, min 8px
    const center = svgSize / 2;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${svgSize}' height='${svgSize}'><circle cx='${center}' cy='${center}' r='${radius}' fill='none' stroke='white' stroke-opacity='0.6' stroke-width='1'/><circle cx='${center}' cy='${center}' r='0.5' fill='white' fill-opacity='0.8'/></svg>`;
    const encoded = encodeURIComponent(svg);
    const hotspot = Math.round(svgSize / 2);
    return `url("data:image/svg+xml,${encoded}") ${hotspot} ${hotspot}, crosshair`;
  }, [brushSettings.size, zoom]);

  const [isDragOver, setIsDragOver] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Canvas dimensions
  const canvasWidth = 640;
  const canvasHeight = 480;

  // Initialize canvases
  useEffect(() => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas) return;

    // Set canvas dimensions
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    overlayCanvas.width = canvasWidth;
    overlayCanvas.height = canvasHeight;

    // Initialize main canvas with dark background
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Initialize professional canvas engine if enabled
    if (useProfessionalCanvas) {
      canvasEngine.initialize(canvas, canvasWidth, canvasHeight);
      canvasEngine.setBrush(brushSettings);
    }
  }, [useProfessionalCanvas, brushSettings]);

  // Draw composition overlay
  useEffect(() => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) return;

    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;

    // Clear overlay
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw grid if visible and showGuideOverlay is true
    if (gridConfig.visible && showGuideOverlay) {
      compositionOverlay.drawOverlay(ctx, canvasWidth, canvasHeight, gridConfig);
    }
  }, [gridConfig, showGuideOverlay]);

  // Load an image file onto the canvas
  const loadImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;

    const url = URL.createObjectURL(file);
    setUploadedImage(url);

    const img = new Image();
    img.onload = () => {
      setImageElement(img);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height);
      const scaledW = img.width * scale;
      const scaledH = img.height * scale;
      const offsetX = (canvasWidth - scaledW) / 2;
      const offsetY = (canvasHeight - scaledH) / 2;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);
    };
    img.src = url;
  }, []);

  // Handle image upload via file input
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadImageFile(file);
  }, [loadImageFile]);

  // Drag-and-drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const { clientX, clientY } = e;
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'));
    if (file) loadImageFile(file);
  }, [loadImageFile]);

  // Clipboard paste handler
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) loadImageFile(file);
        return;
      }
    }
  }, [loadImageFile]);

  // Handle clear canvas
  const handleClearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    setUploadedImage(null);
    setImageElement(null);
    setFocalPoints([]);
    setBalance(null);
  }, []);

  // Drawing handlers
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
  }, [brushColor, brushSize]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }
  }, []);

  // Get canvas ImageData for analysis
  const getCanvasImageData = useCallback((): ImageData | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    return ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  }, []);

  // Style change handler
  const handleStyleChange = useCallback((newStyle: Partial<StyleParameters>) => {
    setStyleParams(prev => ({ ...prev, ...newStyle }));
  }, []);

  // Handle generation result from preview
  const handleGenerationResult = useCallback((result: GenerationResult) => {
    setSelectedResult(result);
  }, []);

  // Handle variation result selection (VariationGallery onSelect returns GenerationResult)
  const handleVariationResultSelect = useCallback((result: GenerationResult) => {
    setSelectedResult(result);
  }, []);

  // Handle new variations generated
  const handleGenerateMoreVariations = useCallback(async () => {
    if (selectedResult) {
      const newVariations = await realTimeEngine.generateVariations(selectedResult, 4);
      setVariations(prev => [...newVariations, ...prev]);
    }
  }, [selectedResult]);

  // Professional canvas handlers
  const handleBrushChange = useCallback((updates: Partial<BrushSettings>) => {
    setBrushSettings(prev => ({ ...prev, ...updates }));
    if (useProfessionalCanvas) {
      canvasEngine.setBrush(updates);
    }
  }, [useProfessionalCanvas]);

  const handleUndo = useCallback(() => {
    if (useProfessionalCanvas) {
      canvasEngine.undo();
      setCanUndo(canvasEngine.canUndo());
      setCanRedo(canvasEngine.canRedo());
    }
  }, [useProfessionalCanvas]);

  const handleRedo = useCallback(() => {
    if (useProfessionalCanvas) {
      canvasEngine.redo();
      setCanUndo(canvasEngine.canUndo());
      setCanRedo(canvasEngine.canRedo());
    }
  }, [useProfessionalCanvas]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.2, 0.25));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  const handleLayerChange = useCallback((layer: Layer | null) => {
    setActiveLayer(layer);
  }, []);

  // Pointer event handlers for professional canvas
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (useProfessionalCanvas) {
      canvasEngine.handlePointerDown(e.nativeEvent);
    } else {
      // Fallback to basic drawing
      setIsDrawing(true);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = brushSettings.color;
      ctx.lineWidth = brushSettings.size;
    }
  }, [useProfessionalCanvas, brushSettings.color, brushSettings.size]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (useProfessionalCanvas) {
      canvasEngine.handlePointerMove(e.nativeEvent);
    } else if (isDrawing) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }, [useProfessionalCanvas, isDrawing]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (useProfessionalCanvas) {
      canvasEngine.handlePointerUp(e.nativeEvent);
      setCanUndo(canvasEngine.canUndo());
      setCanRedo(canvasEngine.canRedo());
    } else {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.closePath();
      }
    }
  }, [useProfessionalCanvas]);

  // Flyout menu item definitions
  const generationItems = useMemo<ToolbarItem[]>(() => [
    {
      id: 'gpt',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      label: 'GPT Prompt Map',
      tooltip: 'Visual prompt builder powered by GPT',
      isActive: promptMapMode === 'gpt',
      onClick: () => setPromptMapMode(prev => prev === 'gpt' ? null : 'gpt'),
    },
    {
      id: 'claude',
      icon: <Zap className="w-3.5 h-3.5" />,
      label: 'Claude Prompt Map',
      tooltip: 'Visual prompt builder powered by Claude',
      isActive: promptMapMode === 'claude',
      onClick: () => setPromptMapMode(prev => prev === 'claude' ? null : 'claude'),
    },
    {
      id: 'lab',
      icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" />,
      label: 'Prompt Laboratory',
      tooltip: 'Experimental multi-model prompt lab',
      isActive: promptMapMode === 'lab',
      onClick: () => setPromptMapMode(prev => prev === 'lab' ? null : 'lab'),
    },
    {
      id: 'synthesis',
      icon: <AudioLines className="w-3.5 h-3.5 text-emerald-400" />,
      label: 'Multimodal Synthesis',
      tooltip: 'Fuse voice, sketch, and text into one prompt',
      isActive: promptMapMode === 'synthesis',
      onClick: () => setPromptMapMode(prev => prev === 'synthesis' ? null : 'synthesis'),
    },
  ], [promptMapMode]);

  const compositionItems = useMemo<ToolbarItem[]>(() => [
    {
      id: 'suggestions',
      icon: <Lightbulb className="w-3.5 h-3.5" />,
      label: 'Layout Analysis',
      tooltip: 'AI-powered composition analysis and suggestions',
      isActive: sidePanelMode === 'suggestions',
      onClick: () => setSidePanelMode(prev => prev === 'suggestions' ? null : 'suggestions'),
    },
  ], [sidePanelMode]);

  const refineItems = useMemo<ToolbarItem[]>(() => [
    {
      id: 'style',
      icon: <Sliders className="w-3.5 h-3.5" />,
      label: 'Style Controller',
      tooltip: 'Adjust rendering style parameters',
      isActive: sidePanelMode === 'style',
      onClick: () => setSidePanelMode(prev => prev === 'style' ? null : 'style'),
    },
    {
      id: 'variations',
      icon: <Layers className="w-3.5 h-3.5" />,
      label: 'Variation Gallery',
      tooltip: 'Browse and compare image variations',
      isActive: sidePanelMode === 'variations',
      onClick: () => setSidePanelMode(prev => prev === 'variations' ? null : 'variations'),
    },
    {
      id: 'storyboard',
      icon: <Film className="w-3.5 h-3.5" />,
      label: 'Storyboard Pipeline',
      tooltip: 'Generate storyboard sequences from sketches',
      isActive: sidePanelMode === 'storyboard',
      onClick: () => setSidePanelMode(prev => prev === 'storyboard' ? null : 'storyboard'),
    },
  ], [sidePanelMode]);

  const drawingItems = useMemo<ToolbarItem[]>(() => [
    {
      id: 'drawing-guides',
      icon: <Ruler className="w-3.5 h-3.5" />,
      label: 'Rulers & Guides',
      tooltip: 'Drawing grid, snap, and measurement rulers',
      isActive: sidePanelMode === 'drawing-guides',
      onClick: () => setSidePanelMode(prev => prev === 'drawing-guides' ? null : 'drawing-guides'),
    },
  ], [sidePanelMode]);

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Pencil className="w-4 h-4 text-cyan-400" />
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold tracking-tight text-slate-50">
              Sketch to Image
            </h3>
            <p className="text-sm text-slate-400">
              Combine hand-drawn sketches with AI-assisted prompts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Primary tools — always visible */}
          <Tooltip content="Guides" position="bottom">
            <Button
              size="xs"
              variant={sidePanelMode === 'guides' ? "primary" : "secondary"}
              className="h-7 px-2 text-sm"
              onClick={() => setSidePanelMode(prev => prev === 'guides' ? null : 'guides')}
              data-testid="sketch-guides-btn"
              aria-label="Composition guides"
            >
              <Grid3X3 className="w-3 h-3 mr-1" />
              Guides
            </Button>
          </Tooltip>

          <Tooltip content="Brush library" position="bottom">
            <Button
              size="xs"
              variant={sidePanelMode === 'brushes' ? "primary" : "secondary"}
              className="h-7 px-2 text-sm"
              onClick={() => setSidePanelMode(prev => prev === 'brushes' ? null : 'brushes')}
              data-testid="sketch-brushes-btn"
              aria-label="Brush library"
            >
              <Brush className="w-3 h-3 mr-1" />
              Brushes
            </Button>
          </Tooltip>

          <Tooltip content="Layer manager" position="bottom">
            <Button
              size="xs"
              variant={sidePanelMode === 'layers' ? "primary" : "secondary"}
              className="h-7 px-2 text-sm"
              onClick={() => setSidePanelMode(prev => prev === 'layers' ? null : 'layers')}
              data-testid="sketch-layers-btn"
              aria-label="Layer manager"
            >
              <Layers className="w-3 h-3 mr-1" />
              Layers
            </Button>
          </Tooltip>

          <Tooltip content="Real-time preview" position="bottom">
            <Button
              size="xs"
              variant={sidePanelMode === 'preview' ? "primary" : "secondary"}
              className="h-7 px-2 text-sm"
              onClick={() => setSidePanelMode(prev => prev === 'preview' ? null : 'preview')}
              data-testid="sketch-preview-btn"
              aria-label="Real-time preview"
            >
              <ImageIcon className="w-3 h-3 mr-1" />
              Preview
            </Button>
          </Tooltip>

          <div className="w-px h-5 bg-slate-700" />

          {/* Flyout: Generation (prompt modes) */}
          <ToolbarFlyout
            icon={<Sparkles className="w-3 h-3" />}
            label="Prompt"
            tooltip="AI prompt builders"
            hasActiveItem={promptMapMode !== null}
            items={generationItems}
          />

          {/* Flyout: Composition */}
          <ToolbarFlyout
            icon={<Lightbulb className="w-3 h-3" />}
            label="Compose"
            tooltip="Composition analysis and suggestions"
            hasActiveItem={sidePanelMode === 'suggestions'}
            items={compositionItems}
          />

          {/* Flyout: Preview & Variations */}
          <ToolbarFlyout
            icon={<Sliders className="w-3 h-3" />}
            label="Refine"
            tooltip="Style, variations, and storyboard"
            hasActiveItem={sidePanelMode === 'style' || sidePanelMode === 'variations' || sidePanelMode === 'storyboard'}
            items={refineItems}
          />

          {/* Flyout: Drawing Tools */}
          <ToolbarFlyout
            icon={<Ruler className="w-3 h-3" />}
            label="Draw"
            tooltip="Drawing guides and rulers"
            hasActiveItem={sidePanelMode === 'drawing-guides'}
            items={drawingItems}
          />
        </div>
      </div>

      {/* Prompt map full-width on top */}
      <Card className="flex flex-col bg-slate-950/80 border-slate-900/80 overflow-hidden">
        {promptMapMode === 'gpt' ? (
          <PromptMapGpt onPromptChange={setComposedPrompt} />
        ) : promptMapMode === 'claude' ? (
          <PromptMapClaude onPromptChange={setComposedPrompt} />
        ) : promptMapMode === 'lab' ? (
          <PromptLaboratory onPromptChange={setComposedPrompt} />
        ) : promptMapMode === 'synthesis' ? (
          <MultimodalSynthesis onPromptChange={setComposedPrompt} canvasRef={canvasRef} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-sm text-slate-400 px-4 py-6">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-8 h-8 text-cyan-400/70" />
              <Zap className="w-8 h-8 text-purple-400/70" />
              <span className="text-3xl">🧪</span>
            </div>
            <p className="max-w-md text-center">
              Try <span className="font-semibold text-slate-300">Gpt</span>,{" "}
              <span className="font-semibold text-purple-300">Claude</span>, the{" "}
              <span className="font-semibold text-cyan-300">Lab</span>, or{" "}
              <span className="font-semibold text-emerald-300">Synthesis</span> to compose prompts
              with different visual builders and smart features.
            </p>
          </div>
        )}

        {composedPrompt && (
          <div className="border-t border-slate-900/80 bg-slate-950/90 px-3 py-2 text-sm text-slate-300">
            <span className="text-slate-400 mr-1">Current prompt:</span>
            <span className="text-slate-100 line-clamp-2">{composedPrompt}</span>
          </div>
        )}
      </Card>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-3 min-h-0">
        {/* Sketch Canvas */}
        <Card className="flex-1 flex flex-col bg-slate-950/80 border-slate-900/80 overflow-hidden">
          {/* Canvas Toolbar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/50">
            <div className="flex items-center gap-2">
              <Tooltip content="Upload reference image" position="bottom">
                <label className="flex items-center gap-1 px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-cyan-500/50">
                  <Upload className="w-3 h-3" />
                  Upload
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </Tooltip>
              <Tooltip content="Clear canvas" position="bottom">
                <button
                  onClick={handleClearCanvas}
                  className="flex items-center gap-1 px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none"
                  aria-label="Clear canvas"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              </Tooltip>
              <div className="w-px h-4 bg-slate-700" />
              <Tooltip content={showGuideOverlay ? "Hide guide overlay" : "Show guide overlay"} position="bottom">
                <button
                  onClick={() => setShowGuideOverlay(!showGuideOverlay)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 text-sm rounded transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none",
                    showGuideOverlay
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "bg-slate-800 text-slate-400"
                  )}
                  aria-label={showGuideOverlay ? "Hide guide overlay" : "Show guide overlay"}
                  aria-pressed={showGuideOverlay}
                >
                  {showGuideOverlay ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  Overlay
                </button>
              </Tooltip>
              <div className="w-px h-4 bg-slate-700" />
              {/* Pro Canvas Toggle */}
              <Tooltip content={useProfessionalCanvas ? "Disable pro canvas" : "Enable pro canvas with layers and undo"} position="bottom">
                <button
                  onClick={() => setUseProfessionalCanvas(!useProfessionalCanvas)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 text-sm rounded transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none",
                    useProfessionalCanvas
                      ? "bg-purple-500/20 text-purple-300"
                      : "bg-slate-800 text-slate-400"
                  )}
                  aria-label={useProfessionalCanvas ? "Disable pro canvas" : "Enable pro canvas"}
                  aria-pressed={useProfessionalCanvas}
                >
                  <Pencil className="w-3 h-3" />
                  Pro
                </button>
              </Tooltip>
            </div>

            {/* Canvas Controls */}
            <div className="flex items-center gap-2">
              {/* Undo/Redo */}
              {useProfessionalCanvas && (
                <>
                  <Tooltip content="Undo (Ctrl+Z)" position="bottom">
                    <button
                      onClick={handleUndo}
                      disabled={!canUndo}
                      className={cn(
                        "p-2.5 rounded transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none",
                        canUndo ? "text-slate-300 hover:bg-slate-700" : "text-slate-400 cursor-not-allowed"
                      )}
                      aria-label="Undo"
                    >
                      <Undo className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                  <Tooltip content="Redo (Ctrl+Y)" position="bottom">
                    <button
                      onClick={handleRedo}
                      disabled={!canRedo}
                      className={cn(
                        "p-2.5 rounded transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none",
                        canRedo ? "text-slate-300 hover:bg-slate-700" : "text-slate-400 cursor-not-allowed"
                      )}
                      aria-label="Redo"
                    >
                      <Redo className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                  <div className="w-px h-4 bg-slate-700" />
                </>
              )}

              {/* Zoom Controls */}
              <Tooltip content="Zoom out" position="bottom">
                <button
                  onClick={handleZoomOut}
                  className="p-2.5 text-slate-300 hover:bg-slate-700 rounded transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              <span className="text-sm text-slate-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
              <Tooltip content="Zoom in" position="bottom">
                <button
                  onClick={handleZoomIn}
                  className="p-2.5 text-slate-300 hover:bg-slate-700 rounded transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              <Tooltip content="Reset zoom to 100%" position="bottom">
                <button
                  onClick={handleResetZoom}
                  className="p-2.5 text-slate-300 hover:bg-slate-700 rounded transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none"
                  aria-label="Reset zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              <div className="w-px h-4 bg-slate-700" />

              {/* Brush Controls */}
              <div className="flex items-center gap-1">
                <span className="text-sm text-slate-400">Size:</span>
                <RangeSlider aria-label="Brush size" value={brushSettings.size} min={1} max={100} onChange={(v) => handleBrushChange({ size: v })} unit="px" className="w-24" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-slate-400">Color:</span>
                <Tooltip content="Brush color" position="bottom">
                  <input
                    type="color"
                    value={brushSettings.color}
                    onChange={(e) => handleBrushChange({ color: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer"
                    aria-label="Brush color"
                  />
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Canvas Area */}
          <div
            className="flex-1 flex items-center justify-center p-4 bg-slate-900/50 overflow-hidden relative"
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onPaste={handlePaste}
            tabIndex={0}
          >
            {/* Drop zone overlay */}
            {isDragOver && (
              <div className="absolute inset-2 z-40 flex items-center justify-center rounded-xl border-2 border-dashed border-cyan-400 bg-cyan-500/10 pointer-events-none">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-cyan-400" />
                  <span className="text-sm font-medium text-cyan-300">Drop image here</span>
                </div>
              </div>
            )}
            <div
              className="relative"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            >
              {/* Main Drawing Canvas */}
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                role="img"
                aria-label={`Sketch canvas — ${brushSettings.size}px ${brushSettings.color} brush at ${Math.round(zoom * 100)}% zoom`}
                className="border border-slate-700/50 rounded-lg touch-none"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                  cursor: brushCursor,
                }}
              />
              {/* Overlay Canvas for Guides */}
              <canvas
                ref={overlayCanvasRef}
                role="img"
                aria-label="Composition guide overlay"
                aria-hidden={!showGuideOverlay}
                className="absolute inset-0 pointer-events-none rounded-lg"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                }}
              />
            </div>
          </div>
        </Card>

        {/* Side Panel for Composition Tools and Real-Time Preview */}
        <AnimatePresence>
        {sidePanelMode && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
          <Card className={cn(
            "flex flex-col bg-slate-950/80 border-slate-900/80 overflow-hidden h-full",
            sidePanelMode === 'preview' || sidePanelMode === 'variations' || sidePanelMode === 'storyboard' ? 'w-80' : 'w-72'
          )}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/50">
              <div className="flex items-center gap-2">
                {sidePanelMode && (() => {
                  const config = SIDE_PANEL_CONFIG[sidePanelMode];
                  const Icon = config.icon;
                  return (
                    <>
                      <Icon className={cn('w-4 h-4', config.iconColor)} />
                      <span className="text-sm font-medium text-slate-200">{config.label}</span>
                    </>
                  );
                })()}
              </div>
              <button
                onClick={() => setSidePanelMode(null)}
                className="p-2.5 text-slate-400 hover:text-slate-200 rounded transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none"
                aria-label="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {sidePanelMode === 'guides' && (
                <CompositionGuides
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                  onConfigChange={setGridConfig}
                />
              )}
              {sidePanelMode === 'suggestions' && (
                <LayoutSuggestions
                  imageSource={getCanvasImageData()}
                  focalPoints={focalPoints}
                  balance={balance}
                />
              )}
              {sidePanelMode === 'style' && (
                <StyleController
                  style={styleParams}
                  onChange={handleStyleChange}
                />
              )}
              {sidePanelMode === 'preview' && (
                <RealTimePreview
                  sketchCanvas={canvasRef.current}
                  prompt={composedPrompt}
                  style={styleParams}
                  onResultSelect={handleGenerationResult}
                />
              )}
              {sidePanelMode === 'variations' && (
                <VariationGallery
                  baseResult={selectedResult}
                  variations={variations}
                  onSelect={handleVariationResultSelect}
                  onGenerateMore={handleGenerateMoreVariations}
                />
              )}
              {sidePanelMode === 'brushes' && (
                <BrushLibrary
                  currentBrush={brushSettings}
                  onBrushChange={handleBrushChange}
                />
              )}
              {sidePanelMode === 'layers' && (
                <LayerPanel
                  width={canvasWidth}
                  height={canvasHeight}
                  onLayerChange={handleLayerChange}
                />
              )}
              {sidePanelMode === 'drawing-guides' && (
                <DrawingGuides
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                />
              )}
              {sidePanelMode === 'storyboard' && (
                <StoryboardPipeline
                  onLoadPrompt={(prompt) => setComposedPrompt(prompt)}
                  onGenerateFrame={(prompt) => setComposedPrompt(prompt)}
                />
              )}
            </div>
          </Card>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SketchToImage;
