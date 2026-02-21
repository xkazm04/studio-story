'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Beat, BeatDependency } from '@/app/types/Beat';
import { BeatTableItem } from './BeatsOverview';
import BeatNode from './NarrativeMap/BeatNode';
import DependencyLink from './NarrativeMap/DependencyLink';
import GanttTimeline from './NarrativeMap/GanttTimeline';
import PacingSuggestions from './NarrativeMap/PacingSuggestions';
import { beatDependenciesApi } from '@/app/hooks/integration/useBeatDependencies';
import { beatPacingApi } from '@/app/hooks/integration/useBeatPacing';
import { useProjectStore } from '@/app/store/projectStore';
import { Button } from '@/app/components/UI/Button';
import { ZoomIn, ZoomOut, Maximize2, Grid3x3, Sparkles } from 'lucide-react';

interface NarrativeMapProps {
  beats: BeatTableItem[];
  onBeatUpdate: (beatId: string, updates: Partial<Beat>) => void;
  onReorder: (beatId: string, newOrder: number) => void;
}

const NarrativeMap = ({ beats, onBeatUpdate, onReorder }: NarrativeMapProps) => {
  const { selectedProject } = useProjectStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedBeat, setSelectedBeat] = useState<string | null>(null);
  const [showGantt, setShowGantt] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showPacing, setShowPacing] = useState(false);
  const [draggedBeat, setDraggedBeat] = useState<string | null>(null);

  // Fetch dependencies
  const { data: dependencies = [] } = beatDependenciesApi.useGetProjectDependencies(
    selectedProject?.id
  );

  // Fetch pacing suggestions
  const { data: pacingSuggestions = [] } = beatPacingApi.useGetProjectPacingSuggestions(
    selectedProject?.id,
    false // Only show unapplied suggestions
  );

  // Auto-layout beats if they don't have positions
  useEffect(() => {
    if (!beats.length) return;

    const beatsNeedingLayout = beats.filter(
      (b) => b.x_position === undefined || b.y_position === undefined
    );

    if (beatsNeedingLayout.length > 0) {
      // Simple horizontal flow layout
      const spacing = 250;
      const verticalSpacing = 150;
      const columns = 4;

      beatsNeedingLayout.forEach((beat, index) => {
        const col = index % columns;
        const row = Math.floor(index / columns);
        const x = col * spacing + 100;
        const y = row * verticalSpacing + 100;

        onBeatUpdate(beat.id, {
          x_position: x,
          y_position: y,
        });
      });
    }
  }, [beats, onBeatUpdate]);

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.3));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Pan controls
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Middle mouse or Alt+Left mouse
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isPanning) {
        setPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      }
    },
    [isPanning, panStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPanning, handleMouseMove, handleMouseUp]);

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((z) => Math.max(0.3, Math.min(3, z + delta)));
    }
  };

  // Beat drag handlers
  const handleBeatDragStart = (beatId: string) => {
    setDraggedBeat(beatId);
    setSelectedBeat(beatId);
  };

  const handleBeatDrag = (beatId: string, x: number, y: number) => {
    onBeatUpdate(beatId, {
      x_position: x,
      y_position: y,
    });
  };

  const handleBeatDragEnd = () => {
    setDraggedBeat(null);
  };

  const handleBeatClick = (beatId: string) => {
    setSelectedBeat(beatId === selectedBeat ? null : beatId);
  };

  return (
    <div className="relative w-full h-[calc(100vh-250px)] overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="flex gap-2 bg-gray-900/80 backdrop-blur-sm rounded-lg p-2 border border-gray-800">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleZoomIn}
            data-testid="narrative-map-zoom-in-btn"
            title="Zoom In (Ctrl+Wheel)"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleZoomOut}
            data-testid="narrative-map-zoom-out-btn"
            title="Zoom Out (Ctrl+Wheel)"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleResetView}
            data-testid="narrative-map-reset-view-btn"
            title="Reset View"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2 bg-gray-900/80 backdrop-blur-sm rounded-lg p-2 border border-gray-800">
          <Button
            size="sm"
            variant={showGrid ? 'primary' : 'secondary'}
            onClick={() => setShowGrid(!showGrid)}
            data-testid="narrative-map-toggle-grid-btn"
            title="Toggle Grid"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={showPacing ? 'primary' : 'secondary'}
            onClick={() => setShowPacing(!showPacing)}
            data-testid="narrative-map-toggle-pacing-btn"
            title="Toggle AI Pacing Suggestions"
          >
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-2 border border-gray-800 text-xs text-gray-400">
          <div>Zoom: {(zoom * 100).toFixed(0)}%</div>
          <div className="text-[10px] mt-1">
            Alt+Drag to pan
            <br />
            Ctrl+Wheel to zoom
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="w-full h-full cursor-move"
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        data-testid="narrative-map-canvas"
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out',
          }}
          className="relative w-full h-full"
        >
          {/* Grid */}
          {showGrid && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <pattern
                  id="grid"
                  width="50"
                  height="50"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 50 0 L 0 0 0 50"
                    fill="none"
                    stroke="rgba(255,255,255,0.03)"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          )}

          {/* Dependency Links */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: '5000px', height: '5000px' }}
          >
            {dependencies.map((dep) => {
              const sourceBeat = beats.find((b) => b.id === dep.source_beat_id);
              const targetBeat = beats.find((b) => b.id === dep.target_beat_id);

              if (!sourceBeat || !targetBeat) return null;

              return (
                <DependencyLink
                  key={dep.id}
                  dependency={dep}
                  sourceX={sourceBeat.x_position || 0}
                  sourceY={sourceBeat.y_position || 0}
                  targetX={targetBeat.x_position || 0}
                  targetY={targetBeat.y_position || 0}
                  isHighlighted={
                    selectedBeat === dep.source_beat_id ||
                    selectedBeat === dep.target_beat_id
                  }
                />
              );
            })}
          </svg>

          {/* Beat Nodes */}
          {beats.map((beat) => (
            <BeatNode
              key={beat.id}
              beat={beat}
              x={beat.x_position || 0}
              y={beat.y_position || 0}
              isSelected={selectedBeat === beat.id}
              isDragging={draggedBeat === beat.id}
              onDragStart={() => handleBeatDragStart(beat.id)}
              onDrag={handleBeatDrag}
              onDragEnd={handleBeatDragEnd}
              onClick={() => handleBeatClick(beat.id)}
              dependencies={dependencies.filter(
                (d) => d.source_beat_id === beat.id || d.target_beat_id === beat.id
              )}
              zoom={zoom}
            />
          ))}
        </div>
      </div>

      {/* Gantt Timeline Overlay */}
      {showGantt && (
        <GanttTimeline
          beats={beats}
          dependencies={dependencies}
          onBeatClick={handleBeatClick}
          selectedBeat={selectedBeat}
        />
      )}

      {/* AI Pacing Suggestions Panel */}
      {showPacing && pacingSuggestions.length > 0 && (
        <PacingSuggestions
          suggestions={pacingSuggestions}
          beats={beats}
          onApplySuggestion={(suggestion) => {
            // Apply the suggestion
            if (suggestion.suggestion_type === 'reorder' && suggestion.suggested_order !== undefined) {
              onReorder(suggestion.beat_id, suggestion.suggested_order);
            } else if (
              suggestion.suggestion_type === 'adjust_duration' &&
              suggestion.suggested_duration !== undefined
            ) {
              onBeatUpdate(suggestion.beat_id, {
                estimated_duration: suggestion.suggested_duration,
              });
            }
            // Mark as applied
            beatPacingApi.updatePacingSuggestion(suggestion.id, true);
          }}
          onDismissSuggestion={(id) => {
            beatPacingApi.deletePacingSuggestion(id);
          }}
        />
      )}
    </div>
  );
};

export default NarrativeMap;
