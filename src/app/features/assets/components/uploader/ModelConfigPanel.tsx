'use client';

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExternalLink,
  Sparkles,
  ChevronDown,
  Tag,
  Palette,
  Gauge,
  Eye,
  Type,
} from 'lucide-react';
import type { AnalysisConfig } from '../../types';
import type { AnalysisOptions } from '@/lib/assets';

interface ModelConfigPanelProps {
  config: AnalysisConfig;
  onConfigChange: (config: AnalysisConfig) => void;
  analysisOptions?: AnalysisOptions;
  onAnalysisOptionsChange?: (options: AnalysisOptions) => void;
}

interface ModelChipProps {
  name: string;
  label: string;
  enabled: boolean;
  tooltip?: string;
  referenceUrl?: string;
  onToggle: (enabled: boolean) => void;
}

const ModelChip = memo(function ModelChip({
  name,
  label,
  enabled,
  tooltip,
  referenceUrl,
  onToggle,
}: ModelChipProps) {
  return (
    <div className="flex items-center gap-2">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onToggle(!enabled)}
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
          border transition-all duration-200
          ${
            enabled
              ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
              : 'bg-slate-900/60 border-slate-700/50 text-slate-400 hover:border-slate-600'
          }
        `}
        title={tooltip}
        data-testid={`model-toggle-${name}`}
      >
        {enabled && <Sparkles className="w-3 h-3" />}
        {label}
      </motion.button>

      {referenceUrl && (
        <a
          href={referenceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
          title="API documentation"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
});

const MODEL_CONFIG = [
  {
    name: 'groq',
    label: 'Groq',
    tooltip: 'llama-4-scout-17b-16e-instruct',
    referenceUrl: 'https://console.groq.com/docs/models',
  },
  {
    name: 'gemini',
    label: 'Gemini',
    tooltip: 'gemini-flash-latest',
    referenceUrl: 'https://ai.google.dev/gemini-api/docs/api-key',
  },
  {
    name: 'openai',
    label: 'OpenAI',
    tooltip: 'gpt-4-vision (coming soon)',
    referenceUrl: 'https://platform.openai.com/docs/guides/vision',
  },
] as const;

// Default analysis options
const DEFAULT_ANALYSIS_OPTIONS: AnalysisOptions = {
  generateTags: true,
  extractContent: true,
  analyzeColors: true,
  assessQuality: true,
  detectObjects: true,
  extractText: false,
};

// Analysis option configuration
const ANALYSIS_OPTIONS_CONFIG = [
  {
    key: 'generateTags' as const,
    label: 'Auto Tags',
    icon: Tag,
    description: 'Generate descriptive tags',
  },
  {
    key: 'analyzeColors' as const,
    label: 'Colors',
    icon: Palette,
    description: 'Analyze color palette',
  },
  {
    key: 'assessQuality' as const,
    label: 'Quality',
    icon: Gauge,
    description: 'Assess image quality',
  },
  {
    key: 'detectObjects' as const,
    label: 'Objects',
    icon: Eye,
    description: 'Detect objects & scenes',
  },
  {
    key: 'extractText' as const,
    label: 'OCR',
    icon: Type,
    description: 'Extract text from image',
  },
];

export default function ModelConfigPanel({
  config,
  onConfigChange,
  analysisOptions = DEFAULT_ANALYSIS_OPTIONS,
  onAnalysisOptionsChange,
}: ModelConfigPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleToggle = (model: keyof AnalysisConfig) => (enabled: boolean) => {
    onConfigChange({
      ...config,
      [model]: { enabled },
    });
  };

  const handleOptionToggle = (key: keyof AnalysisOptions) => {
    if (onAnalysisOptionsChange) {
      onAnalysisOptionsChange({
        ...analysisOptions,
        [key]: !analysisOptions[key],
      });
    }
  };

  const enabledCount = Object.values(config).filter((m) => m.enabled).length;
  const enabledOptionsCount = Object.values(analysisOptions).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4">
      {/* AI Models Section */}
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">AI Models</span>
          <span className="text-[10px] text-slate-500">
            {enabledCount} enabled
          </span>
        </div>

        {/* Model chips */}
        <div className="flex flex-wrap items-center gap-2">
          {MODEL_CONFIG.map((model) => (
            <ModelChip
              key={model.name}
              name={model.name}
              label={model.label}
              enabled={config[model.name as keyof AnalysisConfig]?.enabled || false}
              tooltip={model.tooltip}
              referenceUrl={model.referenceUrl}
              onToggle={handleToggle(model.name as keyof AnalysisConfig)}
            />
          ))}
        </div>

        {/* Validation message */}
        {enabledCount === 0 && (
          <p className="text-[11px] text-amber-400/80">
            Enable at least one model to analyze
          </p>
        )}
      </div>

      {/* Analysis Options Section */}
      {onAnalysisOptionsChange && (
        <div className="flex flex-col gap-3">
          {/* Collapsible header */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between text-xs text-slate-400 hover:text-slate-300 transition-colors"
          >
            <span className="font-medium">Analysis Options</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500">
                {enabledOptionsCount} active
              </span>
              <motion.div
                animate={{ rotate: showAdvanced ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </div>
          </button>

          {/* Options list */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 pt-1">
                  {ANALYSIS_OPTIONS_CONFIG.map((option) => {
                    const Icon = option.icon;
                    const isEnabled = analysisOptions[option.key];

                    return (
                      <motion.button
                        key={option.key}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleOptionToggle(option.key)}
                        className={`
                          inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium
                          border transition-all duration-200
                          ${
                            isEnabled
                              ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                              : 'bg-slate-900/60 border-slate-700/50 text-slate-400 hover:border-slate-600'
                          }
                        `}
                        title={option.description}
                      >
                        <Icon className="w-3 h-3" />
                        {option.label}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
