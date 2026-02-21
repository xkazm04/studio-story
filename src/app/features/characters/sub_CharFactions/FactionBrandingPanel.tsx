'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Shield, Layout, Crown, AlertCircle } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { Faction, FactionBranding } from '@/app/types/Faction';
import { factionApi } from '@/app/api/factions';
import ColorCustomizer from './ColorCustomizer';
import EmblemDesigner from './EmblemDesigner';
import { useQueryClient } from '@tanstack/react-query';

interface FactionBrandingPanelProps {
  faction: Faction;
  onUpdate: () => void;
}

type BrandingTab = 'colors' | 'emblem' | 'templates' | 'preview';

const BANNER_TEMPLATES = [
  {
    id: 'standard' as const,
    name: 'Standard',
    description: 'Clean and professional layout',
  },
  {
    id: 'ornate' as const,
    name: 'Ornate',
    description: 'Decorative with flourishes',
  },
  {
    id: 'minimal' as const,
    name: 'Minimal',
    description: 'Simple and understated',
  },
  {
    id: 'custom' as const,
    name: 'Custom',
    description: 'Create your own design',
  },
];

const FactionBrandingPanel: React.FC<FactionBrandingPanelProps> = ({
  faction,
  onUpdate,
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<BrandingTab>('colors');
  const [selectedTemplate, setSelectedTemplate] = useState(
    faction.branding?.banner_template || 'standard'
  );
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize branding state
  const [brandingState, setBrandingState] = useState<FactionBranding>({
    primary_color: faction.branding?.primary_color || faction.color || '#3b82f6',
    secondary_color: faction.branding?.secondary_color || '#10b981',
    accent_color: faction.branding?.accent_color || '#8b5cf6',
    emblem_style: faction.branding?.emblem_style || 'shield',
    banner_template: faction.branding?.banner_template || 'standard',
    custom_logo_url: faction.branding?.custom_logo_url,
    theme_tier: faction.branding?.theme_tier || 'free',
  });

  const handleColorSave = async (colors: Partial<FactionBranding>) => {
    setIsSaving(true);
    setError(null);
    try {
      const updatedBranding = { ...brandingState, ...colors };
      await factionApi.updateFactionBranding(faction.id, updatedBranding);
      setBrandingState(updatedBranding);
      queryClient.invalidateQueries({ queryKey: ['factions'] });
      onUpdate();
    } catch (err) {
      // Enhanced error handling for validation errors
      if (err instanceof Error) {
        setError(err.message.includes('Invalid branding colors')
          ? err.message
          : 'Failed to save color scheme. Please check that all colors are in valid hex format (#RRGGBB).');
      } else {
        setError('Failed to save color scheme');
      }
      console.error('Error saving colors:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmblemSave = async (emblem: Partial<FactionBranding>) => {
    setIsSaving(true);
    setError(null);
    try {
      const updatedBranding = { ...brandingState, ...emblem };
      await factionApi.updateFactionBranding(faction.id, updatedBranding);
      setBrandingState(updatedBranding);
      queryClient.invalidateQueries({ queryKey: ['factions'] });
      onUpdate();
    } catch (err) {
      setError('Failed to save emblem design');
      console.error('Error saving emblem:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTemplateSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const updatedBranding = { ...brandingState, banner_template: selectedTemplate };
      await factionApi.updateFactionBranding(faction.id, updatedBranding);
      setBrandingState(updatedBranding);
      queryClient.invalidateQueries({ queryKey: ['factions'] });
      onUpdate();
    } catch (err) {
      setError('Failed to save banner template');
      console.error('Error saving template:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setBrandingState({
      primary_color: faction.color || '#3b82f6',
      secondary_color: '#10b981',
      accent_color: '#8b5cf6',
      emblem_style: 'shield',
      banner_template: 'standard',
      theme_tier: 'free',
    });
  };

  return (
    <div className="space-y-6">
      {/* Theme Tier Indicator */}
      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center gap-3">
          <Crown
            size={20}
            className={brandingState.theme_tier === 'premium' ? 'text-yellow-400' : 'text-gray-400'}
          />
          <div>
            <div className="text-sm font-medium text-white">
              {brandingState.theme_tier === 'premium' ? 'Premium Theme' : 'Free Theme'}
            </div>
            <div className="text-xs text-gray-400">
              {brandingState.theme_tier === 'premium'
                ? 'Access to all branding features'
                : 'Upgrade for advanced customization'}
            </div>
          </div>
        </div>
        {brandingState.theme_tier === 'free' && (
          <button
            type="button"
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg font-medium transition-all"
          >
            Upgrade to Premium
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm"
        >
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <div>{error}</div>
        </motion.div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('colors')}
          className={cn('flex items-center gap-2 px-6 py-3 font-medium transition-all',
            activeTab === 'colors'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          )}
        >
          <Palette size={18} />
          Colors
        </button>
        <button
          onClick={() => setActiveTab('emblem')}
          className={cn('flex items-center gap-2 px-6 py-3 font-medium transition-all',
            activeTab === 'emblem'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-gray-300'
          )}
        >
          <Shield size={18} />
          Emblem
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={cn('flex items-center gap-2 px-6 py-3 font-medium transition-all',
            activeTab === 'templates'
              ? 'text-green-400 border-b-2 border-green-400'
              : 'text-gray-400 hover:text-gray-300'
          )}
        >
          <Layout size={18} />
          Templates
        </button>
        <button
          onClick={() => {
            setActiveTab('preview');
            setIsPreviewMode(true);
          }}
          className={cn('flex items-center gap-2 px-6 py-3 font-medium transition-all ml-auto',
            activeTab === 'preview'
              ? 'text-orange-400 border-b-2 border-orange-400'
              : 'text-gray-400 hover:text-gray-300'
          )}
        >
          Preview Mode
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'colors' && (
          <motion.div
            key="colors"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <ColorCustomizer
              currentBranding={brandingState}
              onSave={handleColorSave}
              onReset={handleReset}
              factionName={faction.name}
              factionId={faction.id}
            />
          </motion.div>
        )}

        {activeTab === 'emblem' && (
          <motion.div
            key="emblem"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <EmblemDesigner
              currentBranding={brandingState}
              onSave={handleEmblemSave}
              factionName={faction.name}
              primaryColor={brandingState.primary_color}
            />
          </motion.div>
        )}

        {activeTab === 'templates' && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-4">Select Banner Template</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BANNER_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplate(template.id)}
                    className={cn('relative p-6 rounded-lg border-2 transition-all text-left',
                      selectedTemplate === template.id
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    )}
                  >
                    <div className="space-y-2">
                      <div className="font-medium text-white">{template.name}</div>
                      <div className="text-sm text-gray-400">{template.description}</div>
                      {/* Template preview placeholder */}
                      <div className="mt-4 h-24 bg-gray-900 rounded border border-gray-700 flex items-center justify-center text-xs text-gray-500">
                        {template.name} Preview
                      </div>
                    </div>
                    {selectedTemplate === template.id && (
                      <motion.div
                        layoutId="selected-template"
                        className="absolute inset-0 border-2 border-green-500 rounded-lg"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleTemplateSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Save Template
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'preview' && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h4 className="text-sm font-medium text-gray-300 mb-4">Full Preview</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-400 mb-2">Faction Card Preview</p>
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 min-h-[200px] flex items-center justify-center text-gray-500">
                    Card preview with branding
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-2">Banner Preview</p>
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 min-h-[200px] flex items-center justify-center text-gray-500">
                    Banner preview with branding
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FactionBrandingPanel;
