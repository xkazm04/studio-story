'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Folder, Plus } from 'lucide-react';
import { EmptyState } from '@/app/components/UI';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { projectApi } from '@/app/hooks/integration/useProjects';
import { MOCK_USER_ID } from '@/app/config/mockUser';
import { Project } from '@/app/types/Project';
import ProjectCardSkeleton from './components/ProjectCardSkeleton';
import ProjectCard from './components/ProjectCard';
import ProjectEditModal from './sub_projectModal/ProjectEditModal';
import ProjectDeleteModal from './components/ProjectDeleteModal';

interface ProjectsFeatureProps {
  userId?: string;
}

const ProjectsFeature: React.FC<ProjectsFeatureProps> = ({ userId = MOCK_USER_ID }) => {
  const { data: projects = [], isLoading } = projectApi.useUserProjects(userId, !!userId);
  const { setSelectedProject, setShowLanding } = useProjectStore();

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setShowLanding(false);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
  };

  const handleDeleteProject = (project: Project) => {
    setDeletingProject(project);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white mb-4"
          >
            Your Story Projects
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg"
          >
            Select a project to continue or create a new one
          </motion.p>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          // Skeleton loading state
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <ProjectCardSkeleton key={`skeleton-${index}`} index={index} />
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                onSelect={handleSelectProject}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
              />
            ))}

            {/* Create New Project Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: projects.length * 0.1,
                duration: 0.2
              }}
              className="group relative bg-gray-800/30 backdrop-blur-sm border-2 border-dashed border-gray-700 rounded-lg p-6 cursor-pointer hover:bg-gray-800/50 hover:border-blue-500/50 transition-all duration-300"
              data-testid="create-project-card"
            >
              <div className="flex flex-col items-center justify-center min-h-[140px] text-center">
                <div className="p-3 bg-gray-700/30 rounded-lg mb-4 group-hover:bg-blue-500/20 transition-colors">
                  <Plus size={32} className="text-gray-500 group-hover:text-blue-500 transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-gray-400 group-hover:text-blue-400 transition-colors">
                  Create New Project
                </h3>
              </div>
            </motion.div>
          </div>
        ) : (
          <EmptyState
            icon={<Folder />}
            title="No Projects Yet"
            subtitle="Start your storytelling journey by creating your first project"
            action={{ label: "Create Your First Project", onClick: () => {}, icon: <Plus /> }}
            iconSize="lg"
            animated
            glowColor="rgb(59, 130, 246)"
          />
        )}
      </div>

      {/* Edit Modal */}
      {editingProject && (
        <ProjectEditModal
          isOpen={!!editingProject}
          onClose={() => setEditingProject(null)}
          project={editingProject}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingProject && (
        <ProjectDeleteModal
          isOpen={!!deletingProject}
          onClose={() => setDeletingProject(null)}
          project={deletingProject}
        />
      )}
    </div>
  );
};

export default ProjectsFeature;

