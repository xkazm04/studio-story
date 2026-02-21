"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Pencil, Sparkles, Zap, Grid3X3, Lightbulb, Upload, X, Trash2, Eye, EyeOff, Sliders, Image as ImageIcon, Layers, Brush, Ruler, Undo, Redo, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/app/components/UI/Button";
import { Card } from "@/app/components/UI/Card";
import PromptMapGpt from "./components/PromptMapGpt";
import PromptMapClaude from "./components/PromptMapClaude";
import PromptLaboratory from "./components/PromptLaboratory";
import CompositionGuides from "./components/CompositionGuides";
import LayoutSuggestions from "./components/LayoutSuggestions";
import StyleController from "./components/StyleController";
import RealTimePreview from "./components/RealTimePreview";
import VariationGallery from "./components/VariationGallery";
import BrushLibrary from "./components/BrushLibrary";
import LayerPanel from "./components/LayerPanel";
import DrawingGuides from "./components/DrawingGuides";
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

type PromptMapMode = 'gpt' | 'claude' | 'lab' | null;
type SidePanelMode = 'guides' | 'suggestions' | 'style' | 'preview' | 'variations' | 'brushes' | 'layers' | 'drawing-guides' | null;

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

  // Handle image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setUploadedImage(url);

    // Load image onto canvas
    const img = new Image();
    img.onload = () => {
      setImageElement(img);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Calculate scaling to fit canvas while maintaining aspect ratio
      const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height);
      const scaledW = img.width * scale;
      const scaledH = img.height * scale;
      const offsetX = (canvasWidth - scaledW) / 2;
      const offsetY = (canvasHeight - scaledH) / 2;

      // Clear and draw
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);
    };
    img.src = url;
  }, []);

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

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Pencil className="w-4 h-4 text-cyan-400" />
          <div className="flex flex-col">
            <h3 className="text-xs font-semibold tracking-tight text-slate-50">
              Sketch to Image
            </h3>
            <p className="text-[11px] text-slate-500">
              Combine hand-drawn sketches with AI-assisted prompts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Prompt Mode Buttons */}
          <Button
            size="xs"
            variant={promptMapMode === 'gpt' ? "primary" : "secondary"}
            className="h-7 px-2 text-[11px]"
            onClick={() => setPromptMapMode(prev => prev === 'gpt' ? null : 'gpt')}
            data-testid="sketch-prompt-mode-gpt-btn"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            {promptMapMode === 'gpt' ? "Hide" : "Gpt"}
          </Button>

          <Button
            size="xs"
            variant={promptMapMode === 'claude' ? "primary" : "secondary"}
            className="h-7 px-2 text-[11px]"
            onClick={() => setPromptMapMode(prev => prev === 'claude' ? null : 'claude')}
            data-testid="sketch-prompt-mode-claude-btn"
          >
            <Zap className="w-3 h-3 mr-1" />
            {promptMapMode === 'claude' ? "Hide" : "Claude"}
          </Button>

          <Button
            size="xs"
            variant={promptMapMode === 'lab' ? "primary" : "secondary"}
            className="h-7 px-2 text-[11px] bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-purple-500/30"
            onClick={() => setPromptMapMode(prev => prev === 'lab' ? null : 'lab')}
            data-testid="sketch-prompt-mode-lab-btn"
          >
            <span className="mr-1">🧪</span>
            {promptMapMode === 'lab' ? "Hide" : "Lab"}
          </Button>

          <div className="w-px h-5 bg-slate-700" />

          {/* Composition Assistant Buttons */}
          <Button
            size="xs"
            variant={sidePanelMode === 'guides' ? "primary" : "secondary"}
            className="h-7 px-2 text-[11px]"
            onClick={() => setSidePanelMode(prev => prev === 'guides' ? null : 'guides')}
            data-testid="sketch-guides-btn"
          >
            <Grid3X3 className="w-3 h-3 mr-1" />
            Guides
          </Button>

          <Button
            size="xs"
            variant={sidePanelMode === 'suggestions' ? "primary" : "secondary"}
            className="h-7 px-2 text-[11px]"
            onClick={() => setSidePanelMode(prev => prev === 'suggestions' ? null : 'suggestions')}
            data-testid="sketch-suggestions-btn"
          >
            <Lightbulb className="w-3 h-3 mr-1" />
            Analysis
          </Button>

          <div className="w-px h-5 bg-slate-700" />

          {/* Real-Time Preview Buttons */}
          <Button
            size="xs"
            variant={sidePanelMode === 'style' ? "primary" : "secondary"}
            className="h-7 px-2 text-[11px]"
            onClick={() => setSidePanelMode(prev => prev === 'style' ? null : 'style')}
            data-testid="sketch-style-btn"
          >
            <Sliders className="w-3 h-3 mr-1" />
            Style
          </Button>

          <Button
            size="xs"
            variant={sidePanelMode === 'preview' ? "primary" : "secondary"}
            className="h-7 px-2 text-[11px]"
            onClick={() => setSidePanelMode(prev => prev === 'preview' ? null : 'preview')}
            data-testid="sketch-preview-btn"
          >
            <ImageIcon className="w-3 h-3 mr-1" />
            Preview
          </Button>

          <Button
            size="xs"
            variant={sidePanelMode === 'variations' ? "primary" : "secondary"}
            className="h-7 px-2 text-[11px]"
            onClick={() => setSidePanelMode(prev => prev === 'variations' ? null : 'variations')}
            data-testid="sketch-variations-btn"
          >
            <Layers className="w-3 h-3 mr-1" />
            Vars
          </Button>

          <div className="w-px h-5 bg-slate-700" />

          {/* Professional Canvas Buttons */}
          <Button
            size="xs"
            variant={sidePanelMode === 'brushes' ? "primary" : "secondary"}
            className="h-7 px-2 text-[11px]"
            onClick={() => setSidePanelMode(prev => prev === 'brushes' ? null : 'brushes')}
            data-testid="sketch-brushes-btn"
          >
            <Brush className="w-3 h-3 mr-1" />
            Brushes
          </Button>

          <Button
            size="xs"
            variant={sidePanelMode === 'layers' ? "primary" : "secondary"}
            className="h-7 px-2 text-[11px]"
            onClick={() => setSidePanelMode(prev => prev === 'layers' ? null : 'layers')}
            data-testid="sketch-layers-btn"
          >
            <Layers className="w-3 h-3 mr-1" />
            Layers
          </Button>

          <Button
            size="xs"
            variant={sidePanelMode === 'drawing-guides' ? "primary" : "secondary"}
            className="h-7 px-2 text-[11px]"
            onClick={() => setSidePanelMode(prev => prev === 'drawing-guides' ? null : 'drawing-guides')}
            data-testid="sketch-drawing-guides-btn"
          >
            <Ruler className="w-3 h-3 mr-1" />
            Rulers
          </Button>
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
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-[11px] text-slate-500 px-4 py-6">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-8 h-8 text-cyan-400/70" />
              <Zap className="w-8 h-8 text-purple-400/70" />
              <span className="text-3xl">🧪</span>
            </div>
            <p className="max-w-md text-center">
              Try <span className="font-semibold text-slate-300">Gpt</span>,{" "}
              <span className="font-semibold text-purple-300">Claude</span>, or the{" "}
              <span className="font-semibold text-cyan-300">Lab</span> to compose prompts
              with different visual builders and smart features.
            </p>
          </div>
        )}

        {composedPrompt && (
          <div className="border-t border-slate-900/80 bg-slate-950/90 px-3 py-2 text-[11px] text-slate-300">
            <span className="text-slate-500 mr-1">Current prompt:</span>
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
              <label className="flex items-center gap-1 px-2 py-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer transition-colors">
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
              <button
                onClick={handleClearCanvas}
                className="flex items-center gap-1 px-2 py-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
              <div className="w-px h-4 bg-slate-700" />
              <button
                onClick={() => setShowGuideOverlay(!showGuideOverlay)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 text-[10px] rounded transition-colors",
                  showGuideOverlay
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "bg-slate-800 text-slate-400"
                )}
              >
                {showGuideOverlay ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                Overlay
              </button>
              <div className="w-px h-4 bg-slate-700" />
              {/* Pro Canvas Toggle */}
              <button
                onClick={() => setUseProfessionalCanvas(!useProfessionalCanvas)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 text-[10px] rounded transition-colors",
                  useProfessionalCanvas
                    ? "bg-purple-500/20 text-purple-300"
                    : "bg-slate-800 text-slate-400"
                )}
              >
                <Pencil className="w-3 h-3" />
                Pro
              </button>
            </div>

            {/* Canvas Controls */}
            <div className="flex items-center gap-2">
              {/* Undo/Redo */}
              {useProfessionalCanvas && (
                <>
                  <button
                    onClick={handleUndo}
                    disabled={!canUndo}
                    className={cn(
                      "p-1 rounded transition-colors",
                      canUndo ? "text-slate-300 hover:bg-slate-700" : "text-slate-600 cursor-not-allowed"
                    )}
                    title="Undo"
                  >
                    <Undo className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={!canRedo}
                    className={cn(
                      "p-1 rounded transition-colors",
                      canRedo ? "text-slate-300 hover:bg-slate-700" : "text-slate-600 cursor-not-allowed"
                    )}
                    title="Redo"
                  >
                    <Redo className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-4 bg-slate-700" />
                </>
              )}

              {/* Zoom Controls */}
              <button
                onClick={handleZoomOut}
                className="p-1 text-slate-300 hover:bg-slate-700 rounded transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] text-slate-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={handleZoomIn}
                className="p-1 text-slate-300 hover:bg-slate-700 rounded transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1 text-slate-300 hover:bg-slate-700 rounded transition-colors"
                title="Reset zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-slate-700" />

              {/* Brush Controls */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-500">Size:</span>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={brushSettings.size}
                  onChange={(e) => handleBrushChange({ size: parseInt(e.target.value, 10) })}
                  className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 w-6">{brushSettings.size}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-500">Color:</span>
                <input
                  type="color"
                  value={brushSettings.color}
                  onChange={(e) => handleBrushChange({ color: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 flex items-center justify-center p-4 bg-slate-900/50 overflow-hidden">
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
                className="border border-slate-700/50 rounded-lg cursor-crosshair touch-none"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                }}
              />
              {/* Overlay Canvas for Guides */}
              <canvas
                ref={overlayCanvasRef}
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
        {sidePanelMode && (
          <Card className={cn(
            "flex flex-col bg-slate-950/80 border-slate-900/80 overflow-hidden",
            sidePanelMode === 'preview' || sidePanelMode === 'variations' ? 'w-80' : 'w-72'
          )}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/50">
              <div className="flex items-center gap-2">
                {sidePanelMode === 'guides' && (
                  <>
                    <Grid3X3 className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-medium text-slate-200">Composition Guides</span>
                  </>
                )}
                {sidePanelMode === 'suggestions' && (
                  <>
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-medium text-slate-200">Layout Analysis</span>
                  </>
                )}
                {sidePanelMode === 'style' && (
                  <>
                    <Sliders className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-medium text-slate-200">Style Controls</span>
                  </>
                )}
                {sidePanelMode === 'preview' && (
                  <>
                    <ImageIcon className="w-4 h-4 text-green-400" />
                    <span className="text-xs font-medium text-slate-200">Real-Time Preview</span>
                  </>
                )}
                {sidePanelMode === 'variations' && (
                  <>
                    <Layers className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-medium text-slate-200">Variations</span>
                  </>
                )}
                {sidePanelMode === 'brushes' && (
                  <>
                    <Brush className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-medium text-slate-200">Brush Library</span>
                  </>
                )}
                {sidePanelMode === 'layers' && (
                  <>
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-medium text-slate-200">Layers</span>
                  </>
                )}
                {sidePanelMode === 'drawing-guides' && (
                  <>
                    <Ruler className="w-4 h-4 text-green-400" />
                    <span className="text-xs font-medium text-slate-200">Drawing Guides</span>
                  </>
                )}
              </div>
              <button
                onClick={() => setSidePanelMode(null)}
                className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
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
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SketchToImage;
