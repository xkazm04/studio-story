/**
 * ArtStyleExtractor Component
 * AI-powered style extraction from uploaded images with multi-stage progress
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Upload,
  Palette,
  Layout,
  Dna,
  Loader2,
} from 'lucide-react';
import { Button } from '@/app/components/UI/Button';
import { Label } from '@/app/components/UI/Label';
import { ImageUploadArea } from './ImageUploadArea';
import { extractData } from '@/app/utils/api';

// ============================================================================
// Extraction stage types
// ============================================================================

type ExtractionStage = 'uploading' | 'colors' | 'composition' | 'dna';

interface StageConfig {
  id: ExtractionStage;
  label: string;
  icon: React.ElementType;
  /** Minimum ms before auto-advancing to next simulated stage */
  minDuration: number;
}

const STAGES: StageConfig[] = [
  { id: 'uploading', label: 'Uploading image', icon: Upload, minDuration: 400 },
  { id: 'colors', label: 'Analyzing colors', icon: Palette, minDuration: 800 },
  { id: 'composition', label: 'Detecting composition', icon: Layout, minDuration: 1200 },
  { id: 'dna', label: 'Generating DNA profile', icon: Dna, minDuration: 0 },
];

interface ExtractionResult {
  prompt: string;
  technique?: string;
  colorPalette?: string[];
  mood?: string;
  lighting?: string;
  detailLevel?: string;
  influences?: string[];
}

// ============================================================================
// Sub-components
// ============================================================================

interface StageIndicatorProps {
  stages: StageConfig[];
  currentStageIndex: number;
  done: boolean;
}

