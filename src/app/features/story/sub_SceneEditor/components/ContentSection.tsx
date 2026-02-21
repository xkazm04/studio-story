/**
 * ContentSection Component
 * Editable fields for scene title and content
 * Design: Clean Manuscript style with monospace accents
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSceneEditor } from '@/contexts/SceneEditorContext';
import { cn } from '@/lib/utils';
import {
  Save,
  Check,
  FileText,
  AlignLeft,
  Type,
  Sparkles,
  ImageIcon,
  Volume2,
} from 'lucide-react';
import { AudioNarrationPanel } from './AudioNarrationPanel';
import { SceneSketchPanel } from './SceneSketchPanel';

interface ContentSectionProps {
  sceneId: string;
  projectId: string;
  initialName: string;
  initialContent: string;
  initialDescription: string;
  // Audio narration
  audioUrl?: string;
  onAudioUrlChange?: (url: string | null) => void;
  // Scene sketch/image
  imageUrl?: string;
  imagePrompt?: string;
  artStylePrompt?: string;
  onImageSelect?: (url: string, prompt?: string) => void;
  onRemoveImage?: () => void;
  // Whether to show image panel (used in split view)
  showImagePanel?: boolean;
}

export function ContentSection({
  sceneId,
  projectId,
  initialName,
  initialContent,
  initialDescription,
  audioUrl,
  onAudioUrlChange,
  imageUrl,
  imagePrompt,
  artStylePrompt,
  onImageSelect,
  onRemoveImage,
  showImagePanel = true,
}: ContentSectionProps) {
  const { updateScene } = useSceneEditor();

  const [name, setName] = useState(initialName);
  const [content, setContent] = useState(initialContent);
  const [description, setDescription] = useState(initialDescription);
  const [isSaving, setIsSaving] = useState(false);
  const [savedRecently, setSavedRecently] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset when scene changes
  useEffect(() => {
    setName(initialName);
    setContent(initialContent);
    setDescription(initialDescription);
  }, [sceneId, initialName, initialContent, initialDescription]);

  // Auto-save with debounce
  const saveChanges = useCallback(async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      await updateScene(sceneId, { name, content, description });
      setSavedRecently(true);
      setTimeout(() => setSavedRecently(false), 2000);
    } catch (error) {
      console.error('Failed to save scene:', error);
    } finally {
      setIsSaving(false);
    }
  }, [sceneId, name, content, description, updateScene, isSaving]);

  // Debounced auto-save
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const hasChanges =
      name !== initialName ||
      content !== initialContent ||
      description !== initialDescription;

    if (hasChanges) {
      saveTimeoutRef.current = setTimeout(saveChanges, 1500);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [name, content, description, initialName, initialContent, initialDescription, saveChanges]);

  // Word count
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Save Status Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono uppercase tracking-wide">
          <FileText className="w-3.5 h-3.5" />
          <span>// scene_content</span>
        </div>
        <AnimatePresence mode="wait">
          {isSaving && (
            <motion.span
              key="saving"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-1.5 text-xs text-slate-400 font-mono"
            >
              <Save className="w-3 h-3 animate-pulse" />
              saving...
            </motion.span>
          )}
          {savedRecently && !isSaving && (
            <motion.span
              key="saved"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono"
            >
              <Check className="w-3 h-3" />
              saved
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Scene Name */}
      <div className="relative group">
        <label className="flex items-center gap-2 text-xs font-mono font-medium text-slate-300 mb-2 uppercase tracking-wide">
          <Type className="w-4 h-4 text-cyan-400" />
          scene_name
        </label>
        <div className="relative">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
            placeholder="Enter scene name..."
            className={cn(
              'w-full px-4 py-3 rounded-lg',
              'bg-slate-800/60 border border-slate-700/50',
              'text-slate-100 placeholder:text-slate-500',
              'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50',
              'transition-all duration-200',
              focusedField === 'name' && 'bg-slate-800'
            )}
          />
          {focusedField === 'name' && (
            <motion.div
              layoutId="inputHighlight"
              className="absolute inset-0 rounded-lg ring-2 ring-cyan-500/30 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </div>
      </div>

      {/* Description (optional) */}
      <div className="relative group">
        <label className="flex items-center gap-2 text-xs font-mono font-medium text-slate-300 mb-2 uppercase tracking-wide">
          <Sparkles className="w-4 h-4 text-purple-400" />
          description
          <span className="text-slate-500 font-normal normal-case">(optional)</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onFocus={() => setFocusedField('description')}
            onBlur={() => setFocusedField(null)}
            placeholder="Brief description of this scene..."
            className={cn(
              'w-full px-4 py-3 rounded-lg',
              'bg-slate-800/60 border border-slate-700/50',
              'text-slate-100 placeholder:text-slate-500',
              'focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50',
              'transition-all duration-200',
              focusedField === 'description' && 'bg-slate-800'
            )}
          />
        </div>
      </div>

      {/* Scene Content */}
      <div className="relative group">
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 text-xs font-mono font-medium text-slate-300 uppercase tracking-wide">
            <AlignLeft className="w-4 h-4 text-emerald-400" />
            content
          </label>
          <span className="text-xs text-slate-500 font-mono">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>
        </div>
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setFocusedField('content')}
            onBlur={() => setFocusedField(null)}
            placeholder="Write the scene content here..."
            rows={12}
            className={cn(
              'w-full px-4 py-3 rounded-lg resize-y',
              'bg-slate-800/60 border border-slate-700/50',
              'text-slate-100 placeholder:text-slate-500',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50',
              'transition-all duration-200',
              'min-h-[200px]',
              focusedField === 'content' && 'bg-slate-800'
            )}
          />
        </div>
      </div>

      {/* Audio Narration Panel */}
      {onAudioUrlChange && (
        <AudioNarrationPanel
          sceneId={sceneId}
          projectId={projectId}
          content={content}
          audioUrl={audioUrl ?? null}
          onAudioUrlChange={onAudioUrlChange}
        />
      )}

      {/* Scene Sketch Panel */}
      {showImagePanel && onImageSelect && onRemoveImage && (
        <SceneSketchPanel
          storyContent={content}
          imageUrl={imageUrl ?? null}
          imagePrompt={imagePrompt ?? null}
          artStylePrompt={artStylePrompt}
          onImageSelect={onImageSelect}
          onRemoveImage={onRemoveImage}
          isSaving={isSaving}
        />
      )}

      {/* Bottom stats bar */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-wide">
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                name ? 'bg-emerald-400' : 'bg-slate-600'
              )}
            />
            <span className="text-slate-500">Title</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                description ? 'bg-emerald-400' : 'bg-slate-600'
              )}
            />
            <span className="text-slate-500">Desc</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                content ? 'bg-emerald-400' : 'bg-slate-600'
              )}
            />
            <span className="text-slate-500">Content</span>
          </div>
        </div>
        <span className="text-[10px] text-slate-600 font-mono">auto-save: on</span>
      </div>
    </motion.div>
  );
}
