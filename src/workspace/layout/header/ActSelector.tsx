'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus } from 'lucide-react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { actApi } from '@/app/hooks/integration/useActs';
import { Act } from '@/app/types/Act';
import { useQueryClient } from '@tanstack/react-query';

const ActSelector: React.FC = () => {
  const { selectedProject, selectedAct, setSelectedAct } = useProjectStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newActName, setNewActName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const queryClient = useQueryClient();

  const { data: acts = [], refetch } = actApi.useProjectActs(
    selectedProject?.id || '',
    !!selectedProject
  );

  // Pre-select first act when none is selected
  useEffect(() => {
    if (acts && acts.length > 0 && !selectedAct) {
      setSelectedAct(acts[0]);
    }
  }, [acts, selectedAct, setSelectedAct]);

  // Update dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 200),
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
        setNewActName('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleActSelect = (act: Act) => {
    setSelectedAct(act);
    setIsOpen(false);
    setIsCreating(false);
    setNewActName('');
  };

  const handleCreateAct = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedProject || !newActName.trim()) return;

    try {
      const maxOrder = acts && acts.length > 0
        ? Math.max(...acts.map((act: Act) => act.order || 0))
        : -1;

      const newAct = await actApi.createAct({
        name: newActName.trim(),
        project_id: selectedProject.id,
        description: '',
        order: maxOrder + 1,
      });

      queryClient.invalidateQueries({ queryKey: ['acts', 'project', selectedProject.id] });
      await refetch();

      setSelectedAct(newAct);
      setIsOpen(false);
      setIsCreating(false);
      setNewActName('');
    } catch (error) {
      console.error('Error creating act:', error);
    }
  };

  const handleButtonClick = () => {
    if (!isOpen) {
      setIsCreating(false);
      setNewActName('');
    }
    setIsOpen(!isOpen);
  };

  const displayName = selectedAct?.name || 'Select Act';

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={handleButtonClick}
          className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800/50 transition-all text-xs text-slate-300 hover:text-slate-100"
        >
          <span className={`font-medium ${!selectedAct ? 'text-slate-500' : ''}`}>
            {displayName}
          </span>
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
            <div className="max-h-[300px] overflow-y-auto">
              {acts.map((act: Act) => (
                <button
                  key={act.id}
                  onClick={() => handleActSelect(act)}
                  className={`w-full px-3 py-2 text-left text-xs transition-colors ${
                    act.id === selectedAct?.id
                      ? 'bg-cyan-500/10 text-cyan-300'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                  }`}
                >
                  <div className="font-medium">{act.name}</div>
                  {act.description && (
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                      {act.description}
                    </div>
                  )}
                </button>
              ))}

              {acts.length > 0 && <div className="h-px bg-slate-800 my-0.5" />}

              {!isCreating ? (
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full px-3 py-2 text-left text-xs text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <Plus size={12} />
                  <span className="font-medium">New Act</span>
                </button>
              ) : (
                <form onSubmit={handleCreateAct} className="p-2.5 border-t border-slate-800">
                  <input
                    type="text"
                    value={newActName}
                    onChange={(e) => setNewActName(e.target.value)}
                    placeholder="Act name..."
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700/50 rounded text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-600"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsCreating(false);
                        setNewActName('');
                      }
                    }}
                  />
                  <div className="flex gap-1.5 mt-1.5">
                    <button
                      type="submit"
                      disabled={!newActName.trim()}
                      className="flex-1 px-2 py-1 bg-cyan-600/80 hover:bg-cyan-600 disabled:bg-slate-800 disabled:text-slate-600 text-white text-[10px] font-medium rounded transition-colors"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsCreating(false); setNewActName(''); }}
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

export default ActSelector;
