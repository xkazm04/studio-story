/**
 * AvatarGenerator - Main orchestrator for character avatar generation
 * Design: Clean Manuscript style with cyan accents
 *
 * Features:
 * - Single avatar generation with style presets
 * - Expression library with 12+ emotions
 * - Pose and angle selection
 * - Batch generation for expression sets
 * - Expression blending for mixed emotions
 * - Sprite sheet export
 */

'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  XCircle,
  Sparkles,
  RefreshCw,
  Image,
  Layers,
  Blend,
  Download,
  Smile,
  Shirt,
  Clock,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { extractData } from '@/app/utils/api';
import { Appearance } from '@/app/types/Character';
import { useAvatarGenerator, GeneratedAvatar, OutfitInfo } from '../hooks/useAvatarGenerator';
import StyleSelector from './components/StyleSelector';
import ReferenceSelector from './components/ReferenceSelector';
import AvatarGrid from './components/AvatarGrid';
import CurrentAvatar from './components/CurrentAvatar';
import ExpressionLibrary, { Expression, buildExpressionPrompt } from './components/ExpressionLibrary';
import PoseSelector, { Pose, Angle, buildPoseAnglePrompt } from './components/PoseSelector';
import BatchGenerator from './components/BatchGenerator';
import ExpressionBlender, { BlendResult } from './components/ExpressionBlender';
import AvatarSheetExporter from './components/AvatarSheetExporter';
import OutfitSelector from './components/OutfitSelector';
import AgeProgressor, { buildAgePrompt, getAgingModifier } from './components/AgeProgressor';
import { useAvatarTimeline } from '@/app/hooks/integration/useAvatarTimeline';
import type { AgeStage } from '@/app/hooks/integration/useAvatarTimeline';
import { GENERATION_PRESETS } from '../lib/promptComposer';

// ============================================================================
// Types
// ============================================================================

interface AvatarGeneratorProps {
  characterId: string;
  characterName: string;
  appearance: Appearance;
  artStyle?: string;
  currentAvatarUrl?: string;
  onAvatarUpdated?: (avatar: GeneratedAvatar) => Promise<void>;
}

type TabId = 'single' | 'expression' | 'outfit' | 'age' | 'batch' | 'blend' | 'export';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  description: string;
}

// ============================================================================
// Constants
// ============================================================================

const TABS: Tab[] = [
  {
    id: 'single',
    label: 'single',
    icon: <Image size={14} />,
    description: 'Generate single avatar',
  },
  {
    id: 'expression',
    label: 'expression',
    icon: <Smile size={14} />,
    description: 'Select expression & pose',
  },
  {
    id: 'outfit',
    label: 'outfit',
    icon: <Shirt size={14} />,
    description: 'Generate with outfit',
  },
  {
    id: 'age',
    label: 'age',
    icon: <Clock size={14} />,
    description: 'Age progression timeline',
  },
  {
    id: 'batch',
    label: 'batch',
    icon: <Layers size={14} />,
    description: 'Generate multiple expressions',
  },
  {
    id: 'blend',
    label: 'blend',
    icon: <Blend size={14} />,
    description: 'Mix emotions together',
  },
  {
    id: 'export',
    label: 'export',
    icon: <Download size={14} />,
    description: 'Create sprite sheets',
  },
];

// ============================================================================
// Main Component
// ============================================================================

