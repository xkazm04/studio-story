'use client';

import React, { useState } from 'react';
import { Modal } from '@/app/components/UI/Modal';
import { Button } from '@/app/components/UI/Button';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { Project } from '@/app/types/Project';
import { projectApi } from '@/app/hooks/integration/useProjects';
import { useQueryClient } from '@tanstack/react-query';

interface ProjectDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

const ProjectDeleteModal: React.FC<ProjectDeleteModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync: deleteProject } = projectApi.useDeleteProject();

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);

    try {
      await deleteProject(project.id);

      // Invalidate and refetch project queries
      await queryClient.invalidateQueries({ queryKey: ['projects'] });

      // Close modal
      onClose();
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const footer = (
    <div className="flex items-center justify-between w-full">
      <Button
        variant="ghost"
        onClick={onClose}
        disabled={isDeleting}
        data-testid="cancel-delete-btn"
      >
        Cancel
      </Button>
      <Button
        variant="danger"
        onClick={handleDelete}
        disabled={isDeleting}
        icon={isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
        data-testid="confirm-delete-btn"
      >
        {isDeleting ? 'Deleting...' : 'Delete Project'}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Project"
      subtitle="This action cannot be undone"
      icon={<AlertTriangle size={16} className="text-red-500" />}
      size="md"
      footer={footer}
      closeOnBackdropClick={!isDeleting}
      data-testid="project-delete-modal"
    >
      <div className="space-y-4">
        {/* Warning Message */}
        <div className="px-4 py-3 bg-red-900/30 border border-red-500/50 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-200 text-sm font-medium mb-1">
                Warning: This will permanently delete the project
              </p>
              <p className="text-red-300/80 text-xs">
                All associated data including acts, scenes, characters, and relationships will be removed.
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-4 py-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Project Name */}
        <div className="px-4 py-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
          <p className="text-xs text-gray-400 font-medium mb-1">Project to delete:</p>
          <p className="text-white font-semibold">{project.name}</p>
          {project.description && (
            <p className="text-gray-400 text-sm mt-2 line-clamp-2">{project.description}</p>
          )}
        </div>

        <p className="text-sm text-gray-400 text-center">
          Are you sure you want to delete this project?
        </p>
      </div>
    </Modal>
  );
};

export default ProjectDeleteModal;
