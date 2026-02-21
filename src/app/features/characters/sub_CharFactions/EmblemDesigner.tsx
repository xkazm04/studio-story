'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Upload, Play, Pause } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { FactionBranding } from '@/app/types/Faction';
import PhysicsPreview from './PhysicsPreview';
import EmblemSVGPreview from './EmblemSVGPreview';
import { EMBLEM_STYLES, ANIMATION_MODES } from './emblemConfig';
import type { EmblemStyle, AnimationMode } from './emblemConfig';

interface EmblemDesignerProps {
  currentBranding?: FactionBranding;
  onSave: (branding: Partial<FactionBranding>) => void;
  factionName: string;
  primaryColor: string;
}

const EmblemDesigner: React.FC<EmblemDesignerProps> = ({
  currentBranding,
  onSave,
  factionName,
  primaryColor,
}) => {
  const [selectedStyle, setSelectedStyle] = useState<EmblemStyle>(
    currentBranding?.emblem_style || 'shield'
  );
  const [customImage, setCustomImage] = useState<string | null>(
    currentBranding?.custom_logo_url || null
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [physicsEnabled, setPhysicsEnabled] = useState(false);
  const [animationMode, setAnimationMode] = useState<AnimationMode>('spin');

  useEffect(() => {
    if (currentBranding) {
      setSelectedStyle(currentBranding.emblem_style);
      setCustomImage(currentBranding.custom_logo_url || null);
    }
  }, [currentBranding]);

  const handleStyleSelect = (style: EmblemStyle) => {
    setSelectedStyle(style);
    setUploadError(null);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be smaller than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('File must be an image');
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setCustomImage(e.target?.result as string);
      setUploadError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onSave({
      emblem_style: selectedStyle,
      custom_logo_url: selectedStyle === 'custom' ? customImage || undefined : undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Emblem Style Selection */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-4">Select Emblem Style</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {EMBLEM_STYLES.map((style) => {
            const IconComponent = style.icon;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => handleStyleSelect(style.id)}
                data-testid={`emblem-style-${style.id}-btn`}
                className={cn('relative p-4 rounded-lg border-2 transition-all',
                  selectedStyle === style.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                )}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <IconComponent
                    size={32}
                    className={selectedStyle === style.id ? 'text-blue-400' : 'text-gray-400'}
                  />
                  <div>
                    <div className="font-medium text-white">{style.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{style.description}</div>
                  </div>
                </div>
                {selectedStyle === style.id && (
                  <motion.div
                    layoutId="selected-style"
                    className="absolute inset-0 border-2 border-blue-500 rounded-lg"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Image Upload */}
      {selectedStyle === 'custom' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Upload Custom Emblem
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg cursor-pointer transition-colors">
              <Upload size={16} />
              Choose Image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                data-testid="custom-emblem-upload-input"
                className="hidden"
              />
            </label>
            <span className="text-sm text-gray-400">Max 5MB, PNG/JPG/SVG</span>
          </div>
          {uploadError && (
            <div className="mt-2 text-sm text-red-400">{uploadError}</div>
          )}
        </motion.div>
      )}

      {/* Live Preview */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Emblem Preview
          </h4>
          <button
            type="button"
            onClick={() => setPhysicsEnabled(!physicsEnabled)}
            data-testid="toggle-physics-preview-btn"
            className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all',
              physicsEnabled
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            )}
          >
            {physicsEnabled ? <Pause size={14} /> : <Play size={14} />}
            <span className="text-xs font-medium">
              {physicsEnabled ? 'Stop Physics' : 'Start Physics'}
            </span>
          </button>
        </div>

        {/* Animation Mode Selection */}
        {physicsEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 mr-2">Animation:</span>
              {ANIMATION_MODES.map((mode) => {
                const IconComponent = mode.icon;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setAnimationMode(mode.id)}
                    data-testid={`animation-mode-${mode.id}-btn`}
                    className={cn('flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all',
                      animationMode === mode.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    )}
                    title={mode.description}
                  >
                    <IconComponent size={12} />
                    {mode.name}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        <div className="min-h-[300px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <PhysicsPreview
              emblemContent={
                <EmblemSVGPreview
                  selectedStyle={selectedStyle}
                  customImage={customImage}
                  primaryColor={primaryColor}
                  factionName={factionName}
                />
              }
              isActive={physicsEnabled}
              animationMode={animationMode}
            />
          </AnimatePresence>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-400">
            {physicsEnabled
              ? 'Move your mouse over the emblem to interact with it'
              : 'Emblem will be displayed on faction cards and member profiles'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={handleSave}
          data-testid="save-emblem-btn"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Save size={16} />
          Save Emblem
        </button>
      </div>
    </div>
  );
};

export default EmblemDesigner;
