/**
 * PromptComposer Component
 * Visual image prompt builder for scene images with templates
 * Now includes Context Builder for intelligent context compression
 * Extended with Template Library for versioning, sharing, and effectiveness tracking
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Trash2, Eye, EyeOff, ChevronDown, FileText, Sparkles, Brain, Layers, Library, Plus, BarChart2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/UI/Button';

import { OptionSelector } from './components/OptionSelector';
import { PromptPreview } from './components/PromptPreview';
import { ContextBuilder } from './components/ContextBuilder';
import { TemplateGallery } from './components/TemplateGallery';
import { TemplateEditor } from './components/TemplateEditor';
import { EffectivenessPanel } from './components/EffectivenessPanel';
import { PROMPT_COLUMNS, composePrompt } from './promptData';
import { PromptDimension, PromptOption, SelectionState } from './types';
import type { ContextElement, CompressedContext } from '@/lib/context';
import { templateManager, type PromptTemplate } from '@/lib/templates';

type ComposerMode = 'image' | 'context' | 'templates';

// Prompt templates for quick start
const PROMPT_TEMPLATES = [
  {
    id: 'fantasy_epic',
    name: 'Epic Fantasy',
    description: 'Grand fantasy scenes with dramatic lighting',
    selections: { style: 'painterly', setting: 'ancient_ruins', mood: 'epic' },
  },
  {
    id: 'noir_mystery',
    name: 'Noir Mystery',
    description: 'Dark, moody scenes with high contrast',
    selections: { style: 'cinematic', setting: 'city_night', mood: 'mysterious' },
  },
  {
    id: 'peaceful_nature',
    name: 'Peaceful Nature',
    description: 'Serene natural environments',
    selections: { style: 'watercolor', setting: 'enchanted_forest', mood: 'peaceful' },
  },
  {
    id: 'horror_dark',
    name: 'Dark Horror',
    description: 'Creepy, unsettling atmospheres',
    selections: { style: 'gothic', setting: 'abandoned_castle', mood: 'ominous' },
  },
  {
    id: 'scifi_future',
    name: 'Sci-Fi Future',
    description: 'Futuristic technological settings',
    selections: { style: 'cyberpunk', setting: 'space_station', mood: 'futuristic' },
  },
];

interface PromptComposerProps {
  onImageSelect?: (imageUrl: string, prompt: string) => void;
  isGenerating?: boolean;
  sceneContent?: string;
  contextElements?: ContextElement[];
  focusSceneId?: string;
  focusCharacterIds?: string[];
  onContextGenerated?: (context: CompressedContext) => void;
}

export default function PromptComposer({
  onImageSelect,
  isGenerating = false,
  sceneContent,
  contextElements = [],
  focusSceneId,
  focusCharacterIds,
  onContextGenerated,
}: PromptComposerProps) {
  const [mode, setMode] = useState<ComposerMode>('image');
  const [selections, setSelections] = useState<SelectionState>({});
  const [copied, setCopied] = useState(false);
  const [expandedColumn, setExpandedColumn] = useState<string | null>('style');
  const [showPreview, setShowPreview] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);

  // Template Library state
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [showEffectiveness, setShowEffectiveness] = useState(false);

  const handleSelect = useCallback((dimension: PromptDimension, option: PromptOption) => {
    setSelections((prev) => {
      const isSelected = prev[dimension]?.id === option.id;
      return isSelected
        ? { ...prev, [dimension]: undefined }
        : { ...prev, [dimension]: option };
    });
  }, []);

  const handleClear = useCallback(() => {
    setSelections({});
  }, []);

  const handleCopyPrompt = useCallback(async () => {
    const prompt = finalPrompt;
    if (prompt) {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  const handleImageSelect = useCallback((imageUrl: string, prompt: string) => {
    onImageSelect?.(imageUrl, prompt);
  }, [onImageSelect]);

  const toggleColumn = useCallback((columnId: string) => {
    setExpandedColumn((prev) => (prev === columnId ? null : columnId));
  }, []);

  const handleApplyTemplate = useCallback((template: typeof PROMPT_TEMPLATES[0]) => {
    // Find the actual options from PROMPT_COLUMNS
    const newSelections: SelectionState = {};
    PROMPT_COLUMNS.forEach(column => {
      const templateValue = template.selections[column.id as keyof typeof template.selections];
      if (templateValue) {
        const option = column.options.find(opt => opt.id === templateValue);
        if (option) {
          newSelections[column.id] = option;
        }
      }
    });
    setSelections(newSelections);
    setShowTemplates(false);
  }, []);

  const finalPrompt = useMemo(() => {
    return composePrompt(selections);
  }, [selections]);

  const hasSelections = Object.values(selections).some(Boolean);
  const selectionCount = Object.values(selections).filter(Boolean).length;

  // Template Library handlers
  const handleSelectLibraryTemplate = useCallback((template: PromptTemplate) => {
    setSelectedTemplate(template);
    setIsCreatingTemplate(false);
    setShowEffectiveness(true);
  }, []);

  const handleCreateNewTemplate = useCallback(() => {
    setSelectedTemplate(null);
    setIsCreatingTemplate(true);
  }, []);

  const handleSaveTemplate = useCallback((template: PromptTemplate) => {
    setSelectedTemplate(template);
    setIsCreatingTemplate(false);
    setShowEffectiveness(true);
  }, []);

  const handleForkTemplate = useCallback((template: PromptTemplate) => {
    setSelectedTemplate(template);
    setIsCreatingTemplate(true);
  }, []);

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-1.5 rounded-lg',
              mode === 'image' ? 'bg-cyan-600/20' : mode === 'context' ? 'bg-purple-600/20' : 'bg-amber-600/20'
            )}>
              {mode === 'image' ? (
                <Palette className="w-4 h-4 text-cyan-400" />
              ) : mode === 'context' ? (
                <Brain className="w-4 h-4 text-purple-400" />
              ) : (
                <Library className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                {mode === 'image' ? 'Image Prompt Builder' : mode === 'context' ? 'Context Composer' : 'Template Library'}
              </h2>
              <p className="text-xs text-slate-500">
                {mode === 'image'
                  ? selectionCount > 0
                    ? `${selectionCount} option${selectionCount > 1 ? 's' : ''} selected`
                    : 'Select options to build your prompt'
                  : mode === 'context'
                  ? 'Build and compress context for AI prompts'
                  : 'Create, share, and track prompt templates'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mode === 'image' && (
              <>
                {/* Templates Dropdown */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="h-7 px-2 text-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    Templates
                    <ChevronDown className={cn('w-3 h-3 ml-1 transition-transform', showTemplates && 'rotate-180')} />
                  </Button>

                  <AnimatePresence>
                    {showTemplates && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-1 z-20 w-64 py-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl"
                      >
                        <div className="px-3 py-2 border-b border-slate-700">
                          <h4 className="text-xs font-medium text-slate-300">Quick Start Templates</h4>
                        </div>
                        {PROMPT_TEMPLATES.map(template => (
                          <button
                            key={template.id}
                            onClick={() => handleApplyTemplate(template)}
                            className="w-full px-3 py-2 text-left hover:bg-slate-700/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-slate-200">{template.name}</div>
                                <div className="text-[10px] text-slate-500 truncate">{template.description}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="h-7 px-2 text-xs"
                >
                  {showPreview ? (
                    <EyeOff className="w-3.5 h-3.5 mr-1" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 mr-1" />
                  )}
                  Preview
                </Button>

                {hasSelections && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="h-7 px-2 text-xs text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Clear
                  </Button>
                )}
              </>
            )}

            {mode === 'templates' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCreateNewTemplate}
                  className="h-7 px-2 text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  New Template
                </Button>

                {selectedTemplate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEffectiveness(!showEffectiveness)}
                    className="h-7 px-2 text-xs"
                  >
                    <BarChart2 className="w-3.5 h-3.5 mr-1" />
                    Metrics
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="shrink-0 flex border-b border-slate-800">
        <button
          onClick={() => setMode('image')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
            mode === 'image'
              ? 'bg-cyan-600/10 text-cyan-400 border-b-2 border-cyan-500 -mb-px'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
          )}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Image Prompt</span>
        </button>
        <button
          onClick={() => setMode('context')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
            mode === 'context'
              ? 'bg-purple-600/10 text-purple-400 border-b-2 border-purple-500 -mb-px'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Context Builder</span>
        </button>
        <button
          onClick={() => setMode('templates')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
            mode === 'templates'
              ? 'bg-amber-600/10 text-amber-400 border-b-2 border-amber-500 -mb-px'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
          )}
        >
          <Library className="w-3.5 h-3.5" />
          <span>Template Library</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {mode === 'image' ? (
            <motion.div
              key="image-mode"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="h-full flex"
            >
              {/* Options Panel - flex grow/shrink based on preview */}
              <motion.div
                layout
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className={cn(
                  'overflow-y-auto p-4 space-y-3',
                  showPreview ? 'w-1/2 border-r border-slate-800' : 'w-full'
                )}
              >
                {PROMPT_COLUMNS.map((column) => (
                  <OptionSelector
                    key={column.id}
                    column={column}
                    selectedOption={selections[column.id]}
                    isExpanded={expandedColumn === column.id}
                    loading={isGenerating}
                    onToggle={toggleColumn}
                    onSelect={handleSelect}
                  />
                ))}

                {/* Tips */}
                <div className="mt-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <h4 className="text-xs font-medium text-slate-300 mb-2">Tips</h4>
                  <ul className="text-[10px] text-slate-500 space-y-1">
                    <li>• Use templates for quick start presets</li>
                    <li>• Start with an art style for the overall look</li>
                    <li>• Add a setting to define the location</li>
                    <li>• Finish with a mood for atmosphere</li>
                  </ul>
                </div>
              </motion.div>

              {/* Preview Panel - improved animation */}
              <AnimatePresence mode="wait">
                {showPreview && (
                  <motion.div
                    key="preview-panel"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: '50%', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{
                      duration: 0.25,
                      ease: [0.4, 0, 0.2, 1],
                      opacity: { duration: 0.2 }
                    }}
                    className="overflow-hidden"
                  >
                    <motion.div
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 20, opacity: 0 }}
                      transition={{ duration: 0.2, delay: 0.05 }}
                      className="h-full overflow-y-auto p-4"
                    >
                      {finalPrompt ? (
                        <PromptPreview
                          prompt={finalPrompt}
                          copied={copied}
                          loading={isGenerating}
                          onCopy={handleCopyPrompt}
                          onImageSelect={handleImageSelect}
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-center">
                          <div>
                            <Palette className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                            <p className="text-sm text-slate-500">
                              Select options to build your prompt
                            </p>
                            <p className="text-xs text-slate-600 mt-1">
                              Or use a template for quick start
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : mode === 'context' ? (
            <motion.div
              key="context-mode"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="h-full"
            >
              <ContextBuilder
                elements={contextElements}
                focusSceneId={focusSceneId}
                focusCharacterIds={focusCharacterIds}
                currentContent={sceneContent}
                onContextGenerated={onContextGenerated}
                className="h-full"
              />
            </motion.div>
          ) : (
            <motion.div
              key="templates-mode"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="h-full flex"
            >
              {/* Template Gallery */}
              <div className={cn(
                'h-full border-r border-slate-800 transition-all',
                (isCreatingTemplate || (selectedTemplate && showEffectiveness)) ? 'w-1/3' : 'w-full'
              )}>
                <TemplateGallery
                  onSelectTemplate={handleSelectLibraryTemplate}
                  onForkTemplate={handleForkTemplate}
                  className="h-full"
                />
              </div>

              {/* Template Editor or Effectiveness Panel */}
              <AnimatePresence mode="wait">
                {isCreatingTemplate && (
                  <motion.div
                    key="editor"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: '66.67%', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="h-full overflow-hidden"
                  >
                    <TemplateEditor
                      template={selectedTemplate || undefined}
                      onSave={handleSaveTemplate}
                      onCancel={() => {
                        setIsCreatingTemplate(false);
                        setSelectedTemplate(null);
                      }}
                      className="h-full"
                    />
                  </motion.div>
                )}

                {selectedTemplate && !isCreatingTemplate && showEffectiveness && (
                  <motion.div
                    key="effectiveness"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: '66.67%', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="h-full overflow-hidden flex"
                  >
                    {/* Template Details */}
                    <div className="flex-1 h-full border-r border-slate-800 overflow-y-auto">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-semibold text-slate-200">{selectedTemplate.name}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowEffectiveness(false)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">{selectedTemplate.description}</p>

                        {/* Template Content Preview */}
                        <div className="mb-4">
                          <label className="text-[10px] font-medium text-slate-400 mb-1 block">Content</label>
                          <pre className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-[10px] text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                            {selectedTemplate.content}
                          </pre>
                        </div>

                        {/* Variables */}
                        {selectedTemplate.variables.length > 0 && (
                          <div className="mb-4">
                            <label className="text-[10px] font-medium text-slate-400 mb-1 block">
                              Variables ({selectedTemplate.variables.length})
                            </label>
                            <div className="flex flex-wrap gap-1">
                              {selectedTemplate.variables.map((v) => (
                                <span
                                  key={v.name}
                                  className={cn(
                                    'px-1.5 py-0.5 text-[10px] rounded',
                                    v.required
                                      ? 'bg-cyan-500/20 text-cyan-300'
                                      : 'bg-slate-800 text-slate-500'
                                  )}
                                  title={v.description}
                                >
                                  {`{{${v.name}}}`}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => setIsCreatingTemplate(true)}
                            className="flex-1 h-8 text-xs"
                          >
                            Edit Template
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleForkTemplate(selectedTemplate)}
                            className="h-8 text-xs"
                          >
                            Fork
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Effectiveness Panel */}
                    <div className="w-80 h-full">
                      <EffectivenessPanel
                        template={selectedTemplate}
                        className="h-full"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
