/**
 * SceneSketchPanel Component
 * Compact image generation panel for scene sketching
 */

'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import {
  Sparkles,
  Loader2,
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  RefreshCw,
  Upload,
  FileText,
  X,
  Pencil,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/UI/Button';
import { Label } from '@/app/components/UI/Label';
import { deleteGenerations } from '@/lib/services/sketchCleanup';
import {
  MAX_PROMPT_LENGTH,
  MIN_PROMPT_LENGTH,
  SCENE_WIDTH,
  SCENE_HEIGHT,
  MOOD_OPTIONS,
  type GeneratedImage,
  type SketchMode,
  type MoodOption,
} from '../lib/sketchGeneration';

interface SceneSketchPanelProps {
  /** Story content for generating image description */
  storyContent: string;
  /** Current saved image URL */
  imageUrl: string | null;
  /** Current saved image prompt */
  imagePrompt: string | null;
  /** Art style prompt to apply */
  artStylePrompt?: string;
  /** Callback when image is selected */
  onImageSelect: (imageUrl: string, prompt: string) => void;
  /** Callback when image is removed */
  onRemoveImage: () => void;
  /** Whether saving is in progress */
  isSaving: boolean;
}

/**
 * SceneSketchPanel - Compact image generation panel
 *
 * Two modes for sketching scenes:
 * 1. Custom Prompt - User enters their own description (100-1500 chars)
 * 2. From Narrative - Auto-generates description from story content
 *
 * Features:
 * - Art style integration
 * - Optional mood enhancement
 * - Phoenix 1.0 model always
 * - Fixed 1184x672 widescreen sizing
 */
