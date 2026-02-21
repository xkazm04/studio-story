'use client';

import { useState, useCallback } from 'react';
import { Play, Volume2, Loader2 } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import {
  EMOTIONS, DELIVERY_PRESETS, applyModifiers,
} from '../lib/voiceModifiers';
import type { VoiceSettings } from '../types';

interface PerformanceControlsProps {
  voiceSettings: VoiceSettings;
  onSettingsChange: (settings: VoiceSettings) => void;
  selectedVoiceId?: string;
  previewText?: string;
}

function CompactSlider({ label, value, onChange, min = 0, max = 100, unit = '%' }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; unit?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-slate-500 w-14 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1 bg-slate-800 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-400"
      />
      <span className="text-[11px] text-orange-400 font-mono w-8 text-right">{value}{unit}</span>
    </div>
  );
}

export default function PerformanceControls({
  voiceSettings,
  onSettingsChange,
  selectedVoiceId,
  previewText,
}: PerformanceControlsProps) {
  const [selectedEmotion, setSelectedEmotion] = useState('neutral');
  const [intensity, setIntensity] = useState(50);
  const [selectedPreset, setSelectedPreset] = useState('narration');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSettingChange = useCallback((key: keyof VoiceSettings, value: number) => {
    onSettingsChange({ ...voiceSettings, [key]: value });
  }, [voiceSettings, onSettingsChange]);

  const handlePreview = useCallback(async () => {
    const text = (previewText ?? '').trim() || 'The shadows grow long as evening falls across the ancient kingdom.';
    if (!selectedVoiceId) return;
    setIsGenerating(true);

    const adjustedSettings = applyModifiers(voiceSettings, selectedEmotion, selectedPreset, intensity);

    try {
      const res = await fetch('/api/ai/audio/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice_id: selectedVoiceId,
          voice_settings: adjustedSettings,
        }),
      });

      const data = await res.json();
      if (data.success && data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.onended = () => setIsGenerating(false);
        audio.onerror = () => setIsGenerating(false);
        audio.play();
      } else {
        setIsGenerating(false);
      }
    } catch {
      setIsGenerating(false);
    }
  }, [previewText, selectedVoiceId, voiceSettings, selectedEmotion, selectedPreset, intensity]);

  return (
    <div className="flex flex-col h-full">
      {/* Emotion Grid */}
      <div className="px-3 py-2.5 border-b border-slate-800/30 shrink-0">
        <span className="text-[11px] font-medium text-slate-400 mb-2 block">Emotion</span>
        <div className="grid grid-cols-4 gap-1.5">
          {EMOTIONS.map((emotion) => {
            const isActive = selectedEmotion === emotion.type;
            return (
              <button
                key={emotion.type}
                onClick={() => setSelectedEmotion(emotion.type)}
                className={cn(
                  'flex flex-col items-center gap-1 py-1.5 rounded-md transition-all duration-200',
                  isActive
                    ? 'bg-orange-500/15 ring-1 ring-orange-500/40 scale-105'
                    : 'hover:bg-slate-800/40'
                )}
              >
                <div className={cn(
                  'w-4 h-4 rounded-full transition-all',
                  emotion.color,
                  isActive ? 'shadow-sm scale-110' : 'opacity-50'
                )} />
                <span className={cn(
                  'text-[11px] font-medium',
                  isActive ? 'text-orange-400' : 'text-slate-500'
                )}>
                  {emotion.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-2.5">
          <CompactSlider label="Intensity" value={intensity} onChange={setIntensity} />
        </div>
      </div>

      {/* Delivery Presets */}
      <div className="px-3 py-2.5 border-b border-slate-800/30 shrink-0">
        <span className="text-[11px] font-medium text-slate-400 mb-2 block">Delivery</span>
        <div className="flex flex-wrap gap-1">
          {DELIVERY_PRESETS.map((preset) => {
            const isActive = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setSelectedPreset(preset.id)}
                className={cn(
                  'text-[11px] px-2 py-1 rounded-md font-medium transition-all duration-200',
                  isActive
                    ? 'bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/30'
                    : 'bg-slate-800/40 text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Voice Settings */}
      <div className="px-3 py-2.5 border-b border-slate-800/30 space-y-1.5 shrink-0">
        <span className="text-[11px] font-medium text-slate-400 mb-1 block">Voice Settings</span>
        <CompactSlider
          label="Stability"
          value={Math.round(voiceSettings.stability * 100)}
          onChange={(v) => handleSettingChange('stability', v / 100)}
        />
        <CompactSlider
          label="Similarity"
          value={Math.round(voiceSettings.similarity_boost * 100)}
          onChange={(v) => handleSettingChange('similarity_boost', v / 100)}
        />
        <CompactSlider
          label="Style"
          value={Math.round(voiceSettings.style * 100)}
          onChange={(v) => handleSettingChange('style', v / 100)}
        />
        <CompactSlider
          label="Speed"
          value={Math.round(voiceSettings.speed * 100)}
          onChange={(v) => handleSettingChange('speed', v / 100)}
          min={50}
          max={200}
          unit=""
        />
      </div>

      {/* Preview */}
      {selectedVoiceId && (
        <div className="shrink-0 p-3 mt-auto">
          <button
            onClick={handlePreview}
            disabled={isGenerating}
            className={cn(
              'w-full flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all',
              isGenerating
                ? 'bg-orange-600/40 text-orange-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-500 hover:to-amber-500'
            )}
          >
            {isGenerating ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
            ) : (
              <><Play className="w-3.5 h-3.5" /> Preview Performance</>
            )}
          </button>

          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-[11px] text-slate-500">
              {EMOTIONS.find((e) => e.type === selectedEmotion)?.label} @ {intensity}%
            </span>
            <span className="text-[11px] text-slate-500">
              {DELIVERY_PRESETS.find((p) => p.id === selectedPreset)?.label}
            </span>
            <span className="text-[11px] text-slate-500">
              <Volume2 className="w-2.5 h-2.5 inline mr-0.5" />{Math.round(voiceSettings.stability * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
