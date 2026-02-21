'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  selectionTools,
  transformTools,
  type SelectionToolType,
  type SelectionToolState,
  type TransformToolType,
  type TransformState,
  type Point,
  type HandlePosition,
} from '@/lib/editor';
import { cn } from '@/app/lib/utils';

// ============================================================================
// Types
// ============================================================================

export type EditorMode = 'selection' | 'transform' | 'view';

interface EditorCanvasProps {
  imageUrl?: string;
  processedImageData?: ImageData | null;
  mode: EditorMode;
  activeTool: SelectionToolType | TransformToolType | 'hand' | 'pointer';
  zoom: number;
  offset: Point;
  selection?: import('@/lib/editor').Selection | null;
  showOriginal?: boolean;
  onZoomChange: (zoom: number) => void;
  onOffsetChange: (offset: Point) => void;
  onSelectionChange?: (selection: import('@/lib/editor').Selection | null) => void;
  onImageLoad?: (width: number, height: number) => void;
  showGrid?: boolean;
  showGuides?: boolean;
}

interface CanvasState {
  width: number;
  height: number;
  isDrawing: boolean;
  isPanning: boolean;
  lastPoint: Point | null;
}

// ============================================================================
// Constants
// ============================================================================

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;
const ZOOM_STEP = 0.1;
const HANDLE_SIZE = 8;
const MARCHING_ANTS_SPEED = 100;

// ============================================================================
// Helper Functions
// ============================================================================

function getCanvasPoint(
  e: React.MouseEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement,
  zoom: number,
  offset: Point
): Point {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: ((e.clientX - rect.left) * scaleX - offset.x) / zoom,
    y: ((e.clientY - rect.top) * scaleY - offset.y) / zoom,
  };
}

// ============================================================================
// Main Component
// ============================================================================

