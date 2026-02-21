/**
 * PromptPreview Component
 * Shows composed prompt and generated images
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Wand2, Loader2, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/UI/Button';

interface PromptPreviewProps {
  prompt: string;
  copied: boolean;
  loading?: boolean;
  onCopy: () => void;
  onImageSelect?: (imageUrl: string, prompt: string) => void;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
}

export function PromptPreview({
  prompt,
  copied,
  loading = false,
  onCopy,
  onImageSelect,
}: PromptPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Mock generation for now - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock generated images
      const mockImages: GeneratedImage[] = [
        {
          id: '1',
          url: 'https://picsum.photos/seed/gen1/400/300',
          prompt,
        },
        {
          id: '2',
          url: 'https://picsum.photos/seed/gen2/400/300',
          prompt,
        },
        {
          id: '3',
          url: 'https://picsum.photos/seed/gen3/400/300',
          prompt,
        },
        {
          id: '4',
          url: 'https://picsum.photos/seed/gen4/400/300',
          prompt,
        },
      ];

      setGeneratedImages(mockImages);
    } catch (err) {
      setError('Failed to generate images. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectImage = (image: GeneratedImage) => {
    onImageSelect?.(image.url, image.prompt);
  };

  return (
    <div className="space-y-4">
      {/* Prompt Display */}
      <div className="relative">
        <div
          className={cn(
            'p-3 rounded-lg text-xs font-mono',
            'bg-slate-800 border border-slate-700',
            'text-slate-300 whitespace-pre-wrap break-words',
            'min-h-[80px] max-h-[200px] overflow-y-auto'
          )}
        >
          {prompt || (
            <span className="text-slate-500 italic">
              Select options to build your prompt...
            </span>
          )}
        </div>

        {/* Copy Button */}
        {prompt && (
          <button
            onClick={onCopy}
            className={cn(
              'absolute top-2 right-2 p-1.5 rounded-md transition-colors',
              copied
                ? 'bg-emerald-600/20 text-emerald-400'
                : 'bg-slate-700 text-slate-400 hover:text-slate-200'
            )}
            title={copied ? 'Copied!' : 'Copy prompt'}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Character Count */}
      {prompt && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{prompt.length} characters</span>
          <span className={prompt.length > 1400 ? 'text-amber-400' : ''}>
            {Math.round((prompt.length / 1500) * 100)}% of limit
          </span>
        </div>
      )}

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isGenerating || loading}
        className="w-full gap-2"
        size="sm"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4" />
            Generate Images
          </>
        )}
      </Button>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 text-center">{error}</p>
      )}

      {/* Generated Images Grid */}
      <AnimatePresence>
        {generatedImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium text-slate-300">
                Generated Images
              </h4>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <RefreshCw className={cn('w-3 h-3', isGenerating && 'animate-spin')} />
                Regenerate
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {generatedImages.map((image, index) => (
                <motion.button
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleSelectImage(image)}
                  className={cn(
                    'relative aspect-[4/3] rounded-lg overflow-hidden group',
                    'border-2 border-slate-700 hover:border-cyan-500',
                    'transition-all duration-200'
                  )}
                >
                  <img
                    src={image.url}
                    alt={`Generated image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className={cn(
                      'absolute inset-0 bg-gradient-to-t from-black/60 to-transparent',
                      'opacity-0 group-hover:opacity-100 transition-opacity',
                      'flex items-end justify-center pb-2'
                    )}
                  >
                    <span className="text-xs text-white font-medium flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      Use this
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
