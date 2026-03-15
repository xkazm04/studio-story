/**
 * ArtStyleEditor Component
 * Main editor for story art style with preset, custom, Style DNA, and Evolution modes
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { fadeInUp, NORMAL } from '@/lib/animations';
import { Palette, Save, Check, Dna, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/UI/Button';
import { EmptyState } from '@/app/components/UI/EmptyState';
import { ArtStylePresetSelector } from './components/ArtStylePresetSelector';
import { ArtStyleExtractor } from './components/ArtStyleExtractor';
import { StyleDNAPanel } from './components/StyleDNAPanel';
import { MoodAdapter } from './components/MoodAdapter';
import { SceneTypeRules } from './components/SceneTypeRules';
import { VariationPreview } from './components/VariationPreview';
import { ColorHarmonyPalette } from './components/ColorHarmonyPalette';
import { ArtStyleSource } from './types';
import type { StyleDNAConfig } from '@/lib/style';
import {
  styleVariationManager,
  type EmotionalMood,
  type SceneType,
  type StyleVariationConfig,
} from '@/lib/style';

interface ArtStyleEditorProps {
  projectId: string;
  initialStyleId?: string | null;
  initialCustomPrompt?: string | null;
  initialSource?: ArtStyleSource | null;
  initialExtractedImageUrl?: string | null;
  onSave?: (data: {
    artStyleId: string | null;
    customArtStylePrompt: string | null;
    artStyleSource: ArtStyleSource;
    extractedStyleImageUrl: string | null;
  }) => void;
}

export default function ArtStyleEditor({
  projectId,
  initialStyleId = 'adventure_journal',
  initialCustomPrompt = '',
  initialSource = 'preset',
  initialExtractedImageUrl = null,
  onSave,
}: ArtStyleEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [savedRecently, setSavedRecently] = useState(false);
  const [activeTab, setActiveTab] = useState<'preset' | 'custom' | 'dna' | 'evolution'>(
    initialSource === 'preset' ? 'preset' : 'custom'
  );
  const [styleDNAConfig, setStyleDNAConfig] = useState<StyleDNAConfig | null>(null);

  // Style Evolution state
  const [variationConfig, setVariationConfig] = useState<StyleVariationConfig | null>(null);
  const [selectedMood, setSelectedMood] = useState<EmotionalMood>('neutral');
  const [selectedSceneTypes, setSelectedSceneTypes] = useState<SceneType[]>([]);

  // Initialize or get variation config when Style DNA config changes
  useEffect(() => {
    if (styleDNAConfig) {
      let config = styleVariationManager.getActiveConfig();
      if (!config) {
        config = styleVariationManager.createConfig(
          `${styleDNAConfig.name} Variations`,
          styleDNAConfig.id
        );
        styleVariationManager.setActiveConfig(config.id);
      }
      setVariationConfig(config);
    }
  }, [styleDNAConfig]);

  // Local state for editing
  const [selectedStyleId, setSelectedStyleId] = useState(
    initialStyleId || 'adventure_journal'
  );
  const [customPrompt, setCustomPrompt] = useState(initialCustomPrompt || '');
  const [extractedImageUrl, setExtractedImageUrl] = useState<string | null>(
    initialExtractedImageUrl
  );
  const [artStyleSource, setArtStyleSource] = useState<ArtStyleSource>(
    initialSource || 'preset'
  );

  const handlePresetSelect = useCallback((styleId: string) => {
    setSelectedStyleId(styleId);
    setArtStyleSource('preset');
    setActiveTab('preset');
  }, []);

  const handleCustomPromptChange = useCallback((prompt: string) => {
    setCustomPrompt(prompt);
    setArtStyleSource('custom');
  }, []);

  const handleExtract = useCallback((imageUrl: string, prompt: string) => {
    setExtractedImageUrl(imageUrl);
    setCustomPrompt(prompt);
    setArtStyleSource('extracted');
  }, []);

  const handleClearCustom = useCallback(() => {
    setCustomPrompt('');
    setExtractedImageUrl(null);
    setArtStyleSource('preset');
    setActiveTab('preset');
  }, []);

  const handleStyleDNAChange = useCallback((config: StyleDNAConfig | null) => {
    setStyleDNAConfig(config);
    if (config) {
      setArtStyleSource('extracted'); // Use 'extracted' as the source type for DNA-based styles
    }
  }, []);

  const queryClient = useQueryClient();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const data = {
        artStyleId: activeTab === 'preset' ? selectedStyleId : null,
        customArtStylePrompt: activeTab === 'custom' ? customPrompt : null,
        artStyleSource: activeTab === 'preset' ? 'preset' as const : artStyleSource,
        extractedStyleImageUrl:
          activeTab === 'custom' && artStyleSource === 'extracted'
            ? extractedImageUrl
            : null,
      };

      // Call API to save
      await fetch(`/api/projects/${projectId}/art-style`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      // Optimistic update via React Query invalidation
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });

      onSave?.(data);
      setSavedRecently(true);
      setTimeout(() => setSavedRecently(false), 2000);
    } catch (err) {
      console.error('Failed to save art style:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    (activeTab === 'preset' &&
      (selectedStyleId !== initialStyleId || initialSource !== 'preset')) ||
    (activeTab === 'custom' &&
      (customPrompt !== initialCustomPrompt || artStyleSource !== initialSource)) ||
    (activeTab === 'dna' && styleDNAConfig !== null) ||
    (activeTab === 'evolution' && (selectedMood !== 'neutral' || selectedSceneTypes.length > 0));

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={NORMAL}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
          <Palette className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h2 className="ms-h3">Story Art Style</h2>
          <p className="ms-caption">
            This style applies to all scene images in your story
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg">
        <button
          onClick={() => setActiveTab('preset')}
          className={cn(
            'flex-1 px-2 py-2 text-sm font-medium rounded-md transition-all',
            activeTab === 'preset'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          )}
        >
          Presets
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={cn(
            'flex-1 px-2 py-2 text-sm font-medium rounded-md transition-all',
            activeTab === 'custom'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          )}
        >
          Custom
        </button>
        <button
          onClick={() => setActiveTab('dna')}
          className={cn(
            'flex-1 px-2 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-1',
            activeTab === 'dna'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          )}
        >
          <Dna className="w-3 h-3" />
          DNA
        </button>
        <button
          onClick={() => setActiveTab('evolution')}
          className={cn(
            'flex-1 px-2 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-1',
            activeTab === 'evolution'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          )}
        >
          <Sparkles className="w-3 h-3" />
          Evolution
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === 'preset' && (
          <ArtStylePresetSelector
            selectedStyleId={selectedStyleId}
            onSelect={handlePresetSelect}
            disabled={isSaving}
          />
        )}
        {activeTab === 'custom' && (
          <ArtStyleExtractor
            customPrompt={customPrompt}
            extractedImageUrl={extractedImageUrl}
            onExtract={handleExtract}
            onCustomPromptChange={handleCustomPromptChange}
            onClear={handleClearCustom}
            disabled={isSaving}
          />
        )}
        {activeTab === 'dna' && (
          <StyleDNAPanel
            projectId={projectId}
            onStyleChange={handleStyleDNAChange}
            disabled={isSaving}
          />
        )}
        {activeTab === 'evolution' && variationConfig && (
          <div className="space-y-6">
            {/* Mood Adapter */}
            <MoodAdapter
              configId={variationConfig.id}
              selectedMood={selectedMood}
              onMoodSelect={setSelectedMood}
              disabled={isSaving}
            />

            {/* Scene Type Rules */}
            <SceneTypeRules
              configId={variationConfig.id}
              selectedSceneTypes={selectedSceneTypes}
              onSceneTypesChange={setSelectedSceneTypes}
              disabled={isSaving}
            />

            {/* Variation Preview */}
            <VariationPreview
              configId={variationConfig.id}
              baseStyleId={styleDNAConfig?.id}
              mood={selectedMood}
              sceneTypes={selectedSceneTypes}
              disabled={isSaving}
            />
          </div>
        )}
        {activeTab === 'evolution' && !variationConfig && (
          <EmptyState
            icon={<Sparkles />}
            iconSize="sm"
            title="Create a Style DNA configuration first to enable style evolution"
            action={{ label: 'Go to Style DNA', onClick: () => setActiveTab('dna') }}
            variant="compact"
            className="p-6 rounded-lg bg-slate-800/30 border border-slate-700"
          />
        )}
      </div>

      {/* Color Harmony Palette */}
      <ColorHarmonyPalette disabled={isSaving} />

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <div className="text-sm text-slate-400">
          {hasChanges ? 'Unsaved changes' : 'No changes'}
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          variant="primary"
          size="sm"
          loading={isSaving}
          icon={savedRecently ? <Check /> : <Save />}
        >
          {isSaving ? 'Saving...' : savedRecently ? 'Saved' : 'Save Style'}
        </Button>
      </div>
    </motion.div>
  );
}
