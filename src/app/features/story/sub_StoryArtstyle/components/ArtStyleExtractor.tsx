/**
 * ArtStyleExtractor Component
 * AI-powered style extraction from uploaded images
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, RefreshCw, Copy, Check } from 'lucide-react';
import { Button } from '@/app/components/UI/Button';
import { Label } from '@/app/components/UI/Label';
import { ImageUploadArea } from './ImageUploadArea';

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
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(
    extractedImageUrl
  );
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea to show all content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(150, textarea.scrollHeight)}px`;
    }
  }, [customPrompt]);

  const handleCopyToClipboard = async () => {
    if (!customPrompt) return;
    try {
      await navigator.clipboard.writeText(customPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
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

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image must be less than 10MB');
        return;
      }

      setError(null);
      setIsExtracting(true);

      try {
        // Convert to base64 for display
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64Url = e.target?.result as string;
          setUploadedImageUrl(base64Url);

          // Call API to extract art style
          const response = await fetch('/api/ai/art-style/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: base64Url }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to extract art style');
          }

          const data = await response.json();
          onExtract(base64Url, data.prompt);
          setIsExtracting(false);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to extract art style'
        );
        setUploadedImageUrl(null);
        setIsExtracting(false);
      }
    },
    [onExtract]
  );

  const handleClear = useCallback(() => {
    setUploadedImageUrl(null);
    setError(null);
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

      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Custom Prompt Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-slate-400">
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
              'w-full min-h-[150px] px-3 py-2 text-xs rounded-md relative z-10',
              'bg-slate-800/60 border border-slate-700',
              'text-slate-200 placeholder:text-slate-500',
              'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'resize-none overflow-hidden'
            )}
            disabled={disabled || isExtracting}
          />
        </div>
        <p className="text-[10px] text-slate-500">
          This style will be applied to all scene images in your story
        </p>
      </div>
    </div>
  );
}