function StageIndicator({ stages, currentStageIndex, done }: StageIndicatorProps) {
  return (
    <div className="space-y-1.5">
      {stages.map((stage, idx) => {
        const isComplete = idx < currentStageIndex || done;
        const isActive = idx === currentStageIndex && !done;
        const isPending = idx > currentStageIndex && !done;
        const Icon = stage.icon;

        return (
          <div
            key={stage.id}
            className={cn(
              'flex items-center gap-2 px-2 py-1 rounded transition-all duration-200',
              isActive && 'bg-cyan-500/10',
            )}
          >
            <div className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200',
              isComplete && 'bg-emerald-500/20',
              isActive && 'bg-cyan-500/20',
              isPending && 'bg-slate-800',
            )}>
              {isComplete ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : isActive ? (
                <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
              ) : (
                <Icon className="w-3 h-3 text-slate-500" />
              )}
            </div>
            <span className={cn(
              'text-xs transition-colors duration-200',
              isComplete && 'text-emerald-400',
              isActive && 'text-cyan-300',
              isPending && 'text-slate-500',
            )}>
              {stage.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Best-effort CSS color from a natural language color name */
function cssColor(name: string): string {
  const lower = name.toLowerCase().trim();
  const map: Record<string, string> = {
    red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308',
    orange: '#f97316', purple: '#a855f7', pink: '#ec4899', cyan: '#06b6d4',
    white: '#f8fafc', black: '#0f172a', gray: '#64748b', grey: '#64748b',
    brown: '#92400e', gold: '#ca8a04', silver: '#94a3b8', teal: '#14b8a6',
    indigo: '#6366f1', violet: '#8b5cf6', magenta: '#d946ef', lime: '#84cc16',
    navy: '#1e3a5f', coral: '#f97171', beige: '#d4c9a8', cream: '#fffdd0',
    maroon: '#800000', olive: '#808000', salmon: '#fa8072', turquoise: '#40e0d0',
    amber: '#f59e0b', emerald: '#10b981', rose: '#f43f5e', slate: '#64748b',
    warm: '#f59e0b', cool: '#3b82f6', dark: '#1e293b', light: '#e2e8f0',
    deep: '#312e81', muted: '#94a3b8', pastel: '#fce7f3', earth: '#78716c',
    rust: '#b45309',
  };
  for (const [key, hex] of Object.entries(map)) {
    if (lower.includes(key)) return hex;
  }
  return '#64748b';
}

interface PartialPreviewProps {
  currentStageIndex: number;
  result: ExtractionResult | null;
}

function PartialPreview({ currentStageIndex, result }: PartialPreviewProps) {
  // Colors appear after "Analyzing colors" completes (index >= 2)
  const showColors = currentStageIndex >= 2 && result?.colorPalette && result.colorPalette.length > 0;
  // Mood/lighting appear after "Detecting composition" completes (index >= 3)
  const showComposition = currentStageIndex >= 3 && (result?.mood || result?.lighting);
  // Technique/influences appear when fully done (index >= 4 or STAGES.length)
  const showDna = currentStageIndex >= STAGES.length && (result?.technique || result?.influences);

  if (!showColors && !showComposition && !showDna) return null;

  return (
    <div className="space-y-2 mt-2 pt-2 border-t border-slate-800/50">
      {showColors && (
        <div className="animate-fade-in">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 block">Palette</span>
          <div className="flex gap-1">
            {result!.colorPalette!.map((color, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className="w-full h-5 rounded-sm border border-slate-700/50"
                  style={{ backgroundColor: cssColor(color) }}
                />
                <span className="text-[9px] text-slate-500 truncate max-w-full">{color}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showComposition && (
        <div className="flex gap-3 animate-fade-in">
          {result?.mood && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Mood</span>
              <span className="text-xs text-slate-300">{result.mood}</span>
            </div>
          )}
          {result?.lighting && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Lighting</span>
              <span className="text-xs text-slate-300">{result.lighting}</span>
            </div>
          )}
          {result?.detailLevel && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Detail</span>
              <span className="text-xs text-slate-300">{result.detailLevel}</span>
            </div>
          )}
        </div>
      )}

      {showDna && (
        <div className="space-y-1 animate-fade-in">
          {result?.technique && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Technique</span>
              <span className="text-xs text-slate-300">{result.technique}</span>
            </div>
          )}
          {result?.influences && result.influences.length > 0 && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Influences</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {result.influences.map((inf, i) => (
                  <span key={i} className="px-1.5 py-0.5 text-[10px] bg-slate-800 rounded text-slate-400 border border-slate-700/50">
                    {inf}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main component
// ============================================================================

interface ArtStyleExtractorProps {
  customPrompt: string | null;
  extractedImageUrl: string | null;
  onExtract: (imageUrl: string, prompt: string) => void;
  onCustomPromptChange: (prompt: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

export function ArtStyleExtractor({
  customPrompt,
  extractedImageUrl,
  onExtract,
  onCustomPromptChange,
  onClear,
  disabled = false,
}: ArtStyleExtractorProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(
    extractedImageUrl
  );
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const stageTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Auto-resize textarea to show all content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(150, textarea.scrollHeight)}px`;
    }
  }, [customPrompt]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      stageTimers.current.forEach(clearTimeout);
    };
  }, []);

  const handleCopyToClipboard = async () => {
    if (!customPrompt) return;
    try {
      await navigator.clipboard.writeText(customPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = customPrompt;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /**
   * Start the simulated stage progression.
   * Stages advance on minDuration timers. The final stage stays
   * spinning until the real API response arrives.
   */
  const startStageProgression = useCallback(() => {
    stageTimers.current.forEach(clearTimeout);
    stageTimers.current = [];
    setStageIndex(0);

    let elapsed = 0;
    for (let i = 0; i < STAGES.length - 1; i++) {
      elapsed += STAGES[i].minDuration;
      const nextIndex = i + 1;
      const timer = setTimeout(() => setStageIndex(nextIndex), elapsed);
      stageTimers.current.push(timer);
    }
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Image must be less than 10MB');
        return;
      }

      setError(null);
      setIsExtracting(true);
      setExtractionResult(null);
      startStageProgression();

      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64Url = e.target?.result as string;
          setUploadedImageUrl(base64Url);

          // Advance past 'uploading' immediately since file is read locally
          setStageIndex((prev) => Math.max(prev, 1));

          try {
            const response = await fetch('/api/ai/art-style/extract', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageUrl: base64Url }),
            });

            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || 'Failed to extract art style');
            }

            const data = extractData<Record<string, unknown>>(await response.json());
            const result: ExtractionResult = {
              prompt: (data.prompt as string) || '',
              technique: data.technique as string | undefined,
              colorPalette: data.colorPalette as string[] | undefined,
              mood: data.mood as string | undefined,
              lighting: data.lighting as string | undefined,
              detailLevel: data.detailLevel as string | undefined,
              influences: data.influences as string[] | undefined,
            };

            // Stop timers and store result, then reveal stages progressively
            stageTimers.current.forEach(clearTimeout);
            setExtractionResult(result);

            // Rapidly reveal remaining stages so partials animate in order
            const currentIdx = stageIndex;
            const remaining = STAGES.length - currentIdx;
            for (let i = 0; i < remaining; i++) {
              const timer = setTimeout(() => {
                setStageIndex(currentIdx + i + 1);
              }, i * 300);
              stageTimers.current.push(timer);
            }

            // Mark done after all stages reveal
            const doneTimer = setTimeout(() => {
              setIsExtracting(false);
              onExtract(base64Url, result.prompt);
            }, remaining * 300 + 100);
            stageTimers.current.push(doneTimer);
          } catch (err) {
            stageTimers.current.forEach(clearTimeout);
            setError(
              err instanceof Error ? err.message : 'Failed to extract art style'
            );
            setUploadedImageUrl(null);
            setIsExtracting(false);
            setExtractionResult(null);
          }
        };
        reader.readAsDataURL(file);
      } catch (err) {
        stageTimers.current.forEach(clearTimeout);
        setError(
          err instanceof Error ? err.message : 'Failed to extract art style'
        );
        setUploadedImageUrl(null);
        setIsExtracting(false);
        setExtractionResult(null);
      }
    },
    [onExtract, startStageProgression, stageIndex]
  );

  const handleClear = useCallback(() => {
    setUploadedImageUrl(null);
    setError(null);
    setExtractionResult(null);
    setStageIndex(0);
    stageTimers.current.forEach(clearTimeout);
    onClear();
  }, [onClear]);

  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-400" />
        Custom Art Style
      </Label>

      {/* Image Upload Area */}
      <ImageUploadArea
        onFileSelect={handleFileSelect}
        isLoading={isExtracting}
        disabled={disabled}
        error={error}
        uploadedImageUrl={uploadedImageUrl}
        onClear={handleClear}
        uploadLabel={isExtracting ? 'Extracting art style...' : 'Upload an image'}
        uploadHint="Drop image here or click to browse"
        previewLabel="Style Reference"
      />

      {/* Multi-stage progress indicator — visible during extraction */}
      {isExtracting && (
        <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3 animate-fade-in">
          <StageIndicator
            stages={STAGES}
            currentStageIndex={stageIndex}
            done={false}
          />
          <PartialPreview
            currentStageIndex={stageIndex}
            result={extractionResult}
          />
        </div>
      )}

      {/* Completed extraction summary — persists after extraction finishes */}
      {!isExtracting && extractionResult && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 animate-fade-in">
          <div className="flex items-center gap-1.5 mb-1">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-300">Extraction complete</span>
          </div>
          <PartialPreview
            currentStageIndex={STAGES.length}
            result={extractionResult}
          />
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Custom Prompt Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-slate-400">
            {uploadedImageUrl
              ? 'Extracted Style (editable)'
              : 'Or write custom style prompt'}
          </Label>
          <div className="flex items-center gap-1">
            {customPrompt && (
              <>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleCopyToClipboard}
                  disabled={disabled}
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 mr-1 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleClear}
                  disabled={disabled}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Reset
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={customPrompt || ''}
            onChange={(e) => onCustomPromptChange(e.target.value)}
            placeholder="Describe the visual art style you want for all scene images..."
            className={cn(
              'w-full min-h-[150px] px-3 py-2 text-sm rounded-md relative z-10',
              'bg-slate-800/60 border border-slate-700',
              'text-slate-200 placeholder:text-slate-500',
              'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'resize-none overflow-hidden'
            )}
            disabled={disabled || isExtracting}
          />
        </div>
        <p className="ms-caption">
          This style will be applied to all scene images in your story
        </p>
      </div>
    </div>
  );
}
