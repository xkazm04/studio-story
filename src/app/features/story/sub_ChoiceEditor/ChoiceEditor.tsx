/**
 * ChoiceEditor Component
 * Editor for scene navigation choices
 * Design: Clean Manuscript style with monospace accents
 */

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSceneEditor } from '@/contexts/SceneEditorContext';
import { ChoiceList } from './components/ChoiceList';
import { ChoiceForm } from './components/ChoiceForm';
import { cn } from '@/lib/utils';
import { Plus, GitBranch, ArrowRight, Sparkles } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function ChoiceEditor() {
  const { currentScene, choices, scenes, addChoice } = useSceneEditor();
  const [isAdding, setIsAdding] = useState(false);

  // Filter choices for current scene
  const sceneChoices = currentScene
    ? choices.filter(c => c.scene_id === currentScene.id)
    : [];

  // Available target scenes (excluding current)
  const availableTargets = scenes.filter(s => s.id !== currentScene?.id);

  const handleAddChoice = useCallback(async (label: string, targetSceneId: string | null) => {
    if (!currentScene) return;

    await addChoice({
      id: crypto.randomUUID(),
      scene_id: currentScene.id,
      target_scene_id: targetSceneId,
      label,
      order_index: sceneChoices.length,
    });

    setIsAdding(false);
  }, [currentScene, sceneChoices.length, addChoice]);

  if (!currentScene) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 text-center"
      >
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800/50 mb-3">
          <GitBranch className="w-6 h-6 text-slate-600" />
        </div>
        <p className="text-sm text-slate-400">Select a scene to edit its choices</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-4 space-y-4"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
            <GitBranch className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-mono font-medium text-slate-200 uppercase tracking-wide text-sm">// choices</h3>
            <p className="text-xs text-slate-500 font-mono">
              {sceneChoices.length === 0
                ? 'empty'
                : `${sceneChoices.length} choice${sceneChoices.length > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!isAdding && (
            <motion.button
              key="add-button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => setIsAdding(true)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium uppercase tracking-wide',
                'bg-cyan-600 hover:bg-cyan-500 text-white',
                'transition-all duration-200 shadow-lg shadow-cyan-500/20',
                'hover:shadow-cyan-500/30 hover:scale-[1.02]'
              )}
            >
              <Plus className="w-4 h-4" />
              Add
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Add Choice Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChoiceForm
              availableTargets={availableTargets}
              onSubmit={handleAddChoice}
              onCancel={() => setIsAdding(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Choice List */}
      <motion.div variants={item}>
        <ChoiceList
          choices={sceneChoices}
          scenes={scenes}
        />
      </motion.div>

      {/* Empty State */}
      <AnimatePresence>
        {sceneChoices.length === 0 && !isAdding && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="py-8 text-center border border-dashed border-slate-700/50 rounded-lg bg-slate-900/30"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-slate-800/50 mb-3 border border-slate-700/50">
              <Sparkles className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-sm text-slate-400 mb-1 font-mono">// no_choices</p>
            <p className="text-xs text-slate-600 mb-4">
              Add choices to connect this scene to others
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium
                text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              add_first_choice
              <ArrowRight className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips */}
      {sceneChoices.length > 0 && sceneChoices.length < 4 && (
        <motion.div
          variants={item}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/30 border border-slate-700/30"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <p className="text-xs text-slate-500 font-mono">
            {sceneChoices.length === 1
              ? '// tip: add more choices for branching paths'
              : '// tip: multiple choices create engaging narratives'}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
