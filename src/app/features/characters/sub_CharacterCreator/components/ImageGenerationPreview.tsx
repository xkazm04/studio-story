'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Sparkles, Loader2, X, User, Check, AlertTriangle } from 'lucide-react';
import { SectionWrapper } from '@/app/components/UI';
import { extractData } from '@/app/utils/api';

interface ImageGenerationPreviewProps {
  prompt: string;
  characterId?: string;
}

interface GenerationSlot {
  generationId: string;
  promptId: string;
  status: 'polling' | 'complete' | 'failed';
  imageUrl?: string;
  error?: string;
}

const NUM_SLOTS = 4;
const POLL_INTERVAL = 3000;
const MAX_POLLS = 40; // ~2 minutes

/**
 * Image Generation Preview Component
 * Generates character images via Leonardo AI and displays them in slots
 */
export function ImageGenerationPreview({ prompt, characterId }: ImageGenerationPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [slots, setSlots] = useState<GenerationSlot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [enlargedUrl, setEnlargedUrl] = useState<string | null>(null);
  const [savingAvatarIdx, setSavingAvatarIdx] = useState<number | null>(null);
  const [savedAvatarIdx, setSavedAvatarIdx] = useState<number | null>(null);
  const abortRef = useRef(false);

  const pollGeneration = useCallback(async (generationId: string, slotIndex: number) => {
    let polls = 0;
    while (polls < MAX_POLLS && !abortRef.current) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL));
      polls++;
      try {
        const res = await fetch(`/api/ai/generate-images?generationId=${generationId}`);
        const data = extractData<any>(await res.json());
        if (data.status === 'complete' && data.images?.length > 0) {
          setSlots((prev) =>
            prev.map((s, i) =>
              i === slotIndex ? { ...s, status: 'complete', imageUrl: data.images[0].url } : s
            )
          );
          return;
        }
        if (data.status === 'failed') {
          setSlots((prev) =>
            prev.map((s, i) =>
              i === slotIndex ? { ...s, status: 'failed', error: data.error || 'Generation failed' } : s
            )
          );
          return;
        }
      } catch {
        // continue polling on network errors
      }
    }
    // timeout
    setSlots((prev) =>
      prev.map((s, i) =>
        i === slotIndex && s.status === 'polling'
          ? { ...s, status: 'failed', error: 'Generation timed out' }
          : s
      )
    );
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setSavedAvatarIdx(null);
    abortRef.current = false;

    const prompts = Array.from({ length: NUM_SLOTS }, (_, i) => ({
      id: `char-gen-${Date.now()}-${i}`,
      text: prompt,
    }));

    try {
      const res = await fetch('/api/ai/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompts, width: 768, height: 768 }),
      });

      const data = extractData<any>(await res.json());

      if (!data.success) {
        setError(data.error || 'Failed to start generation');
        setIsGenerating(false);
        return;
      }

      const initialSlots: GenerationSlot[] = data.generations.map(
        (gen: { promptId: string; generationId: string; status: string; error?: string }) => ({
          generationId: gen.generationId,
          promptId: gen.promptId,
          status: gen.status === 'failed' ? 'failed' : 'polling',
          error: gen.error,
        })
      );

      setSlots(initialSlots);
      setIsGenerating(false);

      // Poll each generation in parallel
      initialSlots.forEach((slot, idx) => {
        if (slot.status === 'polling') {
          pollGeneration(slot.generationId, idx);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setIsGenerating(false);
    }
  };

  const handleUseAsAvatar = async (imageUrl: string, slotIndex: number) => {
    if (!characterId) return;
    setSavingAvatarIdx(slotIndex);
    try {
      const res = await fetch(`/api/characters/${characterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: imageUrl }),
      });
      if (res.ok) {
        setSavedAvatarIdx(slotIndex);
      }
    } catch {
      // silent fail — user can retry
    } finally {
      setSavingAvatarIdx(null);
    }
  };

  const anyPolling = slots.some((s) => s.status === 'polling');

  return (
    <SectionWrapper borderColor="orange" padding="md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-semibold text-white mb-1">Image Generation Preview</h4>
          <p className="text-sm text-slate-400">
            Generate character images via AI
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || anyPolling || !prompt.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-700 disabled:text-slate-400 text-white rounded-lg font-medium transition-colors text-sm"
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Starting...
            </>
          ) : anyPolling ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generate Images
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 mb-4 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-sm">
          <AlertTriangle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      {slots.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {slots.map((slot, index) => (
            <div
              key={slot.promptId}
              className="aspect-square bg-slate-800 border-2 border-slate-700 rounded-lg relative overflow-hidden group"
            >
              {slot.status === 'polling' && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/50 to-transparent animate-shimmer" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Loader2 size={24} className="animate-spin" />
                    <span className="text-xs font-medium">Generating...</span>
                  </div>
                </>
              )}

              {slot.status === 'complete' && slot.imageUrl && (
                <>
                  <img
                    src={slot.imageUrl}
                    alt={`Generated character ${index + 1}`}
                    className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-105"
                    onClick={() => setEnlargedUrl(slot.imageUrl!)}
                  />
                  {/* Hover overlay with actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <button
                      onClick={() => setEnlargedUrl(slot.imageUrl!)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-md transition-colors"
                    >
                      Enlarge
                    </button>
                    {characterId && (
                      <button
                        onClick={() => handleUseAsAvatar(slot.imageUrl!, index)}
                        disabled={savingAvatarIdx === index}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white text-xs rounded-md transition-colors"
                      >
                        {savingAvatarIdx === index ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : savedAvatarIdx === index ? (
                          <Check size={12} />
                        ) : (
                          <User size={12} />
                        )}
                        {savedAvatarIdx === index ? 'Saved!' : 'Use as Avatar'}
                      </button>
                    )}
                  </div>
                </>
              )}

              {slot.status === 'failed' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-red-400 p-2">
                  <AlertTriangle size={20} />
                  <span className="text-xs text-center">{slot.error || 'Failed'}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {enlargedUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
          onClick={() => setEnlargedUrl(null)}
        >
          <button
            onClick={() => setEnlargedUrl(null)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <img
            src={enlargedUrl}
            alt="Enlarged preview"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </SectionWrapper>
  );
}
