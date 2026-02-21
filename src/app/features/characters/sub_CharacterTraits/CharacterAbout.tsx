/**
 * CharacterAbout - Character traits management
 * Design: Clean Manuscript style with cyan accents
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle } from 'lucide-react';
import { PROMPT_SECTIONS } from '@/app/constants/promptSections';
import { traitApi } from '@/app/api/traits';
import { Trait } from '@/app/types/Character';
import { SmartGenerateButton } from '@/app/components/UI/SmartGenerateButton';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { useCharacters } from '@/app/hooks/useCharacters';
import { useUnifiedTraitGeneration } from './useUnifiedTraitGeneration';
import TraitPromptSection from './TraitPromptSection';
import { cn } from '@/app/lib/utils';
import InlineTerminal from '@/cli/InlineTerminal';

interface CharacterAboutProps {
  characterId: string;
}

const CharacterAbout: React.FC<CharacterAboutProps> = ({ characterId }) => {
  const { data: traits = [], refetch } = traitApi.useCharacterTraits(characterId);
  const [activeSection, setActiveSection] = useState(0);
  const [generateSuccess, setGenerateSuccess] = useState(false);

  const { selectedProject } = useProjectStore();
  const { data: allCharacters = [] } = useCharacters(selectedProject?.id || '');

  const { generateAllTraits, isGenerating, error, saveTraits, handleInsertResult, terminalProps } = useUnifiedTraitGeneration(
    characterId,
    selectedProject?.id || '',
    allCharacters
  );

  const traitsMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    traits.forEach((trait: Trait) => {
      map[trait.type] = trait.description;
    });
    return map;
  }, [traits]);

  const handleGenerateAllTraits = () => {
    setGenerateSuccess(false);
    generateAllTraits();
  };

  const handleInsertTraits = async (text: string) => {
    const result = handleInsertResult(text);
    if (result) {
      await saveTraits(characterId, result);
      await refetch();
      setGenerateSuccess(true);
      setTimeout(() => setGenerateSuccess(false), 5000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="font-mono text-sm uppercase tracking-wide text-slate-300">// character_traits</h2>
          <p className="text-xs text-slate-500 mt-1">
            generate or edit individual trait sections
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <SmartGenerateButton
            onClick={handleGenerateAllTraits}
            isLoading={isGenerating}
            disabled={isGenerating}
            label="Generate All Traits"
            size="md"
            variant="primary"
          />

          {/* Status messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-1.5 font-mono text-xs text-red-400"
              >
                <AlertCircle size={12} />
                {error}
              </motion.div>
            )}

            {generateSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-1.5 font-mono text-xs text-emerald-400"
              >
                <Check size={12} />
                traits_generated_successfully
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* CLI Terminal for unified trait generation */}
      <InlineTerminal
        {...terminalProps}
        height={150}
        collapsible
        onInsert={handleInsertTraits}
      />

      {/* Section Selector */}
      <div className="flex flex-wrap gap-1.5 p-3 bg-slate-900/50 rounded-lg border border-slate-800/50">
        {PROMPT_SECTIONS.map((section, index) => {
          const isActive = activeSection === index;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(index)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-xs transition-all duration-200',
                isActive
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-800/50'
              )}
            >
              {section.icon && <span className="w-3 h-3">{section.icon}</span>}
              <span className="uppercase tracking-wide">{section.title.toLowerCase().replace(/\s+/g, '_')}</span>
            </button>
          );
        })}
      </div>

      {/* Active Section Content */}
      <motion.div
        key={activeSection}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        <TraitPromptSection
          section={PROMPT_SECTIONS[activeSection]}
          characterId={characterId}
          initialValue={traitsMap[PROMPT_SECTIONS[activeSection].id] || ''}
          onSave={refetch}
        />
      </motion.div>
    </div>
  );
};

export default CharacterAbout;