const AvatarGenerator: React.FC<AvatarGeneratorProps> = ({
  characterId,
  characterName,
  appearance,
  artStyle,
  currentAvatarUrl,
  onAvatarUpdated,
}) => {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabId>('single');

  // Expression/Pose state (for expression tab)
  const [selectedExpression, setSelectedExpression] = useState<Expression | null>(null);
  const [selectedPose, setSelectedPose] = useState<Pose | null>(null);
  const [selectedAngle, setSelectedAngle] = useState<Angle | null>(null);
  const [expressionIntensity, setExpressionIntensity] = useState(50);

  // Avatar updating state
  const [isUpdating, setIsUpdating] = useState(false);

  // Age progression state
  const [ageStage, setAgeStage] = useState<AgeStage>('young_adult');
  const [estimatedAge, setEstimatedAge] = useState<number>(25);
  const [agedAvatars, setAgedAvatars] = useState<GeneratedAvatar[]>([]);
  const [selectedAgedAvatar, setSelectedAgedAvatar] = useState<GeneratedAvatar | null>(null);
  const [isGeneratingAged, setIsGeneratingAged] = useState(false);
  const [pendingAgeProgression, setPendingAgeProgression] = useState<{
    fromStage: AgeStage;
    toStage: AgeStage;
    age: number;
  } | null>(null);

  // Avatar timeline hook for recording progressions
  const {
    latestEntry,
    recordAgeProgression,
    isCreating: isRecordingProgression,
  } = useAvatarTimeline(characterId);

  // All generated avatars (for export)
  const [allAvatars, setAllAvatars] = useState<GeneratedAvatar[]>([]);

  const {
    selectedStyle,
    referenceImage,
    composedPrompt,
    avatars,
    selectedAvatar,
    isComposing,
    isGenerating,
    error,
    currentOutfit,
    setSelectedStyle,
    setReferenceImage,
    setOutfit,
    generateAvatars,
    selectAvatar,
    setAsCharacterAvatar,
    reset,
    cancel,
  } = useAvatarGenerator({
    characterId,
    appearance,
    artStyle,
    currentAvatarUrl,
    onAvatarSelected: async (avatar) => {
      if (onAvatarUpdated) {
        setIsUpdating(true);
        try {
          await onAvatarUpdated(avatar);
        } finally {
          setIsUpdating(false);
        }
      }
    },
  });

  // Track all generated avatars for export
  React.useEffect(() => {
    if (avatars.length > 0) {
      setAllAvatars(prev => {
        const existingIds = new Set(prev.map(a => a.id));
        const newAvatars = avatars.filter(a => !existingIds.has(a.id));
        return [...prev, ...newAvatars];
      });
    }
  }, [avatars]);

  const isLoading = isComposing || isGenerating;

  // Build enhanced prompt with expression/pose modifiers
  const enhancedPromptModifiers = useMemo(() => {
    const parts: string[] = [];

    if (selectedExpression) {
      parts.push(buildExpressionPrompt(selectedExpression, expressionIntensity));
    }

    if (selectedPose || selectedAngle) {
      parts.push(buildPoseAnglePrompt(selectedPose, selectedAngle));
    }

    return parts.join(', ');
  }, [selectedExpression, expressionIntensity, selectedPose, selectedAngle]);

  const handleSetAsAvatar = async () => {
    setAsCharacterAvatar();
  };

  const handleBlendComplete = (result: BlendResult) => {
    // Could trigger generation with blended prompt
    console.log('Blend result:', result);
  };

  const handleBatchItemGenerated = (item: { id: string; imageUrl?: string; prompt?: string }) => {
    if (item.imageUrl) {
      const avatar: GeneratedAvatar = {
        id: item.id,
        url: item.imageUrl,
        prompt: item.prompt || '',
        style: selectedStyle,
        createdAt: new Date().toISOString(),
      };
      setAllAvatars(prev => [...prev, avatar]);
    }
  };

  // Handle age progression generation
  const handleGenerateAged = async (stage: AgeStage, age: number) => {
    setIsGeneratingAged(true);
    setAgedAvatars([]);
    setSelectedAgedAvatar(null);

    // Track from → to for recording later
    const fromStage = latestEntry?.age_stage || 'young_adult';
    setPendingAgeProgression({ fromStage, toStage: stage, age });

    try {
      // Compose base prompt with age modifier appended
      const composeRes = await fetch('/api/ai/compose-avatar-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId,
          appearance,
          style: selectedStyle,
          artStyle,
        }),
      });

      if (!composeRes.ok) {
        const data = await composeRes.json();
        throw new Error(data.error || 'Failed to compose prompt');
      }

      const { prompt: basePrompt } = extractData<any>(await composeRes.json());
      const ageModifier = buildAgePrompt(stage, age);
      const fullPrompt = `${basePrompt}, ${ageModifier}`;

      // Generate images
      const preset = GENERATION_PRESETS.avatar;
      const requestBody: Record<string, unknown> = {
        prompt: fullPrompt,
        numImages: preset.numImages,
        width: preset.width,
        height: preset.height,
      };

      if (currentAvatarUrl) {
        requestBody.referenceImages = [currentAvatarUrl];
        requestBody.referenceStrength = 0.5;
      }

      const genRes = await fetch('/api/ai/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!genRes.ok) {
        const data = await genRes.json();
        throw new Error(data.error || 'Failed to generate aged avatars');
      }

      const genData = extractData<any>(await genRes.json());
      const generated: GeneratedAvatar[] = genData.images.map((url: string, index: number) => ({
        id: `aged-${Date.now()}-${index}`,
        url,
        prompt: fullPrompt,
        style: selectedStyle,
        createdAt: new Date().toISOString(),
      }));

      setAgedAvatars(generated);
      setAllAvatars(prev => [...prev, ...generated]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate aged avatar';
      console.error('Age generation failed:', message);
    } finally {
      setIsGeneratingAged(false);
    }
  };

  // Handle selecting an aged avatar → auto-record to timeline
  const handleSelectAgedAvatar = async (avatar: GeneratedAvatar) => {
    setSelectedAgedAvatar(avatar);

    if (pendingAgeProgression) {
      const { fromStage, toStage, age } = pendingAgeProgression;
      const modifier = getAgingModifier(toStage);
      const visualChanges = [
        ...modifier.physicalChanges.map(change => `physical: ${change}`),
        ...modifier.facialChanges.map(change => `facial: ${change}`),
      ].join('; ');

      try {
        await recordAgeProgression(
          avatar.url,
          fromStage,
          toStage,
          `Aged to ${toStage.replace('_', ' ')} (~${age}y). Changes: ${visualChanges}`,
        );
      } catch (err) {
        console.error('Failed to record age progression:', err);
      }
    }
  };

  const clearAllAvatars = () => {
    setAllAvatars([]);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-sm uppercase tracking-wide text-slate-300">
            // avatar_generator
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            create stylized avatars for {characterName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isLoading && (
            <button
              onClick={cancel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-sm uppercase tracking-wide
                         bg-red-600/80 hover:bg-red-600 text-white transition-all"
            >
              <XCircle className="w-3.5 h-3.5" />
              cancel
            </button>
          )}
          <button
            onClick={reset}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-sm uppercase tracking-wide
                       bg-slate-700 hover:bg-slate-600 text-slate-200 transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            reset
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-800/40 rounded-lg border border-slate-700/30">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-md font-mono text-sm uppercase tracking-wide transition-all',
              activeTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="font-mono text-sm text-red-400">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Single Avatar Tab */}
          {activeTab === 'single' && (
            <div className="space-y-4">
              {/* Current Avatar Display */}
              <CurrentAvatar
                currentAvatarUrl={currentAvatarUrl}
                selectedAvatar={selectedAvatar}
                onSetAsAvatar={handleSetAsAvatar}
                isUpdating={isUpdating}
              />

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column: Style & Reference */}
                <div className="space-y-4">
                  <StyleSelector
                    selectedStyle={selectedStyle}
                    onSelectStyle={setSelectedStyle}
                    disabled={isLoading}
                  />

                  <ReferenceSelector
                    referenceImage={referenceImage}
                    onSetReference={setReferenceImage}
                    currentAvatarUrl={currentAvatarUrl}
                    disabled={isLoading}
                  />

                  {/* Outfit Selector */}
                  <OutfitSelector
                    characterId={characterId}
                    selectedOutfit={currentOutfit}
                    onSelectOutfit={setOutfit}
                    disabled={isLoading}
                  />

                  {/* Prompt Preview (collapsed) */}
                  {composedPrompt && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/30"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm text-slate-400 uppercase">
                          composed_prompt
                        </span>
                      </div>
                      <p className="font-mono text-sm text-slate-400 line-clamp-3">
                        {composedPrompt}
                      </p>
                    </motion.div>
                  )}

                  {/* Generate Button */}
                  <button
                    onClick={generateAvatars}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-mono text-sm uppercase tracking-wide
                               bg-cyan-600 hover:bg-cyan-500 text-white
                               transition-all duration-200 shadow-lg hover:shadow-cyan-500/20
                               disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isGenerating ? 'generating_avatars...' : 'generate_avatars'}
                  </button>
                </div>

                {/* Right Column: Avatar Grid */}
                <AvatarGrid
                  avatars={avatars}
                  selectedAvatar={selectedAvatar}
                  onSelectAvatar={selectAvatar}
                  isLoading={isGenerating}
                />
              </div>
            </div>
          )}

          {/* Expression Tab */}
          {activeTab === 'expression' && (
            <div className="space-y-4">
              {/* Current Avatar Display */}
              <CurrentAvatar
                currentAvatarUrl={currentAvatarUrl}
                selectedAvatar={selectedAvatar}
                onSetAsAvatar={handleSetAsAvatar}
                isUpdating={isUpdating}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column: Expression & Pose Selection */}
                <div className="space-y-4">
                  <ExpressionLibrary
                    selectedExpression={selectedExpression}
                    onSelectExpression={setSelectedExpression}
                    intensity={expressionIntensity}
                    onIntensityChange={setExpressionIntensity}
                    disabled={isLoading}
                  />

                  <PoseSelector
                    selectedPose={selectedPose}
                    selectedAngle={selectedAngle}
                    onSelectPose={setSelectedPose}
                    onSelectAngle={setSelectedAngle}
                    disabled={isLoading}
                    compact
                  />

                  {/* Compact Outfit Selector */}
                  <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700/30">
                    <span className="font-mono text-sm text-slate-400 uppercase">outfit:</span>
                    <OutfitSelector
                      characterId={characterId}
                      selectedOutfit={currentOutfit}
                      onSelectOutfit={setOutfit}
                      disabled={isLoading}
                      compact
                    />
                  </div>

                  {/* Enhanced Prompt Preview */}
                  {(selectedExpression || selectedPose) && (
                    <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/30">
                      <span className="font-mono text-sm text-slate-400 uppercase block mb-2">
                        enhanced_prompt_modifiers
                      </span>
                      <p className="font-mono text-sm text-slate-400">
                        {enhancedPromptModifiers}
                      </p>
                    </div>
                  )}

                  {/* Generate Button */}
                  <button
                    onClick={generateAvatars}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-mono text-sm uppercase tracking-wide
                               bg-cyan-600 hover:bg-cyan-500 text-white
                               transition-all duration-200 shadow-lg hover:shadow-cyan-500/20
                               disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isGenerating ? 'generating...' : 'generate_with_expression'}
                  </button>
                </div>

                {/* Right Column: Avatar Grid */}
                <AvatarGrid
                  avatars={avatars}
                  selectedAvatar={selectedAvatar}
                  onSelectAvatar={selectAvatar}
                  isLoading={isGenerating}
                />
              </div>
            </div>
          )}

          {/* Outfit Tab */}
          {activeTab === 'outfit' && (
            <div className="space-y-4">
              {/* Current Avatar Display */}
              <CurrentAvatar
                currentAvatarUrl={currentAvatarUrl}
                selectedAvatar={selectedAvatar}
                onSetAsAvatar={handleSetAsAvatar}
                isUpdating={isUpdating}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column: Outfit Selection */}
                <div className="space-y-4">
                  <OutfitSelector
                    characterId={characterId}
                    selectedOutfit={currentOutfit}
                    onSelectOutfit={setOutfit}
                    disabled={isLoading}
                  />

                  <StyleSelector
                    selectedStyle={selectedStyle}
                    onSelectStyle={setSelectedStyle}
                    disabled={isLoading}
                  />

                  {/* Outfit Prompt Preview */}
                  {currentOutfit?.promptFragment && (
                    <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Shirt className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="font-mono text-sm text-slate-400 uppercase">
                          outfit_description
                        </span>
                      </div>
                      <p className="font-mono text-sm text-slate-400 italic">
                        "{currentOutfit.promptFragment}"
                      </p>
                    </div>
                  )}

                  {/* Generate Button */}
                  <button
                    onClick={generateAvatars}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-mono text-sm uppercase tracking-wide
                               bg-cyan-600 hover:bg-cyan-500 text-white
                               transition-all duration-200 shadow-lg hover:shadow-cyan-500/20
                               disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isGenerating ? 'generating...' : currentOutfit ? 'generate_with_outfit' : 'generate_avatar'}
                  </button>
                </div>

                {/* Right Column: Avatar Grid */}
                <AvatarGrid
                  avatars={avatars}
                  selectedAvatar={selectedAvatar}
                  onSelectAvatar={selectAvatar}
                  isLoading={isGenerating}
                />
              </div>
            </div>
          )}

          {/* Age Progression Tab */}
          {activeTab === 'age' && (
            <div className="space-y-4">
              {/* Current Avatar Display */}
              <CurrentAvatar
                currentAvatarUrl={currentAvatarUrl}
                selectedAvatar={selectedAgedAvatar}
                onSetAsAvatar={handleSetAsAvatar}
                isUpdating={isUpdating}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column: Age Controls */}
                <div className="space-y-4">
                  <AgeProgressor
                    currentStage={ageStage}
                    estimatedAge={estimatedAge}
                    onStageChange={setAgeStage}
                    onAgeChange={setEstimatedAge}
                    onGenerateAged={handleGenerateAged}
                    disabled={isGeneratingAged}
                  />

                  {/* Recording status */}
                  {isRecordingProgression && (
                    <div className="flex items-center gap-2 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                      <div className="w-3 h-3 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                      <span className="font-mono text-sm text-cyan-400">
                        Recording to timeline...
                      </span>
                    </div>
                  )}

                  {pendingAgeProgression && selectedAgedAvatar && !isRecordingProgression && (
                    <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <span className="font-mono text-sm text-green-400">
                        Recorded: {pendingAgeProgression.fromStage.replace('_', ' ')} → {pendingAgeProgression.toStage.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Column: Generated Aged Avatars */}
                <AvatarGrid
                  avatars={agedAvatars}
                  selectedAvatar={selectedAgedAvatar}
                  onSelectAvatar={handleSelectAgedAvatar}
                  isLoading={isGeneratingAged}
                />
              </div>
            </div>
          )}

          {/* Batch Tab */}
          {activeTab === 'batch' && (
            <BatchGenerator
              basePrompt={composedPrompt || ''}
              characterId={characterId}
              onItemGenerated={(item) => handleBatchItemGenerated({
                id: item.id,
                imageUrl: item.imageUrl,
                prompt: composedPrompt || '',
              })}
              disabled={!composedPrompt}
            />
          )}

          {/* Blend Tab */}
          {activeTab === 'blend' && (
            <ExpressionBlender
              onBlendComplete={handleBlendComplete}
              onPromptGenerated={(prompt) => console.log('Blended prompt:', prompt)}
              disabled={isLoading}
            />
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              {allAvatars.length > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-slate-400">
                      {allAvatars.length} avatars available for export
                    </span>
                    <button
                      onClick={clearAllAvatars}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800/40
                                 text-slate-400 hover:text-red-400 font-mono text-sm transition-colors"
                    >
                      <XCircle size={12} />
                      clear all
                    </button>
                  </div>
                  <AvatarSheetExporter
                    avatars={allAvatars}
                    characterName={characterName}
                    disabled={isLoading}
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Layers size={48} className="mb-4 opacity-50" />
                  <p className="font-mono text-sm mb-2">No avatars to export</p>
                  <p className="font-mono text-sm text-center max-w-md">
                    Generate avatars in the Single or Batch tabs first, then come back here to export them as a sprite sheet.
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Art Style Badge */}
      {artStyle && (
        <div className="flex items-center gap-2 p-3 bg-amber-500/5 rounded-lg border border-amber-500/20">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-mono text-sm text-amber-400/80 uppercase">
            project_art_style:
          </span>
          <span className="font-mono text-sm text-slate-300">
            {artStyle.length > 80 ? artStyle.substring(0, 80) + '...' : artStyle}
          </span>
        </div>
      )}
    </div>
  );
};

export default AvatarGenerator;
