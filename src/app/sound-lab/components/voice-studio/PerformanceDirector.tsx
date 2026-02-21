'use client';

import { useState, useCallback } from 'react';
import {
  Sliders, Play, Volume2, Loader2, PanelRightClose, ChevronLeft, Save,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import WaveformVisualizer from '../shared/WaveformVisualizer';
import {
  EMOTIONS, DELIVERY_PRESETS, applyModifiers,
  type VoiceSettings,
} from '../../lib/voiceModifiers';

interface PerformanceDirectorProps {
  onCollapse: () => void;
  voiceSettings: VoiceSettings;
  onSettingsChange: (settings: VoiceSettings) => void;
  selectedVoiceId: string;
  previewText: string;
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

export default function PerformanceDirector({
  onCollapse,
  voiceSettings,
  onSettingsChange,
  selectedVoiceId,
  previewText,
}: PerformanceDirectorProps) {
  const [selectedEmotion, setSelectedEmotion] = useState('neutral');
  const [intensity, setIntensity] = useState(50);
  const [selectedPreset, setSelectedPreset] = useState('narration');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const mockWaveform = Array.from({ length: 40 }, (_, i) =>
    Math.max(0.1, 0.5 + Math.sin(i * 0.6) * 0.3 + (Math.random() - 0.5) * 0.3)
  );

  const handleSettingChange = useCallback((key: keyof VoiceSettings, value: number) => {
    onSettingsChange({ ...voiceSettings, [key]: value });
  }, [voiceSettings, onSettingsChange]);

  const handlePreview = useCallback(async () => {
    const text = previewText.trim() || 'The shadows grow long as evening falls across the ancient kingdom.';
    setIsGenerating(true);

    // Apply emotion + delivery modifiers scaled by intensity
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

  const handleSaveConfig = useCallback(async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/voices/${selectedVoiceId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voiceSettings),
      });
    } catch {
      // Silently handle save errors
    } finally {
      setIsSaving(false);
    }
  }, [selectedVoiceId, voiceSettings]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 h-8 px-2.5 bg-slate-900/60 border-b border-slate-700/40 shrink-0">
        <Sliders className="w-3.5 h-3.5 text-orange-400/80" />
        <span className="text-xs font-semibold text-slate-200">Performance</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="p-0.5 rounded text-slate-500 hover:text-orange-400 transition-colors"
            title="Save voice settings"
          >
            <Save className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onCollapse}
            className="p-0.5 rounded text-slate-500 hover:text-slate-300 transition-colors"
            title="Collapse panel"
          >
            <PanelRightClose className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

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
      <div className="shrink-0 p-3 mt-auto">
        <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/40 space-y-2">
          <WaveformVisualizer
            data={mockWaveform}
            height={28}
            barWidth={2}
            gap={1}
            animated={isGenerating}
          />
          <button
            onClick={handlePreview}
            disabled={isGenerating}
            className={cn(
              'w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200',
              isGenerating
                ? 'bg-orange-600/40 text-orange-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-500 hover:to-amber-500 shadow-sm shadow-orange-500/20'
            )}
          >
            {isGenerating ? (
              <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</>
            ) : (
              <><Play className="w-3 h-3" /> Preview Performance</>
            )}
          </button>
        </div>

        {/* Config Summary */}
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
    </div>
  );
}

/** Collapsed right panel strip — 40px wide */
export function CollapsedPerformance({ onExpand }: { onExpand: () => void }) {
  return (
    <div className="flex flex-col items-center h-full py-2 gap-3">
      <button
        onClick={onExpand}
        className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
        title="Expand performance panel"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      <Sliders className="w-3.5 h-3.5 text-orange-400/60" />
    </div>
  );
}