const EditorCanvas: React.FC<EditorCanvasProps> = ({
  imageUrl,
  processedImageData,
  mode,
  activeTool,
  zoom,
  offset,
  selection,
  showOriginal = false,
  onZoomChange,
  onOffsetChange,
  onSelectionChange,
  onImageLoad,
  showGrid = false,
  showGuides = false,
}) => {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const animationRef = useRef<number>(0);
  const marchingAntsOffsetRef = useRef(0);

  // State
  const [canvasState, setCanvasState] = useState<CanvasState>({
    width: 800,
    height: 600,
    isDrawing: false,
    isPanning: false,
    lastPoint: null,
  });
  const [selectionState, setSelectionState] = useState<SelectionToolState | null>(null);
  const [transformState, setTransformState] = useState<TransformState | null>(null);
  const [cursor, setCursor] = useState('default');
  const [hoveredHandle, setHoveredHandle] = useState<HandlePosition | null>(null);

  // -------------------------------------------------------------------------
  // Image Loading
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setCanvasState((prev) => ({
        ...prev,
        width: img.width,
        height: img.height,
      }));
      transformTools.setImageBounds(img.width, img.height);
      onImageLoad?.(img.width, img.height);
    };
    img.src = imageUrl;
  }, [imageUrl, onImageLoad]);

  // -------------------------------------------------------------------------
  // Main Canvas Rendering
  // -------------------------------------------------------------------------

  const renderMainCanvas = useCallback(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and offset
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    // Draw image
    if (processedImageData) {
      // Create temporary canvas for ImageData
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = processedImageData.width;
      tempCanvas.height = processedImageData.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.putImageData(processedImageData, 0, 0);
        ctx.drawImage(tempCanvas, 0, 0);
      }
    } else if (imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0);
    }

    // Draw grid if enabled
    if (showGrid) {
      drawGrid(ctx, canvasState.width, canvasState.height);
    }

    ctx.restore();
  }, [processedImageData, zoom, offset, showGrid, canvasState.width, canvasState.height]);

  // -------------------------------------------------------------------------
  // Overlay Canvas Rendering
  // -------------------------------------------------------------------------

  const renderOverlayCanvas = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear overlay
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and offset
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    // Draw selection
    if (mode === 'selection') {
      drawSelection(ctx);
      drawSelectionPreview(ctx);
    }

    // Draw transform handles
    if (mode === 'transform') {
      drawTransformHandles(ctx);
      drawCropOverlay(ctx);
    }

    // Draw guides if enabled
    if (showGuides) {
      drawGuides(ctx, canvasState.width, canvasState.height);
    }

    ctx.restore();
  }, [mode, zoom, offset, showGuides, canvasState.width, canvasState.height]);

  // -------------------------------------------------------------------------
  // Drawing Helpers
  // -------------------------------------------------------------------------

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 50;
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)';
    ctx.lineWidth = 1 / zoom;

    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const drawGuides = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([5 / zoom, 5 / zoom]);

    // Center lines
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Rule of thirds
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.beginPath();
    ctx.moveTo(width / 3, 0);
    ctx.lineTo(width / 3, height);
    ctx.moveTo((width * 2) / 3, 0);
    ctx.lineTo((width * 2) / 3, height);
    ctx.moveTo(0, height / 3);
    ctx.lineTo(width, height / 3);
    ctx.moveTo(0, (height * 2) / 3);
    ctx.lineTo(width, (height * 2) / 3);
    ctx.stroke();

    ctx.setLineDash([]);
  };

  const drawSelection = (ctx: CanvasRenderingContext2D) => {
    const path = selectionTools.getSelectionPath(ctx);
    if (!path) return;

    // Marching ants effect
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([4 / zoom, 4 / zoom]);
    ctx.lineDashOffset = marchingAntsOffsetRef.current / zoom;
    ctx.stroke(path);

    ctx.strokeStyle = '#000000';
    ctx.lineDashOffset = (marchingAntsOffsetRef.current + 4) / zoom;
    ctx.stroke(path);
    ctx.restore();
  };

  const drawSelectionPreview = (ctx: CanvasRenderingContext2D) => {
    const path = selectionTools.getPreviewPath(ctx);
    if (!path) return;

    ctx.save();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([4 / zoom, 4 / zoom]);
    ctx.fill(path);
    ctx.stroke(path);
    ctx.restore();
  };

  const drawTransformHandles = (ctx: CanvasRenderingContext2D) => {
    const tool = transformTools.getTool();
    if (tool === 'crop') return; // Crop uses separate rendering

    const handles = transformTools.getTransformHandles();
    const handleSize = HANDLE_SIZE / zoom;

    for (const handle of handles) {
      ctx.save();

      // Handle fill
      ctx.fillStyle = hoveredHandle === handle.position ? '#3b82f6' : '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1 / zoom;

      if (handle.position === 'rotation') {
        // Rotation handle as circle
        ctx.beginPath();
        ctx.arc(handle.x, handle.y, handleSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        // Corner/edge handles as squares
        ctx.fillRect(
          handle.x - handleSize / 2,
          handle.y - handleSize / 2,
          handleSize,
          handleSize
        );
        ctx.strokeRect(
          handle.x - handleSize / 2,
          handle.y - handleSize / 2,
          handleSize,
          handleSize
        );
      }

      ctx.restore();
    }

    // Draw bounding box
    const state = transformTools.getState();
    const { width, height } = canvasState;
    const scaledWidth = width * Math.abs(state.scaleX);
    const scaledHeight = height * Math.abs(state.scaleY);

    ctx.save();
    ctx.translate(state.translateX + scaledWidth / 2, state.translateY + scaledHeight / 2);
    ctx.rotate((state.rotation * Math.PI) / 180);
    ctx.translate(-scaledWidth / 2, -scaledHeight / 2);

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([4 / zoom, 4 / zoom]);
    ctx.strokeRect(0, 0, scaledWidth, scaledHeight);

    ctx.restore();
  };

  const drawCropOverlay = (ctx: CanvasRenderingContext2D) => {
    const tool = transformTools.getTool();
    if (tool !== 'crop') return;

    const cropRect = transformTools.getCropRect();
    if (!cropRect) return;

    const { width, height } = canvasState;

    // Darken non-crop area
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, width, cropRect.y);
    ctx.fillRect(0, cropRect.y + cropRect.height, width, height - cropRect.y - cropRect.height);
    ctx.fillRect(0, cropRect.y, cropRect.x, cropRect.height);
    ctx.fillRect(cropRect.x + cropRect.width, cropRect.y, width - cropRect.x - cropRect.width, cropRect.height);

    // Draw crop border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 / zoom;
    ctx.strokeRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);

    // Draw rule of thirds
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1 / zoom;
    const thirdW = cropRect.width / 3;
    const thirdH = cropRect.height / 3;

    ctx.beginPath();
    ctx.moveTo(cropRect.x + thirdW, cropRect.y);
    ctx.lineTo(cropRect.x + thirdW, cropRect.y + cropRect.height);
    ctx.moveTo(cropRect.x + thirdW * 2, cropRect.y);
    ctx.lineTo(cropRect.x + thirdW * 2, cropRect.y + cropRect.height);
    ctx.moveTo(cropRect.x, cropRect.y + thirdH);
    ctx.lineTo(cropRect.x + cropRect.width, cropRect.y + thirdH);
    ctx.moveTo(cropRect.x, cropRect.y + thirdH * 2);
    ctx.lineTo(cropRect.x + cropRect.width, cropRect.y + thirdH * 2);
    ctx.stroke();

    // Draw handles
    const handles = transformTools.getCropHandles();
    const handleSize = HANDLE_SIZE / zoom;

    for (const handle of handles) {
      ctx.fillStyle = hoveredHandle === handle.position ? '#3b82f6' : '#ffffff';
      ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1 / zoom;
      ctx.strokeRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
    }
  };

  // -------------------------------------------------------------------------
  // Animation Loop
  // -------------------------------------------------------------------------

  useEffect(() => {
    let lastTime = 0;

    const animate = (time: number) => {
      // Update marching ants
      if (time - lastTime > MARCHING_ANTS_SPEED) {
        marchingAntsOffsetRef.current = (marchingAntsOffsetRef.current + 1) % 8;
        lastTime = time;
      }

      renderMainCanvas();
      renderOverlayCanvas();
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [renderMainCanvas, renderOverlayCanvas]);

  // -------------------------------------------------------------------------
  // Subscribe to Tool State Changes
  // -------------------------------------------------------------------------

  useEffect(() => {
    const unsubSelection = selectionTools.subscribe(setSelectionState);
    const unsubTransform = transformTools.subscribe(setTransformState);

    return () => {
      unsubSelection();
      unsubTransform();
    };
  }, []);

  // -------------------------------------------------------------------------
  // Event Handlers
  // -------------------------------------------------------------------------

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = overlayCanvasRef.current;
      if (!canvas) return;

      const point = getCanvasPoint(e, canvas, zoom, offset);

      // Check for handle interaction in transform mode
      if (mode === 'transform') {
        const handle = transformTools.getHandleAtPoint(point);
        if (handle) {
          transformTools.startTransform(point, handle);
          setCanvasState((prev) => ({ ...prev, isDrawing: true, lastPoint: point }));
          return;
        }
      }

      // Hand tool or middle mouse button for panning
      if (activeTool === 'hand' || e.button === 1) {
        setCanvasState((prev) => ({
          ...prev,
          isPanning: true,
          lastPoint: { x: e.clientX, y: e.clientY },
        }));
        return;
      }

      // Selection tools
      if (mode === 'selection') {
        selectionTools.startSelection(point);
        setCanvasState((prev) => ({ ...prev, isDrawing: true, lastPoint: point }));
        return;
      }

      // Transform move
      if (mode === 'transform') {
        transformTools.startTransform(point);
        setCanvasState((prev) => ({ ...prev, isDrawing: true, lastPoint: point }));
      }
    },
    [mode, activeTool, zoom, offset]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = overlayCanvasRef.current;
      if (!canvas) return;

      const point = getCanvasPoint(e, canvas, zoom, offset);

      // Panning
      if (canvasState.isPanning && canvasState.lastPoint) {
        const dx = e.clientX - canvasState.lastPoint.x;
        const dy = e.clientY - canvasState.lastPoint.y;
        onOffsetChange({ x: offset.x + dx, y: offset.y + dy });
        setCanvasState((prev) => ({ ...prev, lastPoint: { x: e.clientX, y: e.clientY } }));
        return;
      }

      // Check for handle hover
      if (mode === 'transform' && !canvasState.isDrawing) {
        const handle = transformTools.getHandleAtPoint(point);
        setHoveredHandle(handle);
        if (handle) {
          const handles = transformTools.getTool() === 'crop'
            ? transformTools.getCropHandles()
            : transformTools.getTransformHandles();
          const handleData = handles.find((h) => h.position === handle);
          setCursor(handleData?.cursor || 'default');
        } else {
          setCursor('move');
        }
      }

      // Drawing/transforming
      if (canvasState.isDrawing) {
        if (mode === 'selection') {
          selectionTools.updateSelection(point);
        } else if (mode === 'transform') {
          transformTools.updateTransform(point);
        }
      }
    },
    [canvasState, mode, zoom, offset, onOffsetChange]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = overlayCanvasRef.current;
      if (!canvas) return;

      if (canvasState.isPanning) {
        setCanvasState((prev) => ({ ...prev, isPanning: false, lastPoint: null }));
        return;
      }

      if (canvasState.isDrawing) {
        if (mode === 'selection') {
          // Get image data for magic wand if needed
          const mainCanvas = mainCanvasRef.current;
          let imageData: ImageData | undefined;
          if (mainCanvas && activeTool === 'magic-wand') {
            const ctx = mainCanvas.getContext('2d');
            if (ctx) {
              imageData = ctx.getImageData(0, 0, mainCanvas.width, mainCanvas.height);
            }
          }
          selectionTools.completeSelection(imageData);
        } else if (mode === 'transform') {
          transformTools.endTransform();
        }

        setCanvasState((prev) => ({ ...prev, isDrawing: false, lastPoint: null }));
      }
    },
    [canvasState, mode, activeTool]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();

      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta));

      // Zoom towards cursor position
      const canvas = overlayCanvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;

        const zoomFactor = newZoom / zoom;
        const newOffsetX = cursorX - (cursorX - offset.x) * zoomFactor;
        const newOffsetY = cursorY - (cursorY - offset.y) * zoomFactor;

        onZoomChange(newZoom);
        onOffsetChange({ x: newOffsetX, y: newOffsetY });
      }
    },
    [zoom, offset, onZoomChange, onOffsetChange]
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Escape to cancel selection/transform
    if (e.key === 'Escape') {
      selectionTools.cancelSelection();
      transformTools.endTransform();
    }

    // Delete to clear selection
    if (e.key === 'Delete' || e.key === 'Backspace') {
      selectionTools.clearSelection();
    }

    // Ctrl+A to select all
    if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      selectionTools.selectAll(canvasState.width, canvasState.height);
    }

    // Ctrl+D to deselect
    if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      selectionTools.clearSelection();
    }

    // Ctrl+Z to undo
    if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
      e.preventDefault();
      transformTools.undo();
    }

    // Ctrl+Shift+Z or Ctrl+Y to redo
    if ((e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) ||
        (e.key === 'y' && (e.ctrlKey || e.metaKey))) {
      e.preventDefault();
      transformTools.redo();
    }
  }, [canvasState.width, canvasState.height]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // -------------------------------------------------------------------------
  // Cursor Management
  // -------------------------------------------------------------------------

  const getCursor = useMemo(() => {
    if (canvasState.isPanning) return 'grabbing';
    if (activeTool === 'hand') return 'grab';
    if (hoveredHandle) return cursor;

    switch (activeTool) {
      case 'marquee':
      case 'ellipse':
        return 'crosshair';
      case 'lasso':
      case 'polygon':
        return 'crosshair';
      case 'magic-wand':
        return 'crosshair';
      case 'move':
        return 'move';
      case 'scale':
        return 'nwse-resize';
      case 'rotate':
        return 'crosshair';
      case 'crop':
        return 'crosshair';
      default:
        return 'default';
    }
  }, [activeTool, canvasState.isPanning, hoveredHandle, cursor]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-slate-950"
      style={{ cursor: getCursor }}
    >
      {/* Main canvas for image */}
      <canvas
        ref={mainCanvasRef}
        width={canvasState.width}
        height={canvasState.height}
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: 'contain' }}
      />

      {/* Overlay canvas for selection/transform UI */}
      <canvas
        ref={overlayCanvasRef}
        width={canvasState.width}
        height={canvasState.height}
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: 'contain' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Zoom indicator */}
      <div className="absolute bottom-4 left-4 px-2 py-1 bg-slate-900/80 rounded text-xs text-slate-300 font-mono">
        {Math.round(zoom * 100)}%
      </div>

      {/* Image dimensions */}
      <div className="absolute bottom-4 right-4 px-2 py-1 bg-slate-900/80 rounded text-xs text-slate-300 font-mono">
        {canvasState.width} × {canvasState.height}
      </div>
    </div>
  );
};

export default EditorCanvas;
