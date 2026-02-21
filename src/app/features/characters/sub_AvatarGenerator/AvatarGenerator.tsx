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
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
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

type TabId = 'single' | 'expression' | 'outfit' | 'batch' | 'blend' | 'export';

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
          <p className="text-xs text-slate-500 mt-1">
            create stylized avatars for {characterName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isLoading && (
            <button
              onClick={cancel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs uppercase tracking-wide
                         bg-red-600/80 hover:bg-red-600 text-white transition-all"
            >
              <XCircle className="w-3.5 h-3.5" />
              cancel
            </button>
          )}
          <button
            onClick={reset}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs uppercase tracking-wide
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
              'flex items-center gap-1.5 px-3 py-2 rounded-md font-mono text-xs uppercase tracking-wide transition-all',
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
            <span className="font-mono text-xs text-red-400">{error}</span>
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
                        <span className="font-mono text-[10px] text-slate-500 uppercase">
                          composed_prompt
                        </span>
                      </div>
                      <p className="font-mono text-[10px] text-slate-400 line-clamp-3">
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
                    <span className="font-mono text-[10px] text-slate-500 uppercase">outfit:</span>
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
                      <span className="font-mono text-[10px] text-slate-500 uppercase block mb-2">
                        enhanced_prompt_modifiers
                      </span>
                      <p className="font-mono text-[10px] text-slate-400">
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
                        <span className="font-mono text-[10px] text-slate-500 uppercase">
                          outfit_description
                        </span>
                      </div>
                      <p className="font-mono text-[10px] text-slate-400 italic">
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
                    <span className="font-mono text-xs text-slate-400">
                      {allAvatars.length} avatars available for export
                    </span>
                    <button
                      onClick={clearAllAvatars}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800/40
                                 text-slate-500 hover:text-red-400 font-mono text-xs transition-colors"
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
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <Layers size={48} className="mb-4 opacity-50" />
                  <p className="font-mono text-sm mb-2">No avatars to export</p>
                  <p className="font-mono text-xs text-center max-w-md">
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
          <span className="font-mono text-[10px] text-amber-400/80 uppercase">
            project_art_style:
          </span>
          <span className="font-mono text-xs text-slate-300">
            {artStyle.length > 80 ? artStyle.substring(0, 80) + '...' : artStyle}
          </span>
        </div>
      )}
    </div>
  );
};

export default AvatarGenerator;
