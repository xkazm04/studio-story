'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Library, Plus, BarChart2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TYPOGRAPHY } from '@/workspace/theme/tokens';
import { Button } from '@/app/components/UI/Button';

import { TemplateGallery } from './components/TemplateGallery';
import { TemplateEditor } from './components/TemplateEditor';
import { EffectivenessPanel } from './components/EffectivenessPanel';
import type { PromptTemplate } from '@/lib/templates';

export function TemplateLibraryTab() {
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [showEffectiveness, setShowEffectiveness] = useState(false);

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
    <>
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-amber-600/20">
              <Library className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className={TYPOGRAPHY.h1}>Template Library</h2>
              <p className={TYPOGRAPHY.caption}>Create, share, and track prompt templates</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateNewTemplate}
              className="h-7 px-2 text-sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              New Template
            </Button>

            {selectedTemplate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEffectiveness(!showEffectiveness)}
                className="h-7 px-2 text-sm"
              >
                <BarChart2 className="w-3.5 h-3.5 mr-1" />
                Metrics
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex">
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
                  <div className="flex items-center justify-between mb-3">
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
                  <p className="text-sm text-slate-400 mb-3">{selectedTemplate.description}</p>

                  {/* Template Content Preview */}
                  <div className="mb-3">
                    <label className="text-sm font-medium text-slate-400 mb-1 block">Content</label>
                    <pre className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-sm text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {selectedTemplate.content}
                    </pre>
                  </div>

                  {/* Variables */}
                  {selectedTemplate.variables.length > 0 && (
                    <div className="mb-3">
                      <label className="text-sm font-medium text-slate-400 mb-1 block">
                        Variables ({selectedTemplate.variables.length})
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {selectedTemplate.variables.map((v) => (
                          <span
                            key={v.name}
                            className={cn(
                              'px-1.5 py-0.5 text-sm rounded',
                              v.required
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : 'bg-slate-800 text-slate-400'
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
                      className="flex-1 h-8 text-sm"
                    >
                      Edit Template
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleForkTemplate(selectedTemplate)}
                      className="h-8 text-sm"
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
      </div>
    </>
  );
}
