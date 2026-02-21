'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, Edit2, Trash2 } from 'lucide-react';
import { Project } from '@/app/types/Project';

interface ProjectCardProps {
  project: Project;
  index: number;
  onSelect: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  index,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(project);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(project);
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: 'edit' | 'delete') => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      if (action === 'edit') {
        onEdit(project);
      } else {
        onDelete(project);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.1,
        duration: 0.2
      }}
      onClick={() => onSelect(project)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      className="group relative bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 cursor-pointer hover:bg-gray-800 hover:border-blue-500/50 transition-all duration-300"
      data-testid={`project-card-${project.id}`}
      tabIndex={0}
      role="button"
      aria-label={`Open project ${project.name}`}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
          <Folder size={24} className="text-blue-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-sm text-gray-400 line-clamp-2">
              {project.description}
            </p>
          )}
        </div>
      </div>

      {/* Hover indicator border */}
      <div className="absolute inset-0 border-2 border-blue-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Quick Action Overlay */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center gap-4 pointer-events-auto"
            data-testid={`project-overlay-${project.id}`}
          >
            {/* Edit Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              onClick={handleEdit}
              onKeyDown={(e) => handleKeyDown(e, 'edit')}
              className="group/btn p-4 bg-blue-600/80 hover:bg-blue-600 rounded-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label={`Edit project ${project.name}`}
              data-testid={`project-edit-btn-${project.id}`}
              tabIndex={0}
            >
              <Edit2 size={24} className="text-white" />
            </motion.button>

            {/* Delete Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={handleDelete}
              onKeyDown={(e) => handleKeyDown(e, 'delete')}
              className="group/btn p-4 bg-red-600/80 hover:bg-red-600 rounded-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label={`Delete project ${project.name}`}
              data-testid={`project-delete-btn-${project.id}`}
              tabIndex={0}
            >
              <Trash2 size={24} className="text-white" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProjectCard;
