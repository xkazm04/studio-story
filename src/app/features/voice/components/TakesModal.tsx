'use client';

import { useState, useCallback } from 'react';
import { X, Sparkles, Play } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { EMOTIONS, DELIVERY_PRESETS } from '../lib/voiceModifiers';
import { suggestEmotions } from '../lib/emotionSuggestions';
import { useTakeGenerator } from '../hooks/useTakeGenerator';
import TakesGallery from './TakesGallery';
import type { VoiceSettings } from '../types';
import type { ScriptLine, ScriptLineTake } from '../types';

interface TakesModalProps {
  line: ScriptLine;
  voiceSettings: VoiceSettings;
  onClose: () => void;
  onTakesGenerated: (lineId: string, takes: ScriptLineTake[], selectedIdx: number) => void;
}

export default function TakesModal({
  line,
  voiceSettings,
  onClose,
  onTakesGenerated,
}: TakesModalProps) {
  const suggested = suggestEmotions(line.emotion, 5);

  const [selectedEmotions, setSelectedEmotions] = useState<Set<string>>(new Set(suggested.slice(0, 3)));
  const [delivery, setDelivery] = useState(line.delivery || 'narration');
  const [intensity, setIntensity] = useState(70);
  const [takes, setTakes] = useState<ScriptLineTake[]>(line.takes ?? []);
  const [selectedTakeIdx, setSelectedTakeIdx] = useState(line.selectedTakeIdx ?? -1);

  const { isGenerating, progress, generateTakes, cancel } = useTakeGenerator();

  const toggleEmotion = useCallback((emotion: string) => {
    setSelectedEmotions((prev) => {
      const next = new Set(prev);
      if (next.has(emotion)) {
        next.delete(emotion);
      } else {
        next.add(emotion);
      }
      return next;
    });
  }, []);

  const handleGenerate = useCallback(async () => {
    const emotions = Array.from(selectedEmotions);
    if (emotions.length === 0) return;

    const newTakes = await generateTakes(line, voiceSettings, {
      emotions,
      delivery,
      intensity,
    });

    setTakes((prev) => [...prev, ...newTakes]);
  }, [selectedEmotions, line, voiceSettings, delivery, intensity, generateTakes]);

  const handleRate = useCallback((idx: number, rating: number) => {
    setTakes((prev) => prev.map((t, i) => i === idx ? { ...t, rating } : t));
  }, []);

  const handleUseSelected = useCallback(() => {
    onTakesGenerated(line.id, takes, selectedTakeIdx);
    onClose();
  }, [line.id, takes, selectedTakeIdx, onTakesGenerated, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[520px] max-h-[85vh] bg-slate-900 border border-slate-700/60 rounded-xl shadow-2xl shadow-black/40 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800/50 shrink-0">
          <Sparkles className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-semibold text-slate-200">Generate Takes</span>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Line Preview */}
        <div className="px-4 py-2.5 border-b border-slate-800/30 bg-slate-950/30 shrink-0">
          <span className="text-[11px] text-slate-500 block mb-1">Line</span>
          <p className="text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-orange-400">{line.character}:</span>{' '}
            &ldquo;{line.text.length > 120 ? `${line.text.slice(0, 120)}...` : line.text}&rdquo;
          </p>
        </div>

        {/* Emotion Picker */}
        <div className="px-4 py-3 border-b border-slate-800/30 shrink-0">
          <span className="text-[11px] font-medium text-slate-400 mb-2 block">
            Select emotions ({selectedEmotions.size} selected)
          </span>
          <div className="grid grid-cols-6 gap-1.5">
            {EMOTIONS.map((emo) => {
              const isActive = selectedEmotions.has(emo.type);
              const isSuggested = suggested.includes(emo.type);

              return (
                <button
                  key={emo.type}
                  onClick={() => toggleEmotion(emo.type)}
                  className={cn(
                    'flex flex-col items-center gap-1 py-1.5 rounded-md transition-all duration-200',
                    isActive
                      ? 'bg-orange-500/15 ring-1 ring-orange-500/40'
                      : isSuggested
                        ? 'bg-slate-800/40 ring-1 ring-slate-700/40 hover:bg-slate-800/60'
                        : 'hover:bg-slate-800/40 opacity-60'
                  )}
                >
                  <div className={cn(
                    'w-4 h-4 rounded-full transition-all',
                    emo.color,
                    isActive ? 'scale-110' : 'opacity-50'
                  )} />
                  <span className={cn(
                    'text-[9px] font-medium',
                    isActive ? 'text-orange-400' : 'text-slate-500'
                  )}>
                    {emo.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Delivery + Intensity */}
        <div className="px-4 py-2.5 border-b border-slate-800/30 shrink-0 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Delivery</span>
            <select
              value={delivery}
              onChange={(e) => setDelivery(e.target.value)}
              className="h-6 px-2 bg-slate-800/60 border border-slate-700/40 rounded text-[11px] text-slate-300
                focus:outline-none focus:border-orange-500/40"
            >
              {DELIVERY_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 flex-1">
            <span className="text-[11px] text-slate-500">Intensity</span>
            <input
              type="range"
              min={10}
              max={100}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="flex-1 h-1 bg-slate-800 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-400"
            />
            <span className="text-[11px] text-orange-400 font-mono w-8 text-right">{intensity}%</span>
          </div>
        </div>

        {/* Generate Button */}
        <div className="px-4 py-2.5 shrink-0">
          {isGenerating ? (
            <button
              onClick={cancel}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium
                bg-red-600/80 text-white hover:bg-red-500 transition-colors"
            >
              Cancel Generation
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={selectedEmotions.size === 0}
              className={cn(
                'w-full flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all',
                selectedEmotions.size === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-500 hover:to-amber-500'
              )}
            >
              <Play className="w-3.5 h-3.5" />
              Generate {selectedEmotions.size} Take{selectedEmotions.size !== 1 ? 's' : ''}
            </button>
          )}
        </div>

        {/* Takes Gallery */}
        {(takes.length > 0 || isGenerating) && (
          <div className="flex-1 overflow-auto px-4 pb-3">
            <TakesGallery
              takes={takes}
              selectedIdx={selectedTakeIdx}
              onSelect={setSelectedTakeIdx}
              onRate={handleRate}
              isGenerating={isGenerating}
              progress={progress}
            />
          </div>
        )}

        {/* Footer */}
        {takes.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-800/50 shrink-0">
            <button
              onClick={handleUseSelected}
              disabled={selectedTakeIdx < 0}
              className={cn(
                'w-full flex items-center justify-center gap-1.5 py-2.5 rounded-md text-xs font-medium transition-all',
                selectedTakeIdx < 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600/80 text-white hover:bg-emerald-500'
              )}
            >
              {selectedTakeIdx >= 0
                ? `Use Selected Take (${EMOTIONS.find((e) => e.type === takes[selectedTakeIdx]?.emotion)?.label ?? 'Unknown'})`
                : 'Select a take first'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
