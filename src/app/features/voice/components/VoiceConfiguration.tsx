'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Voice, VoiceConfig } from '@/app/types/Voice';
import { useVoiceConfig, useUpdateVoiceConfig } from '@/app/hooks/useVoices';
import { Loader2, Save, RotateCcw } from 'lucide-react';

interface VoiceConfigurationProps {
  voice: Voice;
}

interface SliderConfig {
  field: keyof Pick<VoiceConfig, 'stability' | 'similarity_boost' | 'style' | 'speed'>;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

const sliderConfigs: SliderConfig[] = [
  {
    field: 'stability',
    label: 'Stability',
    description: 'Higher values improve consistency, lower values add variability',
    min: 0,
    max: 1,
    step: 0.01,
    defaultValue: 0.5,
  },
  {
    field: 'similarity_boost',
    label: 'Similarity',
    description: 'Higher values make the voice closer to the original recordings',
    min: 0,
    max: 1,
    step: 0.01,
    defaultValue: 0.75,
  },
  {
    field: 'style',
    label: 'Style',
    description: 'Higher values increase expressiveness and emotional range',
    min: 0,
    max: 1,
    step: 0.01,
    defaultValue: 0.5,
  },
  {
    field: 'speed',
    label: 'Speed',
    description: 'Adjust speaking pace (0.5 = half speed, 2.0 = double speed)',
    min: 0.5,
    max: 2.0,
    step: 0.1,
    defaultValue: 1.0,
  },
];

const VoiceConfiguration = ({ voice }: VoiceConfigurationProps) => {
  const { data: voiceConfig, isLoading, error, refetch } = useVoiceConfig(voice.voice_id);
  const { mutate: updateConfig, isPending: isSaving } = useUpdateVoiceConfig();
  const [localConfig, setLocalConfig] = useState<VoiceConfig | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (voiceConfig) {
      setLocalConfig(voiceConfig);
      setHasChanges(false);
    }
  }, [voiceConfig]);

  const handleSliderChange = (field: keyof VoiceConfig, value: number) => {
    if (!localConfig) return;

    setLocalConfig({ ...localConfig, [field]: value });
    setHasChanges(true);
    setSaveError('');
  };

  const handleSave = () => {
    if (!localConfig) return;

    updateConfig(localConfig, {
      onSuccess: () => {
        setHasChanges(false);
        refetch();
      },
      onError: (error) => {
        setSaveError('Failed to save: ' + error.message);
      },
    });
  };

  const handleReset = () => {
    if (voiceConfig) {
      setLocalConfig(voiceConfig);
      setHasChanges(false);
      setSaveError('');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        <span className="ml-2 text-gray-400">Loading configuration...</span>
      </div>
    );
  }

  if (error || !localConfig) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
        Failed to load voice configuration
      </div>
    );
  }

  return (
    <div className="bg-gray-950/50 p-6 space-y-6">
      {sliderConfigs.map((slider, index) => {
        const value = localConfig[slider.field] as number;

        return (
          <motion.div
            key={slider.field}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-200">{slider.label}</label>
              <span className="text-sm font-mono text-emerald-400">{value.toFixed(2)}</span>
            </div>

            <input
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={value}
              onChange={(e) => handleSliderChange(slider.field, parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-emerald-500
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:shadow-emerald-500/50
                [&::-moz-range-thumb]:w-4
                [&::-moz-range-thumb]:h-4
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-emerald-500
                [&::-moz-range-thumb]:cursor-pointer
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:shadow-lg
                [&::-moz-range-thumb]:shadow-emerald-500/50"
            />

            <p className="text-xs text-gray-500">{slider.description}</p>
          </motion.div>
        );
      })}

      {/* Save/Reset Buttons */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 pt-4 border-t border-gray-700/50"
        >
          <button
            onClick={handleReset}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 flex-1"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Configuration
              </>
            )}
          </button>
        </motion.div>
      )}

      {saveError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-red-400 mt-2"
        >
          {saveError}
        </motion.div>
      )}
    </div>
  );
};

export default VoiceConfiguration;
