'use client';

import React, { useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { projectApi } from '@/app/hooks/integration/useProjects';
import type { Project } from '@/app/types/Project';
import HeaderDropdown from './HeaderDropdown';

const MOCK_USER_ID = process.env.NEXT_PUBLIC_MOCK_USER_ID || '550e8400-e29b-41d4-a716-446655440000';

const ProjectSelector: React.FC = () => {
  const { selectedProject, setSelectedProject } = useProjectStore();
  const { data: projects = [] } = projectApi.useUserProjects(MOCK_USER_ID, true);

  // Auto-select first project when none is selected
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0]);
    }
  }, [projects, selectedProject, setSelectedProject]);

  const items = projects.map((project: Project) => ({
    id: project.id,
    label: project.name,
    sublabel: project.description || undefined,
  }));

  return (
    <HeaderDropdown
      triggerContent={
        <>
          <BookOpen size={13} className="text-cyan-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-slate-200 max-w-[160px] truncate">
            {selectedProject?.name || 'Select Project'}
          </span>
        </>
      }
      triggerClassName="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/40 hover:bg-slate-800/60 transition-colors"
      items={items}
      selectedId={selectedProject?.id}
      selectedItemClassName="bg-blue-500/10 text-blue-300"
      onSelect={(id) => {
        const project = projects.find((p: Project) => p.id === id);
        if (project) setSelectedProject(project);
      }}
      minWidth={220}
      emptyMessage="No projects found"
    />
  );
};

export default ProjectSelector;