export function SceneSketchPanel({
  storyContent,
  imageUrl,
  imagePrompt,
  artStylePrompt = '',
  onImageSelect,
  onRemoveImage,
  isSaving,
}: SceneSketchPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [sketchMode, setSketchMode] = useState<SketchMode>('custom');
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [moodExpanded, setMoodExpanded] = useState(false);
  const [extractorExpanded, setExtractorExpanded] = useState(false);
  const [sketches, setSketches] = useState<GeneratedImage[]>([]);
  const [selectedSketchIndex, setSelectedSketchIndex] = useState<number | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationIds, setGenerationIds] = useState<string[]>([]);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  // Validation for custom prompt mode
  const customPromptLength = customPrompt.trim().length;
  const isCustomPromptValid =
    customPromptLength >= MIN_PROMPT_LENGTH &&
    customPromptLength <= MAX_PROMPT_LENGTH;
  const isCustomPromptTooShort =
    customPromptLength > 0 && customPromptLength < MIN_PROMPT_LENGTH;
  const isCustomPromptTooLong = customPromptLength > MAX_PROMPT_LENGTH;

  // Validation for narrative mode - needs story content
  const hasStoryContent = (storyContent?.trim()?.length || 0) > 20;

  /**
   * Handle file selection for content extraction
   */
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Url = e.target?.result as string;
        setUploadedImageUrl(base64Url);

        // Call API to extract scene breakdown
        const response = await fetch('/api/ai/scene-breakdown', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: base64Url }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to extract scene description');
        }

        const data = await response.json();

        // Populate custom prompt with extracted description
        if (data.breakdown) {
          const truncated = data.breakdown.slice(0, MAX_PROMPT_LENGTH);
          setCustomPrompt(truncated);
          setSketchMode('custom');
        }

        setIsExtracting(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to extract scene description'
      );
      setUploadedImageUrl(null);
      setIsExtracting(false);
    }
  };

  /**
   * Handle extracting from current scene image
   */
  const handleExtractFromCurrent = async () => {
    if (!imageUrl) return;

    setError(null);
    setIsExtracting(true);
    setUploadedImageUrl(imageUrl);

    try {
      const response = await fetch('/api/ai/scene-breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to extract scene description');
      }

      const data = await response.json();

      if (data.breakdown) {
        const truncated = data.breakdown.slice(0, MAX_PROMPT_LENGTH);
        setCustomPrompt(truncated);
        setSketchMode('custom');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to extract scene description'
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      const fakeEvent = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      await handleFileSelect(fakeEvent);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleClearExtraction = () => {
    setUploadedImageUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Generate sketches from custom prompt
   */
  const handleSketchFromCustomPrompt = useCallback(async () => {
    if (!isCustomPromptValid) return;

    setIsGenerating(true);
    setError(null);
    setSketches([]);
    setSelectedSketchIndex(null);

    try {
      // Step 1: Generate image prompt from custom description
      const promptResponse = await fetch('/api/ai/scene-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentDescription: customPrompt.trim(),
          artStylePrompt: artStylePrompt || undefined,
          moodPrompt: selectedMood?.prompt || undefined,
        }),
      });

      if (!promptResponse.ok) {
        const errorData = await promptResponse.json();
        throw new Error(errorData.error || 'Failed to generate image prompt');
      }

      const promptData = await promptResponse.json();
      const imagePromptText = promptData.prompt;

      if (!imagePromptText) {
        throw new Error('No image prompt generated');
      }

      // Step 2: Generate variations
      const variationResponse = await fetch('/api/ai/prompt-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePromptText, count: 3 }),
      });

      if (!variationResponse.ok) {
        const errorData = await variationResponse.json();
        throw new Error(errorData.error || 'Failed to generate variations');
      }

      const variationData = await variationResponse.json();
      const variations = variationData.variations || [
        { variation: imagePromptText },
      ];

      // Step 3: Generate images
      const sketchPromises = variations
        .slice(0, 3)
        .map(async (variation: { variation: string }, index: number) => {
          const response = await fetch('/api/ai/generate-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: variation.variation,
              numImages: 1,
              width: SCENE_WIDTH,
              height: SCENE_HEIGHT,
              model: 'phoenix_1.0',
            }),
          });

          if (!response.ok) {
            console.error(`Failed to generate sketch ${index + 1}`);
            return null;
          }

          const data = await response.json();
          const image = data.images?.[0];
          return image
            ? ({
                ...image,
                prompt: variation.variation,
                generationId: data.generationId,
                imageId: image.id,
              } as GeneratedImage)
            : null;
        });

      const results = await Promise.all(sketchPromises);
      const validSketches = results.filter(
        (s): s is GeneratedImage => s !== null
      );

      if (validSketches.length === 0) {
        throw new Error('Failed to generate any sketches');
      }

      setSketches(validSketches);
      const ids = validSketches
        .map((s) => s.generationId)
        .filter((id): id is string => !!id);
      setGenerationIds(ids);
    } catch (err) {
      console.error('Error generating sketches:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate sketches');
    } finally {
      setIsGenerating(false);
    }
  }, [customPrompt, isCustomPromptValid, artStylePrompt, selectedMood]);

  /**
   * Generate sketches from narrative (simplified - uses story content directly)
   */
  const handleSketchFromNarrative = useCallback(async () => {
    if (!hasStoryContent) return;

    setIsGenerating(true);
    setError(null);
    setSketches([]);
    setSelectedSketchIndex(null);

    try {
      // Generate image prompt from story content
      const promptResponse = await fetch('/api/ai/scene-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentDescription: storyContent.trim().slice(0, MAX_PROMPT_LENGTH),
          artStylePrompt: artStylePrompt || undefined,
          moodPrompt: selectedMood?.prompt || undefined,
        }),
      });

      if (!promptResponse.ok) {
        const errorData = await promptResponse.json();
        throw new Error(errorData.error || 'Failed to generate image prompt');
      }

      const promptData = await promptResponse.json();
      const imagePromptText = promptData.prompt;

      if (!imagePromptText) {
        throw new Error('No image prompt generated');
      }

      // Generate variations
      const variationResponse = await fetch('/api/ai/prompt-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePromptText, count: 3 }),
      });

      if (!variationResponse.ok) {
        const errorData = await variationResponse.json();
        throw new Error(errorData.error || 'Failed to generate variations');
      }

      const variationData = await variationResponse.json();
      const variations = variationData.variations || [
        { variation: imagePromptText },
      ];

      // Generate images
      const sketchPromises = variations
        .slice(0, 3)
        .map(async (variation: { variation: string }, index: number) => {
          const response = await fetch('/api/ai/generate-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: variation.variation,
              numImages: 1,
              width: SCENE_WIDTH,
              height: SCENE_HEIGHT,
              model: 'phoenix_1.0',
            }),
          });

          if (!response.ok) {
            console.error(`Failed to generate sketch ${index + 1}`);
            return null;
          }

          const data = await response.json();
          const image = data.images?.[0];
          return image
            ? ({
                ...image,
                prompt: variation.variation,
                generationId: data.generationId,
                imageId: image.id,
              } as GeneratedImage)
            : null;
        });

      const results = await Promise.all(sketchPromises);
      const validSketches = results.filter(
        (s): s is GeneratedImage => s !== null
      );

      if (validSketches.length === 0) {
        throw new Error('Failed to generate any sketches');
      }

      setSketches(validSketches);
      const ids = validSketches
        .map((s) => s.generationId)
        .filter((id): id is string => !!id);
      setGenerationIds(ids);
    } catch (err) {
      console.error('Error generating sketches:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate sketches');
    } finally {
      setIsGenerating(false);
    }
  }, [storyContent, hasStoryContent, artStylePrompt, selectedMood]);

  // Select and use a sketch
  const handleUseSketch = useCallback(() => {
    if (selectedSketchIndex === null || !sketches[selectedSketchIndex]) return;

    const sketch = sketches[selectedSketchIndex];
    onImageSelect(sketch.url, sketch.prompt || '');

    // Cleanup unused generations
    const selectedGenerationId = sketch.generationId;
    const unusedIds = generationIds.filter((id) => id !== selectedGenerationId);
    if (unusedIds.length > 0) {
      deleteGenerations(unusedIds);
    }

    // Reset state
    setSketches([]);
    setSelectedSketchIndex(null);
    setGenerationIds([]);
  }, [selectedSketchIndex, sketches, onImageSelect, generationIds]);

  // Start over - discard sketches
  const handleStartOver = useCallback(() => {
    if (generationIds.length > 0) {
      deleteGenerations(generationIds);
    }
    setSketches([]);
    setSelectedSketchIndex(null);
    setGenerationIds([]);
  }, [generationIds]);

  return (
    <div className="space-y-4">
      {/* Current Image Display */}
      {imageUrl && (
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-slate-400">
                Current Scene
              </Label>
              <Button
                size="xs"
                variant="ghost"
                onClick={onRemoveImage}
                disabled={isSaving}
                className="h-6 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Remove
              </Button>
            </div>

            <div className="relative rounded-lg overflow-hidden border-2 border-slate-700 bg-slate-800">
              <div className="aspect-[16/9]">
                <img
                  src={imageUrl}
                  alt="Scene image"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {imagePrompt && (
              <p className="text-[10px] text-slate-500 italic line-clamp-2">
                {imagePrompt}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Sketch Generation Section */}
      {sketches.length === 0 && (
        <div className="space-y-3">
          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSketchMode('custom')}
              disabled={isGenerating || isExtracting}
              className={cn(
                'flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all',
                sketchMode === 'custom'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 border border-slate-700'
              )}
            >
              <Pencil className="w-3.5 h-3.5" />
              Custom Prompt
            </button>
            <button
              onClick={() => setSketchMode('narrative')}
              disabled={isGenerating || isExtracting}
              className={cn(
                'flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all',
                sketchMode === 'narrative'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 border border-slate-700'
              )}
            >
              <BookOpen className="w-3.5 h-3.5" />
              From Narrative
            </button>
          </div>

          {/* Custom Prompt Mode */}
          {sketchMode === 'custom' && (
            <div className="space-y-3">
              {/* Content Extractor Section */}
              <div className="space-y-2">
                <button
                  onClick={() => setExtractorExpanded(!extractorExpanded)}
                  className="flex items-center justify-between w-full text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                  disabled={isGenerating || isExtracting}
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Extract from Image</span>
                  </span>
                  {extractorExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {extractorExpanded && (
                  <div className="space-y-2 p-2 bg-slate-800/50 rounded-lg border border-slate-700">
                    {!uploadedImageUrl ? (
                      <>
                        <div
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          className={cn(
                            'border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer',
                            'border-slate-600 hover:border-cyan-500/50 hover:bg-cyan-500/5',
                            isExtracting && 'opacity-50 cursor-not-allowed'
                          )}
                          onClick={() =>
                            !isExtracting && fileInputRef.current?.click()
                          }
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            disabled={isExtracting}
                          />
                          <div className="flex flex-col items-center gap-1.5">
                            {isExtracting ? (
                              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                            ) : (
                              <Upload className="w-5 h-5 text-slate-400" />
                            )}
                            <p className="text-[10px] text-slate-500">
                              {isExtracting
                                ? 'Extracting...'
                                : 'Drop image or click to upload'}
                            </p>
                          </div>
                        </div>

                        {imageUrl && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleExtractFromCurrent}
                            disabled={isExtracting}
                            className="w-full h-7 text-[10px]"
                          >
                            <Sparkles className="w-3 h-3 mr-1" />
                            Extract from Current Scene
                          </Button>
                        )}
                      </>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative rounded-lg border border-slate-700 overflow-hidden">
                          <img
                            src={uploadedImageUrl}
                            alt="Source for extraction"
                            className="w-full h-20 object-cover"
                          />
                          <button
                            onClick={handleClearExtraction}
                            className="absolute top-1 right-1 p-0.5 rounded-full bg-slate-900/80 hover:bg-slate-900"
                            disabled={isExtracting}
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {isExtracting && (
                            <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                              <Loader2 className="w-4 h-4 animate-spin" />
                            </div>
                          )}
                        </div>
                        {!isExtracting && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleClearExtraction}
                            className="w-full h-6 text-[10px]"
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Try Another Image
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Custom Prompt Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-slate-400">
                    Scene Description
                  </Label>
                  <span
                    className={cn(
                      'text-[10px]',
                      isCustomPromptTooLong
                        ? 'text-red-400'
                        : isCustomPromptTooShort
                          ? 'text-amber-400'
                          : 'text-slate-500'
                    )}
                  >
                    {customPromptLength}/{MAX_PROMPT_LENGTH}
                  </span>
                </div>
                <textarea
                  value={customPrompt}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= MAX_PROMPT_LENGTH) {
                      setCustomPrompt(value);
                    }
                  }}
                  placeholder="Describe the visual scene you want to generate (100-1500 characters)..."
                  disabled={isGenerating || isSaving || isExtracting}
                  className={cn(
                    'w-full min-h-[100px] px-3 py-2 text-xs rounded-md resize-none',
                    'bg-slate-800/60 border text-slate-200 placeholder:text-slate-500',
                    'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    isExtracting && 'opacity-50',
                    isCustomPromptTooLong
                      ? 'border-red-500'
                      : isCustomPromptTooShort
                        ? 'border-amber-500'
                        : 'border-slate-700'
                  )}
                />
                {isCustomPromptTooShort && (
                  <p className="text-[10px] text-amber-400">
                    Minimum {MIN_PROMPT_LENGTH} characters required (
                    {MIN_PROMPT_LENGTH - customPromptLength} more needed)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Narrative Mode */}
          {sketchMode === 'narrative' && (
            <div className="space-y-2 p-3 bg-slate-800/30 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <BookOpen className="w-4 h-4" />
                <span className="font-medium">Auto-generate from story</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                This mode automatically creates an image from your story
                content. No manual input needed.
              </p>
              {!hasStoryContent && (
                <p className="text-[10px] text-amber-400">
                  Add story content to use this mode
                </p>
              )}
              {hasStoryContent && (
                <p className="text-[10px] text-emerald-400">
                  Story content ready ({storyContent.trim().length} chars)
                </p>
              )}
            </div>
          )}

          {/* Mood Selector */}
          <div className="space-y-2">
            <button
              onClick={() => setMoodExpanded(!moodExpanded)}
              className="flex items-center justify-between w-full text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
              disabled={isGenerating}
            >
              <span className="flex items-center gap-1.5">
                <span></span>
                <span>Mood (optional)</span>
                {selectedMood && (
                  <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-[10px]">
                    {selectedMood.label}
                  </span>
                )}
              </span>
              {moodExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {moodExpanded && (
              <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-800/50 rounded-lg border border-slate-700">
                {MOOD_OPTIONS.map((mood) => {
                  const isSelected = selectedMood?.id === mood.id;
                  return (
                    <button
                      key={mood.id}
                      onClick={() =>
                        setSelectedMood(isSelected ? null : mood)
                      }
                      disabled={isGenerating}
                      className={cn(
                        'flex items-center gap-1.5 px-2 py-1.5 text-[10px] rounded-md transition-all',
                        isSelected
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-800 border border-slate-700 text-slate-300 hover:border-cyan-500/50'
                      )}
                    >
                      <span>{mood.icon}</span>
                      <span className="truncate">{mood.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-[10px] text-red-400">{error}</p>
            </div>
          )}

          {/* Sketch Button */}
          <Button
            onClick={
              sketchMode === 'custom'
                ? handleSketchFromCustomPrompt
                : handleSketchFromNarrative
            }
            disabled={
              isGenerating ||
              isSaving ||
              isExtracting ||
              (sketchMode === 'custom' && !isCustomPromptValid) ||
              (sketchMode === 'narrative' && !hasStoryContent)
            }
            variant="primary"
            className="w-full h-9 text-xs"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Sketching...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Sketch Image
              </>
            )}
          </Button>
        </div>
      )}

      {/* Sketches Display */}
      {sketches.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-slate-200">
              Select a Sketch
            </Label>
            <Button
              size="xs"
              variant="ghost"
              onClick={handleStartOver}
              disabled={isGenerating}
              className="h-6 text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Start Over
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            {sketches.map((sketch, index) => {
              const isSelected = selectedSketchIndex === index;
              return (
                <button
                  key={index}
                  onClick={() => setSelectedSketchIndex(index)}
                  className={cn(
                    'relative rounded-lg overflow-hidden border-2 transition-all',
                    isSelected
                      ? 'border-cyan-500 ring-2 ring-cyan-500/30'
                      : 'border-slate-700 hover:border-cyan-500/50'
                  )}
                >
                  <div className="aspect-[16/9]">
                    <img
                      src={sketch.url}
                      alt={`Sketch ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {isSelected && (
                    <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center">
                      <div className="bg-cyan-600 text-white rounded-full p-2">
                        <Check className="w-5 h-5" />
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1 bg-black/70 rounded px-2 py-1">
                    <span className="text-xs text-white font-medium">
                      Option {index + 1}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedSketchIndex !== null && (
            <Button
              onClick={handleUseSketch}
              disabled={isSaving}
              variant="primary"
              className="w-full h-10 text-sm"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Use Selected Sketch
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
