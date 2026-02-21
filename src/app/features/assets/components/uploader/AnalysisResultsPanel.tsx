'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Clock,
  AlertCircle,
  Sparkles,
  Tag,
  Palette,
  Gauge,
  ChevronDown,
  Star,
  Sun,
  Eye,
  ThermometerSun,
  Lightbulb,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { AnalysisResult, DetectedAsset } from '../../types';
import type {
  FullAnalysisResult,
  TagSuggestion,
  ColorAnalysis,
  QualityAssessment,
} from '@/lib/assets';

interface AnalysisResultsPanelProps {
  results: AnalysisResult[];
  isLoading?: boolean;
  // Enhanced analysis results
  enhancedAnalysis?: FullAnalysisResult | null;
}

function AssetCard({ asset, index }: { asset: DetectedAsset; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      className="group relative p-3 rounded-lg bg-slate-900/50 border border-slate-800/60
        hover:border-cyan-500/30 hover:bg-slate-900/70 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-slate-200 truncate flex-1">
          {asset.name}
        </h4>
        {asset.confidence && (
          <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
            {Math.round(asset.confidence * 100)}%
          </span>
        )}
      </div>

      {/* Description */}
      {asset.description && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-2">
          {asset.description}
        </p>
      )}

      {/* Category badge */}
      <div className="flex items-center gap-1.5 mb-2">
        <Package className="w-3 h-3 text-slate-500" />
        <span className="text-[11px] text-slate-400">{asset.category}</span>
      </div>

      {/* Tags */}
      {asset.tags && asset.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {asset.tags.slice(0, 4).map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px]
                text-slate-400 bg-slate-800/60 rounded"
            >
              <Tag className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
          {asset.tags.length > 4 && (
            <span className="text-[10px] text-slate-500">
              +{asset.tags.length - 4}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

function ModelSection({ result }: { result: AnalysisResult }) {
  const modelColors: Record<string, string> = {
    gemini: 'text-blue-400',
    groq: 'text-orange-400',
    openai: 'text-green-400',
  };

  return (
    <div className="space-y-3">
      {/* Model header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className={`w-4 h-4 ${modelColors[result.model] || 'text-slate-400'}`} />
          <span className="text-sm font-medium text-slate-200 capitalize">
            {result.model}
          </span>
          <span className="text-[10px] text-slate-500 bg-slate-800/60 px-1.5 py-0.5 rounded">
            {result.assets.length} detected
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-500">
          <Clock className="w-3 h-3" />
          {result.processingTime}ms
        </div>
      </div>

      {/* Error state */}
      {result.error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">{result.error}</p>
        </div>
      )}

      {/* Assets grid */}
      {result.assets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {result.assets.map((asset, index) => (
            <AssetCard key={`${result.model}-${index}`} asset={asset} index={index} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {result.assets.length === 0 && !result.error && (
        <p className="text-xs text-slate-500 italic">No assets detected</p>
      )}
    </div>
  );
}

// Tag category colors
const tagCategoryColors: Record<string, string> = {
  content: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  style: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  mood: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  technical: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

// Tag suggestions section
function TagSuggestionsSection({ tags }: { tags: TagSuggestion[] }) {
  const [showAll, setShowAll] = useState(false);
  const displayTags = showAll ? tags : tags.slice(0, 8);

  if (tags.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Tag className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-medium text-slate-300">Suggested Tags</span>
        <span className="text-[10px] text-slate-500">({tags.length})</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {displayTags.map((tag, i) => (
          <span
            key={i}
            className={clsx(
              'inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border',
              tagCategoryColors[tag.category]
            )}
            title={`${tag.category} tag (${Math.round(tag.confidence * 100)}% confidence)`}
          >
            {tag.tag}
            <span className="opacity-60">{Math.round(tag.confidence * 100)}%</span>
          </span>
        ))}
        {tags.length > 8 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-[11px] text-slate-400 hover:text-slate-200 px-2"
          >
            {showAll ? 'Show less' : `+${tags.length - 8} more`}
          </button>
        )}
      </div>
    </div>
  );
}

// Color analysis section
function ColorAnalysisSection({ colors }: { colors: ColorAnalysis }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-medium text-slate-300">Color Analysis</span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {/* Color palette */}
        <div className="flex gap-1">
          {colors.palette.slice(0, 6).map((color, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-md border border-slate-700"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        {/* Characteristics */}
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
            <Sun className="w-3 h-3" />
            {colors.brightness}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
            <ThermometerSun className="w-3 h-3" />
            {colors.temperature}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
            <Palette className="w-3 h-3" />
            {colors.saturation}
          </span>
        </div>
      </div>
    </div>
  );
}

// Quality assessment section
function QualitySection({ quality }: { quality: QualityAssessment }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Gauge className="w-4 h-4 text-green-400" />
        <span className="text-xs font-medium text-slate-300">Quality Assessment</span>
        <span className={clsx('text-sm font-bold', getScoreColor(quality.overall))}>
          {quality.overall}/100
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Sharpness', value: quality.sharpness },
          { label: 'Exposure', value: quality.exposure },
          { label: 'Noise', value: quality.noise },
          { label: 'Composition', value: quality.composition },
        ].map((item) => (
          <div key={item.label} className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500">{item.label}</span>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.value}%` }}
                transition={{ duration: 0.5 }}
                className={clsx(
                  'h-full rounded-full',
                  item.value >= 80 ? 'bg-green-500' :
                  item.value >= 60 ? 'bg-amber-500' : 'bg-red-500'
                )}
              />
            </div>
          </div>
        ))}
      </div>
      {quality.issues.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {quality.issues.map((issue, i) => (
            <span key={i} className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
              {issue}
            </span>
          ))}
        </div>
      )}
      {quality.recommendations.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {quality.recommendations.map((rec, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
              <Lightbulb className="w-3 h-3" />
              {rec}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Style analysis section
function StyleSection({ style, metadata }: { style: FullAnalysisResult['styleAnalysis']; metadata: FullAnalysisResult['metadata'] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-medium text-slate-300">Style & Metadata</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
          <span className="text-[10px] text-slate-500 block mb-1">Style</span>
          <span className="text-xs text-slate-200">{style.style}</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
          <span className="text-[10px] text-slate-500 block mb-1">Mood</span>
          <span className="text-xs text-slate-200">{style.mood}</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
          <span className="text-[10px] text-slate-500 block mb-1">Category</span>
          <span className="text-xs text-slate-200">{metadata.category}</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
          <span className="text-[10px] text-slate-500 block mb-1">Suggested Name</span>
          <span className="text-xs text-slate-200">{metadata.suggestedName}</span>
        </div>
      </div>
      {metadata.description && (
        <p className="text-[11px] text-slate-400 italic">
          {metadata.description}
        </p>
      )}
    </div>
  );
}

export default function AnalysisResultsPanel({
  results,
  isLoading = false,
  enhancedAnalysis,
}: AnalysisResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<'ai' | 'enhanced'>('ai');
  const hasResults = results.length > 0;
  const hasEnhanced = enhancedAnalysis !== null && enhancedAnalysis !== undefined;
  const totalAssets = results.reduce((sum, r) => sum + r.assets.length, 0);

  return (
    <AnimatePresence mode="wait">
      {(hasResults || isLoading || hasEnhanced) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          <div className="pt-4 border-t border-slate-800/50">
            {/* Results header with tabs */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <Package className="w-4 h-4 text-cyan-400" />
                Analysis Results
              </h3>
              {(hasResults && hasEnhanced) && (
                <div className="flex gap-1 p-0.5 bg-slate-900/60 rounded-md border border-slate-800/50">
                  <button
                    onClick={() => setActiveTab('ai')}
                    className={clsx(
                      'px-2 py-1 rounded text-[10px] font-medium transition-colors',
                      activeTab === 'ai'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-slate-400 hover:text-slate-200'
                    )}
                  >
                    AI Models
                  </button>
                  <button
                    onClick={() => setActiveTab('enhanced')}
                    className={clsx(
                      'px-2 py-1 rounded text-[10px] font-medium transition-colors',
                      activeTab === 'enhanced'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'text-slate-400 hover:text-slate-200'
                    )}
                  >
                    Smart Analysis
                  </button>
                </div>
              )}
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-900/30 border border-slate-800/40">
                <div className="w-5 h-5 border-2 border-cyan-500/40 border-t-cyan-500 rounded-full animate-spin" />
                <span className="text-sm text-slate-400">Analyzing image...</span>
              </div>
            )}

            {/* AI Model Results */}
            {!isLoading && hasResults && (activeTab === 'ai' || !hasEnhanced) && (
              <div className="space-y-6">
                {results.map((result) => (
                  <ModelSection key={result.model} result={result} />
                ))}
              </div>
            )}

            {/* Enhanced Analysis Results */}
            {!isLoading && hasEnhanced && activeTab === 'enhanced' && enhancedAnalysis && (
              <div className="space-y-4">
                <TagSuggestionsSection tags={enhancedAnalysis.tags} />
                <ColorAnalysisSection colors={enhancedAnalysis.colors} />
                <QualitySection quality={enhancedAnalysis.quality} />
                <StyleSection
                  style={enhancedAnalysis.styleAnalysis}
                  metadata={enhancedAnalysis.metadata}
                />

                {/* Processing time */}
                <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-2 border-t border-slate-800/50">
                  <Clock className="w-3 h-3" />
                  Analyzed in {enhancedAnalysis.processingTime}ms
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
