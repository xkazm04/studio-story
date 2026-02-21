'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Save,
  History,
  Variable,
  X,
  ChevronDown,
  ChevronRight,
  Play,
  Copy,
  Check,
  AlertCircle,
  Tag,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/UI/Button';
import {
  templateManager,
  type PromptTemplate,
  type TemplateVariable,
  type TemplateCategory,
  type TemplateVersion,
} from '@/lib/templates';

interface TemplateEditorProps {
  template?: PromptTemplate;
  onSave: (template: PromptTemplate) => void;
  onCancel?: () => void;
  className?: string;
}

const CATEGORY_OPTIONS: { value: TemplateCategory; label: string }[] = [
  { value: 'character', label: 'Character' },
  { value: 'scene', label: 'Scene' },
  { value: 'dialogue', label: 'Dialogue' },
  { value: 'description', label: 'Description' },
  { value: 'image', label: 'Image' },
  { value: 'story', label: 'Story' },
  { value: 'world-building', label: 'World Building' },
  { value: 'custom', label: 'Custom' },
];

const VARIABLE_TYPES: { value: TemplateVariable['type']; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'select', label: 'Select' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Yes/No' },
];

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onSave,
  onCancel,
  className,
}) => {
  const isNew = !template;

  // Form state
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [category, setCategory] = useState<TemplateCategory>(template?.category || 'custom');
  const [tags, setTags] = useState<string[]>(template?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [content, setContent] = useState(template?.content || '');
  const [variables, setVariables] = useState<TemplateVariable[]>(template?.variables || []);
  const [changeNote, setChangeNote] = useState('');

  // UI state
  const [showVariables, setShowVariables] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [previewValues, setPreviewValues] = useState<Record<string, string | number | boolean>>({});
  const [copied, setCopied] = useState(false);

  // Validation
  const validation = useMemo(() => {
    const errors: string[] = [];
    if (!name.trim()) errors.push('Name is required');
    if (!content.trim()) errors.push('Content is required');

    // Check for undefined variables in content
    const variablePattern = /\{\{(\w+)\}\}/g;
    const usedVars = new Set<string>();
    let match;
    while ((match = variablePattern.exec(content)) !== null) {
      usedVars.add(match[1]);
    }

    const definedVars = new Set(variables.map((v) => v.name));
    usedVars.forEach((v) => {
      if (!definedVars.has(v)) {
        errors.push(`Variable "{{${v}}}" is used but not defined`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }, [name, content, variables]);

  // Preview the filled template
  const previewContent = useMemo(() => {
    if (!showPreview) return '';

    let result = content;
    variables.forEach((variable) => {
      const value = previewValues[variable.name] ?? variable.defaultValue ?? `[${variable.name}]`;
      result = result.replace(new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g'), String(value));
    });
    return result;
  }, [content, variables, previewValues, showPreview]);

  // Add variable
  const addVariable = useCallback(() => {
    const newName = `var${variables.length + 1}`;
    setVariables((prev) => [
      ...prev,
      {
        name: newName,
        type: 'text',
        description: '',
        required: false,
      },
    ]);
  }, [variables.length]);

  // Update variable
  const updateVariable = useCallback((index: number, updates: Partial<TemplateVariable>) => {
    setVariables((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  }, []);

  // Remove variable
  const removeVariable = useCallback((index: number) => {
    setVariables((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Add tag
  const addTag = useCallback(() => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  // Remove tag
  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  // Insert variable into content
  const insertVariable = useCallback((variableName: string) => {
    const placeholder = `{{${variableName}}}`;
    setContent((prev) => prev + placeholder);
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    if (!validation.valid) return;

    if (isNew) {
      const newTemplate = templateManager.createTemplate({
        name,
        description,
        category,
        tags,
        content,
        variables,
        authorId: 'current_user', // In production, use actual user ID
        authorName: 'Current User',
        visibility: 'private',
      });
      onSave(newTemplate);
    } else {
      const updated = templateManager.updateTemplate(
        template!.id,
        { name, description, category, tags, content, variables },
        changeNote || undefined
      );
      if (updated) onSave(updated);
    }
  }, [validation.valid, isNew, name, description, category, tags, content, variables, changeNote, template, onSave]);

  // Copy content to clipboard
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(showPreview ? previewContent : content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content, previewContent, showPreview]);

  // Rollback to version
  const handleRollback = useCallback((version: number) => {
    if (!template) return;

    const versionData = templateManager.getVersion(template.id, version);
    if (versionData) {
      setContent(versionData.content);
      setVariables(versionData.variables);
      setChangeNote(`Rolled back to version ${version}`);
      setShowHistory(false);
    }
  }, [template]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="shrink-0 p-3 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">
            {isNew ? 'Create Template' : 'Edit Template'}
          </h3>
          <div className="flex items-center gap-2">
            {!isNew && template && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="h-7 px-2 text-xs"
              >
                <History className="w-3.5 h-3.5 mr-1" />
                v{template.currentVersion}
              </Button>
            )}
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel} className="h-7 px-2 text-xs">
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Version History Drawer */}
      <AnimatePresence>
        {showHistory && template && template.versions.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-slate-800"
          >
            <div className="p-3 bg-slate-900/80 max-h-40 overflow-y-auto">
              <div className="text-[10px] font-medium text-slate-400 mb-2">Version History</div>
              <div className="space-y-1">
                {template.versions.slice().reverse().map((version) => (
                  <div
                    key={version.version}
                    className="flex items-center justify-between py-1.5 px-2 bg-slate-800/50 rounded"
                  >
                    <div>
                      <span className="text-xs text-slate-300">v{version.version}</span>
                      {version.changeNote && (
                        <span className="text-[10px] text-slate-500 ml-2">{version.changeNote}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">
                        {new Date(version.createdAt).toLocaleDateString()}
                      </span>
                      {version.version !== template.currentVersion && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRollback(version.version)}
                          className="h-5 px-1.5 text-[10px]"
                        >
                          Restore
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Basic Info */}
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-medium text-slate-400 mb-1 block">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Template name"
              className="w-full px-2.5 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div>
            <label className="text-[10px] font-medium text-slate-400 mb-1 block">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this template does"
              className="w-full px-2.5 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-medium text-slate-400 mb-1 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                className="w-full px-2.5 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-medium text-slate-400 mb-1 block">Tags</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add tag"
                  className="flex-1 px-2.5 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
                <Button size="sm" variant="secondary" onClick={addTag} className="h-[34px] px-2">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-400">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Variables Section */}
        <div className="border border-slate-800 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowVariables(!showVariables)}
            className="w-full flex items-center justify-between p-2.5 bg-slate-900/50 hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              {showVariables ? (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )}
              <Variable className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium text-slate-300">
                Variables ({variables.length})
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                addVariable();
              }}
              className="h-6 px-2 text-[10px]"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          </button>

          <AnimatePresence>
            {showVariables && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-2.5 space-y-2 max-h-48 overflow-y-auto">
                  {variables.length === 0 ? (
                    <p className="text-[10px] text-slate-500 text-center py-2">
                      No variables defined. Add variables to make your template dynamic.
                    </p>
                  ) : (
                    variables.map((variable, index) => (
                      <div
                        key={index}
                        className="p-2 bg-slate-800/50 rounded-lg border border-slate-700/50"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={variable.name}
                              onChange={(e) =>
                                updateVariable(index, { name: e.target.value.replace(/\s/g, '_') })
                              }
                              placeholder="name"
                              className="px-2 py-1 bg-slate-900/50 border border-slate-700 rounded text-[10px] text-slate-200 focus:outline-none focus:border-cyan-500/50"
                            />
                            <select
                              value={variable.type}
                              onChange={(e) =>
                                updateVariable(index, { type: e.target.value as TemplateVariable['type'] })
                              }
                              className="px-2 py-1 bg-slate-900/50 border border-slate-700 rounded text-[10px] text-slate-200 focus:outline-none focus:border-cyan-500/50"
                            >
                              {VARIABLE_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>
                                  {t.label}
                                </option>
                              ))}
                            </select>
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1 text-[10px] text-slate-400">
                                <input
                                  type="checkbox"
                                  checked={variable.required}
                                  onChange={(e) => updateVariable(index, { required: e.target.checked })}
                                  className="w-3 h-3 rounded border-slate-600"
                                />
                                Required
                              </label>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => insertVariable(variable.name)}
                              className="h-6 w-6 p-0 text-cyan-400"
                              title="Insert into content"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeVariable(index)}
                              className="h-6 w-6 p-0 text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={variable.description}
                          onChange={(e) => updateVariable(index, { description: e.target.value })}
                          placeholder="Description (optional)"
                          className="mt-1.5 w-full px-2 py-1 bg-slate-900/50 border border-slate-700 rounded text-[10px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                        />
                        {variable.type === 'select' && (
                          <input
                            type="text"
                            value={variable.options?.join(', ') || ''}
                            onChange={(e) =>
                              updateVariable(index, {
                                options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                              })
                            }
                            placeholder="Options (comma-separated)"
                            className="mt-1.5 w-full px-2 py-1 bg-slate-900/50 border border-slate-700 rounded text-[10px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Template Content */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-medium text-slate-400">
              Content <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="h-6 px-2 text-[10px]"
              >
                {showPreview ? (
                  <>
                    <EyeOff className="w-3 h-3 mr-1" />
                    Editor
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3 mr-1" />
                    Preview
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCopy} className="h-6 px-2 text-[10px]">
                {copied ? (
                  <>
                    <Check className="w-3 h-3 mr-1 text-green-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {showPreview ? (
            <div className="w-full min-h-[200px] px-2.5 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-200 whitespace-pre-wrap overflow-y-auto">
              {previewContent || (
                <span className="text-slate-500">Fill in variables to see preview...</span>
              )}
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your prompt template here. Use {{variableName}} for placeholders."
              rows={10}
              className="w-full px-2.5 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-mono resize-none"
            />
          )}

          {/* Preview Variables */}
          {showPreview && variables.length > 0 && (
            <div className="mt-2 p-2 bg-slate-800/30 rounded-lg">
              <div className="text-[10px] font-medium text-slate-400 mb-1.5">Preview Values</div>
              <div className="grid grid-cols-2 gap-2">
                {variables.map((variable) => (
                  <div key={variable.name}>
                    <label className="text-[10px] text-slate-500">{variable.name}</label>
                    {variable.type === 'select' && variable.options ? (
                      <select
                        value={String(previewValues[variable.name] || '')}
                        onChange={(e) =>
                          setPreviewValues((prev) => ({ ...prev, [variable.name]: e.target.value }))
                        }
                        className="w-full px-2 py-1 bg-slate-900/50 border border-slate-700 rounded text-[10px] text-slate-200"
                      >
                        <option value="">Select...</option>
                        {variable.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={variable.type === 'number' ? 'number' : 'text'}
                        value={String(previewValues[variable.name] || '')}
                        onChange={(e) =>
                          setPreviewValues((prev) => ({ ...prev, [variable.name]: e.target.value }))
                        }
                        placeholder={String(variable.defaultValue || '')}
                        className="w-full px-2 py-1 bg-slate-900/50 border border-slate-700 rounded text-[10px] text-slate-200"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Change Note (for updates) */}
        {!isNew && (
          <div>
            <label className="text-[10px] font-medium text-slate-400 mb-1 block">
              Change Note (optional)
            </label>
            <input
              type="text"
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="Describe what you changed"
              className="w-full px-2.5 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        )}

        {/* Validation Errors */}
        {!validation.valid && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-1.5 text-red-400 text-xs mb-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Please fix the following:
            </div>
            <ul className="text-[10px] text-red-300 space-y-0.5 ml-5 list-disc">
              {validation.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 p-3 border-t border-slate-800 bg-slate-900/50">
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="secondary" size="sm" onClick={onCancel} className="flex-1 h-8 text-xs">
              Cancel
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!validation.valid}
            className="flex-1 h-8 text-xs"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            {isNew ? 'Create Template' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;
