'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus } from 'lucide-react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { sceneApi } from '@/app/hooks/integration/useScenes';
import { Scene } from '@/app/types/Scene';
import { useQueryClient } from '@tanstack/react-query';

const SceneSelector: React.FC = () => {
  const { selectedProject, selectedAct, selectedScene, setSelectedScene } = useProjectStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newSceneName, setNewSceneName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const queryClient = useQueryClient();

  const { data: scenes = [], refetch } = sceneApi.useScenesByProjectAndAct(
    selectedProject?.id || '',
    selectedAct?.id || '',
    !!selectedProject && !!selectedAct
  );

  const sortedScenes = [...scenes].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Update dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 250),
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsCreating(false);
        setNewSceneName('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSceneSelect = (scene: Scene) => {
    setSelectedScene(scene);
    setIsOpen(false);
    setIsCreating(false);
    setNewSceneName('');
  };

  const handleCreateScene = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedProject || !selectedAct || !newSceneName.trim()) return;

    try {
      const newScene = await sceneApi.createScene({
        name: newSceneName.trim(),
        project_id: selectedProject.id,
        act_id: selectedAct.id,
        order: scenes.length,
      });

      queryClient.invalidateQueries({
        queryKey: ['scenes', 'project', selectedProject.id, 'act', selectedAct.id],
      });
      await refetch();

      setSelectedScene(newScene);
      setIsOpen(false);
      setIsCreating(false);
      setNewSceneName('');
    } catch (error) {
      console.error('Error creating scene:', error);
    }
  };

  const handleButtonClick = () => {
    if (!isOpen) {
      setIsCreating(false);
      setNewSceneName('');
    }
    setIsOpen(!isOpen);
  };

  if (!selectedAct) return null;

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={handleButtonClick}
          className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800/50 transition-all text-xs text-slate-300 hover:text-slate-100"
        >
          {selectedScene ? (
            <>
              <span className="text-slate-500 font-mono text-[10px]">
                #{selectedScene.order !== undefined ? selectedScene.order + 1 : ''}
              </span>
              <span className="font-medium">{selectedScene.name}</span>
            </>
          ) : (
            <span className="font-medium text-slate-500">Select Scene</span>
          )}
          <ChevronDown
            size={12}
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {isOpen && typeof window !== 'undefined' && createPortal(
        <AnimatePresence mode="wait">
          <motion.div
            key="dropdown"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            ref={dropdownRef}
            className="fixed bg-slate-900 border border-slate-700/60 rounded-lg shadow-xl overflow-hidden z-[9999]"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
            }}
          >
            <div className="max-h-[400px] overflow-y-auto">
              {sortedScenes.length > 0 ? (
                sortedScenes.map((scene: Scene) => (
                  <button
                    key={scene.id}
                    onClick={() => handleSceneSelect(scene)}
                    className={`w-full px-3 py-2 text-left text-xs transition-colors ${
                      scene.id === selectedScene?.id
                        ? 'bg-amber-500/10 text-amber-300'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-mono text-[10px]">
                        #{scene.order !== undefined ? scene.order + 1 : '?'}
                      </span>
                      <span className="font-medium">{scene.name}</span>
                    </div>
                    {scene.description && (
                      <div className="text-[10px] text-slate-500 mt-0.5 truncate ml-5">
                        {scene.description}
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-[10px] text-slate-500">
                  No scenes in this act
                </div>
              )}

              {sortedScenes.length > 0 && <div className="h-px bg-slate-800 my-0.5" />}

              {!isCreating ? (
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full px-3 py-2 text-left text-xs text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <Plus size={12} />
                  <span className="font-medium">New Scene</span>
                </button>
              ) : (
                <form onSubmit={handleCreateScene} className="p-2.5 border-t border-slate-800">
                  <input
                    type="text"
                    value={newSceneName}
                    onChange={(e) => setNewSceneName(e.target.value)}
                    placeholder="Scene name..."
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700/50 rounded text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-600"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsCreating(false);
                        setNewSceneName('');
                      }
                    }}
                  />
                  <div className="flex gap-1.5 mt-1.5">
                    <button
                      type="submit"
                      disabled={!newSceneName.trim()}
                      className="flex-1 px-2 py-1 bg-amber-600/80 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-600 text-white text-[10px] font-medium rounded transition-colors"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsCreating(false); setNewSceneName(''); }}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default SceneSelector;
