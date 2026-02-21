'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RefreshCw,
  Maximize2,
  Pin,
  PinOff,
  Download,
  Copy,
  Eye,
  EyeOff,
  Zap,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import {
  realTimeEngine,
  type GenerationResult,
  type GenerationStatus,
  type GenerationQuality,
  type ProgressInfo,
  type StyleParameters,
} from '@/lib/sketch';
import { cn } from '@/app/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface RealTimePreviewProps {
  sketchCanvas: HTMLCanvasElement | null;
  prompt: string;
  style: StyleParameters;
  autoGenerate?: boolean;
  onResultSelect?: (result: GenerationResult) => void;
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getQualityLabel(quality: GenerationQuality): string {
  switch (quality) {
    case 'draft':
      return 'Draft';
    case 'preview':
      return 'Preview';
    case 'standard':
      return 'Standard';
    case 'high':
      return 'High Quality';
    default:
      return quality;
  }
}

function getQualityColor(quality: GenerationQuality): string {
  switch (quality) {
    case 'draft':
      return 'text-yellow-400';
    case 'preview':
      return 'text-blue-400';
    case 'standard':
      return 'text-green-400';
    case 'high':
      return 'text-purple-400';
    default:
      return 'text-slate-400';
  }
}

function getStatusColor(status: GenerationStatus): string {
  switch (status) {
    case 'idle':
      return 'text-slate-400';
    case 'pending':
      return 'text-yellow-400';
    case 'generating':
      return 'text-blue-400';
    case 'complete':
      return 'text-green-400';
    case 'error':
      return 'text-red-400';
    default:
      return 'text-slate-400';
  }
}

function getConfidenceLabel(confidence: number): { label: string; color: string } {
  if (confidence >= 0.9) return { label: 'Excellent', color: 'text-green-400' };
  if (confidence >= 0.75) return { label: 'Good', color: 'text-blue-400' };
  if (confidence >= 0.5) return { label: 'Fair', color: 'text-yellow-400' };
  return { label: 'Low', color: 'text-orange-400' };
}

// ============================================================================
// Sub-components
// ============================================================================

interface ProgressBarProps {
  progress: ProgressInfo;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400 capitalize">{progress.stage}</span>
        <span className={cn('text-[10px]', getQualityColor(progress.currentQuality))}>
          {getQualityLabel(progress.currentQuality)}
        </span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress.progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      {progress.estimatedTimeRemaining && (
        <div className="flex items-center gap-1 text-[10px] text-slate-500">
          <Clock className="w-3 h-3" />
          <span>~{Math.ceil(progress.estimatedTimeRemaining / 1000)}s remaining</span>
        </div>
      )}
    </div>
  );
};

interface PreviewImageProps {
  result: GenerationResult;
  isSelected: boolean;
  onSelect: () => void;
  onPin: () => void;
  onDownload: () => void;
}

