'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { aiService } from '@/app/services/aiService';
import { FactionWizardResponse } from '@/app/types/Faction';

interface WizardStepPromptProps {
  projectId: string;
  onFactionGenerated: (response: FactionWizardResponse) => void;
}

const FACTION_TYPES = [
  { value: 'guild', label: 'Guild', description: 'Professional or craft organization' },
  { value: 'family', label: 'Family', description: 'Noble house or clan' },
  { value: 'nation', label: 'Nation', description: 'Country or state' },
  { value: 'corporation', label: 'Corporation', description: 'Business or trade organization' },
  { value: 'cult', label: 'Cult', description: 'Religious or ideological group' },
  { value: 'military', label: 'Military', description: 'Armed forces or mercenary company' },
  { value: 'academic', label: 'Academic', description: 'School, university, or research institution' },
  { value: 'criminal', label: 'Criminal', description: 'Crime syndicate or underground network' },
  { value: 'religious', label: 'Religious', description: 'Church, temple, or faith-based organization' },
  { value: 'other', label: 'Other', description: 'Custom faction type' },
] as const;

const WizardStepPrompt: React.FC<WizardStepPromptProps> = ({
  projectId,
  onFactionGenerated,
}) => {
  const [prompt, setPrompt] = useState('');
  const [factionType, setFactionType] = useState<typeof FACTION_TYPES[number]['value']>('guild');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your faction');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Use mock generator for now (can be replaced with actual AI API call)
      const response = aiService.generateMockFaction(prompt, factionType);

      // Simulate API delay for better UX
      await new Promise(resolve => setTimeout(resolve, 2000));

      onFactionGenerated(response);
    } catch (err) {
      console.error('Error generating faction:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate faction');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      {/* Instructions */}
      <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
        <p className="text-sm text-purple-200">
          Describe your faction in a few sentences. The AI will generate a complete profile including
          lore, timeline events, achievements, branding, and member archetypes.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-start gap-2"
        >
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <div>{error}</div>
        </motion.div>
      )}

      {/* Faction Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Faction Type
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {FACTION_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setFactionType(type.value)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                factionType === type.value
                  ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              )}
              data-testid={`faction-type-${type.value}`}
            >
              {type.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {FACTION_TYPES.find(t => t.value === factionType)?.description}
        </p>
      </div>

      {/* Prompt Input */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Faction Description
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Example: A guild of shadow mages who protect the city from supernatural threats. They operate from an ancient tower and value secrecy above all else..."
          className="w-full min-h-[150px] px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          disabled={isGenerating}
          data-testid="faction-prompt-input"
        />
        <div className="mt-2 flex justify-between items-center">
          <p className="text-xs text-gray-500">
            {prompt.length} characters
          </p>
          <p className="text-xs text-gray-500">
            Tip: Be specific about culture, values, and history
          </p>
        </div>
      </div>

      {/* Example Prompts */}
      <div>
        <p className="text-sm font-medium text-gray-300 mb-2">Example Prompts:</p>
        <div className="space-y-2">
          {[
            'A merchant guild controlling trade routes across the desert, known for their caravans of exotic goods',
            'An ancient noble family with a dark secret, maintaining their power through strategic alliances',
            'A revolutionary academic society seeking to democratize magical knowledge',
          ].map((example, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPrompt(example)}
              className="w-full text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-400 hover:text-gray-300 transition-colors"
              disabled={isGenerating}
              data-testid={`example-prompt-${idx}`}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-all"
          data-testid="generate-faction-btn"
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating Faction...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generate with AI
            </>
          )}
        </button>
      </div>

      {/* Generation Status */}
      {isGenerating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-gray-800 rounded-lg border border-gray-700"
        >
          <div className="flex items-center gap-3">
            <Loader2 className="text-purple-400 animate-spin" size={20} />
            <div>
              <p className="text-sm font-medium text-white">AI is generating your faction...</p>
              <p className="text-xs text-gray-400 mt-1">
                Creating lore, timeline, achievements, and branding
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default WizardStepPrompt;
