'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, BookOpen } from 'lucide-react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { projectApi } from '@/app/hooks/integration/useProjects';
import type { Project } from '@/app/types/Project';

const MOCK_USER_ID = process.env.NEXT_PUBLIC_MOCK_USER_ID || '550e8400-e29b-41d4-a716-446655440000';

const ProjectSelector: React.FC = () => {
  const { selectedProject, setSelectedProject } = useProjectStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  const { data: projects = [] } = projectApi.useUserProjects(MOCK_USER_ID, true);

  // Auto-select first project when none is selected
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0]);
    }
  }, [projects, selectedProject, setSelectedProject]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 220),
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (project: Project) => {
    setSelectedProject(project);
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-slate-800/60 transition-colors"
      >
        <BookOpen size={13} className="text-slate-500" />
        <span className="text-xs font-semibold text-slate-200 max-w-[160px] truncate">
          {selectedProject?.name || 'Select Project'}
        </span>
        <ChevronDown
          size={11}
          className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

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
              {projects.map((project: Project) => (
                <button
                  key={project.id}
                  onClick={() => handleSelect(project)}
                  className={`w-full px-3 py-2 text-left text-xs transition-colors ${
                    project.id === selectedProject?.id
                      ? 'bg-blue-500/10 text-blue-300'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                  }`}
                >
                  <div className="font-medium">{project.name}</div>
                  {project.description && (
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                      {project.description}
                    </div>
                  )}
                </button>
              ))}
              {projects.length === 0 && (
                <div className="px-3 py-4 text-center text-[10px] text-slate-500">
                  No projects found
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default ProjectSelector;
