/**
 * AudioNarrationPanel Component
 * Generate and manage audio narration for scene content using ElevenLabs TTS
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, Play, Pause, RefreshCw, Trash2, Loader2, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioNarrationPanelProps {
  /** The text content to generate audio from */
  content: string;
  /** Project ID for storage path */
  projectId: string;
  /** Scene ID for storage path */
  sceneId: string;
  /** Current audio URL if exists */
  audioUrl: string | null;
  /** Callback when audio URL changes */
  onAudioUrlChange: (url: string | null) => void;
  /** Whether the panel is disabled */
  disabled?: boolean;
}

/**
 * AudioNarrationPanel - Generate and manage audio narration for story content
 *
 * Features:
 * - Generate audio from content using ElevenLabs TTS
 * - Play/pause audio playback
 * - Re-generate audio
 * - Delete audio
 * - Only visible when ELEVENLABS_API_KEY is configured
 */
export function AudioNarrationPanel({
  content,
  projectId,
  sceneId,
  audioUrl,
  onAudioUrlChange,
  disabled = false,
}: AudioNarrationPanelProps) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use Audio API directly instead of DOM element
  const audioInstanceRef = useRef<HTMLAudioElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);

  // Check if ElevenLabs is available
  useEffect(() => {
    async function checkAvailability() {
      try {
        const response = await fetch('/api/ai/elevenlabs');
        const data = await response.json();
        setIsAvailable(data.available);
      } catch {
        setIsAvailable(false);
      }
    }
    checkAvailability();
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioInstanceRef.current) {
        audioInstanceRef.current.pause();
        // Revoke blob URL if exists
        if (audioInstanceRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioInstanceRef.current.src);
        }
        audioInstanceRef.current.src = '';
        audioInstanceRef.current = null;
      }
    };
  }, []);

  // Stop playback when URL changes
  useEffect(() => {
    if (currentUrlRef.current !== audioUrl) {
      if (audioInstanceRef.current) {
        audioInstanceRef.current.pause();
        // Revoke blob URL if exists
        if (audioInstanceRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioInstanceRef.current.src);
        }
        audioInstanceRef.current.src = '';
        audioInstanceRef.current = null;
      }
      setIsPlaying(false);
      currentUrlRef.current = audioUrl;
    }
  }, [audioUrl]);

  // Generate audio narration
  const handleGenerate = useCallback(async () => {
    if (!content.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/elevenlabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: content,
          projectId,
          sceneId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate audio');
      }

      onAudioUrlChange(data.audioUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate audio');
    } finally {
      setIsGenerating(false);
    }
  }, [content, projectId, sceneId, isGenerating, onAudioUrlChange]);

  // Delete audio
  const handleDelete = useCallback(async () => {
    if (!audioUrl || isDeleting) return;

    // Stop playback first
    if (audioInstanceRef.current) {
      audioInstanceRef.current.pause();
      audioInstanceRef.current = null;
    }
    setIsPlaying(false);

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/elevenlabs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioUrl }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete audio');
      }

      onAudioUrlChange(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete audio');
    } finally {
      setIsDeleting(false);
    }
  }, [audioUrl, isDeleting, onAudioUrlChange]);

  // Toggle playback using Audio API with blob URL for better compatibility
  const togglePlayback = useCallback(async () => {
    if (!audioUrl) return;

    setError(null);

    // If playing, pause
    if (isPlaying && audioInstanceRef.current) {
      audioInstanceRef.current.pause();
      setIsPlaying(false);
      return;
    }

    // Create new audio instance if needed
    if (!audioInstanceRef.current || currentUrlRef.current !== audioUrl) {
      setIsLoading(true);

      // Clean up old instance
      if (audioInstanceRef.current) {
        audioInstanceRef.current.pause();
        // Revoke old blob URL if exists
        if (audioInstanceRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioInstanceRef.current.src);
        }
        audioInstanceRef.current.src = '';
      }

      try {
        // Fetch audio as blob to ensure correct MIME type handling
        const response = await fetch(audioUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch audio: ${response.status}`);
        }

        // Get the blob and create object URL with explicit MIME type
        const blob = await response.blob();
        const audioBlob = new Blob([blob], { type: 'audio/mpeg' });
        const blobUrl = URL.createObjectURL(audioBlob);

        const audio = new Audio();
        audioInstanceRef.current = audio;
        currentUrlRef.current = audioUrl;

        // Set up event handlers
        audio.onended = () => setIsPlaying(false);
        audio.onpause = () => setIsPlaying(false);
        audio.onplay = () => {
          setIsPlaying(true);
          setIsLoading(false);
        };
        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          setError('Failed to play audio');
          setIsPlaying(false);
          setIsLoading(false);
        };

        // Set blob URL as source
        audio.src = blobUrl;

        // Play
        await audio.play();
      } catch (err) {
        console.error('Audio load/play error:', err);
        setError(err instanceof Error ? err.message : 'Failed to play audio');
        setIsLoading(false);
      }
    } else {
      // Audio already loaded, just play
      try {
        setIsLoading(true);
        await audioInstanceRef.current.play();
      } catch (err) {
        console.error('Play error:', err);
        setError('Failed to play audio');
        setIsLoading(false);
      }
    }
  }, [audioUrl, isPlaying]);

  // Don't render if ElevenLabs is not available
  if (isAvailable === null) {
    return null; // Loading
  }

  if (!isAvailable) {
    return null; // Not configured
  }

  const hasAudio = !!audioUrl;
  const canGenerate = content.trim().length > 0 && !disabled;

  return (
    <div className="mt-2">
      {/* Panel */}
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          'bg-slate-800/50 border border-slate-700',
          'transition-all duration-150'
        )}
      >
        {/* Audio icon */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <Mic className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Audio</span>
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-slate-700" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          {hasAudio ? (
            <>
              {/* Play/Pause */}
              <button
                type="button"
                onClick={togglePlayback}
                disabled={disabled || isLoading}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                  'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20',
                  'transition-colors disabled:opacity-50'
                )}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-3 h-3" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
                <span>
                  {isLoading ? 'Loading...' : isPlaying ? 'Pause' : 'Play'}
                </span>
              </button>

              {/* Regenerate */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate || isGenerating}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-xs',
                  'text-slate-400 hover:text-slate-200 hover:bg-slate-700',
                  'transition-colors disabled:opacity-50'
                )}
                aria-label="Regenerate audio"
                title="Regenerate audio"
              >
                {isGenerating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={handleDelete}
                disabled={disabled || isDeleting}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-xs',
                  'text-slate-400 hover:text-red-400 hover:bg-red-500/10',
                  'transition-colors disabled:opacity-50'
                )}
                aria-label="Delete audio"
                title="Delete audio"
              >
                {isDeleting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
              </button>
            </>
          ) : (
            /* Generate button */
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium',
                'bg-cyan-600 text-white hover:bg-cyan-500',
                'transition-colors disabled:opacity-50'
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3 h-3" />
                  <span>Generate Audio</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <span
            className="ml-auto text-xs text-red-400 truncate max-w-[200px]"
            title={error}
          >
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
