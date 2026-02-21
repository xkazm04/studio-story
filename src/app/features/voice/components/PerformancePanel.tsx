'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sliders,
  Heart,
  Gauge,
  Bookmark,
  ChevronDown,
  Play,
  Save,
  RotateCcw,
  Volume2,
  Music,
} from 'lucide-react';
import { Button } from '@/app/components/UI/Button';
import { Slider } from '@/app/components/UI/Slider';
import { CollapsibleSection } from '@/app/components/UI/CollapsibleSection';
import EmotionPanel from './EmotionPanel';
import PacingControls from './PacingControls';
import DeliveryPresets from './DeliveryPresets';
import {
  emotionController,
  DEFAULT_PERFORMANCE,
  type PerformanceConfig,
  type DeliveryPreset,
} from '@/lib/voice';

interface PerformancePanelProps {
  className?: string;
  onGeneratePreview?: (config: PerformanceConfig, text: string) => void;
}

export default function PerformancePanel({
  className = '',
  onGeneratePreview,
}: PerformancePanelProps) {
  // Performance configuration state
  const [config, setConfig] = useState<PerformanceConfig>({ ...DEFAULT_PERFORMANCE });
  const [selectedPreset, setSelectedPreset] = useState<string | undefined>();
  const [previewText, setPreviewText] = useState(
    'The shadows lengthened across the ancient stones, and she knew her time had finally come.'
  );

  // UI state
  const [activeSection, setActiveSection] = useState<'emotion' | 'pacing' | 'presets' | 'params'>('presets');

  // Handle preset selection
  const handlePresetSelect = useCallback((preset: DeliveryPreset) => {
    const newConfig = emotionController.applyPreset(preset.id);
    setConfig(newConfig);
    setSelectedPreset(preset.id);
  }, []);

  // Handle emotion change
  const handleEmotionChange = useCallback((emotion: typeof config.emotion) => {
    setConfig((prev) => ({ ...prev, emotion }));
    setSelectedPreset(undefined);
  }, []);

  // Handle pacing change
  const handlePacingChange = useCallback((pacing: typeof config.pacing) => {
    setConfig((prev) => ({ ...prev, pacing }));
    setSelectedPreset(undefined);
  }, []);

  // Handle parameter changes
  const handleParamChange = useCallback(<K extends keyof PerformanceConfig>(
    key: K,
    value: PerformanceConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSelectedPreset(undefined);
  }, []);

  // Save current config as preset
  const handleSaveAsPreset = useCallback((name: string) => {
    const preset = emotionController.createPreset({
      name,
      description: `Custom preset: ${config.emotion.type} at ${Math.round(config.emotion.intensity * 100)}%`,
      emotion: config.emotion,
      pacing: config.pacing,
      emphasis: 'auto',
      pitch: config.pitch,
      volume: config.volume,
      breathiness: config.breathiness,
      vibrato: config.vibrato,
    });
    setSelectedPreset(preset.id);
  }, [config]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    setConfig({ ...DEFAULT_PERFORMANCE });
    setSelectedPreset(undefined);
  }, []);

  // Generate preview
  const handlePreview = useCallback(() => {
    if (onGeneratePreview) {
      onGeneratePreview(config, previewText);
    }
  }, [config, previewText, onGeneratePreview]);

  // Section tabs
  const sections = [
    { id: 'presets' as const, label: 'Presets', icon: Bookmark },
    { id: 'emotion' as const, label: 'Emotion', icon: Heart },
    { id: 'pacing' as const, label: 'Pacing', icon: Gauge },
    { id: 'params' as const, label: 'Voice', icon: Sliders },
  ];

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
              <Music className="w-6 h-6 text-purple-400" />
              Performance Director
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Control emotion, pacing, and delivery style
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Reset
            </Button>
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 p-1 bg-slate-900/60 rounded-lg">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <AnimatePresence mode="wait">
          {activeSection === 'presets' && (
            <motion.div
              key="presets"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <DeliveryPresets
                selectedPreset={selectedPreset}
                onSelectPreset={handlePresetSelect}
                currentConfig={config}
                onSaveAsPreset={handleSaveAsPreset}
              />
            </motion.div>
          )}

          {activeSection === 'emotion' && (
            <motion.div
              key="emotion"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <EmotionPanel
                emotion={config.emotion}
                onChange={handleEmotionChange}
              />
            </motion.div>
          )}

          {activeSection === 'pacing' && (
            <motion.div
              key="pacing"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <PacingControls
                pacing={config.pacing}
                onChange={handlePacingChange}
              />
            </motion.div>
          )}

          {activeSection === 'params' && (
            <motion.div
              key="params"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              {/* Pitch */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-200">Pitch</label>
                  <span className="text-xs text-slate-500">
                    {config.pitch >= 0 ? '+' : ''}{Math.round(config.pitch * 100)}%
                  </span>
                </div>
                <Slider
                  value={config.pitch}
                  min={-0.5}
                  max={0.5}
                  step={0.05}
                  onChange={(value) => handleParamChange('pitch', value)}
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Lower</span>
                  <span>Normal</span>
                  <span>Higher</span>
                </div>
              </div>

              {/* Volume */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-200">Volume</label>
                  <span className="text-xs text-slate-500">
                    {Math.round(config.volume * 100)}%
                  </span>
                </div>
                <Slider
                  value={config.volume}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(value) => handleParamChange('volume', value)}
                />
              </div>

              {/* Breathiness */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-200">Breathiness</label>
                  <span className="text-xs text-slate-500">
                    {Math.round(config.breathiness * 100)}%
                  </span>
                </div>
                <Slider
                  value={config.breathiness}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(value) => handleParamChange('breathiness', value)}
                />
                <p className="text-[10px] text-slate-500">
                  Add airy quality to the voice
                </p>
              </div>

              {/* Vibrato */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-200">Vibrato</label>
                  <span className="text-xs text-slate-500">
                    {Math.round(config.vibrato * 100)}%
                  </span>
                </div>
                <Slider
                  value={config.vibrato}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(value) => handleParamChange('vibrato', value)}
                />
                <p className="text-[10px] text-slate-500">
                  Add natural voice variation
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Preview Section */}
      <div className="p-6 border-t border-slate-800 bg-slate-900/30">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-200">Preview Text</label>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePreview}
              disabled={!onGeneratePreview}
            >
              <Play className="w-4 h-4 mr-1.5" />
              Generate Preview
            </Button>
          </div>
          <textarea
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            className="w-full h-20 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-purple-500/50"
            placeholder="Enter text to preview..."
          />
        </div>

        {/* Current config summary */}
        <div className="mt-4 p-3 rounded-lg bg-slate-900/60 border border-slate-800/50">
          <div className="grid grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">Emotion</span>
              <span className="text-slate-300 capitalize">{config.emotion.type}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Intensity</span>
              <span className="text-slate-300">{Math.round(config.emotion.intensity * 100)}%</span>
            </div>
            <div>
              <span className="text-slate-500 block">Speed</span>
              <span className="text-slate-300">{(config.pacing.speed * 100).toFixed(0)}%</span>
            </div>
            <div>
              <span className="text-slate-500 block">Preset</span>
              <span className="text-slate-300">
                {selectedPreset
                  ? emotionController.getPreset(selectedPreset)?.name || 'Custom'
                  : 'Custom'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
