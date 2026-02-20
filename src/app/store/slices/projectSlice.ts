import { create } from 'zustand';
import { Project } from '../../types/Project';
import { Scene } from '../../types/Scene';
import { Act } from '../../types/Act';

interface ProjectState {
  // Projects
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  updateProject: (project: Project) => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;

  // Acts - UI state only (data is managed by React Query)
  selectedAct: Act | null;
  setSelectedAct: (act: Act | null) => void;

  // Scenes - UI state only (data is managed by React Query)
  selectedScene: Scene | null;
  selectedSceneId: string | null;
  setSelectedScene: (scene: Scene | null) => void;
  setSelectedSceneId: (id: string | null) => void;

  // UI State
  showLanding: boolean;
  setShowLanding: (show: boolean) => void;

  // Dev helpers
  initializeWithMockProject: (project: Project) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  // Projects
  selectedProject: null,
  setSelectedProject: (project) => set({ selectedProject: project }),
  updateProject: (project) => {
    const { projects } = get();
    set({
      selectedProject: project,
      projects: projects.map(p => p.id === project.id ? project : p),
    });
  },
  projects: [],
  setProjects: (projects) => set({ projects: projects }),

  // Acts - UI state only (data is managed by React Query)
  selectedAct: null,
  setSelectedAct: (act) => set({ selectedAct: act }),

  // Scenes - UI state only (data is managed by React Query)
  selectedScene: null,
  selectedSceneId: null,
  setSelectedScene: (scene) => set({ selectedScene: scene, selectedSceneId: scene?.id || null }),
  setSelectedSceneId: (id) => set({ selectedSceneId: id }),

  // UI State
  showLanding: true, // Start with landing page visible
  setShowLanding: (show) => set({ showLanding: show }),

  // Dev helpers
  initializeWithMockProject: (project) => set({
    selectedProject: project,
    showLanding: false
  }),
}));

// Type exports for strict typing
export type { ProjectState };