const PreviewImage: React.FC<PreviewImageProps> = ({
  result,
  isSelected,
  onSelect,
  onPin,
  onDownload,
}) => {
  const confidenceInfo = getConfidenceLabel(result.confidence);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer',
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/30'
          : 'border-slate-700 hover:border-slate-600'
      )}
      onClick={onSelect}
    >
      {/* Image */}
      <img
        src={result.imageUrl}
        alt={`Generated preview - ${result.quality}`}
        className="w-full aspect-square object-cover bg-slate-900"
      />

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className={cn('text-[10px]', getQualityColor(result.quality))}>
                {getQualityLabel(result.quality)}
              </span>
              <span className="text-[10px] text-slate-500">•</span>
              <span className={cn('text-[10px]', confidenceInfo.color)}>
                {Math.round(result.confidence * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPin();
                }}
                className={cn(
                  'p-1 rounded transition-colors',
                  result.isPinned
                    ? 'text-yellow-400 bg-yellow-500/20'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                {result.isPinned ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload();
                }}
                className="p-1 text-slate-400 hover:text-white rounded transition-colors"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pinned indicator */}
      {result.isPinned && (
        <div className="absolute top-1 right-1 p-1 bg-yellow-500/20 rounded">
          <Pin className="w-3 h-3 text-yellow-400" />
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const RealTimePreview: React.FC<RealTimePreviewProps> = ({
  sketchCanvas,
  prompt,
  style,
  autoGenerate = true,
  onResultSelect,
  className,
}) => {
  // State
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<GenerationResult | null>(null);
  const [isAutoEnabled, setIsAutoEnabled] = useState(autoGenerate);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<GenerationResult | null>(null);

  const lastSketchHash = useRef<string>('');

  // Setup engine callbacks
  useEffect(() => {
    realTimeEngine.onStatusChangeCallback((newStatus) => {
      setStatus(newStatus);
    });

    realTimeEngine.onProgressCallback((progressInfo) => {
      setProgress(progressInfo);
    });

    realTimeEngine.onResultCallback((result) => {
      setResults((prev) => {
        // Keep only latest results per quality level, up to 8 total
        const updated = [...prev, result];
        if (updated.length > 8) {
          // Keep pinned results
          const pinned = updated.filter((r) => r.isPinned);
          const unpinned = updated.filter((r) => !r.isPinned);
          return [...pinned, ...unpinned.slice(-Math.max(8 - pinned.length, 1))];
        }
        return updated;
      });

      // Auto-select latest result
      if (!selectedResult || result.quality === 'high' || result.quality === 'standard') {
        setSelectedResult(result);
        onResultSelect?.(result);
      }
    });

    realTimeEngine.onErrorCallback((error) => {
      console.error('Generation error:', error);
    });

    return () => {
      realTimeEngine.cancelGeneration();
    };
  }, [onResultSelect, selectedResult]);

  // Generate when sketch or style changes (if auto enabled)
  useEffect(() => {
    if (!isAutoEnabled || !sketchCanvas || !prompt) return;

    // Get sketch data
    const sketchData = sketchCanvas.toDataURL('image/png');
    const currentHash = sketchData.slice(-100); // Simple hash

    // Only regenerate if sketch actually changed
    if (currentHash === lastSketchHash.current) return;
    lastSketchHash.current = currentHash;

    // Update engine style
    realTimeEngine.setStyle(style);

    // Request generation with debounce
    realTimeEngine.requestGeneration(sketchData, prompt);
  }, [sketchCanvas, prompt, style, isAutoEnabled]);

  // Handlers
  const handleManualGenerate = useCallback(() => {
    if (!sketchCanvas || !prompt) return;

    const sketchData = sketchCanvas.toDataURL('image/png');
    realTimeEngine.setStyle(style);
    realTimeEngine.requestGeneration(sketchData, prompt, { immediate: true });
  }, [sketchCanvas, prompt, style]);

  const handleCancel = useCallback(() => {
    realTimeEngine.cancelGeneration();
  }, []);

  const handleSelectResult = useCallback(
    (result: GenerationResult) => {
      setSelectedResult(result);
      onResultSelect?.(result);
    },
    [onResultSelect]
  );

  const handlePinResult = useCallback((result: GenerationResult) => {
    if (result.isPinned) {
      realTimeEngine.unpinResult(result.id);
    } else {
      realTimeEngine.pinResult(result.id);
    }
    setResults((prev) =>
      prev.map((r) => (r.id === result.id ? { ...r, isPinned: !r.isPinned } : r))
    );
  }, []);

  const handleDownloadResult = useCallback((result: GenerationResult) => {
    const link = document.createElement('a');
    link.download = `sketch_preview_${result.id}.png`;
    link.href = result.imageUrl;
    link.click();
  }, []);

  const handleCompare = useCallback((result: GenerationResult) => {
    if (comparisonResult?.id === result.id) {
      setShowComparison(false);
      setComparisonResult(null);
    } else {
      setComparisonResult(result);
      setShowComparison(true);
    }
  }, [comparisonResult]);

  const handleClearResults = useCallback(() => {
    realTimeEngine.clearResults(true);
    setResults(realTimeEngine.getResults());
    setSelectedResult(null);
  }, []);

  // Render status icon
  const StatusIcon = () => {
    switch (status) {
      case 'idle':
        return <Play className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4 animate-pulse" />;
      case 'generating':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'complete':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-medium text-slate-200">Real-Time Preview</span>
          <div className={cn('flex items-center gap-1 text-[10px]', getStatusColor(status))}>
            <StatusIcon />
            <span className="capitalize">{status}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsAutoEnabled(!isAutoEnabled)}
            className={cn(
              'p-1.5 rounded transition-colors',
              isAutoEnabled
                ? 'bg-green-500/20 text-green-400'
                : 'bg-slate-700/50 text-slate-400'
            )}
            title={isAutoEnabled ? 'Auto-generate enabled' : 'Auto-generate disabled'}
          >
            {isAutoEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          {status === 'generating' ? (
            <button
              onClick={handleCancel}
              className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              title="Cancel generation"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleManualGenerate}
              disabled={!sketchCanvas || !prompt}
              className={cn(
                'p-1.5 rounded transition-colors',
                sketchCanvas && prompt
                  ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                  : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
              )}
              title="Generate now"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {progress && status === 'generating' && <ProgressBar progress={progress} />}

      {/* Main Preview */}
      <div className="relative aspect-square bg-slate-900 rounded-lg overflow-hidden border border-slate-700/50">
        {selectedResult ? (
          <>
            <img
              src={selectedResult.imageUrl}
              alt="Selected preview"
              className="w-full h-full object-contain"
            />
            {/* Overlay info */}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-slate-900/90 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs', getQualityColor(selectedResult.quality))}>
                    {getQualityLabel(selectedResult.quality)}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {Math.round(selectedResult.confidence * 100)}% confidence
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>{selectedResult.processingTime}ms</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <Zap className="w-10 h-10 text-slate-700 mb-2" />
            <p className="text-xs text-slate-500">
              {prompt ? 'Draw on the canvas to see real-time previews' : 'Add a prompt to enable preview generation'}
            </p>
          </div>
        )}

        {/* Comparison overlay */}
        <AnimatePresence>
          {showComparison && comparisonResult && selectedResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex"
            >
              <div className="w-1/2 h-full overflow-hidden border-r border-white/50">
                <img
                  src={selectedResult.imageUrl}
                  alt="Current"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/80 rounded text-[10px] text-slate-300">
                  Current
                </div>
              </div>
              <div className="w-1/2 h-full overflow-hidden">
                <img
                  src={comparisonResult.imageUrl}
                  alt="Comparison"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-slate-900/80 rounded text-[10px] text-slate-300">
                  Comparison
                </div>
              </div>
              <button
                onClick={() => setShowComparison(false)}
                className="absolute top-2 right-2 p-1 bg-slate-900/80 rounded text-slate-300 hover:text-white"
              >
                <EyeOff className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Gallery */}
      {results.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
              Results ({results.length})
            </span>
            <button
              onClick={handleClearResults}
              className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {results.slice(-8).map((result) => (
              <PreviewImage
                key={result.id}
                result={result}
                isSelected={selectedResult?.id === result.id}
                onSelect={() => handleSelectResult(result)}
                onPin={() => handlePinResult(result)}
                onDownload={() => handleDownloadResult(result)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {selectedResult && (
        <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[10px]">
              <TrendingUp className="w-3 h-3 text-green-400" />
              <span className="text-slate-400">Quality:</span>
              <span className={getQualityColor(selectedResult.quality)}>
                {getQualityLabel(selectedResult.quality)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <span className="text-slate-400">Seed:</span>
              <span className="text-slate-300 font-mono">
                {selectedResult.metadata?.seed}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              if (selectedResult.metadata?.seed) {
                navigator.clipboard.writeText(String(selectedResult.metadata.seed));
              }
            }}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
            title="Copy seed"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default RealTimePreview;
