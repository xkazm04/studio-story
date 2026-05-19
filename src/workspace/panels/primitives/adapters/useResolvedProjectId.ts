import { useProjectStore } from '@/app/store/slices/projectSlice';

/**
 * Resolves a projectId from an optional prop override or the global project store.
 * Eliminates the repeated 3-line pattern across adapter components.
 */
export function useResolvedProjectId(propProjectId?: string) {
  const selectedProject = useProjectStore((s) => s.selectedProject);
  const projectId = propProjectId || selectedProject?.id || '';
  return { projectId, hasProject: !!projectId, selectedProject };
}
